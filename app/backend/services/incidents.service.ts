import prisma from "../db/prisma";
import {
  Incident,
  IncidentSchema,
  CreateIncidentPayload,
  CreateIncidentPayloadSchema,
  CreateIncidentInputPayload,
  IncidentFilter,
  IncidentFilterSchema,
  IncidentFilterInput,
} from "@/shared";

export class IncidentsService {
  /**
   * Fetch incidents matching optional filter
   */
  async getIncidents(filter?: IncidentFilterInput): Promise<Incident[]> {
    const validatedFilter = filter ? IncidentFilterSchema.parse(filter) : undefined;
    const whereClause: {
      severity?: string;
      category?: string;
      district?: string;
      status?: string;
    } = {};

    if (validatedFilter?.severity) whereClause.severity = validatedFilter.severity;
    if (validatedFilter?.category) whereClause.category = validatedFilter.category;
    if (validatedFilter?.district) whereClause.district = validatedFilter.district;
    if (validatedFilter?.status) whereClause.status = validatedFilter.status;

    const dbIncidents = await prisma.incident.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: validatedFilter?.limit ?? 50,
    });

    return dbIncidents.map((inc) => IncidentSchema.parse(inc));
  }

  /**
   * Get single incident by ID
   */
  async getIncidentById(id: string): Promise<Incident | null> {
    const incident = await prisma.incident.findUnique({
      where: { id },
    });
    return incident ? IncidentSchema.parse(incident) : null;
  }

  /**
   * Create a new incident
   */
  async createIncident(rawPayload: CreateIncidentInputPayload): Promise<Incident> {
    const payload = CreateIncidentPayloadSchema.parse(rawPayload);
    const formattedTimestamp =
      payload.timestamp ||
      new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });

    const nodeId =
      payload.nodeId || `EE-TLN-NODE-${Math.floor(Math.random() * 890 + 100)}`;
    const makiIcon =
      payload.makiIcon ||
      (payload.severity === "critical"
        ? "lightning"
        : payload.severity === "warning"
        ? "caution"
        : "waveform");

    const created = await prisma.incident.create({
      data: {
        title: payload.title,
        timestamp: formattedTimestamp,
        severity: payload.severity,
        category: payload.category,
        makiIcon,
        lat: payload.lat,
        lng: payload.lng,
        description: payload.description,
        status: payload.status,
        nodeId,
        district: payload.district ?? null,
      },
    });

    return IncidentSchema.parse(created);
  }

  /**
   * Update an existing incident
   */
  async updateIncident(
    id: string,
    data: Partial<CreateIncidentPayload>
  ): Promise<Incident> {
    const updated = await prisma.incident.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.severity !== undefined ? { severity: data.severity } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.district !== undefined ? { district: data.district } : {}),
        ...(data.lat !== undefined ? { lat: data.lat } : {}),
        ...(data.lng !== undefined ? { lng: data.lng } : {}),
        ...(data.nodeId !== undefined ? { nodeId: data.nodeId } : {}),
        ...(data.makiIcon !== undefined ? { makiIcon: data.makiIcon } : {}),
        ...(data.timestamp !== undefined ? { timestamp: data.timestamp } : {}),
      },
    });
    return IncidentSchema.parse(updated);
  }

  /**
   * Delete an incident by ID
   */
  async deleteIncident(id: string): Promise<boolean> {
    try {
      await prisma.incident.delete({
        where: { id },
      });
      return true;
    } catch (err: any) {
      if (err?.code === "P2025") {
        return true;
      }
      throw err;
    }
  }
}

export const incidentsService = new IncidentsService();
