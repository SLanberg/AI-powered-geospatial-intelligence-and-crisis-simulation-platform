import { useCallback } from "react";
import type { MapLayerMouseEvent } from "react-map-gl/maplibre";

import type { Incident } from "../data";

interface UseMapInteractionsOptions {
  incidentById: Map<string, Incident>;
  flyTo: (
    latitude: number,
    longitude: number,
    zoom: number,
    pitch?: number,
    bearing?: number,
  ) => void;
  setSelectedIncident: (incident: Incident | null) => void;
}

export function useMapInteractions({
  incidentById,
  flyTo,
  setSelectedIncident,
}: UseMapInteractionsOptions) {
  return useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];

      if (!feature) {
        setSelectedIncident(null);
        return;
      }

      const properties = feature.properties;
      const layerId = feature.layer?.id;

      if (
        layerId === "incident-circles" ||
        layerId === "incident-pulse" ||
        layerId === "incident-labels" ||
        layerId === "selected-incident"
      ) {
        const incidentId = String(properties?.id ?? "");
        const incident = incidentById.get(incidentId);

        if (incident) {
          setSelectedIncident(incident);
          flyTo(incident.lat, incident.lng, 16.5);
        }

        return;
      }
    },
    [flyTo, incidentById, setSelectedIncident],
  );
}
