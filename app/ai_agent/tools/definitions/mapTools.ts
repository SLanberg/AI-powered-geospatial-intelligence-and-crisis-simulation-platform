import fs from "fs";
import path from "path";
import { z } from "zod";
import { ITool } from "../registry";

export const NavigateMapInputSchema = z.object({
  query: z.string().describe("Name of the location, facility, gas station, address, substation, or coordinates in Tallinn (e.g., 'Olerex AS Linnu tee tankla', 'Balti jaam', 'Kristiine', '59.4128, 24.7092')"),
  lat: z.number().optional().describe("Direct latitude if known"),
  lng: z.number().optional().describe("Direct longitude if known"),
  zoom: z.number().optional().default(15.5).describe("Map camera zoom level (typically 14-17 for POIs, 12-13 for districts)"),
  district: z.string().optional().describe("District filter or sector if known"),
  title: z.string().optional().describe("Custom title to display on the map action banner"),
});
export type NavigateMapInput = z.infer<typeof NavigateMapInputSchema>;

export const NavigateMapOutputSchema = z.object({
  success: z.boolean(),
  resolvedLocation: z.object({
    name: z.string(),
    address: z.string().optional(),
    district: z.string().optional(),
    category: z.string().optional(),
    lat: z.number(),
    lng: z.number(),
    zoom: z.number(),
  }),
  mapAction: z.object({
    type: z.literal("fly_to"),
    center: z.object({
      lat: z.number(),
      lng: z.number(),
      zoom: z.number(),
    }),
    title: z.string(),
    targetDistrictId: z.string().optional(),
    address: z.string().optional(),
  }),
  message: z.string(),
});
export type NavigateMapOutput = z.infer<typeof NavigateMapOutputSchema>;

// District Centers Dictionary for quick lookup
const DISTRICT_CENTERS: Record<string, { name: string; lat: number; lng: number }> = {
  vanalinn: { name: "Vanalinn", lat: 59.4372, lng: 24.7453 },
  ulemiste: { name: "Ülemiste", lat: 59.4215, lng: 24.7958 },
  port: { name: "Port / Sadam", lat: 59.4450, lng: 24.7680 },
  baltijaam: { name: "Balti Jaam", lat: 59.4402, lng: 24.7378 },
  kristiine: { name: "Kristiine", lat: 59.4260, lng: 24.7240 },
  mustamae: { name: "Mustamäe", lat: 59.3965, lng: 24.6730 },
  lasnamae: { name: "Lasnamäe", lat: 59.4380, lng: 24.8450 },
  "pohja-tallinn": { name: "Põhja-Tallinn", lat: 59.4500, lng: 24.7200 },
  kesklinn: { name: "Kesklinn", lat: 59.4320, lng: 24.7550 },
  nomme: { name: "Nõmme", lat: 59.3800, lng: 24.6800 },
  pirita: { name: "Pirita", lat: 59.4650, lng: 24.8300 },
  haabersti: { name: "Haabersti", lat: 59.4200, lng: 24.6300 },
};

let cachedGisFacilities: Array<{
  id?: string;
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  category?: string;
  type?: string;
}> | null = null;

function loadGisFacilities() {
  if (cachedGisFacilities) return cachedGisFacilities;
  try {
    const filePath = path.join(process.cwd(), "public/data/official_emergency_services.json");
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      cachedGisFacilities = JSON.parse(raw);
    } else {
      cachedGisFacilities = [];
    }
  } catch {
    cachedGisFacilities = [];
  }
  return cachedGisFacilities || [];
}

export const KNOWN_TRANSPORT_HUBS = [
  {
    name: "Tallinn Lennart Meri Airport (TLL)",
    aliases: ["tll", "airport", "tallinn airport", "lennart meri", "lennujaam", "lennujaama", "tallinna lennujaam"],
    lat: 59.4132,
    lng: 24.8326,
    zoom: 16,
    district: "ulemiste",
    address: "Tartu mnt 101",
  },
  {
    name: "Balti Jaam (Tallinn Central Station)",
    aliases: ["balti jaam", "central station", "train station", "raudteejaam", "tallinn station"],
    lat: 59.4402,
    lng: 24.7378,
    zoom: 16,
    district: "pohja-tallinn",
    address: "Toompuiestee 37",
  },
  {
    name: "Tallinn Linnahall Heliport",
    aliases: ["heliport", "linnahall heliport", "city heliport"],
    lat: 59.4479,
    lng: 24.7533,
    zoom: 16,
    district: "kesklinn",
    address: "Mere pst 20",
  },
  {
    name: "Old City Harbour (Tallinna Vanasadam)",
    aliases: ["vanasadam", "old city harbour", "passenger port", "tallinna vanasadam", "passenger harbour"],
    lat: 59.4449,
    lng: 24.7608,
    zoom: 16,
    district: "port",
    address: "Sadama 25",
  },
  {
    name: "Ülemiste Railway & Rail Baltica Terminal",
    aliases: ["ulemiste station", "ülemiste jaam", "ülemiste rail", "rail baltica"],
    lat: 59.4233,
    lng: 24.7961,
    zoom: 16,
    district: "ulemiste",
    address: "Suur-Sõjamäe 4",
  },
  {
    name: "Port of Muuga (Muuga Sadam)",
    aliases: ["muuga", "muuga port", "muuga sadam", "port of muuga"],
    lat: 59.4960,
    lng: 24.9600,
    zoom: 15.5,
    district: "lasnamae",
    address: "Maardu tee 57",
  },
];

export function searchLocationInTallinn(query: string): {
  name: string;
  address?: string;
  district?: string;
  category?: string;
  lat: number;
  lng: number;
  zoom: number;
} | null {
  const clean = query.trim().toLowerCase();

  // 1. Check for coordinate pattern: "59.4128, 24.7092" or "lat 59.4, lng 24.7"
  const coordMatch = clean.match(/([-+]?\d{1,2}\.\d+)[,\s]+([-+]?\d{1,3}\.\d+)/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return {
        name: `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        lat,
        lng,
        zoom: 16,
      };
    }
  }

  // 2. Check Major Transport Hubs & Airport Aliases
  for (const hub of KNOWN_TRANSPORT_HUBS) {
    const matchesAlias = hub.aliases.some((alias) => {
      const aliasRegex = new RegExp(`\\b${alias.replace(/\s+/g, "\\s+")}\\b`, "i");
      return aliasRegex.test(clean) || clean === alias;
    });

    if (matchesAlias || clean.includes(hub.name.toLowerCase())) {
      return {
        name: hub.name,
        address: hub.address,
        district: hub.district,
        lat: hub.lat,
        lng: hub.lng,
        zoom: hub.zoom,
      };
    }
  }

  // 3. Search Official GIS database (~12,000 facilities: Olerex gas stations, hospitals, shelters, fire stations, hazard sites)
  const facilities = loadGisFacilities();
  if (facilities.length > 0) {
    // Strip common command words
    const searchTerms = clean
      .replace(/^(fly to|navigate to|show me where this is move the map|show me where this is|show me|move the map to|move map to|go to|locate|where is|move me to)\s+/i, "")
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 2);

    let bestFacility: (typeof facilities)[0] | null = null;
    let maxScore = 0;

    for (const fac of facilities) {
      if (!fac.name || fac.lat === undefined || fac.lng === undefined) continue;
      const facName = fac.name.toLowerCase();
      const facAddr = (fac.address || "").toLowerCase();

      // Exact match or substring
      if (facName.includes(clean) || (clean.length > 5 && (facName + " " + facAddr).includes(clean))) {
        return {
          name: fac.name,
          address: fac.address,
          category: fac.category || fac.type,
          lat: Number(fac.lat),
          lng: Number(fac.lng),
          zoom: 16,
        };
      }

      // Word score match
      let score = 0;
      for (const term of searchTerms) {
        if (facName.includes(term)) score += 3;
        if (facAddr.includes(term)) score += 2;
      }

      if (score > maxScore) {
        maxScore = score;
        bestFacility = fac;
      }
    }

    if (bestFacility && maxScore >= 4) {
      return {
        name: bestFacility.name || "Target Facility",
        address: bestFacility.address,
        category: bestFacility.category || bestFacility.type,
        lat: Number(bestFacility.lat),
        lng: Number(bestFacility.lng),
        zoom: 16,
      };
    }
  }

  // 4. Check district centers (Strict word-boundary matching)
  for (const [key, center] of Object.entries(DISTRICT_CENTERS)) {
    const normKey = key.replace(/-/g, " ");
    const keyRegex = new RegExp(`\\b${normKey}\\b`, "i");
    const nameRegex = new RegExp(`\\b${center.name.toLowerCase().replace(/[\/\-_]/g, "\\s*")}\\b`, "i");

    const districtTerms = center.name
      .toLowerCase()
      .split(/[\s/]+/)
      .filter((w) => w.length > 3 && w !== "district" && w !== "sector");

    const matchesToken = districtTerms.some((term) => new RegExp(`\\b${term}\\b`, "i").test(clean));

    if (keyRegex.test(clean) || nameRegex.test(clean) || matchesToken) {
      return {
        name: `${center.name} District Sector`,
        district: key,
        lat: center.lat,
        lng: center.lng,
        zoom: 13.5,
      };
    }
  }

  // Fallback to Tallinn Central
  return null;
}

export const navigateMapTool: ITool<NavigateMapInput, NavigateMapOutput> = {
  name: "navigate_map",
  description:
    "Fly the tactical map camera and focus the GIS viewport onto a specific location, address, gas station, emergency service, or district in Tallinn (e.g. 'Olerex AS Linnu tee tankla', 'Balti jaam', 'Kristiine').",
  isWriteOperation: false,
  inputSchema: NavigateMapInputSchema,
  outputSchema: NavigateMapOutputSchema,
  execute: async (rawInput: unknown): Promise<NavigateMapOutput> => {
    const input: NavigateMapInput = NavigateMapInputSchema.parse(rawInput);

    let resolved: {
      name: string;
      address?: string;
      district?: string;
      category?: string;
      lat: number;
      lng: number;
      zoom: number;
    } | null = null;

    if (input.lat !== undefined && input.lng !== undefined) {
      resolved = {
        name: input.title || input.query || "Target Location",
        lat: input.lat,
        lng: input.lng,
        zoom: input.zoom ?? 15.5,
        district: input.district,
      };
    } else {
      resolved = searchLocationInTallinn(input.query);
    }

    if (!resolved) {
      resolved = {
        name: input.query,
        address: "Tallinn Central Command Area",
        lat: 59.4372,
        lng: 24.7453,
        zoom: 13,
      };
    }

    const title = input.title || resolved.name;

    const mapAction = {
      type: "fly_to" as const,
      center: {
        lat: resolved.lat,
        lng: resolved.lng,
        zoom: input.zoom || resolved.zoom || 15.5,
      },
      title,
      targetDistrictId: resolved.district,
      address: resolved.address,
    };

    return {
      success: true,
      resolvedLocation: {
        name: resolved.name,
        address: resolved.address,
        district: resolved.district,
        category: resolved.category,
        lat: resolved.lat,
        lng: resolved.lng,
        zoom: resolved.zoom,
      },
      mapAction,
      message: `GIS Camera re-centered on ${resolved.name} [${resolved.lat.toFixed(4)}, ${resolved.lng.toFixed(4)}]. Viewport telemetry locked.`,
    };
  },
};

export const FocusDistrictInputSchema = z.object({
  district: z.string().describe("District name in Tallinn (e.g., 'kristiine', 'vanalinn', 'ulemiste', 'mustamae', 'lasnamae', 'kesklinn', 'nomme', 'pirita', 'haabersti', 'pohja-tallinn')"),
  highlightIncidents: z.boolean().optional().default(true).describe("Whether to highlight active incident hotspots in this district"),
});
export type FocusDistrictInput = z.infer<typeof FocusDistrictInputSchema>;

export const FocusDistrictOutputSchema = z.object({
  success: z.boolean(),
  district: z.string(),
  name: z.string(),
  center: z.object({
    lat: z.number(),
    lng: z.number(),
    zoom: z.number(),
  }),
  mapAction: z.object({
    type: z.literal("focus_district"),
    targetDistrictId: z.string(),
    center: z.object({
      lat: z.number(),
      lng: z.number(),
      zoom: z.number(),
    }),
    title: z.string(),
  }),
  message: z.string(),
});
export type FocusDistrictOutput = z.infer<typeof FocusDistrictOutputSchema>;

export const focusDistrictTool: ITool<FocusDistrictInput, FocusDistrictOutput> = {
  name: "focus_district",
  description: "Highlight a Tallinn district sector and position the map camera over its territory.",
  isWriteOperation: false,
  inputSchema: FocusDistrictInputSchema,
  outputSchema: FocusDistrictOutputSchema,
  execute: async (rawInput: unknown): Promise<FocusDistrictOutput> => {
    const input = FocusDistrictInputSchema.parse(rawInput);
    const key = input.district.toLowerCase().trim().replace(/[\s_]+/g, "-");
    const foundKey = Object.keys(DISTRICT_CENTERS).find((k) => k === key || k.includes(key) || key.includes(k)) || "vanalinn";
    const center = DISTRICT_CENTERS[foundKey];

    const mapAction = {
      type: "focus_district" as const,
      targetDistrictId: foundKey,
      center: {
        lat: center.lat,
        lng: center.lng,
        zoom: 13.5,
      },
      title: `District Sector: ${center.name}`,
    };

    return {
      success: true,
      district: foundKey,
      name: center.name,
      center: {
        lat: center.lat,
        lng: center.lng,
        zoom: 13.5,
      },
      mapAction,
      message: `Focused tactical map on ${center.name} district [${center.lat}, ${center.lng}]. District perimeter highlighted.`,
    };
  },
};
