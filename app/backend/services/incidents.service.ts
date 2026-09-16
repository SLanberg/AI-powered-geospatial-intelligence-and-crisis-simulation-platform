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

const INITIAL_INCIDENTS: Array<Omit<Incident, "createdAt" | "updatedAt">> = [
  {
    id: "INC-0847-01",
    title: "Vanalinn Substation #4 Tripped",
    timestamp: "08:47:05",
    severity: "critical",
    category: "Grid Failure",
    makiIcon: "lightning",
    lat: 59.4372,
    lng: 24.7453,
    description: "Primary transformer isolation relay triggered unexpectedly. Cascading frequency drop detected in Old Town district.",
    status: "active",
    nodeId: "EE-TLN-SUB-04",
    district: "Vanalinn",
  },
  {
    id: "INC-0847-02",
    title: "Ülemiste Smart Feeder Surge",
    timestamp: "08:47:01",
    severity: "critical",
    category: "Grid Failure",
    makiIcon: "caution",
    lat: 59.4215,
    lng: 24.7958,
    description: "Voltage spike exceeding 420kV tolerances. Automated circuit breaker isolated tech park sectors B & C.",
    status: "active",
    nodeId: "EE-TLN-ULE-01",
    district: "Ülemiste",
  },
  {
    id: "INC-0847-03",
    title: "Viru Junction Signal Controller Freeze",
    timestamp: "08:47:18",
    severity: "warning",
    category: "Traffic Flow",
    makiIcon: "traffic-light",
    lat: 59.4365,
    lng: 24.7562,
    description: "Optical traffic sensors lost heartbeat connection. Junction defaulted to fail-safe amber pulse state.",
    status: "investigating",
    nodeId: "EE-TLN-TRF-88",
    district: "Viru",
  },
  {
    id: "INC-0847-04",
    title: "Balti Jaam Automated Dispatch Timeout",
    timestamp: "08:47:30",
    severity: "warning",
    category: "Emergency Dispatch",
    makiIcon: "emergency-phone",
    lat: 59.4402,
    lng: 24.7378,
    description: "Emergency vehicle priority routing server experienced a 1.4s packet drop. Secondary routing route initiated.",
    status: "active",
    nodeId: "EE-TLN-DISP-09",
    district: "Balti Jaam",
  },
  {
    id: "INC-0847-05",
    title: "Port of Tallinn Fiber Gateway Latency",
    timestamp: "08:46:50",
    severity: "info",
    category: "Telecom Node",
    makiIcon: "communications-tower",
    lat: 59.445,
    lng: 24.768,
    description: "Subsea link telemetry reporting elevated ping (48ms vs baseline 4ms). Traffic rerouted through terrestrial backbone.",
    status: "mitigated",
    nodeId: "EE-TLN-GW-03",
    district: "Port",
  },
  {
    id: "INC-0847-06",
    title: "Kristiine Sector Sensor Array Anomaly",
    timestamp: "08:47:42",
    severity: "warning",
    category: "Sensor Anomaly",
    makiIcon: "waveform",
    lat: 59.426,
    lng: 24.724,
    description: "Environmental acoustic sensor array detected low-frequency micro-vibrations prior to power trip.",
    status: "investigating",
    nodeId: "EE-TLN-SNS-44",
    district: "Kristiine",
  },
];

export class IncidentsService {
  /**
   * Fetch incidents matching optional filter, auto-seeding if empty
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

    let dbIncidents = await prisma.incident.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      take: validatedFilter?.limit ?? 50,
    });

    if (dbIncidents.length === 0 && Object.keys(whereClause).length === 0) {
      await prisma.incident.createMany({
        data: INITIAL_INCIDENTS,
      });
      dbIncidents = await prisma.incident.findMany({
        orderBy: { createdAt: "desc" },
      });
    }

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
        ...(data.title ? { title: data.title } : {}),
        ...(data.severity ? { severity: data.severity } : {}),
        ...(data.category ? { category: data.category } : {}),
        ...(data.description ? { description: data.description } : {}),
        ...(data.status ? { status: data.status } : {}),
        ...(data.district !== undefined ? { district: data.district } : {}),
      },
    });
    return IncidentSchema.parse(updated);
  }
}

export const incidentsService = new IncidentsService();
