import { NextResponse } from "next/server";
import { vesselsService } from "../services/vessels.service";
import { flightsService } from "../services/flights.service";
import { infrastructureService } from "../services/infrastructure.service";
import { VesselResponseSchema, FlightResponseSchema } from "@/shared";

export class TelemetryController {
  /**
   * GET /api/vessels
   */
  async getVessels(): Promise<NextResponse> {
    try {
      const result = await vesselsService.fetchLiveVessels();
      const validated = VesselResponseSchema.parse(result);
      return NextResponse.json(validated);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch maritime telemetry";
      return NextResponse.json({ status: "error", error: message }, { status: 500 });
    }
  }

  /**
   * GET /api/flights
   */
  async getFlights(): Promise<NextResponse> {
    try {
      const result = await flightsService.fetchLiveFlights();
      const validated = FlightResponseSchema.parse(result);
      return NextResponse.json(validated);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch aerial telemetry";
      return NextResponse.json({ status: "error", error: message }, { status: 500 });
    }
  }

  /**
   * GET /api/infrastructure
   */
  async getInfrastructure(): Promise<NextResponse> {
    try {
      const result = await infrastructureService.getFacilities();
      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch infrastructure";
      return NextResponse.json({ status: "error", error: message }, { status: 500 });
    }
  }
}

export const telemetryController = new TelemetryController();
