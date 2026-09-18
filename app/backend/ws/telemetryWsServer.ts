import { WebSocketServer, WebSocket } from "ws";
import { flightsService } from "../services/flights.service";
import {
  vesselsService,
  SIMULATED_MARITIME_FLEET,
  calculateMaritimePosition,
  sanitizeVesselWaterPosition,
} from "../services/vessels.service";
import type { FlightData, VesselData } from "@/shared";

export interface TelemetryWsMessage {
  type: "telemetry:snapshot" | "telemetry:update" | "ping" | "pong";
  timestamp: number;
  flights: FlightData[];
  vessels: VesselData[];
}

class TelemetryWsManager {
  private wss: WebSocketServer | null = null;
  private port = Number(process.env.WS_PORT || 3001);
  private isStarted = false;
  private flights: FlightData[] = [];
  private vessels: VesselData[] = [];
  private tickInterval: NodeJS.Timeout | null = null;
  private fetchInterval: NodeJS.Timeout | null = null;
  private isFetching = false;

  public getStatus() {
    return {
      active: this.isStarted && !!this.wss,
      port: this.port,
      clientCount: this.wss?.clients?.size ?? 0,
      flightCount: this.flights.length,
      vesselCount: this.vessels.length,
    };
  }

  public start() {
    if (this.isStarted && this.wss) {
      return;
    }

    try {
      this.wss = new WebSocketServer({ port: this.port });
      this.isStarted = true;

      this.wss.on("connection", (ws: WebSocket) => {
        // Send initial snapshot immediately to the newly connected client
        const snapshot: TelemetryWsMessage = {
          type: "telemetry:snapshot",
          timestamp: Date.now(),
          flights: this.flights,
          vessels: this.vessels,
        };
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(snapshot));
        }

        ws.on("message", (message: string) => {
          try {
            const data = JSON.parse(message.toString());
            if (data.type === "ping") {
              ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
            }
          } catch {
            // Ignore malformed messages
          }
        });

        ws.on("error", () => {
          // Handled silently
        });
      });

      this.wss.on("error", (err: Error & { code?: string }) => {
        if (err.code === "EADDRINUSE") {
          console.warn(`[TelemetryWs] Port ${this.port} is already in use; reusing existing instance.`);
        } else {
          console.error("[TelemetryWs] Server error:", err);
        }
      });

      // Initial data fetch
      this.refreshData();

      // Refresh live API telemetry every 10 seconds
      this.fetchInterval = setInterval(() => {
        this.refreshData();
      }, 10000);

      // Real-time kinematic advancement every 1 second (1000ms = 1Hz stream)
      this.tickInterval = setInterval(() => {
        this.tickMovement();
        this.broadcast();
      }, 1000);

      console.log(`[TelemetryWs] Real-time Telemetry WebSocket server running on port ${this.port}`);
    } catch (err) {
      console.error("[TelemetryWs] Failed to start WebSocket server:", err);
    }
  }

  private async refreshData() {
    if (this.isFetching) return;
    this.isFetching = true;
    try {
      const [flightsRes, vesselsRes] = await Promise.allSettled([
        flightsService.fetchLiveFlights(),
        vesselsService.fetchLiveVessels(),
      ]);

      if (flightsRes.status === "fulfilled" && flightsRes.value?.flights) {
        const incomingFlights = flightsRes.value.flights;
        if (incomingFlights.length > 0) {
          const currentDict = new Map<string, FlightData>();
          this.flights.forEach((f) => currentDict.set(f.id, f));

          this.flights = incomingFlights.map((incoming) => {
            const existing = currentDict.get(incoming.id);
            if (!existing) return incoming;

            // Retain smoothly advanced heading and altitude if close
            return {
              ...incoming,
              altitude: incoming.altitude || existing.altitude,
              heading: incoming.heading || existing.heading,
            };
          });
        } else {
          this.flights = [];
        }
      }

      if (vesselsRes.status === "fulfilled" && vesselsRes.value?.vessels) {
        const incomingVessels = vesselsRes.value.vessels;
        if (incomingVessels.length > 0) {
          this.vessels = incomingVessels;
        }
      }
    } catch (err) {
      console.warn("[TelemetryWs] Background refresh error:", err);
    } finally {
      this.isFetching = false;
    }
  }

  private tickMovement() {
    const nowSec = Math.floor(Date.now() / 1000);

    // Map for fast route lookup
    const simVesselMap = new Map(SIMULATED_MARITIME_FLEET.map((r) => [r.mmsi, r]));

    // 1. Advance real flights based on true ADS-B kinematics
    this.flights = this.flights.map((f) => {
      if (f.onGround || !f.velocity || f.velocity <= 0) return f;

      const headingRad = (f.heading * Math.PI) / 180;
      const distMeters = f.velocity * 1.0; // 1 second step
      const dLat = (distMeters * Math.cos(headingRad)) / 111320;
      const dLng =
        (distMeters * Math.sin(headingRad)) /
        (111320 * Math.cos((f.lat * Math.PI) / 180));

      let newLat = f.lat + dLat;
      let newLng = f.lng + dLng;

      // Airspace boundary bounds
      if (newLat > 60.8) newLat = 58.0;
      if (newLat < 58.0) newLat = 60.8;
      if (newLng > 27.5) newLng = 22.0;
      if (newLng < 22.0) newLng = 27.5;

      const newAlt = Math.max(0, f.altitude + (f.verticalRate || 0) * 1.0);

      return {
        ...f,
        lat: newLat,
        lng: newLng,
        altitude: newAlt,
        lastContact: Date.now(),
      };
    });

    // 2. Advance vessels based on maritime fairway waypoints and sea safety
    this.vessels = this.vessels.map((v) => {
      const simRoute = simVesselMap.get(v.mmsi);
      if (simRoute) {
        const nextPos = calculateMaritimePosition(simRoute, nowSec);
        const safePos = sanitizeVesselWaterPosition(nextPos.lat, nextPos.lng);
        return {
          ...v,
          lat: safePos.lat,
          lng: safePos.lng,
          sog: nextPos.sog,
          cog: nextPos.heading,
          heading: nextPos.heading,
          timestamp: Date.now(),
        };
      }

      if (!v.sog || v.sog <= 0.1) return v;

      const speedMs = v.sog * 0.514444; // knots to m/s
      const headingToUse =
        v.heading && v.heading !== 511 ? v.heading : v.cog || 0;
      const headingRad = (headingToUse * Math.PI) / 180;
      const distMeters = speedMs * 1.0; // 1 second step
      const dLat = (distMeters * Math.cos(headingRad)) / 111320;
      const dLng =
        (distMeters * Math.sin(headingRad)) /
        (111320 * Math.cos((v.lat * Math.PI) / 180));

      const rawLat = v.lat + dLat;
      const rawLng = v.lng + dLng;
      const safe = sanitizeVesselWaterPosition(rawLat, rawLng);

      return {
        ...v,
        lat: safe.lat,
        lng: safe.lng,
        timestamp: Date.now(),
      };
    });
  }

  private broadcast() {
    if (!this.wss || this.wss.clients.size === 0) return;

    const message: TelemetryWsMessage = {
      type: "telemetry:update",
      timestamp: Date.now(),
      flights: this.flights,
      vessels: this.vessels,
    };

    const payload = JSON.stringify(message);

    for (const client of this.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(payload);
        } catch {
          // Client might have abruptly closed
        }
      }
    }
  }

  public stop() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    if (this.fetchInterval) clearInterval(this.fetchInterval);
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.isStarted = false;
  }
}

// Global singleton to withstand Next.js hot module reloading
const globalForWs = globalThis as unknown as {
  __telemetryWsManager?: TelemetryWsManager;
};

export const telemetryWsManager =
  globalForWs.__telemetryWsManager || new TelemetryWsManager();

if (process.env.NODE_ENV !== "production") {
  globalForWs.__telemetryWsManager = telemetryWsManager;
}

export function startTelemetryWsServer() {
  telemetryWsManager.start();
}
