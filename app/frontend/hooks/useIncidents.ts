"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Incident, IncidentListResponseSchema, CreateIncidentPayload } from "@/shared";
import {
  createIncidentAction,
  updateIncidentAction,
  deleteIncidentAction,
} from "../actions/incidents.actions";

export interface UseIncidentsResult {
  incidents: Incident[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createIncident: (payload: CreateIncidentPayload) => Promise<boolean>;
  updateIncident: (id: string, payload: Partial<CreateIncidentPayload>) => Promise<boolean>;
  deleteIncident: (id: string) => Promise<boolean>;
}

export function useIncidents(initialIncidents?: Incident[]): UseIncidentsResult {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents || []);
  const [loading, setLoading] = useState<boolean>(initialIncidents === undefined);
  const [error, setError] = useState<string | null>(null);

  const isInitializedRef = useRef<boolean>(false);
  const incidentsRef = useRef<Incident[]>(incidents);
  incidentsRef.current = incidents;

  // Broadcast ONLY on mutations (create / update / delete) to notify other components
  const broadcastMutation = useCallback((list: Incident[]) => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("scada-incidents-updated", { detail: list })
      );
    }
  }, []);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/incidents", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const parsed = IncidentListResponseSchema.parse(json);
      setIncidents(parsed.incidents);
      // NOTE: Queries (reads) must NOT broadcast global mutation events
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load incidents");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch once on mount only if initialIncidents is not provided at all
  useEffect(() => {
    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      if (initialIncidents === undefined) {
        fetchIncidents();
      }
    }
  }, [fetchIncidents, initialIncidents]);

  // Synchronize when initialIncidents receives updated data from parent/SSR
  useEffect(() => {
    if (initialIncidents !== undefined) {
      setIncidents((prev) => {
        if (
          prev.length === initialIncidents.length &&
          prev.every((item, idx) => item.id === initialIncidents[idx]?.id)
        ) {
          return prev;
        }
        return initialIncidents;
      });
      setLoading(false);
    }
  }, [initialIncidents]);

  // Listen for real-time external updates (e.g. from AI Tools or Map actions)
  useEffect(() => {
    const handleExternalUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Incident[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setIncidents(customEvent.detail);
      }
    };
    window.addEventListener("scada-incidents-updated", handleExternalUpdate);
    return () => {
      window.removeEventListener("scada-incidents-updated", handleExternalUpdate);
    };
  }, []);

  const createIncident = async (payload: CreateIncidentPayload): Promise<boolean> => {
    setError(null);
    const res = await createIncidentAction(payload);
    if (res.success && res.data) {
      const updatedList = [res.data, ...incidentsRef.current.filter((i) => i.id !== res.data!.id)];
      setIncidents(updatedList);
      broadcastMutation(updatedList);
      return true;
    }
    setError(res.error || "Failed to create incident");
    return false;
  };

  const updateIncident = async (
    id: string,
    payload: Partial<CreateIncidentPayload>
  ): Promise<boolean> => {
    setError(null);
    const res = await updateIncidentAction(id, payload);
    if (res.success && res.data) {
      const updatedList = incidentsRef.current.map((inc) => (inc.id === id ? res.data! : inc));
      setIncidents(updatedList);
      broadcastMutation(updatedList);
      return true;
    }
    setError(res.error || "Failed to update incident");
    return false;
  };

  const deleteIncident = async (id: string): Promise<boolean> => {
    setError(null);
    const res = await deleteIncidentAction(id);
    if (res.success) {
      const updatedList = incidentsRef.current.filter((inc) => inc.id !== id);
      setIncidents(updatedList);
      broadcastMutation(updatedList);
      return true;
    }
    setError(res.error || "Failed to delete incident");
    return false;
  };

  return {
    incidents,
    loading,
    error,
    refresh: fetchIncidents,
    createIncident,
    updateIncident,
    deleteIncident,
  };
}

