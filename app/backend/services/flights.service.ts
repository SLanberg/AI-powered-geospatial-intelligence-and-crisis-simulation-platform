import { FlightData, FlightResponse } from "@/shared";

export interface FlightVector extends FlightData {
  country?: string;
  isGround: boolean;
  timestamp: number;
  originAirport?: string;
  destinationAirport?: string;
  path?: [number, number][];
  aircraftType?: string;
}

const ADSB_LOL_URL = "https://api.adsb.lol/v2/lat/59.43/lon/24.75/dist/250";
const OPENSKY_URL =
  "https://opensky-network.org/api/states/all?lamin=57.5&lamax=61.2&lomin=21.0&lomax=28.5";

function generateFlightTrail(
  lat: number,
  lng: number,
  heading: number,
  velocity: number,
  points = 12
): [number, number][] {
  const trail: [number, number][] = [];
  const hdgRad = ((heading - 180) * Math.PI) / 180;
  const stepDistMeters = Math.max(500, velocity * 8);

  for (let i = points; i >= 0; i--) {
    const distMeters = stepDistMeters * i;
    const dLat = (distMeters * Math.cos(hdgRad)) / 111320;
    const dLng =
      (distMeters * Math.sin(hdgRad)) / (111320 * Math.cos((lat * Math.PI) / 180));
    trail.push([Number((lng + dLng).toFixed(5)), Number((lat + dLat).toFixed(5))]);
  }
  return trail;
}

function getLinearPos(
  baseLat: number,
  baseLng: number,
  velocity: number,
  heading: number,
  nowSec: number
): { lat: number; lng: number } {
  const hdgRad = (heading * Math.PI) / 180;
  const distMeters = velocity * (nowSec % 86400);
  const dLat = (distMeters * Math.cos(hdgRad)) / 111320;
  const dLng =
    (distMeters * Math.sin(hdgRad)) / (111320 * Math.cos((baseLat * Math.PI) / 180));

  let lat = baseLat + dLat;
  let lng = baseLng + dLng;

  const minLat = 58.0;
  const maxLat = 60.8;
  const minLng = 22.0;
  const maxLng = 27.5;

  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;

  while (lat > maxLat) lat -= latSpan;
  while (lat < minLat) lat += latSpan;
  while (lng > maxLng) lng -= lngSpan;
  while (lng < minLng) lng += lngSpan;

  return { lat, lng };
}

export class FlightsService {
  async fetchLiveFlights(): Promise<FlightResponse> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(ADSB_LOL_URL, {
        headers: { "User-Agent": "NeuralCity/2.0" },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (res.ok) {
        const data = (await res.json()) as {
          ac?: Array<{
            hex: string;
            flight?: string;
            lat?: number;
            lon?: number;
            alt_geom?: number;
            gs?: number;
            track?: number;
            baro_rate?: number;
            type?: string;
            squawk?: string;
          }>;
        };

        const aircraft = data.ac ?? [];
        const flights: FlightData[] = aircraft
          .filter((a) => a.lat && a.lon && typeof a.lat === "number" && typeof a.lon === "number")
          .map((a) => {
            const velocity = (a.gs ?? 150) * 0.514444;
            const heading = a.track ?? 0;
            return {
              id: a.hex || `ac-${Math.random()}`,
              callsign: a.flight?.trim() || `TLL-${a.hex?.slice(0, 4) || "AIR"}`,
              origin: "EETN",
              destination: "BALTIC AIRSPACE",
              lat: a.lat as number,
              lng: a.lon as number,
              altitude: ((a.alt_geom ?? 3000) * 0.3048),
              velocity,
              heading,
              verticalRate: (a.baro_rate ?? 0) * 0.00508,
              onGround: (a.alt_geom ?? 0) < 50,
              squawk: a.squawk ?? null,
              lastContact: Date.now(),
            };
          });

        if (flights.length > 0) {
          return {
            status: "success",
            count: flights.length,
            flights,
            simulated: false,
          };
        }
      }
    } catch {
      // Fallback
    }

    return this.generateSimulatedFlights();
  }

  private generateSimulatedFlights(): FlightResponse {
    const nowSec = Math.floor(Date.now() / 1000);
    const SIMULATED_FLIGHTS = [
      { id: "4bb21a", callsign: "BTI671", baseLat: 59.41, baseLng: 24.83, velocity: 110, heading: 260, alt: 1850, dest: "RIGA (EVRA)", orig: "TALLINN (EETN)" },
      { id: "471f2b", callsign: "SAS1789", baseLat: 59.45, baseLng: 24.78, velocity: 210, heading: 245, alt: 7200, dest: "STOCKHOLM (ESSA)", orig: "TALLINN (EETN)" },
      { id: "4601fc", callsign: "FIN131", baseLat: 59.58, baseLng: 24.85, velocity: 160, heading: 190, alt: 3100, dest: "TALLINN (EETN)", orig: "HELSINKI (EFHK)" },
      { id: "484556", callsign: "DLH2412", baseLat: 59.35, baseLng: 24.62, velocity: 235, heading: 215, alt: 9800, dest: "FRANKFURT (EDDF)", orig: "TALLINN (EETN)" },
      { id: "4ca652", callsign: "RYR4102", baseLat: 59.48, baseLng: 25.10, velocity: 220, heading: 270, alt: 8400, dest: "DUBLIN (EIDW)", orig: "TALLINN (EETN)" },
      { id: "ee001a", callsign: "PPA-SAR-01", baseLat: 59.47, baseLng: 24.72, velocity: 65, heading: 320, alt: 450, dest: "PATROL SECTOR A", orig: "TALLINN (EETN)" },
    ];

    const flights: FlightData[] = SIMULATED_FLIGHTS.map((base) => {
      const pos = getLinearPos(base.baseLat, base.baseLng, base.velocity, base.heading, nowSec);
      return {
        id: base.id,
        callsign: base.callsign,
        origin: base.orig,
        destination: base.dest,
        lat: pos.lat,
        lng: pos.lng,
        altitude: base.alt,
        velocity: base.velocity,
        heading: base.heading,
        verticalRate: 0,
        onGround: false,
        squawk: "7000",
        lastContact: Date.now(),
      };
    });

    return {
      status: "success",
      count: flights.length,
      flights,
      simulated: true,
    };
  }
}

export const flightsService = new FlightsService();
