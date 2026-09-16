import { telemetryController } from "@/backend/controllers/telemetry.controller";

export const runtime = "nodejs";

export async function GET() {
  return telemetryController.getInfrastructure();
}
