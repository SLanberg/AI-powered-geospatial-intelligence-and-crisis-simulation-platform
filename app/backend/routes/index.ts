import { incidentsController } from "../controllers/incidents.controller";
import { telemetryController } from "../controllers/telemetry.controller";
import { chatController } from "../controllers/chat.controller";

/**
 * Central Route Map
 * Maps domain endpoints to controllers
 */
export const backendRoutes = {
  incidents: {
    get: (req: Request) => incidentsController.getIncidents(req),
    post: (req: Request) => incidentsController.createIncident(req),
  },
  telemetry: {
    vessels: () => telemetryController.getVessels(),
    flights: () => telemetryController.getFlights(),
    infrastructure: () => telemetryController.getInfrastructure(),
  },
  chat: {
    status: () => chatController.getStatus(),
    handle: (req: Request) => chatController.handleChat(req),
  },
};
