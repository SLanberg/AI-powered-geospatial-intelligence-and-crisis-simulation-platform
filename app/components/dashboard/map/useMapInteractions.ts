import { useCallback } from "react";
import type { MapLayerMouseEvent } from "react-map-gl/maplibre";

import type { ClusterPoint, Incident } from "../data";

interface UseMapInteractionsOptions {
  incidentById: Map<string, Incident>;
  clusterById: Map<string, ClusterPoint>;
  flyTo: (
    latitude: number,
    longitude: number,
    zoom: number,
    pitch?: number,
    bearing?: number,
  ) => void;
  setSelectedIncident: (incident: Incident | null) => void;
  setSelectedCluster: (cluster: ClusterPoint | null) => void;
}

export function useMapInteractions({
  incidentById,
  clusterById,
  flyTo,
  setSelectedIncident,
  setSelectedCluster,
}: UseMapInteractionsOptions) {
  return useCallback(
    (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];

      if (!feature) {
        setSelectedIncident(null);
        setSelectedCluster(null);
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
          setSelectedCluster(null);
          setSelectedIncident(incident);
          flyTo(incident.lat, incident.lng, 14.8);
        }

        return;
      }

      if (layerId === "cluster-circles" || layerId === "cluster-labels") {
        const clusterId = String(properties?.id ?? "");
        const cluster = clusterById.get(clusterId);

        if (cluster) {
          setSelectedIncident(null);
          setSelectedCluster(cluster);
        }
      }
    },
    [clusterById, flyTo, incidentById, setSelectedCluster, setSelectedIncident],
  );
}
