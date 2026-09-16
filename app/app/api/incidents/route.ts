import { incidentsController } from "@/backend/controllers/incidents.controller";

export const runtime = "nodejs";

export async function GET(request: Request) {
  return incidentsController.getIncidents(request);
}

export async function POST(request: Request) {
  return incidentsController.createIncident(request);
}
