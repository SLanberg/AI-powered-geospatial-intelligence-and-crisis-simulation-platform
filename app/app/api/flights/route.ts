import { telemetryController } from "@/backend/controllers/telemetry.controller";
export type { FlightVector } from "@/backend/services/flights.service";
export type { FlightData } from "@/shared";

export const runtime = "nodejs";

export async function GET() {
  return telemetryController.getFlights();
}
