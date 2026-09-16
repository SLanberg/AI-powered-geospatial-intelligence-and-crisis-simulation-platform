import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const revalidate = 21_600;

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public/data/official_emergency_services.json");
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      return NextResponse.json({
        facilities: data,
        total: data.length,
        sources: [
          "Maa- ja Ruumiamet (MaRu) ETAK WFS (https://gsavalik.envir.ee/geoserver/etak/wfs)",
          "Maa- ja Ruumiamet AKS POI OGC (https://aks.geoportaal.ee/aks-ogc)",
          "Tallinn GIS / Päästeamet ArcGIS REST (https://gis.tallinn.ee/arcgis/rest/services/kriisivalmidus/paasteameti_avaandmed/FeatureServer)"
        ]
      });
    }

    return NextResponse.json({ facilities: [], total: 0, sources: [] });
  } catch (error) {
    return NextResponse.json(
      { facilities: [], error: "GIS feed unavailable" },
      { status: 500 }
    );
  }
}

