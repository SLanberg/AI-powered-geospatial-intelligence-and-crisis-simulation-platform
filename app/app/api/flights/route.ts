import { NextResponse } from "next/server";

export interface FlightVector {
  id: string;
  callsign: string;
  country: string;
  lat: number;
  lng: number;
  altitude: number; // in meters
  velocity: number; // in m/s
  heading: number; // degrees
  verticalRate: number; // m/s
  isGround: boolean;
  timestamp: number;
  path?: [number, number][]; // historical flight trail coordinates [lng, lat]
  aircraftType?: string;
  squawk?: string;
  originAirport?: string;
  destinationAirport?: string;
}

const ADSB_LOL_URL = "https://api.adsb.lol/v2/lat/59.43/lon/24.75/dist/250";
const OPENSKY_URL =
  "https://opensky-network.org/api/states/all?lamin=57.5&lamax=61.2&lomin=21.0&lomax=28.5";



function generateFlightTrail(lat: number, lng: number, heading: number, velocity: number, points = 12): [number, number][] {
  const trail: [number, number][] = [];
  const hdgRad = ((heading - 180) * Math.PI) / 180; // direction coming from
  const stepDistMeters = Math.max(500, velocity * 8); // 8 seconds per historical point

  for (let i = points; i >= 0; i--) {
    const distMeters = stepDistMeters * i;
    const dLat = (distMeters * Math.cos(hdgRad)) / 111320;
    const dLng = (distMeters * Math.sin(hdgRad)) / (111320 * Math.cos((lat * Math.PI) / 180));
    trail.push([Number((lng + dLng).toFixed(5)), Number((lat + dLat).toFixed(5))]);
  }
  return trail;
}

function getLinearPos(
  baseLat: number,
  baseLng: number,
  velocity: number,
  heading: number,
  nowSec: number,
  minLat = 58.0,
  maxLat = 60.8,
  minLng = 22.0,
  maxLng = 27.5
) {
  const hdgRad = (heading * Math.PI) / 180;
  const distMeters = velocity * (nowSec % 86400);
  const dLat = (distMeters * Math.cos(hdgRad)) / 111320;
  const dLng = (distMeters * Math.sin(hdgRad)) / (111320 * Math.cos((baseLat * Math.PI) / 180));

  let lat = baseLat + dLat;
  let lng = baseLng + dLng;

  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;
  lat = minLat + ((((lat - minLat) % latSpan) + latSpan) % latSpan);
  lng = minLng + ((((lng - minLng) % lngSpan) + lngSpan) % lngSpan);

  return { lat, lng };
}

function generateFallbackFlights(): FlightVector[] {
  const now = Math.floor(Date.now() / 1000);

  const f1 = getLinearPos(59.43, 24.88, 185, 260, now);
  const f2 = getLinearPos(59.52, 24.72, 240, 195, now);
  const f3 = getLinearPos(59.38, 24.60, 270, 75, now);
  const f4 = getLinearPos(59.41, 24.78, 130, 130, now);
  const f5 = getLinearPos(59.47, 24.95, 210, 310, now);

  const list: Omit<FlightVector, "path">[] = [
    {
      id: "471f01",
      callsign: "EEL102",
      country: "Estonia",
      lat: f1.lat,
      lng: f1.lng,
      altitude: 3200,
      velocity: 185,
      heading: 260,
      verticalRate: -0.5,
      isGround: false,
      timestamp: now,
      aircraftType: "A320",
    },
    {
      id: "461e88",
      callsign: "AY1013",
      country: "Finland",
      lat: f2.lat,
      lng: f2.lng,
      altitude: 8500,
      velocity: 240,
      heading: 195,
      verticalRate: 0,
      isGround: false,
      timestamp: now,
      aircraftType: "A20N",
    },
    {
      id: "471a42",
      callsign: "DLH822",
      country: "Germany",
      lat: f3.lat,
      lng: f3.lng,
      altitude: 10600,
      velocity: 270,
      heading: 75,
      verticalRate: 0,
      isGround: false,
      timestamp: now,
      aircraftType: "A321",
    },
    {
      id: "471c09",
      callsign: "BTI411",
      country: "Latvia",
      lat: f4.lat,
      lng: f4.lng,
      altitude: 1200,
      velocity: 130,
      heading: 130,
      verticalRate: -1.2,
      isGround: false,
      timestamp: now,
      aircraftType: "BCS3",
    },
    {
      id: "471f99",
      callsign: "EEL881",
      country: "Estonia",
      lat: f5.lat,
      lng: f5.lng,
      altitude: 4500,
      velocity: 210,
      heading: 310,
      verticalRate: 1.5,
      isGround: false,
      timestamp: now,
      aircraftType: "AT76",
    },
  ];

  return list.map((f) => ({
    ...f,
    path: generateFlightTrail(f.lat, f.lng, f.heading, f.velocity, 15),
  }));
}

let cachedLiveFlights: { flights: FlightVector[]; timestamp: number; source: string } | null = null;

export async function GET() {
  const nowSec = Math.floor(Date.now() / 1000);

  // 1. Try adsb.lol Live Flight Radar Provider First
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(ADSB_LOL_URL, {
      signal: controller.signal,
      headers: {
        "User-Agent": "CitySignal-FlightRadar/1.0",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.ac && Array.isArray(data.ac) && data.ac.length > 0) {
        const flights: FlightVector[] = data.ac
          .map((ac: any) => {
            if (typeof ac.lat !== "number" || typeof ac.lon !== "number") return null;

            const lat = Number(ac.lat);
            const lng = Number(ac.lon);
            const hdg = Number(ac.track ?? ac.true_heading ?? ac.mag_heading ?? 0);
            const altFeet = Number(ac.alt_baro ?? ac.alt_geom ?? 10000);
            const altMeters = altFeet * 0.3048;
            const gsKnots = Number(ac.gs ?? 150);
            const velMs = gsKnots * 0.514444;
            const baroRateFpm = Number(ac.baro_rate ?? ac.geom_rate ?? 0);
            const vRateMs = baroRateFpm * 0.00508;
            const callsign = String(ac.flight || ac.r || ac.hex || "FLIGHT").trim();

            return {
              id: String(ac.hex || ac.flight || Math.random()),
              callsign,
              country: ac.r ? `Reg ${ac.r}` : "International",
              lat,
              lng,
              altitude: Math.max(0, altMeters),
              velocity: velMs,
              heading: hdg,
              verticalRate: vRateMs,
              isGround: Boolean(ac.alt_baro === "ground" || altFeet < 50),
              timestamp: nowSec,
              path: [],
              aircraftType: ac.t || undefined,
              squawk: ac.squawk || "",
            };
          })
          .filter((f: FlightVector | null): f is FlightVector => f !== null)
          .slice(0, 45); // Filter top active local regional flights

        if (flights.length > 0) {
          cachedLiveFlights = { flights, timestamp: Date.now(), source: "Live ADS-B Radar (adsb.lol)" };
          return NextResponse.json({
            flights,
            timestamp: Date.now(),
            isMock: false,
            source: "Live ADS-B Radar (adsb.lol)",
          });
        }
      }
    }
  } catch (_adsbErr) {
    // Fall back to OpenSky
  }

  // 2. OpenSky Network Fallback Provider
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(OPENSKY_URL, {
      signal: controller.signal,
      headers: {
        "User-Agent": "CitySignal-TacticalDashboard/1.0",
      },
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.states && Array.isArray(data.states) && data.states.length > 0) {
        const flights: FlightVector[] = data.states
          .map((state: (string | number | boolean | null)[]) => {
            const [
              icao24,
              callsign,
              origin_country,
              time_position,
              _last_contact,
              longitude,
              latitude,
              baro_altitude,
              on_ground,
              velocity,
              true_track,
              vertical_rate,
              _sensors,
              geo_altitude,
            ] = state;

            if (latitude === null || longitude === null) return null;

            let lat = Number(latitude);
            let lng = Number(longitude);
            const vel = Number(velocity ?? 150);
            const hdg = Number(true_track ?? 0);
            const vRate = Number(vertical_rate ?? 0);
            const alt = Number(baro_altitude ?? geo_altitude ?? 3000);
            const posTime = Number(time_position || nowSec);
            const csStr = typeof callsign === "string" && callsign.trim() ? callsign.trim() : String(icao24).toUpperCase();

            const elapsedSec = Math.max(0, Math.min(60, nowSec - posTime));
            if (elapsedSec > 0 && vel > 0 && !on_ground) {
              const hdgRad = (hdg * Math.PI) / 180;
              const distMeters = vel * elapsedSec;
              const dLat = (distMeters * Math.cos(hdgRad)) / 111320;
              const dLng = (distMeters * Math.sin(hdgRad)) / (111320 * Math.cos((lat * Math.PI) / 180));
              lat += dLat;
              lng += dLng;
            }

            return {
              id: String(icao24),
              callsign: csStr,
              country: String(origin_country || "Unknown"),
              lat,
              lng,
              altitude: Math.max(0, alt + vRate * elapsedSec),
              velocity: vel,
              heading: hdg,
              verticalRate: vRate,
              isGround: Boolean(on_ground),
              timestamp: nowSec,
              path: generateFlightTrail(lat, lng, hdg, vel, 15),
            };
          })
          .filter((f: FlightVector | null): f is FlightVector => f !== null);

        if (flights.length > 0) {
          cachedLiveFlights = { flights, timestamp: Date.now(), source: "OpenSky Network ADS-B" };
          return NextResponse.json({
            flights,
            timestamp: Date.now(),
            isMock: false,
            source: "OpenSky Network ADS-B",
          });
        }
      }
    }
  } catch (_openSkyErr) {
    // Fall back to generated linear vectors
  }

  // Use recent live cache (up to 45 seconds old) if external providers hit momentary timeout
  if (cachedLiveFlights && Date.now() - cachedLiveFlights.timestamp < 45000) {
    return NextResponse.json({
      flights: cachedLiveFlights.flights,
      timestamp: Date.now(),
      isMock: false,
      source: `${cachedLiveFlights.source} (Cache Preserved)`,
    });
  }

  return NextResponse.json({
    flights: generateFallbackFlights(),
    timestamp: Date.now(),
    isMock: true,
    source: "Flight Vector Kinematic Engine (Fallback Active)",
  });
}

