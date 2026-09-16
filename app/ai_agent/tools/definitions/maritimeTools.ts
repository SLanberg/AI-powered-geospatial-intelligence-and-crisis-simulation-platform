import { vesselsService } from "@/backend/services/vessels.service";
import { flightsService } from "@/backend/services/flights.service";
import {
  QueryVesselsInputSchema,
  QueryVesselsOutputSchema,
  QueryVesselsInput,
  QueryVesselsOutput,
  QueryFlightsInputSchema,
  QueryFlightsOutputSchema,
  QueryFlightsInput,
  QueryFlightsOutput,
} from "@/shared";

export const queryVesselsTool = {
  name: "query_vessels",
  description: "Query real-time AIS maritime telemetry of vessels navigating Tallinn Bay and the Gulf of Finland.",
  isWriteOperation: false,
  inputSchema: QueryVesselsInputSchema,
  outputSchema: QueryVesselsOutputSchema,
  execute: async (rawInput: unknown): Promise<QueryVesselsOutput> => {
    const input: QueryVesselsInput = QueryVesselsInputSchema.parse(rawInput);
    const result = await vesselsService.fetchLiveVessels();

    let filtered = result.vessels;
    if (input.category && input.category !== "all") {
      filtered = filtered.filter((v) => v.shipCategory === input.category);
    }

    const sliced = filtered.slice(0, input.limit);
    return {
      count: sliced.length,
      vessels: sliced.map((v) => ({
        mmsi: v.mmsi,
        name: v.name,
        category: v.shipCategory,
        speed_knots: v.sog,
        destination: v.destination,
        lat: v.lat,
        lng: v.lng,
      })),
    };
  },
};

export const queryFlightsTool = {
  name: "query_flights",
  description: "Query real-time aerial flight vectors and ADS-B radar tracks within Tallinn airspace.",
  isWriteOperation: false,
  inputSchema: QueryFlightsInputSchema,
  outputSchema: QueryFlightsOutputSchema,
  execute: async (rawInput: unknown): Promise<QueryFlightsOutput> => {
    const input: QueryFlightsInput = QueryFlightsInputSchema.parse(rawInput);
    const result = await flightsService.fetchLiveFlights();

    const sliced = result.flights.slice(0, input.limit);
    return {
      count: sliced.length,
      flights: sliced.map((f) => ({
        callsign: f.callsign,
        origin: f.origin,
        destination: f.destination,
        altitude: f.altitude,
        velocity: f.velocity,
        lat: f.lat,
        lng: f.lng,
      })),
    };
  },
};
