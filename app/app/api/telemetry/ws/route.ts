import { NextResponse } from "next/server";
import { telemetryWsManager, startTelemetryWsServer } from "@/backend/ws/telemetryWsServer";

export const runtime = "nodejs";

export async function GET() {
  try {
    startTelemetryWsServer();
    const status = telemetryWsManager.getStatus();
    return NextResponse.json({
      status: "ok",
      ws: status,
      timestamp: Date.now(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to initialize WebSocket server";
    return NextResponse.json({ status: "error", error: message }, { status: 500 });
  }
}
