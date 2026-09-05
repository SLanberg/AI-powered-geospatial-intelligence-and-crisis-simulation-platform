"use client";

import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import Map, {
  Layer,
  MapRef,
  NavigationControl,
  FullscreenControl,
  Popup,
  Source,
  type LayerProps,
  type ViewState,
} from "react-map-gl/maplibre";

import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import { CrisisTimeline } from "./CrisisTimeline";
import { MapClusterPopup } from "./map/MapClusterPopup";
import { MapHeader } from "./map/MapHeader";
import { MapHUD } from "./map/MapHUD";
import { MapIncidentPopup } from "./map/MapIncidentPopup";
import { TelemetryFeed } from "./map/TelemetryFeed";
import { useMapInteractions } from "./map/useMapInteractions";

import {
  MOCK_INCIDENTS,
  MOCK_CLUSTERS,
  type Incident,
  type ClusterPoint,
} from "./data";

if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
}

/* -------------------------------------------------------------------------- */
/* Map styles                                                                 */
/* -------------------------------------------------------------------------- */

const MAP_GLYPHS =
  "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf";

type MapTheme = "dark" | "voyager" | "satellite";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

const MAP_STYLES: Record<string, maplibregl.StyleSpecification> = {
  dark: {
    version: 8 as const,
    glyphs: MAP_GLYPHS,
    sources: {
      carto: {
        type: "raster" as const,
        tiles: [
          "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
          "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
          "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
          "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
    },
    layers: [
      {
        id: "carto",
        type: "raster" as const,
        source: "carto",
        minzoom: 0,
        maxzoom: 20,
        paint: {
          "raster-fade-duration": 0,
        },
      },
    ],
  },

  voyager: {
    version: 8 as const,
    glyphs: MAP_GLYPHS,
    sources: {
      carto: {
        type: "raster" as const,
        tiles: [
          "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
          "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
          "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
          "https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
    },
    layers: [
      {
        id: "carto",
        type: "raster" as const,
        source: "carto",
        minzoom: 0,
        maxzoom: 20,
        paint: {
          "raster-fade-duration": 0,
        },
      },
    ],
  },

  satellite: {
    version: 8 as const,
    glyphs: MAP_GLYPHS,
    sources: {
      imagery: {
        type: "raster" as const,
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution:
          "&copy; Esri, Maxar, Earthstar Geographics",
      },
      labels: {
        type: "raster" as const,
        tiles: [
          "https://a.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png",
          "https://b.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png",
          "https://c.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png",
          "https://d.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
    },
    layers: [
      {
        id: "imagery",
        type: "raster" as const,
        source: "imagery",
        minzoom: 0,
        maxzoom: 19,
        paint: {
          "raster-fade-duration": 0,
        },
      },
      {
        id: "labels",
        type: "raster" as const,
        source: "labels",
        minzoom: 0,
        maxzoom: 20,
        paint: {
          "raster-fade-duration": 0,
        },
      },
    ],
  },
};

/* -------------------------------------------------------------------------- */
/* Static map layers                                                          */
/* -------------------------------------------------------------------------- */

/*
 * IMPORTANT:
 * These are explicitly typed with LayerProps.
 *
 * This prevents TypeScript from interpreting MapLibre expression arrays
 * as generic `(string | number | ...)[]`.
 */

const INCIDENT_PULSE: LayerProps = {
  id: "incident-pulse",
  type: "circle",
  source: "incidents",
  paint: {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      8,
      6,
      12,
      9,
      16,
      14,
    ],

    "circle-color": [
      "match",
      ["get", "severity"],
      "critical",
      "#f43f5e",
      "warning",
      "#f59e0b",
      "#3b82f6",
    ],

    "circle-opacity": 0.12,

    "circle-stroke-width": 1,

    "circle-stroke-color": [
      "match",
      ["get", "severity"],
      "critical",
      "#f43f5e",
      "warning",
      "#f59e0b",
      "#3b82f6",
    ],
  },
};

const INCIDENT_CIRCLES: LayerProps = {
  id: "incident-circles",
  type: "circle",
  source: "incidents",
  paint: {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      8,
      4,
      12,
      6,
      16,
      9,
    ],

    "circle-color": [
      "match",
      ["get", "severity"],
      "critical",
      "#f43f5e",
      "warning",
      "#f59e0b",
      "#3b82f6",
    ],

    "circle-stroke-color": "#ffffff",

    "circle-stroke-width": 1,

    "circle-opacity": 0.95,
  },
};

/*
 * Selected incident is intentionally a separate source/layer.
 *
 * This means selecting one incident does NOT force us to rebuild the
 * GeoJSON FeatureCollection for every incident.
 */
const SELECTED_INCIDENT: LayerProps = {
  id: "selected-incident",
  type: "circle",
  source: "selected-incident",
  paint: {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      8,
      7,
      12,
      10,
      16,
      14,
    ],

    "circle-color": [
      "match",
      ["get", "severity"],
      "critical",
      "#f43f5e",
      "warning",
      "#f59e0b",
      "#3b82f6",
    ],

    "circle-opacity": 1,

    "circle-stroke-color": "#ffffff",

    "circle-stroke-width": 3,
  },
};

const INCIDENT_LABELS: LayerProps = {
  id: "incident-labels",
  type: "symbol",
  source: "incidents",

  /*
   * Labels are more expensive than circles.
   *
   * At low zoom levels they are not useful anyway.
   */
  minzoom: 12,

  layout: {
    "text-field": [
      "concat",
      ["get", "timestamp"],
      " | ",
      ["get", "nodeId"],
    ],

    "text-size": 9,

    "text-font": ["Open Sans Regular"],

    "text-offset": [0, 1.8],

    "text-anchor": "top",

    "text-allow-overlap": false,

    "text-ignore-placement": false,
  },

  paint: {
    "text-color": "#cbd5e1",

    "text-halo-color": "#020617",

    "text-halo-width": 1.5,
  },
};

const CLUSTER_CIRCLES: LayerProps = {
  id: "cluster-circles",
  type: "circle",
  source: "clusters",

  paint: {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["get", "incidentCount"],
      1,
      14,
      10,
      20,
      50,
      28,
    ],

    "circle-color": "#0b132b",

    "circle-stroke-color": "#60a5fa",

    "circle-stroke-width": 2,

    "circle-opacity": 0.95,
  },
};

const CLUSTER_LABELS: LayerProps = {
  id: "cluster-labels",
  type: "symbol",
  source: "clusters",

  layout: {
    "text-field": [
      "to-string",
      ["get", "incidentCount"],
    ],

    "text-size": [
      "interpolate",
      ["linear"],
      ["get", "incidentCount"],
      1,
      10,
      50,
      14,
    ],

    "text-font": ["Open Sans Bold"],

    "text-allow-overlap": true,

    "text-ignore-placement": true,
  },

  paint: {
    "text-color": "#bfdbfe",
  },
};

/* -------------------------------------------------------------------------- */
/* GeoJSON helpers                                                            */
/* -------------------------------------------------------------------------- */

function incidentsToGeoJSON(
  incidents: Incident[],
) {
  return {
    type: "FeatureCollection" as const,

    features: incidents.map((incident) => ({
      type: "Feature" as const,

      id: incident.id,

      geometry: {
        type: "Point" as const,
        coordinates: [
          incident.lng,
          incident.lat,
        ],
      },

      properties: {
        id: incident.id,
        title: incident.title,
        description: incident.description,
        timestamp: incident.timestamp,
        nodeId: incident.nodeId,
        severity: incident.severity,
        status: incident.status,
      },
    })),
  };
}

function incidentToGeoJSON(
  incident: Incident | null,
) {
  if (!incident) {
    return {
      type: "FeatureCollection" as const,
      features: [],
    };
  }

  return {
    type: "FeatureCollection" as const,

    features: [
      {
        type: "Feature" as const,

        id: incident.id,

        geometry: {
          type: "Point" as const,
          coordinates: [
            incident.lng,
            incident.lat,
          ],
        },

        properties: {
          id: incident.id,
          title: incident.title,
          description: incident.description,
          timestamp: incident.timestamp,
          nodeId: incident.nodeId,
          severity: incident.severity,
          status: incident.status,
        },
      },
    ],
  };
}

function clustersToGeoJSON(
  clusters: ClusterPoint[],
) {
  return {
    type: "FeatureCollection" as const,

    features: clusters.map((cluster) => ({
      type: "Feature" as const,

      id: cluster.id,

      geometry: {
        type: "Point" as const,
        coordinates: [
          cluster.lng,
          cluster.lat,
        ],
      },

      properties: {
        id: cluster.id,
        name: cluster.name,
        incidentCount: cluster.incidentCount,
        primaryCategory: cluster.primaryCategory,
        radiusKm: cluster.radiusKm,
      },
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

interface MapContainerProps {
  showIncidents: boolean;
  showClusters: boolean;
  crisisActive: boolean;
  setCrisisActive: (active: boolean) => void;

  selectedTime: string;
  setSelectedTime: React.Dispatch<
    React.SetStateAction<string>
  >;

  selectedIncident: Incident | null;
  setSelectedIncident: (
    incident: Incident | null,
  ) => void;
}

export function MapContainer({
  showIncidents,
  showClusters,
  crisisActive,
  selectedTime,
  setSelectedTime,
  selectedIncident,
  setSelectedIncident,
}: MapContainerProps) {
  const mapRef = useRef<MapRef | null>(null);

  const [mapTheme, setMapTheme] =
    useState<MapTheme>("dark");

  const [is3D, setIs3D] =
    useState(false);

  const isClient = useIsClient();

  const [selectedCluster, setSelectedCluster] =
    useState<ClusterPoint | null>(null);

  const [sideDrawerOpen, setSideDrawerOpen] =
    useState(true);

  const [viewState, setViewState] =
    useState<ViewState>({
      latitude: 59.437,
      longitude: 24.7535,
      zoom: 12.3,
      bearing: 0,
      pitch: 0,
      padding: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    });

  /* ---------------------------------------------------------------------- */
  /* O(1) lookup maps                                                       */
  /* ---------------------------------------------------------------------- */

  const incidentById = useMemo(() => {
    return new globalThis.Map(
      MOCK_INCIDENTS.map((incident) => [incident.id, incident]),
    );
  }, []);

  const clusterById = useMemo(() => {
    return new globalThis.Map(
      MOCK_CLUSTERS.map((cluster) => [cluster.id, cluster]),
    );
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Filter data                                                            */
  /* ---------------------------------------------------------------------- */

  const filteredIncidents = useMemo(() => {
    if (!showIncidents) {
      return [];
    }

    switch (selectedTime) {
      case "08:40":
        return MOCK_INCIDENTS.slice(4);

      case "08:44":
        return MOCK_INCIDENTS.slice(2);

      case "08:47":
      default:
        return MOCK_INCIDENTS;
    }
  }, [
    showIncidents,
    selectedTime,
  ]);

  /* ---------------------------------------------------------------------- */
  /* GeoJSON                                                                 */
  /* ---------------------------------------------------------------------- */

  const incidentGeoJSON = useMemo(
    () =>
      incidentsToGeoJSON(
        filteredIncidents,
      ),
    [filteredIncidents],
  );

  const selectedIncidentGeoJSON = useMemo(
    () =>
      incidentToGeoJSON(
        selectedIncident,
      ),
    [selectedIncident],
  );

  const clusterGeoJSON = useMemo(
    () =>
      clustersToGeoJSON(
        showClusters
          ? MOCK_CLUSTERS
          : [],
      ),
    [showClusters],
  );

  /* ---------------------------------------------------------------------- */
  /* Camera                                                                  */
  /* ---------------------------------------------------------------------- */

  const flyTo = useCallback(
    (
      latitude: number,
      longitude: number,
      zoom: number,
      pitch = viewState.pitch,
      bearing = viewState.bearing,
    ) => {
      mapRef.current?.flyTo({
        center: [
          longitude,
          latitude,
        ],

        zoom,

        pitch,

        bearing,

        duration: 800,

        essential: true,
      });
    },
    [
      viewState.pitch,
      viewState.bearing,
    ],
  );

  const resetView = useCallback(() => {
    setIs3D(false);

    flyTo(
      59.437,
      24.7535,
      12.3,
      0,
      0,
    );
  }, [flyTo]);

  const toggle3D = useCallback(() => {
    const next = !is3D;

    setIs3D(next);

    mapRef.current?.easeTo({
      pitch: next ? 45 : 0,
      bearing: next ? -20 : 0,
      duration: 600,
      essential: true,
    });
  }, [is3D]);

  /* ---------------------------------------------------------------------- */
  /* Map click handling                                                      */
  /* ---------------------------------------------------------------------- */

  const handleMapClick = useMapInteractions({
    incidentById,
    clusterById,
    flyTo,
    setSelectedIncident,
    setSelectedCluster,
  });

  /* ---------------------------------------------------------------------- */
  /* Render                                                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="w-full flex flex-col select-none">
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                              */}
      {/* ------------------------------------------------------------------ */}

      <MapHeader
        mapTheme={mapTheme}
        setMapTheme={setMapTheme}
        is3D={is3D}
        toggle3D={toggle3D}
        resetView={resetView}
        sideDrawerOpen={sideDrawerOpen}
        setSideDrawerOpen={setSideDrawerOpen}
        filteredIncidentsCount={filteredIncidents.length}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Map                                                                 */}
      {/* ------------------------------------------------------------------ */}

      <div className="relative w-full h-[640px] lg:h-[calc(100vh-230px)] min-h-[580px] overflow-hidden border-x border-b border-slate-800/90 rounded-b-xl bg-[#06080D]">
        {isClient ? (
        <Map
          ref={mapRef}
          mapLib={maplibregl}
          initialViewState={
            viewState
          }
          mapStyle={MAP_STYLES[mapTheme]}
          style={{
            width: "100%",
            height: "100%",
          }}
          attributionControl={false}
          fadeDuration={0}
          onMoveEnd={(event) => {
            /*
             * React only receives camera state after movement.
             *
             * There is intentionally NO setState inside onMove.
             */
            setViewState(
              event.viewState,
            );
          }}
          interactiveLayerIds={[
            ...(showIncidents
              ? [
                  "incident-circles",
                  "incident-pulse",
                  "incident-labels",
                  "selected-incident",
                ]
              : []),

            ...(showClusters
              ? [
                  "cluster-circles",
                  "cluster-labels",
                ]
              : []),
          ]}
          onClick={handleMapClick}
          onError={(err) => {
            console.error("map error", err);
          }}
          cursor="default"
        >
          <NavigationControl
            position="bottom-right"
            showCompass
          />

          <FullscreenControl
            position="bottom-right"
          />

          {/* -------------------------------------------------------------- */}
          {/* Incidents                                                       */}
          {/* -------------------------------------------------------------- */}

          {showIncidents && (
            <>
              <Source
                id="incidents"
                type="geojson"
                data={
                  incidentGeoJSON
                }
              >
                <Layer
                  {...INCIDENT_PULSE}
                />

                <Layer
                  {...INCIDENT_CIRCLES}
                />

                <Layer
                  {...INCIDENT_LABELS}
                />
              </Source>

              {/* -------------------------------------------------------- */}
              {/* Selected incident                                        */}
              {/* -------------------------------------------------------- */}

              <Source
                id="selected-incident"
                type="geojson"
                data={
                  selectedIncidentGeoJSON
                }
              >
                <Layer
                  {...SELECTED_INCIDENT}
                />
              </Source>
            </>
          )}

          {/* -------------------------------------------------------------- */}
          {/* Operational clusters                                           */}
          {/* -------------------------------------------------------------- */}

          {showClusters && (
            <Source
              id="clusters"
              type="geojson"
              data={
                clusterGeoJSON
              }
            >
              <Layer
                {...CLUSTER_CIRCLES}
              />

              <Layer
                {...CLUSTER_LABELS}
              />
            </Source>
          )}

          {/* -------------------------------------------------------------- */}
          {/* Incident popup                                                  */}
          {/* -------------------------------------------------------------- */}

          {selectedIncident && (
            <Popup
              latitude={selectedIncident.lat}
              longitude={selectedIncident.lng}
              anchor="top"
              offset={16}
              closeButton={false}
              closeOnClick={false}
              onClose={() => setSelectedIncident(null)}
            >
              <MapIncidentPopup
                selectedIncident={selectedIncident}
                setSelectedIncident={setSelectedIncident}
              />
            </Popup>
          )}

          {/* -------------------------------------------------------------- */}
          {/* Cluster popup                                                   */}
          {/* -------------------------------------------------------------- */}

          {selectedCluster && (
            <Popup
              latitude={selectedCluster.lat}
              longitude={selectedCluster.lng}
              anchor="top"
              offset={16}
              closeButton={false}
              closeOnClick={false}
              onClose={() => setSelectedCluster(null)}
            >
              <MapClusterPopup
                selectedCluster={selectedCluster}
                setSelectedCluster={setSelectedCluster}
              />
            </Popup>
          )}
        </Map>
        ) : null}

        {/* ---------------------------------------------------------------- */}
        {/* HUD                                                               */}
        {/* ---------------------------------------------------------------- */}

        <MapHUD
          zoom={viewState.zoom}
          pitch={viewState.pitch}
        />

        {/* ---------------------------------------------------------------- */}
        {/* Feed                                                              */}
        {/* ---------------------------------------------------------------- */}

        {sideDrawerOpen && (
          <TelemetryFeed
            filteredIncidents={filteredIncidents}
            setSelectedIncident={setSelectedIncident}
            setSelectedCluster={setSelectedCluster}
            flyTo={flyTo}
          />
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Timeline                                                            */}
      {/* ------------------------------------------------------------------ */}

      <CrisisTimeline
        selectedTime={
          selectedTime
        }
        setSelectedTime={
          setSelectedTime
        }
        crisisActive={
          crisisActive
        }
      />
    </div>
  );
}