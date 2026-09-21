import { PublicTransportData, PublicTransportType } from "@/shared";

const TALLINN_GPS_ENDPOINT = "https://transport.tallinn.ee/gps.txt";
const VEHICLE_STALE_TIMEOUT_MS = 60_000; // 60 seconds

export class TallinnTransportAdapter {
  private vehicleCache = new Map<string, { vehicle: PublicTransportData; lastSeen: number }>();

  /**
   * Map integer vehicle type code to normalized vehicle string type
   */
  private mapVehicleType(code: string): PublicTransportType {
    switch (code.trim()) {
      case "1":
        return "trolleybus";
      case "3":
        return "tram";
      case "7":
        return "night_bus";
      case "2":
      default:
        return "bus";
    }
  }

  /**
   * Fetch and parse Tallinn transport live telemetry feed
   */
  async fetchLiveVehicles(): Promise<{
    status: string;
    count: number;
    mode: "realtime";
    vehicles: PublicTransportData[];
    updatedAt: string;
  }> {
    const now = Date.now();
    const isoNow = new Date(now).toISOString();

    try {
      const response = await fetch(TALLINN_GPS_ENDPOINT, {
        headers: {
          "User-Agent": "CitySignal-TallinnTransportAdapter/1.0",
          "Accept": "text/plain, */*",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Tallinn GPS endpoint returned HTTP ${response.status}`);
      }

      const textData = await response.text();
      const lines = textData.split(/\r?\n/);
      const updatedVehicles: PublicTransportData[] = [];

      for (let idx = 0; idx < lines.length; idx++) {
        const line = lines[idx].trim();
        if (!line) continue;

        // Line format: type,route,lon,lat,speed,bearing,vehicle_id,low_floor,trip_id,destination
        const parts = line.split(",");
        if (parts.length < 4) continue;

        const rawType = parts[0] || "2";
        const route = parts[1] || "";
        const rawLon = parseFloat(parts[2]);
        const rawLat = parseFloat(parts[3]);

        if (isNaN(rawLon) || isNaN(rawLat)) continue;

        const lon = rawLon / 1_000_000;
        const lat = rawLat / 1_000_000;

        // Basic sanity check for Tallinn bounding box (Lat: ~58.5 - 60.0, Lon: ~23.5 - 26.0)
        if (lat < 58.5 || lat > 60.0 || lon < 23.5 || lon > 26.0) continue;

        const rawSpeed = parts[4] ? parseFloat(parts[4]) : 0;
        const speed = isNaN(rawSpeed) ? 0 : rawSpeed;

        const rawBearing = parts[5] ? parseInt(parts[5], 10) : 0;
        const bearing = isNaN(rawBearing) || rawBearing === 999 ? 0 : (rawBearing % 360);

        const vehicleId = parts[6] ? parts[6].trim() : `veh-${route}-${idx}`;
        const lowFloorCode = parts[7] ? parts[7].trim().toUpperCase() : "";
        const lowFloor = lowFloorCode === "Z" || lowFloorCode === "TRUE" || lowFloorCode === "1";
        const tripId = parts[8] ? parts[8].trim() : "";
        const destination = parts.slice(9).join(",").trim() || "Tallinn";

        const vehicleType = this.mapVehicleType(rawType);

        const vehicle: PublicTransportData = {
          id: vehicleId,
          type: vehicleType,
          route,
          tripId,
          lat,
          lon,
          lng: lon,
          bearing,
          speed,
          timestamp: isoNow,
          destination,
          lowFloor,
          source: "tallinn_transport",
        };

        this.vehicleCache.set(vehicleId, { vehicle, lastSeen: now });
        updatedVehicles.push(vehicle);
      }

      // Purge stale vehicles from cache
      for (const [id, cached] of this.vehicleCache.entries()) {
        if (now - cached.lastSeen > VEHICLE_STALE_TIMEOUT_MS) {
          this.vehicleCache.delete(id);
        }
      }

      const activeVehicles = Array.from(this.vehicleCache.values()).map((c) => c.vehicle);

      return {
        status: "success",
        count: activeVehicles.length,
        mode: "realtime",
        vehicles: activeVehicles,
        updatedAt: isoNow,
      };
    } catch (error) {
      console.warn("[TallinnTransportAdapter] Error fetching live vehicles, returning cached:", error);

      // Fallback to active non-stale cached vehicles
      const activeVehicles = Array.from(this.vehicleCache.values())
        .filter((c) => now - c.lastSeen <= VEHICLE_STALE_TIMEOUT_MS)
        .map((c) => c.vehicle);

      return {
        status: activeVehicles.length > 0 ? "success" : "partial_error",
        count: activeVehicles.length,
        mode: "realtime",
        vehicles: activeVehicles,
        updatedAt: isoNow,
      };
    }
  }
}

export const tallinnTransportAdapter = new TallinnTransportAdapter();
