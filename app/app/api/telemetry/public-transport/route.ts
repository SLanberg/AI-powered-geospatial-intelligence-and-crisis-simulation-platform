import { telemetryController } from "@/backend/controllers/telemetry.controller";
export type { PublicTransportData } from "@/shared";

export const runtime = "nodejs";

export async function GET() {
  return telemetryController.getPublicTransport();
}
