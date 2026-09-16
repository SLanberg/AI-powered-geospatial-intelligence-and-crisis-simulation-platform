import { telemetryController } from "@/backend/controllers/telemetry.controller";
export type { VesselData } from "@/shared";

export const runtime = "nodejs";

export async function GET() {
  return telemetryController.getVessels();
}
