import { VesselData, VesselCategory, VesselResponse } from "@/shared";

const DIGITRAFFIC_LOCATIONS_URL =
  "https://meri.digitraffic.fi/api/ais/v1/locations?latitude=59.45&longitude=24.75&radius=45";
const DIGITRAFFIC_VESSELS_URL = "https://meri.digitraffic.fi/api/ais/v1/vessels";

const metadataCache = new Map<
  number,
  {
    name: string;
    shipType: number;
    destination: string;
    callSign: string;
    updatedAt: number;
  }
>();
const CACHE_TTL_MS = 10 * 60 * 1000;

function getShipCategory(shipType: number): VesselCategory {
  if ((shipType >= 36 && shipType <= 37) || shipType === 30) {
    return "yacht";
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

function getLinearVesselPos(
  baseLat: number,
  baseLng: number,
  sogKnots: number,
  headingDeg: number,
  nowSec: number
): { lat: number; lng: number } {
  const speedMs = sogKnots * 0.514444;
  const hdgRad = (headingDeg * Math.PI) / 180;
  const distMeters = speedMs * (nowSec % 86400);
  const dLat = (distMeters * Math.cos(hdgRad)) / 111320;
  const dLng =
    (distMeters * Math.sin(hdgRad)) / (111320 * Math.cos((baseLat * Math.PI) / 180));

  let lat = baseLat + dLat;
  let lng = baseLng + dLng;

  const minLat = 59.35;
  const maxLat = 59.6;
  const minLng = 24.5;
  const maxLng = 25.0;

  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;

  while (lat > maxLat) lat -= latSpan;
  while (lat < minLat) lat += latSpan;
  while (lng > maxLng) lng -= lngSpan;
  while (lng < minLng) lng += lngSpan;

  return { lat, lng };
}

export class VesselsService {
  async fetchLiveVessels(): Promise<VesselResponse> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(DIGITRAFFIC_LOCATIONS_URL, {
        headers: { "Accept-Encoding": "gzip", "User-Agent": "NeuralCity/2.0" },
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (!res.ok) {
        throw new Error(`Digitraffic locations responded with ${res.status}`);
      }

      const geojson = (await res.json()) as {
        features?: Array<{
          mmsi: number;
          geometry: { coordinates: [number, number] };
          properties: {
            sog: number;
            cog: number;
            heading: number;
            navStat: number;
            timestampExternal: number;
          };
        }>;
      };

      const features = geojson.features ?? [];
      const mmsiList = features.map((f) => f.mmsi);

      // Fetch metadata for un-cached vessels
      const missingMmsi = mmsiList.filter((mmsi) => {
        const cached = metadataCache.get(mmsi);
        return !cached || Date.now() - cached.updatedAt > CACHE_TTL_MS;
      });

      if (missingMmsi.length > 0) {
        try {
          const metaController = new AbortController();
          const metaTimeout = setTimeout(() => metaController.abort(), 3000);
          const metaRes = await fetch(DIGITRAFFIC_VESSELS_URL, {
            headers: { "Accept-Encoding": "gzip", "User-Agent": "NeuralCity/2.0" },
            signal: metaController.signal,
          }).finally(() => clearTimeout(metaTimeout));

          if (metaRes.ok) {
            const metaList = (await metaRes.json()) as Array<{
              mmsi: number;
              name?: string;
              shipType?: number;
              destination?: string;
              callSign?: string;
            }>;

            const now = Date.now();
            for (const item of metaList) {
              if (mmsiList.includes(item.mmsi)) {
                metadataCache.set(item.mmsi, {
                  name: item.name?.trim() || `VESSEL-${item.mmsi}`,
                  shipType: item.shipType || 0,
                  destination: item.destination?.trim() || "TALLINN",
                  callSign: item.callSign?.trim() || "",
                  updatedAt: now,
                });
              }
            }
          }
        } catch {
          // Ignore metadata fetch error, fallback gracefully
        }
      }

      const vessels: VesselData[] = features.map((f) => {
        const meta = metadataCache.get(f.mmsi);
        const shipType = meta?.shipType || 0;
        return {
          mmsi: f.mmsi,
          name: meta?.name || `VESSEL-${f.mmsi}`,
          shipType,
          shipCategory: getShipCategory(shipType),
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
          sog: f.properties.sog || 0,
          cog: f.properties.cog || 0,
          heading: f.properties.heading || f.properties.cog || 0,
          navStatus: f.properties.navStat || 0,
          destination: meta?.destination || "GULF OF FINLAND",
          callSign: meta?.callSign || "",
          timestamp: f.properties.timestampExternal || Date.now(),
        };
      });

      return {
        status: "success",
        count: vessels.length,
        vessels,
        simulated: false,
      };
    } catch {
      return this.generateSimulatedVessels();
    }
  }

  private generateSimulatedVessels(): VesselResponse {
    const nowSec = Math.floor(Date.now() / 1000);
    const SIMULATED_FLEET = [
      { mmsi: 276841000, name: "MEGASTAR", shipType: 60, sog: 21.5, heading: 24, baseLat: 59.458, baseLng: 24.762, dest: "HELSINKI" },
      { mmsi: 276852000, name: "MYSTAR", shipType: 60, sog: 19.8, heading: 205, baseLat: 59.492, baseLng: 24.789, dest: "TALLINN" },
      { mmsi: 230627000, name: "SILJA EUROPA", shipType: 60, sog: 14.2, heading: 15, baseLat: 59.465, baseLng: 24.77, dest: "HELSINKI" },
      { mmsi: 276789000, name: "BALTIC QUEEN", shipType: 60, sog: 16.0, heading: 285, baseLat: 59.48, baseLng: 24.69, dest: "STOCKHOLM" },
      { mmsi: 212543000, name: "NORDIC N", shipType: 80, sog: 9.4, heading: 85, baseLat: 59.51, baseLng: 24.65, dest: "MUOGA" },
      { mmsi: 305889000, name: "ELAND", shipType: 70, sog: 11.2, heading: 75, baseLat: 59.53, baseLng: 24.55, dest: "ST. PETERSBURG" },
      { mmsi: 276001234, name: "TALLINN PILOT 1", shipType: 30, sog: 18.0, heading: 330, baseLat: 59.47, baseLng: 24.74, dest: "TALLINN ROAD" },
      { mmsi: 276999888, name: "EVA-316 ICEBREAKER", shipType: 52, sog: 0.0, heading: 120, baseLat: 59.452, baseLng: 24.735, dest: "HUNDIPEA" },
    ];

    const vessels: VesselData[] = SIMULATED_FLEET.map((base) => {
      const pos = getLinearVesselPos(base.baseLat, base.baseLng, base.sog, base.heading, nowSec);
      return {
        mmsi: base.mmsi,
        name: base.name,
        shipType: base.shipType,
        shipCategory: getShipCategory(base.shipType),
        lat: pos.lat,
        lng: pos.lng,
        sog: base.sog,
        cog: base.heading,
        heading: base.heading,
        navStatus: base.sog > 0.5 ? 0 : 1,
        destination: base.dest,
        callSign: `ES${base.mmsi.toString().slice(-4)}`,
        timestamp: Date.now(),
      };
    });

    return {
      status: "success",
      count: vessels.length,
      vessels,
      simulated: true,
    };
  }
}

export const vesselsService = new VesselsService();
