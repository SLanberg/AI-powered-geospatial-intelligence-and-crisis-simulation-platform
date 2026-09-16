import { incidentsService } from "@/backend/services/incidents.service";
import {
  SearchIncidentsInputSchema,
  SearchIncidentsOutputSchema,
  SearchIncidentsInput,
  SearchIncidentsOutput,
  CreateIncidentInputSchema,
  CreateIncidentOutputSchema,
  CreateIncidentInput,
  CreateIncidentOutput,
} from "@/shared";

export const searchIncidentsTool = {
  name: "search_incidents",
  description: "Search active grid anomalies, power outages, and incidents in Tallinn stored in SQLite DB.",
  isWriteOperation: false,
  inputSchema: SearchIncidentsInputSchema,
  outputSchema: SearchIncidentsOutputSchema,
  execute: async (rawInput: unknown): Promise<SearchIncidentsOutput> => {
    const input: SearchIncidentsInput = SearchIncidentsInputSchema.parse(rawInput);
    const allIncidents = await incidentsService.getIncidents({
      severity: input.severity,
      district: input.sector,
    });

    const filtered = allIncidents.filter((inc) => {
      if (input.sector && inc.district && !inc.district.toLowerCase().includes(input.sector.toLowerCase())) {
        return false;
      }
      return true;
    });

    return {
      count: filtered.length,
      incidents: filtered.map((i) => ({
        id: i.id,
        title: i.title,
        severity: i.severity,
        category: i.category,
        status: i.status,
        district: i.district,
        nodeId: i.nodeId,
        description: i.description,
        timestamp: i.timestamp,
      })),
    };
  },
};

export const createIncidentTool = {
  name: "create_incident",
  description: "Create and register a verified telemetry anomaly or civil crisis incident in Tallinn DB.",
  isWriteOperation: true,
  inputSchema: CreateIncidentInputSchema,
  outputSchema: CreateIncidentOutputSchema,
  execute: async (rawInput: unknown): Promise<CreateIncidentOutput> => {
    const input: CreateIncidentInput = CreateIncidentInputSchema.parse(rawInput);
    const incident = await incidentsService.createIncident({
      title: input.title,
      severity: input.severity,
      category: input.category,
      district: input.district,
      description: input.description,
      lat: input.lat ?? 59.4372,
      lng: input.lng ?? 24.7453,
    });

    return {
      success: true,
      incidentId: incident.id,
      message: `Incident registered in database: [${incident.id}] ${incident.title}`,
    };
  },
};
