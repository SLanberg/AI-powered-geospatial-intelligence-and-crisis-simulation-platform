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

  /**
   * GET /api/incidents/[id]
   */
  async getIncidentById(id: string): Promise<NextResponse> {
    try {
      const incident = await incidentsService.getIncidentById(id);
      if (!incident) {
        return NextResponse.json(
          { status: "error", error: `Incident ${id} not found` },
          { status: 404 }
        );
      }
      return NextResponse.json({
        status: "success",
        incident,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch incident";
      return NextResponse.json(
        { status: "error", error: message },
        { status: 500 }
      );
    }
  }

  /**
   * PATCH /api/incidents/[id]
   */
  async updateIncident(request: Request, id: string): Promise<NextResponse> {
    try {
      const body = await request.json();
      const updated = await incidentsService.updateIncident(id, body);
      return NextResponse.json({
        status: "updated",
        message: `Successfully updated incident ${id}`,
        incident: updated,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update incident";
      return NextResponse.json(
        { status: "error", error: message },
        { status: 500 }
      );
    }
  }

  /**
   * DELETE /api/incidents/[id]
   */
  async deleteIncident(id: string): Promise<NextResponse> {
    try {
      await incidentsService.deleteIncident(id);
      return NextResponse.json({
        status: "deleted",
        message: `Successfully deleted incident ${id}`,
        id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete incident";
      return NextResponse.json(
        { status: "error", error: message },
        { status: 500 }
      );
    }
  }
}

export const incidentsController = new IncidentsController();
