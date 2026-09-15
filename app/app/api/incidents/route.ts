import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

const INITIAL_INCIDENTS = [
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
    lat: 59.4450,
    lng: 24.7680,
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
    lat: 59.4260,
    lng: 24.7240,
    description: "Environmental acoustic sensor array detected low-frequency micro-vibrations prior to power trip.",
    status: "investigating",
    nodeId: "EE-TLN-SNS-44",
    district: "Kristiine",
  },
];

export async function GET() {
  try {
    let incidents = await prisma.incident.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (incidents.length === 0) {
      // Auto-seed initial SCADA incidents into SQLite if DB is empty
      await prisma.incident.createMany({
        data: INITIAL_INCIDENTS,
      });
      incidents = await prisma.incident.findMany({
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({
      status: "success",
      count: incidents.length,
      incidents,
    });
  } catch (error) {
    console.error("Failed to fetch incidents from SQLite DB:", error);
    return NextResponse.json(
      { error: "Failed to fetch incidents from SQLite database." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const title = (body.title as string) || "Unspecified Anomaly";
    const severity = (body.severity as string) || "critical";
    const category = (body.category as string) || "Grid Failure";
    const lat = typeof body.lat === "number" ? body.lat : 59.4372;
    const lng = typeof body.lng === "number" ? body.lng : 24.7453;
    const description = (body.description as string) || "Telemetry incident created via AI Agent request.";
    const status = (body.status as string) || "active";
    const district = (body.district as string) || null;
    const nodeId = (body.nodeId as string) || `EE-TLN-NODE-${Math.floor(Math.random() * 890 + 100)}`;
    const makiIcon = body.makiIcon || (severity === "critical" ? "lightning" : severity === "warning" ? "caution" : "waveform");

    const timestamp = body.timestamp || new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    const newIncident = await prisma.incident.create({
      data: {
        title,
        timestamp,
        severity,
        category,
        makiIcon,
        lat,
        lng,
        description,
        status,
        nodeId,
        district,
      },
    });

    return NextResponse.json(
      {
        status: "created",
        message: `Successfully created incident ${newIncident.id} in SQLite database.`,
        incident: newIncident,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create incident in SQLite DB:", error);
    return NextResponse.json(
      { error: "Failed to create incident in SQLite database." },
      { status: 500 }
    );
  }
}
