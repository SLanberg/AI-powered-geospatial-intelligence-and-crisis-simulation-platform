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

export interface FlightWaypoint {
  lng: number;
  lat: number;
  altMeters: number;
  speedMs?: number;
}

export interface FlightRoute {
  id: string;
  callsign: string;
  aircraftType: string;
  country: string;
  origin: string;
  destination: string;
  squawk: string;
  defaultSpeedMs: number;
  cycleOffsetSec: number;
  waypoints: FlightWaypoint[];
}

const OPENSKY_URL =
  "https://opensky-network.org/api/states/all?lamin=58.0&lomin=22.0&lamax=61.0&lomax=28.0";
const ADSB_LOL_URL = "https://api.adsb.lol/v2/lat/59.43/lon/24.75/dist/250";

let lastFlightFetchTime = 0;
let cachedFlightResponse: FlightResponse | null = null;
const FLIGHT_CACHE_TTL_MS = 10 * 1000;

export class FlightsService {
  async fetchLiveFlights(): Promise<FlightResponse> {
    const now = Date.now();
    if (cachedFlightResponse && now - lastFlightFetchTime < FLIGHT_CACHE_TTL_MS) {
      return cachedFlightResponse;
    }

    // 1. Try OpenSky Network (official live ADS-B network)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(OPENSKY_URL, {
        headers: { "User-Agent": "NeuralCity/2.0" },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (res.ok) {
        const data = (await res.json()) as {
          states?: Array<[
            string,          // 0: icao24
            string | null,   // 1: callsign
            string,          // 2: origin_country
            number | null,   // 3: time_position
            number | null,   // 4: last_contact
            number | null,   // 5: longitude
            number | null,   // 6: latitude
            number | null,   // 7: baro_altitude
            boolean,         // 8: on_ground
            number | null,   // 9: velocity
            number | null,   // 10: true_track
            number | null,   // 11: vertical_rate
            unknown,         // 12: sensors
            number | null,   // 13: geo_altitude
            string | null,   // 14: squawk
            boolean,         // 15: spi
            number           // 16: position_source
          ]>;
        };

        const states = data.states ?? [];
        const flights: FlightData[] = states
          .filter((s) => s[5] != null && s[6] != null && typeof s[5] === "number" && typeof s[6] === "number")
          .map((s) => {
            const id = s[0];
            const callsign = (s[1] || id).trim() || id;
            const country = s[2] || "International Airspace";
            const lng = s[5] as number;
            const lat = s[6] as number;
            const altitude = s[7] ?? s[13] ?? 0;
            const onGround = !!s[8];
            const velocity = s[9] ?? 0;
            const heading = s[10] ?? 0;
            const verticalRate = s[11] ?? 0;
            const squawk = s[14] || null;
            const lastContact = (s[4] || s[3] || Math.floor(Date.now() / 1000)) * 1000;

            return {
              id,
              callsign,
              origin: country,
              destination: "BALTIC AIRSPACE",
              lat,
              lng,
              altitude,
              velocity,
              heading,
              verticalRate,
              onGround,
              squawk,
              lastContact,
            };
          });

        if (flights.length > 0) {
          const response: FlightResponse = {
            status: "success",
            count: flights.length,
            flights,
            simulated: false,
          };
          lastFlightFetchTime = Date.now();
          cachedFlightResponse = response;
          return response;
        }
      }
    } catch {
      // Continue to secondary live provider
    }

    // 2. Try ADS-B Lol secondary real-time live feed
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
            alt_baro?: number | string;
            gs?: number;
            track?: number;
            baro_rate?: number;
            type?: string;
            squawk?: string;
            r?: string;
          }>;
        };

        const aircraft = data.ac ?? [];
        const flights: FlightData[] = aircraft
          .filter((a) => a.lat != null && a.lon != null && typeof a.lat === "number" && typeof a.lon === "number")
          .map((a) => {
            const velocity = (a.gs ?? 0) * 0.514444;
            const heading = a.track ?? 0;
            const altM = typeof a.alt_geom === "number" ? a.alt_geom * 0.3048 : typeof a.alt_baro === "number" ? a.alt_baro * 0.3048 : 0;
            return {
              id: a.hex || `ac-${Math.random()}`,
              callsign: a.flight?.trim() || a.r?.trim() || `TLL-${a.hex?.slice(0, 4) || "AIR"}`,
              origin: "EETN / BALTIC AIRSPACE",
              destination: "BALTIC AIRSPACE",
              lat: a.lat as number,
              lng: a.lon as number,
              altitude: altM,
              velocity,
              heading,
              verticalRate: (a.baro_rate ?? 0) * 0.00508,
              onGround: (a.alt_geom ?? 0) < 50,
              squawk: a.squawk ?? null,
              lastContact: Date.now(),
            };
          });

        if (flights.length > 0) {
          const response: FlightResponse = {
            status: "success",
            count: flights.length,
            flights,
            simulated: false,
          };
          lastFlightFetchTime = Date.now();
          cachedFlightResponse = response;
          return response;
        }
      }
    } catch {
      // Handled
    }

    // Only return real data: If no live ADS-B receivers detect aircraft or connection is offline, return empty real array
    return {
      status: "success",
      count: 0,
      flights: [],
      simulated: false,
    };
  }
}

export const flightsService = new FlightsService();

