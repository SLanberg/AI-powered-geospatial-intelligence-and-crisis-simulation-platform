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
}

// Bounding box for Estonia / Tallinn airspace
// lamin=58.5, lamax=60.2, lomin=23.5, lomax=26.5
const OPENSKY_URL =
  "https://opensky-network.org/api/states/all?lamin=58.5&lamax=60.2&lomin=23.5&lomax=26.5";

function generateFallbackFlights(): FlightVector[] {
  const now = Math.floor(Date.now() / 1000);
  const baseTime = now / 10;

  return [
    {
      id: "471f01",
      callsign: "EEL102",
      country: "Estonia",
      lat: 59.43 + Math.sin(baseTime * 0.05) * 0.08,
      lng: 24.88 + Math.cos(baseTime * 0.05) * 0.12,
      altitude: 3200,
      velocity: 185,
      heading: 260,
      verticalRate: -2.5,
      isGround: false,
      timestamp: now,
    },
    {
      id: "461e88",
      callsign: "AY1013",
      country: "Finland",
      lat: 59.52 - (baseTime % 100) * 0.003,
      lng: 24.72 + Math.sin(baseTime * 0.08) * 0.05,
      altitude: 8500,
      velocity: 240,
      heading: 195,
      verticalRate: -5.0,
      isGround: false,
      timestamp: now,
    },
    {
      id: "471a42",
      callsign: "DLH822",
      country: "Germany",
      lat: 59.38 + (baseTime % 120) * 0.002,
      lng: 24.6 + Math.cos(baseTime * 0.06) * 0.06,
      altitude: 10600,
      velocity: 270,
      heading: 75,
      verticalRate: 0,
      isGround: false,
      timestamp: now,
    },
    {
      id: "471c09",
      callsign: "BTI411",
      country: "Latvia",
      lat: 59.41 + Math.cos(baseTime * 0.04) * 0.07,
      lng: 24.78 + Math.sin(baseTime * 0.04) * 0.09,
      altitude: 1200,
      velocity: 130,
      heading: 130,
      verticalRate: -8.0,
      isGround: false,
      timestamp: now,
    },
    {
      id: "471f99",
      callsign: "EEL881",
      country: "Estonia",
      lat: 59.47 + Math.sin(baseTime * 0.07) * 0.09,
      lng: 24.95 - Math.cos(baseTime * 0.07) * 0.1,
      altitude: 4500,
      velocity: 210,
      heading: 310,
      verticalRate: 3.2,
      isGround: false,
      timestamp: now,
    },
  ];
}

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(OPENSKY_URL, {
      signal: controller.signal,
      headers: {
        "User-Agent": "CitySignal-TacticalDashboard/1.0",
      },
      next: { revalidate: 10 },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({
        flights: [],
        timestamp: Date.now(),
        isMock: false,
        source: `OpenSky API HTTP ${res.status}`,
      });
    }

    const data = await res.json();
    if (!data.states || !Array.isArray(data.states) || data.states.length === 0) {
      return NextResponse.json({
        flights: [],
        timestamp: Date.now(),
        isMock: false,
        source: "OpenSky API empty states",
      });
    }

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

        return {
          id: String(icao24),
          callsign: typeof callsign === "string" && callsign.trim() ? callsign.trim() : String(icao24).toUpperCase(),
          country: String(origin_country || "Unknown"),
          lat: Number(latitude),
          lng: Number(longitude),
          altitude: Number(baro_altitude ?? geo_altitude ?? 3000),
          velocity: Number(velocity ?? 150),
          heading: Number(true_track ?? 0),
          verticalRate: Number(vertical_rate ?? 0),
          isGround: Boolean(on_ground),
          timestamp: Number(time_position || Math.floor(Date.now() / 1000)),
        };
      })
      .filter((f: FlightVector | null): f is FlightVector => f !== null);

    return NextResponse.json({
      flights,
      timestamp: Date.now(),
      isMock: false,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      flights: [],
      timestamp: Date.now(),
      isMock: false,
      error: errMessage,
    });
  }
}
