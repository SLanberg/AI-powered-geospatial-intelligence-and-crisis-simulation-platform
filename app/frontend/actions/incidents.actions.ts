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
 * Server Action: Update an incident
 */
export async function updateIncidentAction(
  id: string,
  rawPayload: unknown
): Promise<ServerActionResult<Incident>> {
  try {
    const validatedPartial: Partial<CreateIncidentPayload> = CreateIncidentPayloadSchema.partial().parse(rawPayload);
    const incident = await incidentsService.updateIncident(id, validatedPartial);
    return { success: true, data: incident };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update incident";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Delete an incident
 */
export async function deleteIncidentAction(
  id: string
): Promise<ServerActionResult<{ id: string }>> {
  try {
    await incidentsService.deleteIncident(id);
    return { success: true, data: { id } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete incident";
    return { success: false, error: message };
  }
}

