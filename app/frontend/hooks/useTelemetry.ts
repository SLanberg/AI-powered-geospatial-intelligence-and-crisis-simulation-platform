"use client";

import { useState, useEffect, useCallback } from "react";
import {
  VesselData,
  FlightData,
  VesselResponseSchema,
  FlightResponseSchema,
} from "@/shared";

export interface UseTelemetryResult {
  vessels: VesselData[];
  flights: FlightData[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useTelemetry(pollIntervalMs = 8000): UseTelemetryResult {
  const [vessels, setVessels] = useState<VesselData[]>([]);
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTelemetry = useCallback(async () => {
    try {
      const [vesselRes, flightRes] = await Promise.all([
        fetch("/api/vessels"),
        fetch("/api/flights"),
      ]);

      if (vesselRes.ok) {
        const vesselJson = await vesselRes.json();
        const parsed = VesselResponseSchema.parse(vesselJson);
        setVessels(parsed.vessels);
      }

      if (flightRes.ok) {
        const flightJson = await flightRes.json();
        const parsed = FlightResponseSchema.parse(flightJson);
        setFlights(parsed.flights);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load telemetry");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTelemetry();
    const timer = setInterval(fetchTelemetry, pollIntervalMs);
    return () => clearInterval(timer);
  }, [fetchTelemetry, pollIntervalMs]);

  return {
    vessels,
    flights,
    loading,
    error,
    refresh: fetchTelemetry,
  };
}
