import fs from "fs";
import path from "path";
import prisma from "../db/prisma";
import { Infrastructure, InfrastructureSchema } from "@/shared";

export interface InfrastructureFeedResult {
  facilities: Array<Record<string, unknown>>;
  total: number;
  sources: string[];
  dbItems?: Infrastructure[];
}

export class InfrastructureService {
  /**
   * Get official emergency GIS facilities and database critical infrastructure
   */
  async getFacilities(): Promise<InfrastructureFeedResult> {
    const sources = [
      "Maa- ja Ruumiamet (MaRu) ETAK WFS (https://gsavalik.envir.ee/geoserver/etak/wfs)",
      "Maa- ja Ruumiamet AKS POI OGC (https://aks.geoportaal.ee/aks-ogc)",
      "Tallinn GIS / Päästeamet ArcGIS REST (https://gis.tallinn.ee/arcgis/rest/services/kriisivalmidus/paasteameti_avaandmed/FeatureServer)",
    ];

    let fileFacilities: Array<Record<string, unknown>> = [];
    const filePath = path.join(process.cwd(), "public/data/official_emergency_services.json");

    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        fileFacilities = JSON.parse(raw) as Array<Record<string, unknown>>;
      } catch {
        fileFacilities = [];
      }
    }

    // Optionally pull db items
    let dbItems: Infrastructure[] = [];
    try {
      const records = await prisma.infrastructure.findMany();
      dbItems = records.map((r) => InfrastructureSchema.parse(r));
    } catch {
      dbItems = [];
    }

    return {
      facilities: fileFacilities,
      total: fileFacilities.length,
      sources,
      dbItems,
    };
  }
}

export const infrastructureService = new InfrastructureService();
