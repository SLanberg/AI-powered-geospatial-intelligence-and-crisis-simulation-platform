"use server";

import { revalidatePath } from "next/cache";
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
    revalidatePath("/");
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
    revalidatePath("/");
    return { success: true, data: incident };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update incident";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Get all incidents with optional filter
 */
export async function getIncidentsAction(
  filter?: IncidentFilter
): Promise<ServerActionResult<Incident[]>> {
  try {
    const validatedFilter = filter ? IncidentFilterSchema.parse(filter) : undefined;
    const incidents = await incidentsService.getIncidents(validatedFilter);
    return { success: true, data: incidents };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch incidents";
    return { success: false, error: message };
  }
}

/**
 * Server Action: Get single incident by ID
 */
export async function getIncidentByIdAction(
  id: string
): Promise<ServerActionResult<Incident>> {
  try {
    const incident = await incidentsService.getIncidentById(id);
    if (!incident) {
      return { success: false, error: `Incident ${id} not found` };
    }
    return { success: true, data: incident };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch incident";
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
    revalidatePath("/");
    return { success: true, data: { id } };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete incident";
    return { success: false, error: message };
  }
}

