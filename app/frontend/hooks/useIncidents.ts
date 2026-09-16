"use client";

import { useState, useEffect, useCallback } from "react";
import { Incident, IncidentListResponseSchema, CreateIncidentPayload } from "@/shared";
import { createIncidentAction } from "../actions/incidents.actions";

export interface UseIncidentsResult {
  incidents: Incident[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createIncident: (payload: CreateIncidentPayload) => Promise<boolean>;
}

export function useIncidents(initialIncidents?: Incident[]): UseIncidentsResult {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents || []);
  const [loading, setLoading] = useState<boolean>(!initialIncidents);
  const [error, setError] = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/incidents");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const parsed = IncidentListResponseSchema.parse(json);
      setIncidents(parsed.incidents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialIncidents) {
      fetchIncidents();
    }
  }, [initialIncidents, fetchIncidents]);

  const createIncident = async (payload: CreateIncidentPayload): Promise<boolean> => {
    const res = await createIncidentAction(payload);
    if (res.success && res.data) {
      setIncidents((prev) => [res.data!, ...prev]);
      return true;
    }
    setError(res.error || "Failed to create incident");
    return false;
  };

  return {
    incidents,
    loading,
    error,
    refresh: fetchIncidents,
    createIncident,
  };
}
