"use server";

import { incidentsService } from "@/backend/services/incidents.service";
import {
  CreateIncidentPayloadSchema,
  CreateIncidentPayload,
  Incident,
  IncidentFilterSchema,
  IncidentFilter,
} from "@/shared";

export interface ServerActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Create an incident with strict Zod validation
 */
export async function createIncidentAction(
  rawPayload: unknown
): Promise<ServerActionResult<Incident>> {
  try {
    const validatedPayload: CreateIncidentPayload = CreateIncidentPayloadSchema.parse(rawPayload);
    const incident = await incidentsService.createIncident(validatedPayload);
    return { success: true, data: incident };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create incident";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Query incidents with strict Zod filtering
 */
export async function queryIncidentsAction(
  rawFilter?: unknown
): Promise<ServerActionResult<Incident[]>> {
  try {
    const validatedFilter: IncidentFilter | undefined = rawFilter
      ? IncidentFilterSchema.parse(rawFilter)
      : undefined;
    const incidents = await incidentsService.getIncidents(validatedFilter);
    return { success: true, data: incidents };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to query incidents";
    return { success: false, error: message };
  }
}
