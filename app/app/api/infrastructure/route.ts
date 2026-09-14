import { NextResponse } from "next/server";

export const revalidate = 21_600;

const TALLINN_BOUNDS = "59.35,24.55,59.50,24.95";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

type OsmElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

const query = `[out:json][timeout:45];
(
  nwr[amenity~"^(hospital|clinic|doctors|police|fire_station|school|college|university|shelter)$"](${TALLINN_BOUNDS});
  nwr[emergency="ambulance_station"](${TALLINN_BOUNDS});
  nwr[power~"^(substation|plant)$"](${TALLINN_BOUNDS});
  nwr[man_made~"^(water_works|wastewater_plant)$"](${TALLINN_BOUNDS});
  nwr[aeroway="aerodrome"](${TALLINN_BOUNDS});
  nwr[railway="station"](${TALLINN_BOUNDS});
);
out center tags;`;

function facilityType(tags: Record<string, string>) {
  if (tags.power) return "power";
  if (tags.man_made) return "water";
  if (tags.aeroway || tags.railway) return "transport";
  if (tags.amenity === "hospital") return "hospital";
  if (["clinic", "doctors"].includes(tags.amenity) || tags.emergency === "ambulance_station") return "clinic";
  if (tags.amenity === "police") return "police";
  if (tags.amenity === "fire_station") return "fire_station";
  if (["school", "college", "university"].includes(tags.amenity)) return "school";
  return "shelter";
}

function category(tags: Record<string, string>) {
  return tags.amenity || tags.power || tags.man_made || tags.aeroway || tags.railway || "facility";
}

function address(tags: Record<string, string>) {
  const street = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ");
  return street || tags["addr:full"] || "Address not published in source";
}

export async function GET() {
  try {
    const response = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ data: query }),
      next: { revalidate },
    });
    if (!response.ok) throw new Error(`Overpass returned ${response.status}`);
    const payload = (await response.json()) as { elements?: OsmElement[] };
    const facilities = (payload.elements || [])
      .map((element) => {
        const tags = element.tags || {};
        const lat = element.lat ?? element.center?.lat;
        const lng = element.lon ?? element.center?.lon;
        if (!lat || !lng || !tags.name) return null;
        return {
          id: `osm-${element.type}-${element.id}`,
          name: tags.name,
          shortName: tags.short_name || tags.name.slice(0, 22),
          type: facilityType(tags),
          category: category(tags),
          lat,
          lng,
          address: address(tags),
          district: tags["addr:district"] || "Tallinn",
          city: tags["addr:city"] || "Tallinn",
          phone: tags.phone || tags["contact:phone"] || "Not published",
          emergency: tags.emergency === "yes" ? "112" : undefined,
          status: "active" as const,
          hours: tags.opening_hours || "Hours not published",
          source: "OpenStreetMap / Overpass (ODbL)",
          sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a!.name.localeCompare(b!.name));
    return NextResponse.json({ facilities, source: "OpenStreetMap / Overpass (ODbL)" });
  } catch {
    return NextResponse.json(
      { facilities: [], source: "OpenStreetMap / Overpass (ODbL)", error: "Open GIS feed is temporarily unavailable" },
      { status: 503 },
    );
  }
}
