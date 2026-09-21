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
  UpdateIncidentInputSchema,
  UpdateIncidentOutputSchema,
  UpdateIncidentInput,
  UpdateIncidentOutput,
  DeleteIncidentInputSchema,
  DeleteIncidentOutputSchema,
  DeleteIncidentInput,
  DeleteIncidentOutput,
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

export const updateIncidentTool = {
  name: "update_incident",
  description: "Update details or status of an existing incident in Tallinn DB.",
  isWriteOperation: true,
  inputSchema: UpdateIncidentInputSchema,
  outputSchema: UpdateIncidentOutputSchema,
  execute: async (rawInput: unknown): Promise<UpdateIncidentOutput> => {
    const input: UpdateIncidentInput = UpdateIncidentInputSchema.parse(rawInput);
    const updated = await incidentsService.updateIncident(input.id, {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.severity !== undefined ? { severity: input.severity } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.district !== undefined ? { district: input.district } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.lat !== undefined ? { lat: input.lat } : {}),
      ...(input.lng !== undefined ? { lng: input.lng } : {}),
    });

    return {
      success: true,
      incidentId: updated.id,
      message: `Incident updated in database: [${updated.id}] ${updated.title} (Status: ${updated.status})`,
    };
  },
};

export const deleteIncidentTool = {
  name: "delete_incident",
  description: "Decommission and remove an incident record from Tallinn DB.",
  isWriteOperation: true,
  inputSchema: DeleteIncidentInputSchema,
  outputSchema: DeleteIncidentOutputSchema,
  execute: async (rawInput: unknown): Promise<DeleteIncidentOutput> => {
    const input: DeleteIncidentInput = DeleteIncidentInputSchema.parse(rawInput);
    await incidentsService.deleteIncident(input.id);

    return {
      success: true,
      incidentId: input.id,
      message: `Incident [${input.id}] successfully decommissioned from database.`,
    };
  },
};
