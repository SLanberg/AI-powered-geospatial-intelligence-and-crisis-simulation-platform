import { NextResponse } from "next/server";

export interface VesselData {
  mmsi: number;
  name: string;
  shipType: number;
  shipCategory: "yacht" | "cargo" | "tanker" | "passenger" | "other";
  lat: number;
  lng: number;
  sog: number; // speed over ground (knots)
  cog: number; // course over ground (degrees)
  heading: number; // true heading
  navStatus: number;
  destination: string;
  callSign: string;
  timestamp: number;
}

// Bounding box / location center around Tallinn Bay
// lat: ~59.45, lng: ~24.75, radius: ~30km
const DIGITRAFFIC_LOCATIONS_URL =
  "https://meri.digitraffic.fi/api/ais/v1/locations?latitude=59.45&longitude=24.75&radius=30";
const DIGITRAFFIC_VESSELS_URL = "https://meri.digitraffic.fi/api/ais/v1/vessels";

// Cache vessel metadata to avoid spamming detail API
const metadataCache = new Map<number, { name: string; shipType: number; destination: string; callSign: string; updatedAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function getShipCategory(shipType: number): "yacht" | "cargo" | "tanker" | "passenger" | "other" {
  if ((shipType >= 36 && shipType <= 37) || shipType === 30) {
    return "yacht"; // Sailing / Pleasure Craft / Yacht
  }
  if (shipType >= 70 && shipType <= 79) {
    return "cargo";
  }
  if (shipType >= 80 && shipType <= 89) {
    return "tanker";
  }
  if (shipType >= 60 && shipType <= 69) {
    return "passenger";
  }
  return "other";
}

function generateFallbackVessels(): VesselData[] {
  const now = Date.now();
  const baseTime = Math.floor(now / 1000) / 10;
  return [
    {
      mmsi: 276869000,
      name: "Nordic Spirit (AIS Yacht)",
      shipType: 37,
      shipCategory: "yacht",
      lat: 59.467 + Math.sin(baseTime * 0.04) * 0.008,
      lng: 24.827 + Math.cos(baseTime * 0.04) * 0.012,
      sog: 12.4,
      cog: 260,
      heading: 260,
      navStatus: 0,
      destination: "Pirita Marina",
      callSign: "ESRQ",
      timestamp: now,
    },
    {
      mmsi: 230673000,
      name: "Baltic Breeze",
      shipType: 36,
      shipCategory: "yacht",
      lat: 59.485 + Math.cos(baseTime * 0.05) * 0.01,
      lng: 24.72 + Math.sin(baseTime * 0.05) * 0.015,
      sog: 9.2,
      cog: 95,
      heading: 95,
      navStatus: 0,
      destination: "Haven Kakumäe",
      callSign: "OG123",
      timestamp: now,
    },
    {
      mmsi: 276123450,
      name: "Tallink Megastar",
      shipType: 60,
      shipCategory: "passenger",
      lat: 59.452 + Math.sin(baseTime * 0.03) * 0.015,
      lng: 24.764 + Math.cos(baseTime * 0.03) * 0.02,
      sog: 21.0,
      cog: 340,
      heading: 340,
      navStatus: 0,
      destination: "Helsinki Harbour",
      callSign: "ESML",
      timestamp: now,
    },
    {
      mmsi: 276998877,
      name: "Tallinn Tanker Express",
      shipType: 80,
      shipCategory: "tanker",
      lat: 59.51 + Math.cos(baseTime * 0.02) * 0.015,
      lng: 24.85 + Math.sin(baseTime * 0.02) * 0.015,
      sog: 14.5,
      cog: 180,
      heading: 180,
      navStatus: 0,
      destination: "Muuga Harbour",
      callSign: "ESTT",
      timestamp: now,
    },
    {
      mmsi: 276554433,
      name: "Cargo Leader",
      shipType: 70,
      shipCategory: "cargo",
      lat: 59.435 + Math.sin(baseTime * 0.04) * 0.01,
      lng: 24.685 + Math.cos(baseTime * 0.04) * 0.015,
      sog: 11.0,
      cog: 75,
      heading: 75,
      navStatus: 0,
      destination: "Paldiski Port",
      callSign: "ESCL",
      timestamp: now,
    },
  ];
}

export async function GET() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(DIGITRAFFIC_LOCATIONS_URL, {
      signal: controller.signal,
      headers: {
        "Digitraffic-User": "CitySignal-Dashboard/1.0",
        "Accept-Encoding": "gzip",
      },
      next: { revalidate: 15 },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      return NextResponse.json({
        vessels: generateFallbackVessels(),
        timestamp: Date.now(),
        isMock: true,
        source: `Digitraffic API HTTP ${res.status} (Fallback Active)`,
      });
    }

    const data = await res.json();
    if (!data.features || !Array.isArray(data.features) || data.features.length === 0) {
      return NextResponse.json({
        vessels: generateFallbackVessels(),
        timestamp: Date.now(),
        isMock: true,
        source: "Digitraffic API empty features (Fallback Active)",
      });
    }

    const nowMs = Date.now();
    
    // Select top active vessels near Tallinn Bay
    const rawFeatures = data.features.slice(0, 50);

    // Fetch metadata for MMSIs missing from cache (up to 15 parallel requests)
    const mmsisToFetch = rawFeatures
      .map((f: any) => f.mmsi || f.properties?.mmsi)
      .filter((mmsi: number) => mmsi && (!metadataCache.has(mmsi) || nowMs - (metadataCache.get(mmsi)?.updatedAt || 0) > CACHE_TTL_MS))
      .slice(0, 15);

    await Promise.all(
      mmsisToFetch.map(async (mmsi: number) => {
        try {
          const metaRes = await fetch(`${DIGITRAFFIC_VESSELS_URL}/${mmsi}`, {
            headers: {
              "Digitraffic-User": "CitySignal-Dashboard/1.0",
              "Accept-Encoding": "gzip",
            },
            next: { revalidate: 300 },
          });
          if (metaRes.ok) {
            const meta = await metaRes.json();
            metadataCache.set(mmsi, {
              name: meta.name?.trim() || `VESSEL-${mmsi}`,
              shipType: meta.shipType || 0,
              destination: meta.destination?.trim() || "Unspecified",
              callSign: meta.callSign?.trim() || "",
              updatedAt: nowMs,
            });
          }
        } catch (_err) {
          // ignore individual metadata fetch errors
        }
      })
    );

    const vessels: VesselData[] = rawFeatures
      .map((feature: any) => {
        const props = feature.properties || {};
        const coords = feature.geometry?.coordinates || [];
        const mmsi = Number(feature.mmsi || props.mmsi);
        if (!mmsi || coords.length < 2) return null;

        const lng = Number(coords[0]);
        const lat = Number(coords[1]);

        const cachedMeta = metadataCache.get(mmsi);
        const name = cachedMeta?.name || `MMSI ${mmsi}`;
        const shipType = cachedMeta?.shipType || 0;
        const destination = cachedMeta?.destination || "Tallinn Sea Area";
        const callSign = cachedMeta?.callSign || "";
        const shipCategory = getShipCategory(shipType);

        const sog = Number(props.sog ?? 0);
        const cog = Number(props.cog ?? 0);
        const heading = Number(props.heading && props.heading !== 511 ? props.heading : cog);
        const navStatus = Number(props.navStat ?? 0);
        const timestamp = Number(props.timestampExternal || nowMs);

        return {
          mmsi,
          name,
          shipType,
          shipCategory,
          lat,
          lng,
          sog,
          cog,
          heading,
          navStatus,
          destination,
          callSign,
          timestamp,
        };
      })
      .filter((v: VesselData | null): v is VesselData => v !== null);

    return NextResponse.json({
      vessels: vessels.length > 0 ? vessels : generateFallbackVessels(),
      timestamp: Date.now(),
      isMock: false,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({
      vessels: generateFallbackVessels(),
      timestamp: Date.now(),
      isMock: true,
      error: errMessage,
    });
  }
}
