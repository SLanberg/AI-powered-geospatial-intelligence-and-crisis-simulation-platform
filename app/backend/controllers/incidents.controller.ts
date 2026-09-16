import { NextResponse } from "next/server";
import { incidentsService } from "../services/incidents.service";
import { validateBody, validateQueryParams } from "../middlewares/validate";
import {
  CreateIncidentPayloadSchema,
  IncidentFilterSchema,
  IncidentListResponseSchema,
} from "@/shared";

export class IncidentsController {
  /**
   * GET /api/incidents
   */
  async getIncidents(request: Request): Promise<NextResponse> {
    try {
      const filterResult = validateQueryParams(request.url, IncidentFilterSchema);
      const filter = filterResult.success ? filterResult.data : undefined;

      const incidents = await incidentsService.getIncidents(filter);
      const responseData = {
        status: "success" as const,
        count: incidents.length,
        incidents,
      };

      const validated = IncidentListResponseSchema.parse(responseData);
      return NextResponse.json(validated);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch incidents";
      return NextResponse.json(
        { status: "error", error: message },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/incidents
   */
  async createIncident(request: Request): Promise<NextResponse> {
    try {
      const validation = await validateBody(request, CreateIncidentPayloadSchema);
      if (!validation.success) {
        return validation.response;
      }

      const created = await incidentsService.createIncident(validation.data);
      return NextResponse.json(
        {
          status: "created",
          message: `Successfully created incident ${created.id}`,
          incident: created,
        },
        { status: 201 }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create incident";
      return NextResponse.json(
        { status: "error", error: message },
        { status: 500 }
      );
    }
  }
}

export const incidentsController = new IncidentsController();
