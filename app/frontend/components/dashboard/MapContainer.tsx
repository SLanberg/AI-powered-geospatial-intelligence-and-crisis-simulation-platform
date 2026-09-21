"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import Map, {
  Layer,
  Marker,
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

import { Car, Siren, Bus, MapPin, Anchor, X, Plane, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import type { FlightVector } from "@/app/api/flights/route";
import type { VesselData } from "@/app/api/vessels/route";
import {
  SIMULATED_MARITIME_FLEET,
  calculateMaritimePosition,
  sanitizeVesselWaterPosition,
} from "@/backend/services/vessels.service";

import {
  ROAD_CORRIDORS,
  tickTrafficEngine,
  type Vehicle,
  type TrafficSegment,
} from "@/backend/services/trafficEngine.service";

import { MapToolbar } from "./map/MapToolbar";
import { MapIncidentPopup } from "./map/MapIncidentPopup";
import { useMapInteractions } from "./map/useMapInteractions";
import { MapObjectVector } from "./map/MapObjectVector";
import { clusterInfrastructure, type InfrastructureCluster } from "./map/useDecluttering";
import { MakiIcon, getMakiIconNameForIncident } from "./map/MakiIcon";

import {
  MOCK_INCIDENTS,
  type Incident,
  type MapAction,
  fetchIncidentsFromDb,
} from "./data";

import { AppleMapsMarker } from "./map/AppleMapsMarker";
import { IncidentMarker } from "./map/IncidentMarker";
import { TallinnBusMarker } from "./map/TallinnBusMarker";
import { TallinnBusPopup } from "./map/TallinnBusPopup";
import type { PublicTransportData } from "@/shared";
import { InfrastructureClusterMarker } from "./map/InfrastructureClusterMarker";
import { AreaInfrastructurePanel } from "./map/AreaInfrastructurePanel";
import { AreaInfrastructureModal } from "./map/AreaInfrastructureModal";
import { EmergencyServicePopup } from "./map/EmergencyServicePopup";

import {
  TALLINN_EMERGENCY_SERVICES,
  type EmergencyService,
} from "./emergencyServicesData";

import { TransportHubMarker } from "./map/TransportHubMarker";
import { TransportHubPopup } from "./map/TransportHubPopup";

import { getDistrictBoundariesGeoJSON } from "./districtBoundaries";
import {
  TALLINN_TRANSPORT_HUBS,
  type TransportHub,
} from "./transportHubsData";

if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
}

/* -------------------------------------------------------------------------- */
/* Map styles                                                                 */
/* -------------------------------------------------------------------------- */

const MAP_GLYPHS =
  "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf";

const CARTO_API_KEY =
  process.env.NEXT_PUBLIC_CARTO_API_KEY ||
  process.env.CARTO_API_KEY ||
  "";

const CARTO_KEY_PARAM = CARTO_API_KEY
  ? `?key=${encodeURIComponent(CARTO_API_KEY)}`
  : "";

type MapTheme = "dark" | "voyager" | "satellite";

function useIsClient() {
  return useSyncExternalStore(
    () => () => { },
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
          `https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png${CARTO_KEY_PARAM}`,
          `https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png${CARTO_KEY_PARAM}`,
          `https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png${CARTO_KEY_PARAM}`,
          `https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png${CARTO_KEY_PARAM}`,
        ],
        tileSize: 256,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
    },

    layers: [
      {
        id: "tactical-canvas",
        type: "background" as const,
        paint: {
          "background-color": "#121820",
        },
      },

      {
        id: "carto",
        type: "raster" as const,
        source: "carto",
        minzoom: 0,
        maxzoom: 20,
        paint: {
          "raster-fade-duration": 0,
          "raster-opacity": 0.94,
          "raster-brightness-min": 0.14,
          "raster-brightness-max": 0.92,
          "raster-saturation": -0.4,
          "raster-contrast": 0.18,
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
          `https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png${CARTO_KEY_PARAM}`,
          `https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png${CARTO_KEY_PARAM}`,
          `https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png${CARTO_KEY_PARAM}`,
          `https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png${CARTO_KEY_PARAM}`,
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
          "raster-brightness-min": 0.06,
          "raster-brightness-max": 0.24,
          "raster-saturation": -0.9,
          "raster-contrast": 0.14,
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
        attribution: "&copy; Esri, Maxar, Earthstar Geographics",
      },

      labels: {
        type: "raster" as const,
        tiles: [
          `https://a.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png${CARTO_KEY_PARAM}`,
          `https://b.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png${CARTO_KEY_PARAM}`,
          `https://c.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png${CARTO_KEY_PARAM}`,
          `https://d.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}.png${CARTO_KEY_PARAM}`,
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

/**
 * Critical incidents are intentionally NOT rendered by this WebGL layer.
 *
 * Critical incidents use a single React Marker instead.
 *
 * Warning + normal incidents remain WebGL circles.
 */
const INCIDENT_CIRCLES: LayerProps = {
  id: "incident-circles",
  type: "circle",
  source: "incidents",

  filter: [
    "!=",
    ["get", "severity"],
    "critical",
  ],

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
      "warning",
      "#FF9500",
      "normal",
      "#34C759",
      "#007AFF",
    ],

    "circle-stroke-color": "#121820",
    "circle-stroke-width": 1.5,
    "circle-opacity": 0.9,
  },
};

/**
 * Critical incidents are excluded from the selected WebGL layer as well.
 *
 * Otherwise selecting a critical incident would create a second red
 * circle underneath the React Marker.
 */
const SELECTED_INCIDENT: LayerProps = {
  id: "selected-incident",
  type: "circle",
  source: "selected-incident",

  filter: [
    "!=",
    ["get", "severity"],
    "critical",
  ],

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
      "warning",
      "#FF9500",
      "normal",
      "#34C759",
      "#007AFF",
    ],

    "circle-opacity": 1,
    "circle-stroke-color": "#F8FAFC",
    "circle-stroke-width": 3,
  },
};

const INCIDENT_HEATMAP: LayerProps = {
  id: "incident-heatmap",
  type: "heatmap",
  source: "incidents-heatmap",
  maxzoom: 17,
  paint: {
    // Weight points based on severity property
    "heatmap-weight": [
      "interpolate",
      ["linear"],
      ["get", "weight"],
      1,
      0.5,
      3,
      1.5,
      5,
      3,
    ],
    // Intensity multiplier based on zoom level
    "heatmap-intensity": [
      "interpolate",
      ["linear"],
      ["zoom"],
      8,
      1,
      13,
      2.5,
      16,
      4,
    ],
    // Color ramp from cool blue to cyan to yellow to vivid red/magenta
    "heatmap-color": [
      "interpolate",
      ["linear"],
      ["heatmap-density"],
      0,
      "rgba(15, 23, 42, 0)",
      0.15,
      "rgba(14, 165, 233, 0.4)",
      0.35,
      "rgba(34, 197, 94, 0.65)",
      0.65,
      "rgba(245, 158, 11, 0.85)",
      0.85,
      "rgba(239, 68, 68, 0.95)",
      1.0,
      "rgba(236, 72, 153, 1)",
    ],
    // Radius of influence per point based on zoom
    "heatmap-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      8,
      25,
      12,
      45,
      15,
      70,
    ],
    // Smooth fade out at high zoom levels
    "heatmap-opacity": [
      "interpolate",
      ["linear"],
      ["zoom"],
      7,
      0.85,
      14,
      0.8,
      17,
      0.3,
    ],
  },
};

const FLIGHT_CIRCLES: LayerProps = {
  id: "flight-circles",
  type: "circle",
  source: "flights",

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

    "circle-color": "#f59e0b",
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": 1.5,
    "circle-opacity": 0.9,
  },
};

const VESSEL_CIRCLES: LayerProps = {
  id: "vessel-circles",
  type: "circle",
  source: "vessels",

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

    "circle-color": "#06b6d4",
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": 1.5,
    "circle-opacity": 0.9,
  },
};

const VEHICLE_CIRCLES: LayerProps = {
  id: "vehicle-circles",
  type: "circle",
  source: "vehicles",

  paint: {
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      8,
      3,
      12,
      ["get", "radius"],
      16,
      ["*", ["get", "radius"], 1.4],
    ],

    "circle-color": ["get", "color"],
    "circle-stroke-color": "#ffffff",
    "circle-stroke-width": 1.5,
    "circle-opacity": 0.9,
  },
};

/* -------------------------------------------------------------------------- */
/* GeoJSON helpers                                                            */
/* -------------------------------------------------------------------------- */

function incidentsToGeoJSON(incidents: Incident[]) {
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

function incidentsToHeatmapGeoJSON(incidents: Incident[]) {
  return {
    type: "FeatureCollection" as const,

    features: incidents.map((incident) => {
      const weight = incident.severity === "critical" ? 5 : incident.severity === "warning" ? 3 : 1;
      return {
        type: "Feature" as const,

        id: `hm-${incident.id}`,

        geometry: {
          type: "Point" as const,
          coordinates: [incident.lng, incident.lat],
        },

        properties: {
          id: incident.id,
          weight,
          severity: incident.severity,
        },
      };
    }),
  };
}

function incidentToGeoJSON(incident: Incident | null) {
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

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

interface MapContainerProps {
  incidents?: Incident[];

  showIncidents: boolean;

  crisisActive: boolean;

  setCrisisActive: (active: boolean) => void;

  onUseFeedContext?: (context: string) => void;

  selectedTime: string;

  setSelectedTime: React.Dispatch<
    React.SetStateAction<string>
  >;

  selectedIncident: Incident | null;

  setSelectedIncident: (
    incident: Incident | null,
  ) => void;

  showFlights?: boolean;

  setShowFlights?: React.Dispatch<
    React.SetStateAction<boolean>
  >;

  showVehicles?: boolean;

  setShowVehicles?: React.Dispatch<
    React.SetStateAction<boolean>
  >;

  setShowIncidents?: React.Dispatch<
    React.SetStateAction<boolean>
  >;

  showHeatmap?: boolean;

  setShowHeatmap?: React.Dispatch<
    React.SetStateAction<boolean>
  >;

  onFlightCountChange?: (count: number) => void;

  onVehicleCountChange?: (count: number) => void;

  mapAction?: MapAction | null;

  onClearMapAction?: () => void;

  copilotWidth?: number;

  aiOpen?: boolean;

  isCopilotDragging?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Memoized Marker Components for High-Performance Map Rendering              */
/* -------------------------------------------------------------------------- */

const FlightMarkerItem = React.memo(function FlightMarkerItem({
  flight,
  isSelected,
  onSelect,
}: {
  flight: FlightVector;
  isSelected: boolean;
  onSelect: (flight: FlightVector) => void;
}) {
  const isHeli = flight.callsign.includes("HELI") || flight.altitude < 300;
  const isMil = flight.callsign.includes("MIL") || flight.callsign.includes("NATO");
  const airType = isHeli ? "helicopter" : isMil ? "military" : "plane";

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(flight);
    },
    [flight, onSelect]
  );

  return (
    <Marker
      latitude={flight.lat}
      longitude={flight.lng}
      anchor="center"
    >
      <div
        className="relative group cursor-pointer transition-transform hover:scale-110 hover:z-[99999] will-change-transform"
        onClick={handleClick}
      >
        <MapObjectVector
          domain="air"
          type={airType}
          heading={flight.heading}
          status="normal"
          size={30}
          isSelected={isSelected}
        />
        {!isSelected && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[999999] whitespace-nowrap bg-slate-900 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-semibold px-2 py-0.5 rounded shadow-lg">
            {flight.callsign || flight.id} ({Math.round(flight.altitude)}m)
          </div>
        )}
      </div>
    </Marker>
  );
});

const VesselMarkerItem = React.memo(function VesselMarkerItem({
  vessel,
  isSelected,
  onSelect,
}: {
  vessel: VesselData;
  isSelected: boolean;
  onSelect: (vessel: VesselData) => void;
}) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(vessel);
    },
    [vessel, onSelect]
  );

  return (
    <Marker
      latitude={vessel.lat}
      longitude={vessel.lng}
      anchor="center"
    >
      <div
        className="relative group cursor-pointer transition-transform hover:scale-110 hover:z-[99999] will-change-transform"
        onClick={handleClick}
      >
        <MapObjectVector
          domain="maritime"
          type={vessel.shipCategory}
          heading={vessel.heading}
          status="normal"
          size={30}
          isSelected={isSelected}
        />
        {!isSelected && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[999999] whitespace-nowrap bg-slate-900 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-semibold px-2 py-0.5 rounded shadow-lg">
            {vessel.name || `MMSI ${vessel.mmsi}`} ({vessel.sog} kts)
          </div>
        )}
      </div>
    </Marker>
  );
});

const IncidentMarkerItem = React.memo(function IncidentMarkerItem({
  inc,
  isSelected,
  onSelect,
}: {
  inc: Incident;
  isSelected: boolean;
  onSelect: (inc: Incident) => void;
}) {
  return (
    <Marker
      latitude={inc.lat}
      longitude={inc.lng}
      anchor="center"
    >
      <IncidentMarker
        inc={inc}
        isSelected={isSelected}
        onClick={onSelect}
      />
    </Marker>
  );
});

const DistrictCentroidMarkerItem = React.memo(function DistrictCentroidMarkerItem({
  props,
}: {
  props: any;
}) {
  const isTarget = props.isTarget;
  const badgeBg =
    props.severity === "critical" || isTarget
      ? "rgba(239, 68, 68, 0.9)"
      : props.severity === "warning"
      ? "rgba(245, 158, 11, 0.9)"
      : "rgba(14, 165, 233, 0.9)";

  return (
    <Marker
      latitude={props.centerLat}
      longitude={props.centerLng}
      anchor="center"
    >
      <div className="relative flex flex-col items-center justify-center pointer-events-none transition-transform duration-200 transform hover:scale-105 will-change-transform">
        <div
          className="relative px-3 py-1.5 rounded-lg border flex flex-col items-center justify-center transition-all"
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.85)",
            borderColor: props.strokeColor,
          }}
        >
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: props.strokeColor }}
            />
            <span className="font-mono text-[11px] font-extrabold uppercase tracking-wider text-white">
              {props.name}
            </span>
          </div>
          {props.count > 0 && (
            <span
              className="font-mono text-[9.5px] font-bold text-white px-2 py-0.5 rounded-full mt-1 border border-white/20"
              style={{ backgroundColor: badgeBg }}
            >
              {props.count} {props.count === 1 ? "Active Incident" : "Active Incidents"}
            </span>
          )}
        </div>
      </div>
    </Marker>
  );
});

const SelectedVehicleMarkerItem = React.memo(function SelectedVehicleMarkerItem({
  vehicle,
  onSelect,
}: {
  vehicle: Vehicle;
  onSelect: (vehicle: Vehicle) => void;
}) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect(vehicle);
    },
    [vehicle, onSelect]
  );

  return (
    <Marker
      latitude={vehicle.lat}
      longitude={vehicle.lng}
      anchor="center"
    >
      <div
        onClick={handleClick}
        className="relative cursor-pointer group flex items-center justify-center p-1 ring-2 ring-sky-400 rounded-full scale-110 will-change-transform z-50 hover:z-[99999]"
        title={`${vehicle.name} (${vehicle.speed} km/h) - ${vehicle.destination}`}
      >
        {vehicle.type === "ambulance" ? (
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-rose-600 border-2 border-white shadow-md">
            <Siren className="w-4 h-4 text-white animate-pulse" />
          </div>
        ) : vehicle.type === "police" ? (
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-md">
            <Siren className="w-3.5 h-3.5 text-white" />
          </div>
        ) : vehicle.type === "fire_engine" ? (
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-600 border-2 border-white shadow-md">
            <Siren className="w-4 h-4 text-white animate-bounce" />
          </div>
        ) : vehicle.type === "bus" ? (
          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-600 border border-white shadow-sm">
            <Bus className="w-3.5 h-3.5 text-white" />
          </div>
        ) : vehicle.type === "yacht" ? (
          <div
            className="flex items-center justify-center w-7 h-7 rounded-full bg-cyan-600 border-2 border-white shadow-md"
            style={{ transform: `rotate(${vehicle.heading}deg)` }}
          >
            <Anchor className="w-4 h-4 text-white" />
          </div>
        ) : (
          <div
            className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 border border-white shadow-sm"
            style={{ transform: `rotate(${vehicle.heading}deg)` }}
          >
            <Car className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
    </Marker>
  );
});

export function MapContainer({
  incidents,
  showIncidents,
  crisisActive,
  onUseFeedContext,
  selectedTime,
  setSelectedTime,
  selectedIncident,
  setSelectedIncident,
  showFlights,
  setShowFlights,
  showVehicles,
  setShowVehicles,
  setShowIncidents,
  showHeatmap,
  setShowHeatmap,
  onFlightCountChange,
  onVehicleCountChange,
  mapAction,
  onClearMapAction,
  copilotWidth = 446,
  aiOpen = false,
  isCopilotDragging = false,
}: MapContainerProps) {
  const mapRef = useRef<MapRef | null>(null);

  const rightOffset = aiOpen ? copilotWidth : 0;

  const [mapTheme, setMapTheme] =
    useState<MapTheme>("dark");

  const [is3D, setIs3D] =
    useState(false);

  const [internalShowHeatmap, setInternalShowHeatmap] = useState(false);
  const activeShowHeatmap = showHeatmap ?? internalShowHeatmap;
  const activeSetShowHeatmap = setShowHeatmap ?? setInternalShowHeatmap;

  const [incidentList, setIncidentList] = useState<Incident[]>(incidents || MOCK_INCIDENTS);

  useEffect(() => {
    if (incidents) {
      setIncidentList(incidents);
    }
  }, [incidents]);

  useEffect(() => {
    if (!incidents) {
      fetchIncidentsFromDb().then((list) => setIncidentList([...list]));
    }

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Incident[]>;
      if (customEvent.detail) {
        setIncidentList([...customEvent.detail]);
      }
    };
    window.addEventListener("scada-incidents-updated", handleUpdate);
    return () => window.removeEventListener("scada-incidents-updated", handleUpdate);
  }, [incidents]);

  const isClient = useIsClient();

  const [isMapReady, setIsMapReady] =
    useState(false);

  const [
    selectedInfrastructureCluster,
    setSelectedInfrastructureCluster,
  ] = useState<InfrastructureCluster | null>(null);
  const [showClusterSidePanel, setShowClusterSidePanel] = useState(false);
  const [showFullClusterModal, setShowFullClusterModal] = useState(false);

  const [feedMinimized, setFeedMinimized] =
    useState(false);

  /* Internal layer toggles fallback */
  const [
    internalShowFlights,
    setInternalShowFlights,
  ] = useState(true);

  const [
    internalShowVehicles,
    setInternalShowVehicles,
  ] = useState(true);

  const activeShowFlights =
    showFlights ?? internalShowFlights;

  const activeSetShowFlights =
    setShowFlights ?? setInternalShowFlights;

  const activeShowVehicles =
    showVehicles ?? internalShowVehicles;

  const activeSetShowVehicles =
    setShowVehicles ?? setInternalShowVehicles;

  /* Real-time Flight Airspace state */
  const [flights, setFlights] =
    useState<FlightVector[]>([]);

  const [selectedFlight, setSelectedFlight] =
    useState<FlightVector | null>(null);

  /* Real-time Maritime AIS Vessel state */
  const [vessels, setVessels] =
    useState<VesselData[]>([]);

  const [selectedVessel, setSelectedVessel] =
    useState<VesselData | null>(null);

  /* Ground Traffic & Vehicle state */
  const [vehicles, setVehicles] =
    useState<Vehicle[]>([]);

  const [trafficSegments] =
    useState<TrafficSegment[]>([]);

  const [selectedVehicle, setSelectedVehicle] =
    useState<Vehicle | null>(null);

  /* Real-Time Tallinn Public Transport state */
  const [publicTransportMode, setPublicTransportMode] = useState<"realtime" | "simulation">(
    (process.env.NEXT_PUBLIC_PUBLIC_TRANSPORT_MODE as "realtime" | "simulation") || "realtime"
  );
  const [showPublicTransport, setShowPublicTransport] = useState<boolean>(true);
  const [publicTransportVehicles, setPublicTransportVehicles] = useState<PublicTransportData[]>([]);
  const [selectedPublicTransport, setSelectedPublicTransport] = useState<PublicTransportData | null>(null);

  /* Special Facilities & Emergency Services state */
  const [
    showEmergencyServices,
    setShowEmergencyServices,
  ] = useState(true);

  const [
    selectedEmergencyService,
    setSelectedEmergencyService,
  ] = useState<EmergencyService | null>(null);

  /* Transport Hubs state */
  const [
    showTransportHubs,
    setShowTransportHubs,
  ] = useState(true);

  const [
    selectedTransportHub,
    setSelectedTransportHub,
  ] = useState<TransportHub | null>(null);

  /* ---------------------------------------------------------------------- */
  /* GeoJSON calculation for WebGL Flight Airspace layer                   */
  /* ---------------------------------------------------------------------- */

  const flightsGeoJSON = useMemo(() => {
    if (!activeShowFlights) {
      return {
        type: "FeatureCollection" as const,
        features: [],
      };
    }

    return {
      type: "FeatureCollection" as const,

      features: flights.map((f) => ({
        type: "Feature" as const,

        id: f.id,

        geometry: {
          type: "Point" as const,
          coordinates: [
            f.lng,
            f.lat,
          ],
        },

        properties: {
          id: f.id,
          callsign: f.callsign || f.id,
          velocity: f.velocity,
          heading: f.heading,
          altitude: f.altitude,
          country: f.country,
          isGround: f.isGround,
        },
      })),
    };
  }, [flights, activeShowFlights]);

  /* ---------------------------------------------------------------------- */
  /* GeoJSON calculation for WebGL Maritime Vessel layer                   */
  /* ---------------------------------------------------------------------- */

  const vesselsGeoJSON = useMemo(() => {
    if (!activeShowVehicles) {
      return {
        type: "FeatureCollection" as const,
        features: [],
      };
    }

    return {
      type: "FeatureCollection" as const,

      features: vessels.map((v) => ({
        type: "Feature" as const,

        id: v.mmsi,

        geometry: {
          type: "Point" as const,
          coordinates: [
            v.lng,
            v.lat,
          ],
        },

        properties: {
          mmsi: v.mmsi,
          name: v.name || `MMSI ${v.mmsi}`,
          sog: v.sog,
          heading: v.heading,
          shipCategory: v.shipCategory,
          destination: v.destination,
        },
      })),
    };
  }, [vessels, activeShowVehicles]);

  /* ---------------------------------------------------------------------- */
  /* GeoJSON calculation for WebGL Traffic Vehicles layer                  */
  /* ---------------------------------------------------------------------- */

  const vehiclesGeoJSON = useMemo(() => {
    if (!activeShowVehicles || vehicles.length === 0) {
      return {
        type: "FeatureCollection" as const,
        features: [],
      };
    }

    return {
      type: "FeatureCollection" as const,
      features: vehicles.map((v) => ({
        type: "Feature" as const,
        id: v.id,
        geometry: {
          type: "Point" as const,
          coordinates: [v.lng, v.lat],
        },
        properties: {
          id: v.id,
          name: v.name,
          type: v.type,
          speed: v.speed,
          heading: v.heading,
          destination: v.destination,
          color:
            v.type === "ambulance"
              ? "#0284c7"
              : v.type === "police"
              ? "#3b82f6"
              : v.type === "fire_engine"
              ? "#ea580c"
              : v.type === "bus"
              ? "#d97706"
              : v.type === "yacht"
              ? "#06b6d4"
              : v.status === "delayed"
              ? "#f59e0b"
              : "#10b981",
          radius:
            v.type === "ambulance" || v.type === "fire_engine" || v.type === "police"
              ? 7
              : v.type === "bus" || v.type === "yacht"
              ? 6
              : 4,
        },
      })),
    };
  }, [vehicles, activeShowVehicles]);

  /* ---------------------------------------------------------------------- */
  /* Fetch OpenSky & live ADS-B flights                                     */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    let isMounted = true;

    const fetchFlights = async () => {
      try {
        const res = await fetch("/api/flights");

        if (!res.ok) return;

        const data = await res.json();

        if (
          isMounted &&
          data.flights &&
          Array.isArray(data.flights) &&
          data.flights.length > 0
        ) {
          setFlights((prevFlights) => {
            if (!prevFlights || prevFlights.length === 0) return data.flights;

            const prevDict: Record<string, FlightVector> = {};
            prevFlights.forEach((f) => {
              prevDict[f.id] = f;
              if (f.callsign) prevDict[f.callsign] = f;
            });

            const incomingIds = new Set<string>();

            const updatedIncoming = data.flights.map((incoming: FlightVector) => {
              incomingIds.add(incoming.id);
              if (incoming.callsign) incomingIds.add(incoming.callsign);

              const prev = prevDict[incoming.id] || (incoming.callsign ? prevDict[incoming.callsign] : undefined);
              if (!prev) return incoming;

              return {
                ...incoming,
                path: prev.path || incoming.path,
              };
            });

            // Keep flights missing from current frame for up to 45 seconds to prevent flickering
            const nowSec = Math.floor(Date.now() / 1000);
            const retainedPrev = prevFlights.filter((prev) => {
              if (incomingIds.has(prev.id) || (prev.callsign && incomingIds.has(prev.callsign))) {
                return false;
              }
              const age = nowSec - (prev.timestamp || nowSec);
              return age < 45;
            });

            return [...updatedIncoming, ...retainedPrev];
          });
        }
      } catch (_err) {
        // silent fallback
      }
    };

    fetchFlights();

    const interval = setInterval(
      fetchFlights,
      6000,
    );

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Fetch real AIS vessels                                                 */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    let isMounted = true;

    const fetchVessels = async () => {
      try {
        const res = await fetch("/api/vessels");

        if (!res.ok) return;

        const data = await res.json();

        if (
          isMounted &&
          data.vessels &&
          Array.isArray(data.vessels)
        ) {
          setVessels(data.vessels);
        }
      } catch (_err) {
        // silent fallback
      }
    };

    fetchVessels();

    const interval = setInterval(
      fetchVessels,
      10000,
    );

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Fetch Real-Time Tallinn Public Transport Telemetry                     */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (publicTransportMode !== "realtime") return;

    let isMounted = true;

    const fetchPublicTransport = async () => {
      try {
        const res = await fetch("/api/telemetry/public-transport");
        if (!res.ok) return;

        const data = await res.json();
        if (isMounted && data.vehicles && Array.isArray(data.vehicles)) {
          setPublicTransportVehicles(data.vehicles);
        }
      } catch (_err) {
        // silent fallback
      }
    };

    fetchPublicTransport();
    const interval = setInterval(fetchPublicTransport, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [publicTransportMode]);

  /* ---------------------------------------------------------------------- */
  /* Smooth Kinematic Movement for Public Transport Vehicles                */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (publicTransportMode !== "realtime") return;

    const moveInterval = setInterval(() => {
      setPublicTransportVehicles((prev) => {
        if (!prev || prev.length === 0) return prev;
        return prev.map((v) => {
          if (!v.speed || v.speed <= 0) return v;
          const speedMps = v.speed / 3.6;
          const bearingRad = (v.bearing * Math.PI) / 180;
          const distMeters = speedMps * 1.0;
          const dLat = (distMeters * Math.cos(bearingRad)) / 111320;
          const dLng = (distMeters * Math.sin(bearingRad)) / (111320 * Math.cos((v.lat * Math.PI) / 180));

          return {
            ...v,
            lat: v.lat + dLat,
            lon: v.lon + dLng,
            lng: v.lon + dLng,
          };
        });
      });
    }, 1000);

    return () => clearInterval(moveInterval);
  }, [publicTransportMode]);

  /* ---------------------------------------------------------------------- */
  /* Ground traffic simulation ticks                                       */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const trafficInterval = setInterval(() => {
      setVehicles((prev) =>
        tickTrafficEngine(prev, 1000),
      );
    }, 1000);

    return () =>
      clearInterval(trafficInterval);
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Real-time Movement Ticks for Flights and Maritime Vessels               */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const simVesselMap = new globalThis.Map(SIMULATED_MARITIME_FLEET.map((r) => [r.mmsi, r]));

    const moveInterval = setInterval(() => {
      const nowSec = Math.floor(Date.now() / 1000);

      // 1. Advance real flights based on true ADS-B telemetry kinematics
      setFlights((prevFlights) => {
        if (!prevFlights || prevFlights.length === 0) return prevFlights;
        return prevFlights.map((f) => {
          if (!f.velocity || f.velocity <= 0 || f.isGround) return f;
          const headingRad = (f.heading * Math.PI) / 180;
          const distMeters = f.velocity * 1.0; // 1s step
          const dLat = (distMeters * Math.cos(headingRad)) / 111320;
          const dLng = (distMeters * Math.sin(headingRad)) / (111320 * Math.cos((f.lat * Math.PI) / 180));
          const newLat = f.lat + dLat;
          const newLng = f.lng + dLng;
          const newAlt = Math.max(0, f.altitude + (f.verticalRate || 0) * 1.0);
          
          const newPoint: [number, number] = [Number(newLng.toFixed(5)), Number(newLat.toFixed(5))];
          const currentPath: [number, number][] = f.path && f.path.length > 0 ? f.path : [[Number(f.lng.toFixed(5)), Number(f.lat.toFixed(5))]];
          const updatedPath: [number, number][] = [...currentPath, newPoint].slice(-150);

          return {
            ...f,
            lat: newLat,
            lng: newLng,
            altitude: newAlt,
            path: updatedPath,
          };
        });
      });

      // 2. Advance vessels strictly along designated Baltic Sea corridors & fairways
      setVessels((prevVessels) => {
        if (!prevVessels || prevVessels.length === 0) return prevVessels;
        return prevVessels.map((v) => {
          const sim = simVesselMap.get(v.mmsi);
          if (sim) {
            const next = calculateMaritimePosition(sim, nowSec);
            const safe = sanitizeVesselWaterPosition(next.lat, next.lng);
            return {
              ...v,
              lat: safe.lat,
              lng: safe.lng,
              sog: next.sog,
              cog: next.heading,
              heading: next.heading,
            };
          }

          if (!v.sog || v.sog <= 0) return v;
          const speedMs = v.sog * 0.514444; // knots to m/s
          const headingToUse = (v.heading && v.heading !== 511) ? v.heading : (v.cog || 0);
          const headingRad = (headingToUse * Math.PI) / 180;
          const distMeters = speedMs * 1.0; // 1s step
          const dLat = (distMeters * Math.cos(headingRad)) / 111320;
          const dLng = (distMeters * Math.sin(headingRad)) / (111320 * Math.cos((v.lat * Math.PI) / 180));
          const rawLat = v.lat + dLat;
          const rawLng = v.lng + dLng;
          const safe = sanitizeVesselWaterPosition(rawLat, rawLng);
          return {
            ...v,
            lat: safe.lat,
            lng: safe.lng,
          };
        });
      });
    }, 1000);

    return () => clearInterval(moveInterval);
  }, []);

  const handleFlightSelect = useCallback((selected: FlightVector) => {
    setSelectedFlight(selected);
    setSelectedVessel(null);
    setSelectedEmergencyService(null);
    setSelectedIncident(null);
    setSelectedVehicle(null);
  }, []);

  const handleVesselSelect = useCallback((selected: VesselData) => {
    setSelectedVessel(selected);
    setSelectedFlight(null);
    setSelectedEmergencyService(null);
    setSelectedIncident(null);
    setSelectedVehicle(null);
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Update parent counters                                                 */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (onFlightCountChange) {
      onFlightCountChange(flights.length);
    }
  }, [
    flights.length,
    onFlightCountChange,
  ]);

  useEffect(() => {
    if (onVehicleCountChange) {
      onVehicleCountChange(vessels.length);
    }
  }, [
    vessels.length,
    onVehicleCountChange,
  ]);

  /* ---------------------------------------------------------------------- */
  /* Camera state                                                            */
  /* ---------------------------------------------------------------------- */

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

  // Quantize zoom level to prevent thrashing during smooth pinch-zoom / mouse-wheel zoom
  const quantizedZoom = Math.round(viewState.zoom * 2) / 2;

  const visibleEmergencyServices = useMemo(() => {
    if (!showEmergencyServices || TALLINN_EMERGENCY_SERVICES.length === 0) return [];
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      if (bounds) {
        const west = bounds.getWest() - 0.08;
        const east = bounds.getEast() + 0.08;
        const south = bounds.getSouth() - 0.05;
        const north = bounds.getNorth() + 0.05;
        return TALLINN_EMERGENCY_SERVICES.filter(
          (s) =>
            s.id === selectedEmergencyService?.id ||
            (s.lat >= south && s.lat <= north && s.lng >= west && s.lng <= east)
        );
      }
    }
    const latSpan = Math.max(0.08, 120 / Math.pow(2, viewState.zoom));
    const lngSpan = Math.max(0.16, 240 / Math.pow(2, viewState.zoom));
    return TALLINN_EMERGENCY_SERVICES.filter(
      (s) =>
        s.id === selectedEmergencyService?.id ||
        (Math.abs(s.lat - viewState.latitude) <= latSpan &&
         Math.abs(s.lng - viewState.longitude) <= lngSpan)
    );
  }, [showEmergencyServices, viewState.latitude, viewState.longitude, quantizedZoom, selectedEmergencyService?.id]);

  const visibleTransportHubs = useMemo(() => {
    if (!showTransportHubs || TALLINN_TRANSPORT_HUBS.length === 0) return [];
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      if (bounds) {
        const west = bounds.getWest() - 0.08;
        const east = bounds.getEast() + 0.08;
        const south = bounds.getSouth() - 0.05;
        const north = bounds.getNorth() + 0.05;
        return TALLINN_TRANSPORT_HUBS.filter(
          (h) =>
            h.id === selectedTransportHub?.id ||
            (h.lat >= south && h.lat <= north && h.lng >= west && h.lng <= east)
        );
      }
    }
    const latSpan = Math.max(0.08, 120 / Math.pow(2, viewState.zoom));
    const lngSpan = Math.max(0.16, 240 / Math.pow(2, viewState.zoom));
    return TALLINN_TRANSPORT_HUBS.filter(
      (h) =>
        h.id === selectedTransportHub?.id ||
        (Math.abs(h.lat - viewState.latitude) <= latSpan &&
         Math.abs(h.lng - viewState.longitude) <= lngSpan)
    );
  }, [showTransportHubs, viewState.latitude, viewState.longitude, quantizedZoom, selectedTransportHub?.id]);

  // Unified Area Infrastructure clusters (Emergency Services + Transport Hubs)
  const infraClusters = useMemo(() => {
    return clusterInfrastructure(visibleEmergencyServices, visibleTransportHubs, mapRef.current, quantizedZoom);
  }, [visibleEmergencyServices, visibleTransportHubs, isMapReady, quantizedZoom]);

  /* ---------------------------------------------------------------------- */
  /* Viewport bounds filtering for HTML DOM markers to maintain 60 FPS       */
  /* ---------------------------------------------------------------------- */

  const visibleFlights = useMemo(() => {
    if (!activeShowFlights || flights.length === 0) return [];
    if (flights.length <= 8) return flights;

    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      if (bounds) {
        const west = bounds.getWest() - 0.15;
        const east = bounds.getEast() + 0.15;
        const south = bounds.getSouth() - 0.1;
        const north = bounds.getNorth() + 0.1;
        return flights.filter(
          (f) =>
            f.id === selectedFlight?.id ||
            (f.lat >= south && f.lat <= north && f.lng >= west && f.lng <= east)
        );
      }
    }
    const latSpan = Math.max(0.12, 180 / Math.pow(2, viewState.zoom));
    const lngSpan = Math.max(0.24, 360 / Math.pow(2, viewState.zoom));
    return flights.filter(
      (f) =>
        f.id === selectedFlight?.id ||
        (Math.abs(f.lat - viewState.latitude) <= latSpan &&
         Math.abs(f.lng - viewState.longitude) <= lngSpan)
    );
  }, [flights, activeShowFlights, viewState.latitude, viewState.longitude, viewState.zoom, selectedFlight?.id]);

  const visibleVessels = useMemo(() => {
    if (!activeShowVehicles || vessels.length === 0) return [];
    if (vessels.length <= 8) return vessels;

    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      if (bounds) {
        const west = bounds.getWest() - 0.15;
        const east = bounds.getEast() + 0.15;
        const south = bounds.getSouth() - 0.1;
        const north = bounds.getNorth() + 0.1;
        return vessels.filter(
          (v) =>
            v.mmsi === selectedVessel?.mmsi ||
            (v.lat >= south && v.lat <= north && v.lng >= west && v.lng <= east)
        );
      }
    }
    const latSpan = Math.max(0.12, 180 / Math.pow(2, viewState.zoom));
    const lngSpan = Math.max(0.24, 360 / Math.pow(2, viewState.zoom));
    return vessels.filter(
      (v) =>
        v.mmsi === selectedVessel?.mmsi ||
        (Math.abs(v.lat - viewState.latitude) <= latSpan &&
         Math.abs(v.lng - viewState.longitude) <= lngSpan)
    );
  }, [vessels, activeShowVehicles, viewState.latitude, viewState.longitude, viewState.zoom, selectedVessel?.mmsi]);

  /* ---------------------------------------------------------------------- */
  /* Selected vehicle route                                                  */
  /* ---------------------------------------------------------------------- */

  const selectedVehicleRouteGeoJSON =
    useMemo(() => {
      if (!selectedVehicle) return null;

      const vLng = selectedVehicle.lng;
      const vLat = selectedVehicle.lat;

      let destLng =
        selectedVehicle.destLng;

      let destLat =
        selectedVehicle.destLat;

      const corridor =
        ROAD_CORRIDORS[
        selectedVehicle.routeId
        ];

      /* Fallback to corridor end */
      if (
        (!destLng || !destLat) &&
        corridor &&
        corridor.path.length > 0
      ) {
        const endPt =
          selectedVehicle.direction === 1
            ? corridor.path[
            corridor.path.length - 1
            ]
            : corridor.path[0];

        destLng = endPt[0];
        destLat = endPt[1];
      }

      if (!destLng || !destLat) {
        destLng = 24.7535;
        destLat = 59.4370;
      }

      const coords: [number, number][] = [
        [vLng, vLat],
      ];

      if (
        corridor &&
        corridor.path.length >= 2
      ) {
        const pathPoints =
          selectedVehicle.direction === 1
            ? corridor.path
            : [...corridor.path].reverse();

        for (const [pLng, pLat] of pathPoints) {
          const dist = Math.hypot(
            pLng - vLng,
            pLat - vLat,
          );

          if (dist > 0.002) {
            coords.push([
              pLng,
              pLat,
            ]);
          }
        }
      }

      coords.push([
        destLng,
        destLat,
      ]);

      return {
        type: "FeatureCollection" as const,

        features: [
          {
            type: "Feature" as const,

            id: "selected-vehicle-route-line",

            geometry: {
              type: "LineString" as const,
              coordinates: coords,
            },

            properties: {
              id: selectedVehicle.id,
              name: selectedVehicle.name,
              destination:
                selectedVehicle.destination,
              type: selectedVehicle.type,
            },
          },
        ],
      };
    }, [selectedVehicle]);

  /* ---------------------------------------------------------------------- */
  /* O(1) incident lookup                                                   */
  /* ---------------------------------------------------------------------- */

  const incidentById = useMemo(() => {
    return new globalThis.Map(
      incidentList.map(
        (incident) => [
          incident.id,
          incident,
        ],
      ),
    );
  }, [incidentList]);

  /* ---------------------------------------------------------------------- */
  /* Filter data                                                            */
  /* ---------------------------------------------------------------------- */

  const filteredIncidents = useMemo(() => {
    if (!showIncidents) {
      return [];
    }

    switch (selectedTime) {
      case "08:40":
        return incidentList.slice(4);

      case "08:44":
        return incidentList.slice(2);

      case "08:47":
      default:
        return incidentList;
    }
  }, [
    showIncidents,
    selectedTime,
    incidentList,
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

  const incidentHeatmapGeoJSON = useMemo(
    () => incidentsToHeatmapGeoJSON(filteredIncidents),
    [filteredIncidents]
  );

  const districtBoundariesGeoJSON = useMemo(
    () =>
      getDistrictBoundariesGeoJSON(
        mapAction?.highlightedDistricts,
        mapAction?.targetDistrictId,
        activeShowHeatmap
      ),
    [mapAction?.highlightedDistricts, mapAction?.targetDistrictId, activeShowHeatmap]
  );

  const selectedIncidentGeoJSON =
    useMemo(
      () =>
        incidentToGeoJSON(
          selectedIncident,
        ),
      [selectedIncident],
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

  useEffect(() => {
    if (mapAction?.center) {
      flyTo(
        mapAction.center.lat,
        mapAction.center.lng,
        mapAction.center.zoom,
      );

      const targetLat = mapAction.center.lat;
      const targetLng = mapAction.center.lng;

      // 1. Match nearest emergency service
      let matchedService: EmergencyService | null = null;
      let minServiceDist = Infinity;
      for (const s of TALLINN_EMERGENCY_SERVICES) {
        const d = Math.hypot(s.lat - targetLat, s.lng - targetLng);
        if (d < 0.004 && d < minServiceDist) {
          minServiceDist = d;
          matchedService = s;
        }
      }

      // 2. Match nearest transport hub
      let matchedHub: TransportHub | null = null;
      let minHubDist = Infinity;
      for (const h of TALLINN_TRANSPORT_HUBS) {
        const d = Math.hypot(h.lat - targetLat, h.lng - targetLng);
        if (d < 0.007 && d < minHubDist) {
          minHubDist = d;
          matchedHub = h;
        }
      }

      // 3. Match nearest incident
      let matchedIncident: Incident | null = null;
      let minIncDist = Infinity;
      for (const inc of incidentList) {
        const d = Math.hypot(inc.lat - targetLat, inc.lng - targetLng);
        if (d < 0.004 && d < minIncDist) {
          minIncDist = d;
          matchedIncident = inc;
        }
      }

      if (matchedService && minServiceDist <= minHubDist && minServiceDist <= minIncDist) {
        setSelectedEmergencyService(matchedService);
        setSelectedTransportHub(null);
        setSelectedIncident(null);
        flyTo(matchedService.lat, matchedService.lng, Math.max(mapAction.center.zoom || 16, 16));
      } else if (matchedHub && minHubDist <= minIncDist) {
        setSelectedTransportHub(matchedHub);
        setSelectedEmergencyService(null);
        setSelectedIncident(null);
        flyTo(matchedHub.lat, matchedHub.lng, Math.max(mapAction.center.zoom || 16, 16));
      } else if (matchedIncident) {
        setSelectedIncident(matchedIncident);
        setSelectedEmergencyService(null);
        setSelectedTransportHub(null);
        flyTo(matchedIncident.lat, matchedIncident.lng, Math.max(mapAction.center.zoom || 16.5, 16.5));
      }
    }
  }, [mapAction, flyTo, incidentList, setSelectedIncident, setSelectedEmergencyService, setSelectedTransportHub]);

  useEffect(() => {
    const handleFocusNode = (e: Event) => {
      const customEvent = e as CustomEvent<{ nodeId: string }>;
      if (customEvent.detail?.nodeId) {
        const targetId = customEvent.detail.nodeId.toLowerCase();
        const found = incidentList.find(
          (inc) =>
            (inc.nodeId && inc.nodeId.toLowerCase() === targetId) ||
            inc.id.toLowerCase() === targetId
        );
        if (found) {
          setShowIncidents?.(true);
          setSelectedIncident(found);
          flyTo(found.lat, found.lng, 16.5);
        }
      }
    };
    window.addEventListener("scada-focus-incident-node", handleFocusNode);
    return () => window.removeEventListener("scada-focus-incident-node", handleFocusNode);
  }, [incidentList, setSelectedIncident, setShowIncidents, flyTo]);

  useEffect(() => {
    if (selectedIncident) {
      setShowIncidents?.(true);
      flyTo(selectedIncident.lat, selectedIncident.lng, 16.5);
      setSelectedEmergencyService(null);
      setSelectedTransportHub(null);
      setSelectedFlight(null);
      setSelectedVessel(null);
      setSelectedVehicle(null);
    }
  }, [selectedIncident, isMapReady, flyTo, setShowIncidents, setSelectedEmergencyService, setSelectedTransportHub, setSelectedFlight, setSelectedVessel, setSelectedVehicle]);

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

  const baseHandleMapClick =
    useMapInteractions({
      incidentById,
      flyTo,
      setSelectedIncident,
    });

  const handleMapClick = useCallback(
    (
      event: maplibregl.MapLayerMouseEvent,
    ) => {
      const feature =
        event.features?.[0];

      if (!feature) {
        setSelectedFlight(null);
        setSelectedVessel(null);
        setSelectedEmergencyService(null);

        baseHandleMapClick(event);

        return;
      }

      const properties =
        feature.properties;

      const layerId =
        feature.layer?.id;

      if (
        layerId === "flight-circles" ||
        layerId === "flight-labels"
      ) {
        const flightId = String(
          properties?.id ?? "",
        );

        const f = flights.find(
          (item) =>
            item.id === flightId,
        );

        if (f) {
          setSelectedFlight(f);
          setSelectedVessel(null);
          setSelectedEmergencyService(null);
          setSelectedIncident(null);

          return;
        }
      }

      if (
        layerId === "vessel-circles" ||
        layerId === "vessel-labels"
      ) {
        const mmsi = Number(
          properties?.mmsi ?? 0,
        );

        const v = vessels.find(
          (item) =>
            item.mmsi === mmsi,
        );

        if (v) {
          setSelectedVessel(v);
          setSelectedFlight(null);
          setSelectedEmergencyService(null);
          setSelectedIncident(null);
          setSelectedVehicle(null);

          return;
        }
      }

      if (layerId === "vehicle-circles") {
        const vehId = String(properties?.id ?? "");
        const vehicle = vehicles.find((item) => item.id === vehId);
        if (vehicle) {
          setSelectedVehicle(vehicle);
          setSelectedFlight(null);
          setSelectedVessel(null);
          setSelectedEmergencyService(null);
          setSelectedIncident(null);

          return;
        }
      }

      baseHandleMapClick(event);
    },
    [
      baseHandleMapClick,
      flights,
      vessels,
      vehicles,
      setSelectedIncident,
    ],
  );

  /* ---------------------------------------------------------------------- */
  /* Emergency service interaction                                           */
  /* ---------------------------------------------------------------------- */

  const handleEmergencyServiceClick =
    useCallback(
      (s: EmergencyService) => {
        setSelectedEmergencyService(s);
        setSelectedTransportHub(null);
        setSelectedFlight(null);
        setSelectedVessel(null);
        setSelectedIncident(null);
        setSelectedVehicle(null);
      },
      [
        setSelectedEmergencyService,
        setSelectedTransportHub,
        setSelectedFlight,
        setSelectedIncident,
        setSelectedVehicle,
        setSelectedVessel,
      ],
    );

  const handleTransportHubClick =
    useCallback(
      (hub: TransportHub) => {
        setSelectedTransportHub(hub);
        setSelectedEmergencyService(null);
        setSelectedFlight(null);
        setSelectedVessel(null);
        setSelectedIncident(null);
        setSelectedVehicle(null);
      },
      [
        setSelectedTransportHub,
        setSelectedEmergencyService,
        setSelectedFlight,
        setSelectedIncident,
        setSelectedVehicle,
        setSelectedVessel,
      ],
    );

  /* ---------------------------------------------------------------------- */
  /* Render                                                                  */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="w-full h-full flex flex-col flex-1 select-text">
      {/* ---------------------------------------------------------------- */}
      {/* Map                                                               */}
      {/* ---------------------------------------------------------------- */}

      <div
        className="relative w-full h-full flex-1 min-h-[580px] [&_.maplibregl-ctrl-bottom-right]:!right-[var(--map-ctrl-right,10px)] [&_.maplibregl-ctrl-top-right]:!right-[var(--map-ctrl-right,10px)] [&_.maplibregl-ctrl-bottom-right]:transition-[right] [&_.maplibregl-ctrl-top-right]:transition-[right] [&_.maplibregl-ctrl-bottom-right]:duration-200 [&_.maplibregl-ctrl-top-right]:duration-200"
        style={{
          // @ts-ignore
          "--map-ctrl-right": `${rightOffset + 10}px`,
        }}
      >
        {/* Compact vertical toolbars overlaid on map */}
        <MapToolbar
          mapTheme={mapTheme}
          setMapTheme={setMapTheme}
          is3D={is3D}
          toggle3D={toggle3D}
          resetView={resetView}
          showFlights={activeShowFlights}
          setShowFlights={activeSetShowFlights}
          showVehicles={activeShowVehicles}
          setShowVehicles={activeSetShowVehicles}
          showPublicTransport={showPublicTransport}
          setShowPublicTransport={setShowPublicTransport}
          publicTransportCount={publicTransportVehicles.length}
          publicTransportMode={publicTransportMode}
          setPublicTransportMode={setPublicTransportMode}
          showEmergencyServices={showEmergencyServices}
          setShowEmergencyServices={setShowEmergencyServices}
          showTransportHubs={showTransportHubs}
          setShowTransportHubs={setShowTransportHubs}
          showIncidents={showIncidents}
          setShowIncidents={setShowIncidents}
          showHeatmap={activeShowHeatmap}
          setShowHeatmap={activeSetShowHeatmap}
          flightCount={flights.length}
          vehicleCount={vessels.length}
          emergencyCount={TALLINN_EMERGENCY_SERVICES.length}
          transportHubCount={TALLINN_TRANSPORT_HUBS.length}
          incidentCount={incidentList.length}
          rightOffset={rightOffset}
          isDragging={isCopilotDragging}
        />


        <div className="absolute inset-0 overflow-hidden rounded-xl border border-border bg-background">
          {isClient ? (
            <Map
              ref={mapRef}
              reuseMaps={true}
              mapLib={maplibregl}
              initialViewState={
                selectedIncident
                  ? {
                      latitude: selectedIncident.lat,
                      longitude: selectedIncident.lng,
                      zoom: 16.5,
                      pitch: 0,
                      bearing: 0,
                    }
                  : viewState
              }
              mapStyle={
                MAP_STYLES[mapTheme]
              }
              style={{
                width: "100%",
                height: "100%",
              }}
              attributionControl={false}
              fadeDuration={0}
              onLoad={() => {
                setIsMapReady(true);
                if (selectedIncident) {
                  mapRef.current?.flyTo({
                    center: [selectedIncident.lng, selectedIncident.lat],
                    zoom: 16.5,
                    duration: 600,
                    essential: true,
                  });
                }
              }}
              onMoveEnd={(event) => {
                setViewState(
                  event.viewState,
                );
              }}
              interactiveLayerIds={[
                ...(showIncidents
                  ? [
                    "incident-circles",
                    "selected-incident",
                  ]
                  : []),

                ...(activeShowFlights
                  ? ["flight-circles"]
                  : []),

                ...(activeShowVehicles
                  ? ["vessel-circles", "vehicle-circles"]
                  : []),
              ]}
              onClick={handleMapClick}
              onError={(err) => {
                console.error(
                  "map error",
                  err,
                );
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

              {/* ------------------------------------------------------ */}
              {/* Incidents                                                 */}
              {/* ------------------------------------------------------ */}

              {showIncidents && (
                <>
                  {/* Minimal Tactical Incident Markers with Maki Icons */}
                  {filteredIncidents.map((inc) => (
                    <IncidentMarkerItem
                      key={`incident-maki-marker-${inc.id}`}
                      inc={inc}
                      isSelected={selectedIncident?.id === inc.id}
                      onSelect={setSelectedIncident}
                    />
                  ))}

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



              {/* ------------------------------------------------------ */}
              {/* Incident popup                                          */}
              {/* ------------------------------------------------------ */}

              {selectedIncident && (
                <Popup
                  latitude={selectedIncident.lat}
                  longitude={selectedIncident.lng}
                  anchor="left"
                  offset={24}
                  maxWidth="320px"
                  closeButton={false}
                  closeOnClick={false}
                  onClose={() => setSelectedIncident(null)}
                >
                  <MapIncidentPopup
                    selectedIncident={selectedIncident}
                    setSelectedIncident={setSelectedIncident}
                    onCenter={() => flyTo(selectedIncident.lat, selectedIncident.lng, 16)}
                  />
                </Popup>
              )}

              {/* ------------------------------------------------------ */}
              {/* Animated route for selected vehicle                    */}
              {/* ------------------------------------------------------ */}

              {activeShowVehicles &&
                selectedVehicle &&
                selectedVehicleRouteGeoJSON && (
                  <Source
                    id="selected-vehicle-route"
                    type="geojson"
                    data={
                      selectedVehicleRouteGeoJSON
                    }
                  >
                    <Layer
                      id="selected-vehicle-route-glow"
                      type="line"
                      paint={{
                        "line-color":
                          selectedVehicle.type ===
                            "ambulance"
                            ? "#f43f5e"
                            : selectedVehicle.type ===
                              "police"
                              ? "#3b82f6"
                              : selectedVehicle.type ===
                                "fire_engine"
                                ? "#ea580c"
                                : selectedVehicle.type ===
                                  "yacht"
                                  ? "#06b6d4"
                                  : "#0284c7",

                        "line-width": 8,
                        "line-opacity": 0.35,
                        "line-blur": 0,
                      }}
                    />

                    <Layer
                      id="selected-vehicle-route-dash"
                      type="line"
                      layout={{
                        "line-join":
                          "round",
                        "line-cap":
                          "round",
                      }}
                      paint={{
                        "line-color":
                          selectedVehicle.type ===
                            "ambulance"
                            ? "#fb7185"
                            : selectedVehicle.type ===
                              "police"
                              ? "#60a5fa"
                              : selectedVehicle.type ===
                                "fire_engine"
                                ? "#fb923c"
                                : selectedVehicle.type ===
                                  "yacht"
                                  ? "#22d3ee"
                                  : "#38bdf8",

                        "line-width": 4,
                        "line-dasharray": [
                          0.1,
                          2.5,
                        ],
                      }}
                    />
                  </Source>
                )}

              {/* ------------------------------------------------------ */}
              {/* Destination target marker                              */}
              {/* ------------------------------------------------------ */}

              {activeShowVehicles &&
                selectedVehicle &&
                selectedVehicle.destLat &&
                selectedVehicle.destLng && (
                  <Marker
                    latitude={
                      selectedVehicle.destLat
                    }
                    longitude={
                      selectedVehicle.destLng
                    }
                    anchor="bottom"
                  >
                    <div className="relative flex flex-col items-center cursor-pointer group">
                      <div className="flex items-center gap-1.5 bg-slate-950/90 text-sky-300 border border-sky-400/80 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold shadow-md whitespace-nowrap animate-bounce">
                        <Target className="w-3.5 h-3.5 text-sky-400 animate-spin" />

                        <span>
                          DESTINATION:{" "}
                          {
                            selectedVehicle.destination
                          }
                        </span>
                      </div>

                      <div className="relative flex items-center justify-center mt-1">
                        <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-white border-2 border-background shadow-md">
                          <MapPin className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                    </div>
                  </Marker>
                )}

              {/* Selected Vehicle Marker Overlay */}
              {activeShowVehicles && selectedVehicle && (
                <SelectedVehicleMarkerItem
                  key={`selected-vehicle-${selectedVehicle.id}`}
                  vehicle={selectedVehicle}
                  onSelect={setSelectedVehicle}
                />
              )}

              {/* ------------------------------------------------------ */}
              {/* Unified Area Infrastructure & Transport Hub Clusters   */}
              {/* ------------------------------------------------------ */}

              {(showEmergencyServices || showTransportHubs) &&
                infraClusters.map((cluster) => {
                  const isClustered = cluster.totalCount > 1;

                  if (isClustered) {
                    return (
                      <Marker
                        key={cluster.id}
                        latitude={cluster.lat}
                        longitude={cluster.lng}
                        anchor="center"
                      >
                        <InfrastructureClusterMarker
                          cluster={cluster}
                          onClick={() => {
                            setSelectedIncident(null);
                            setSelectedFlight(null);
                            setSelectedVessel(null);
                            setSelectedVehicle(null);
                            setSelectedEmergencyService(null);
                            setSelectedTransportHub(null);
                            setSelectedInfrastructureCluster(cluster);
                            setShowClusterSidePanel(true);
                            setShowFullClusterModal(false);
                          }}
                        />
                      </Marker>
                    );
                  }

                  // Single facility or transport hub
                  const service = cluster.services[0];
                  const hub = cluster.hubs[0];

                  if (service) {
                    return (
                      <Marker
                        key={cluster.id}
                        latitude={cluster.lat}
                        longitude={cluster.lng}
                        anchor="bottom"
                      >
                        <AppleMapsMarker
                          service={service}
                          isSelected={selectedEmergencyService?.id === service.id}
                          onClick={handleEmergencyServiceClick}
                        />
                      </Marker>
                    );
                  }

                  if (hub) {
                    return (
                      <Marker
                        key={cluster.id}
                        latitude={cluster.lat}
                        longitude={cluster.lng}
                        anchor="bottom"
                      >
                        <TransportHubMarker
                          hub={hub}
                          isSelected={selectedTransportHub?.id === hub.id}
                          onClick={handleTransportHubClick}
                        />
                      </Marker>
                    );
                  }

                  return null;
                })}

              {/* ------------------------------------------------------ */}
              {/* WebGL Flight Path Trails (FlightRadar24 Style)        */}
              {/* ------------------------------------------------------ */}

              {/* ------------------------------------------------------ */}
              {/* WebGL Flight Path Trail (Active ONLY when selected)    */}
              {/* ------------------------------------------------------ */}

              {activeShowFlights && (
                <Source id="flights" type="geojson" data={flightsGeoJSON}>
                  <Layer {...FLIGHT_CIRCLES} />
                </Source>
              )}

              {activeShowVehicles && (
                <Source id="vessels" type="geojson" data={vesselsGeoJSON}>
                  <Layer {...VESSEL_CIRCLES} />
                </Source>
              )}

              {activeShowVehicles && (
                <Source id="vehicles" type="geojson" data={vehiclesGeoJSON}>
                  <Layer {...VEHICLE_CIRCLES} />
                </Source>
              )}

              {/* ------------------------------------------------------ */}
              {/* Airspace Flights Icons (Viewport Culled)               */}
              {/* ------------------------------------------------------ */}

              {activeShowFlights &&
                visibleFlights.map((f) => (
                  <FlightMarkerItem
                    key={`flight-${f.id}`}
                    flight={f}
                    isSelected={selectedFlight?.id === f.id}
                    onSelect={handleFlightSelect}
                  />
                ))}

              {/* ------------------------------------------------------ */}
              {/* Maritime AIS Vessels Icons (Viewport Culled)          */}
              {/* ------------------------------------------------------ */}

              {activeShowVehicles &&
                visibleVessels.map((v) => (
                  <VesselMarkerItem
                    key={`vessel-${v.mmsi}`}
                    vessel={v}
                    isSelected={selectedVessel?.mmsi === v.mmsi}
                    onSelect={handleVesselSelect}
                  />
                ))}

              {/* ------------------------------------------------------ */}
              {/* Real-time Tallinn Public Transport Vehicles            */}
              {/* ------------------------------------------------------ */}
              {showPublicTransport &&
                publicTransportMode === "realtime" &&
                publicTransportVehicles.map((v) => (
                  <Marker
                    key={`tallinn-bus-${v.id}`}
                    latitude={v.lat}
                    longitude={v.lon}
                    anchor="center"
                  >
                    <TallinnBusMarker
                      vehicle={v}
                      zoom={viewState.zoom}
                      isSelected={selectedPublicTransport?.id === v.id}
                      onClick={(veh) => {
                        setSelectedIncident(null);
                        setSelectedFlight(null);
                        setSelectedVessel(null);
                        setSelectedVehicle(null);
                        setSelectedEmergencyService(null);
                        setSelectedTransportHub(null);
                        setSelectedPublicTransport(veh);
                      }}
                    />
                  </Marker>
                ))}

              {/* Tallinn Bus Popup */}
              {showPublicTransport && selectedPublicTransport && (
                <Popup
                  latitude={selectedPublicTransport.lat}
                  longitude={selectedPublicTransport.lon}
                  anchor="top"
                  offset={16}
                  closeButton={false}
                  closeOnClick={false}
                  onClose={() => setSelectedPublicTransport(null)}
                >
                  <TallinnBusPopup
                    vehicle={selectedPublicTransport}
                    onClose={() => setSelectedPublicTransport(null)}
                  />
                </Popup>
              )}

              {/* ------------------------------------------------------ */}
              {/* AIS Vessel Popup                                       */}
              {/* ------------------------------------------------------ */}

              {(() => {
                const activeVessel = selectedVessel
                  ? vessels.find((v) => v.mmsi === selectedVessel.mmsi) || selectedVessel
                  : null;
                if (!activeVessel) return null;

                return (
                  <Popup
                    latitude={activeVessel.lat}
                    longitude={activeVessel.lng}
                    anchor="left"
                    offset={24}
                    maxWidth="300px"
                    closeButton={false}
                    closeOnClick={false}
                    onClose={() => setSelectedVessel(null)}
                  >
                    <div className="bg-popover text-popover-foreground p-3.5 rounded-xl border border-border shadow-2xl w-[300px] max-w-[300px] max-h-[420px] flex flex-col animate-in fade-in-50 zoom-in-95 overflow-hidden box-border">
                      <div className="flex justify-between items-start gap-2 shrink-0 pb-2 border-b border-border/60">
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex gap-1.5 items-center flex-wrap min-w-0">
                            <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 uppercase font-semibold text-[10px] tracking-wider flex items-center shrink-0">
                              <span className="inline-flex rounded-full h-2 w-2 bg-cyan-500 mr-1.5 shrink-0" />
                              <Anchor className="w-3 h-3 mr-1 inline" />
                              {activeVessel.shipCategory}
                            </Badge>

                            <span className="font-mono text-[11px] font-semibold text-muted-foreground shrink-0">
                              MMSI: {activeVessel.mmsi}
                            </span>
                          </div>

                          <h4 className="font-bold text-xs text-foreground leading-snug pt-0.5 break-words">
                            {activeVessel.name}
                          </h4>
                        </div>

                        <button
                          onClick={() => setSelectedVessel(null)}
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent flex items-center justify-center transition-colors shrink-0 -mr-1 -mt-1"
                          aria-label="Close popup"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="overflow-y-auto pr-1 flex-1 space-y-2 mt-2 font-mono text-xs">
                        <div className="text-xs font-mono text-cyan-300 bg-cyan-950/40 p-2 rounded border border-cyan-800/40 space-y-1">
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-muted-foreground">Live Coords:</span>
                            <span className="text-foreground font-semibold">
                              {activeVessel.lat.toFixed(5)}, {activeVessel.lng.toFixed(5)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-muted-foreground">Speed & Heading:</span>
                            <span className="text-foreground font-semibold">
                              {activeVessel.sog} kts ({Math.round(activeVessel.sog * 1.852)} km/h) · {activeVessel.heading}°
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-muted-foreground">Destination:</span>
                            <span className="text-cyan-200 font-semibold truncate max-w-[130px]">
                              {activeVessel.destination}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border/80 font-mono text-[10px] font-semibold text-muted-foreground flex justify-between items-center">
                          <span>
                            CALLSIGN:{" "}
                            <strong className="text-foreground font-bold uppercase">
                              {activeVessel.callSign || "N/A"}
                            </strong>
                          </span>

                          <span className="flex items-center text-[9px] text-cyan-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-1"></span>
                            AIS REAL-TIME
                          </span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                );
              })()}

              {/* ------------------------------------------------------ */}
              {/* Airspace Flight Popup                                  */}
              {/* ------------------------------------------------------ */}

              {(() => {
                const activeFlight = selectedFlight
                  ? flights.find((f) => f.id === selectedFlight.id) || selectedFlight
                  : null;
                if (!activeFlight) return null;

                return (
                  <Popup
                    latitude={activeFlight.lat}
                    longitude={activeFlight.lng}
                    anchor="left"
                    offset={24}
                    maxWidth="300px"
                    closeButton={false}
                    closeOnClick={false}
                    onClose={() => setSelectedFlight(null)}
                  >
                    <div className="bg-popover text-popover-foreground p-3.5 rounded-xl border border-border shadow-2xl w-[300px] max-w-[300px] max-h-[420px] flex flex-col animate-in fade-in-50 zoom-in-95 overflow-hidden box-border">
                      <div className="flex justify-between items-start gap-2 shrink-0 pb-2 border-b border-border/60">
                        <div className="space-y-0.5 min-w-0 flex-1">
                          <div className="flex gap-1.5 items-center flex-wrap min-w-0">
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50 uppercase font-semibold text-[10px] tracking-wider flex items-center shrink-0">
                              <span className="inline-flex rounded-full h-2 w-2 bg-amber-500 mr-1.5 shrink-0" />
                              <Plane className="w-3 h-3 mr-1 inline" />
                              {activeFlight.callsign.includes("HELI") || activeFlight.altitude < 300
                                ? "Helicopter"
                                : activeFlight.callsign.includes("MIL")
                                ? "Military"
                                : "Commercial"}
                            </Badge>

                            <span className="font-mono text-[11px] font-semibold text-muted-foreground shrink-0">
                              {activeFlight.country}
                            </span>
                          </div>

                          <h4 className="font-bold text-xs text-foreground leading-snug pt-0.5 font-mono break-words">
                            {activeFlight.callsign || activeFlight.id}
                          </h4>
                        </div>

                        <button
                          onClick={() => setSelectedFlight(null)}
                          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent flex items-center justify-center transition-colors shrink-0 -mr-1 -mt-1"
                          aria-label="Close popup"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="overflow-y-auto pr-1 flex-1 space-y-2 mt-2 text-xs font-mono">
                        <div className="text-xs font-mono text-amber-300 bg-amber-950/40 p-2 rounded-lg border border-amber-800/40 space-y-1">
                          {activeFlight.originAirport && (
                            <div className="flex justify-between items-center text-[10px] pb-1 border-b border-amber-800/30">
                              <span className="text-muted-foreground">Origin Airport:</span>
                              <span className="text-amber-300 font-bold">
                                🛫 {activeFlight.originAirport}
                              </span>
                            </div>
                          )}
                          {activeFlight.destinationAirport && (
                            <div className="flex justify-between items-center text-[10px] pb-1 border-b border-amber-800/30">
                              <span className="text-muted-foreground">Destination:</span>
                              <span className="text-cyan-300 font-bold">
                                🛬 {activeFlight.destinationAirport}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-muted-foreground">Aircraft Model:</span>
                            <span className="text-foreground font-semibold truncate max-w-[130px]">
                              {activeFlight.aircraftType || "Aircraft"}{activeFlight.squawk ? ` (${activeFlight.squawk})` : ""}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-muted-foreground">Live Altitude:</span>
                            <span className="text-foreground font-semibold">
                              {Math.round(activeFlight.altitude)} m ({Math.round(activeFlight.altitude * 3.28084)} ft)
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-muted-foreground">Speed & Bearing:</span>
                            <span className="text-foreground font-semibold">
                              {Math.round(activeFlight.velocity * 3.6)} km/h · {activeFlight.heading}°
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="text-muted-foreground">Vertical Speed:</span>
                            <span className="text-amber-200 font-semibold">
                              {activeFlight.verticalRate > 0 ? `+${activeFlight.verticalRate} m/s ↗` : activeFlight.verticalRate < 0 ? `${activeFlight.verticalRate} m/s ↘` : "0 m/s →"}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-border/80 font-mono text-[10px] font-semibold text-muted-foreground flex justify-between items-center">
                          <span>
                            ICAO24:{" "}
                            <strong className="text-foreground font-bold uppercase">
                              {activeFlight.id}
                            </strong>
                          </span>

                          <span className="flex items-center text-[9px] text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1"></span>
                            ADS-B REAL-TIME
                          </span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                );
              })()}

              {/* ------------------------------------------------------ */}
              {/* Vehicle Popup                                          */}
              {/* ------------------------------------------------------ */}

              {selectedVehicle && (
                <Popup
                  latitude={selectedVehicle.lat}
                  longitude={selectedVehicle.lng}
                  anchor="left"
                  offset={24}
                  maxWidth="300px"
                  closeButton={false}
                  closeOnClick={false}
                  onClose={() => setSelectedVehicle(null)}
                >
                  <div className="bg-popover text-popover-foreground p-3.5 rounded-xl border border-border shadow-2xl w-[300px] max-w-[300px] max-h-[420px] flex flex-col animate-in fade-in-50 zoom-in-95 overflow-hidden box-border">
                    <div className="flex justify-between items-start gap-2 shrink-0 pb-2 border-b border-border/60">
                      <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex gap-1.5 items-center flex-wrap min-w-0">
                          <Badge
                            className={`uppercase font-semibold text-[10px] tracking-wider shrink-0 ${selectedVehicle.type ===
                                "ambulance"
                                ? "bg-sky-500/20 text-sky-400 border-sky-500/50"
                                : selectedVehicle.type ===
                                  "police"
                                  ? "bg-blue-500/20 text-blue-400 border-blue-500/50"
                                  : selectedVehicle.type ===
                                    "fire_engine"
                                    ? "bg-orange-500/20 text-orange-400 border-orange-500/50"
                                    : selectedVehicle.type ===
                                      "yacht"
                                      ? "bg-cyan-500/20 text-cyan-400 border-cyan-500/50"
                                      : selectedVehicle.type ===
                                        "bus"
                                        ? "bg-amber-500/20 text-amber-400 border-amber-500/50"
                                        : "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                              }`}
                          >
                            {selectedVehicle.type ===
                              "ambulance" ? (
                              <Siren className="w-3 h-3 mr-1 inline" />
                            ) : selectedVehicle.type ===
                              "police" ? (
                              <Siren className="w-3 h-3 mr-1 inline" />
                            ) : selectedVehicle.type ===
                              "fire_engine" ? (
                              <Siren className="w-3 h-3 mr-1 inline" />
                            ) : selectedVehicle.type ===
                              "yacht" ? (
                              <Anchor className="w-3 h-3 mr-1 inline" />
                            ) : selectedVehicle.type ===
                              "bus" ? (
                              <Bus className="w-3 h-3 mr-1 inline" />
                            ) : (
                              <Car className="w-3 h-3 mr-1 inline" />
                            )}

                            {selectedVehicle.type.replace(
                              "_",
                              " ",
                            )}
                          </Badge>

                          <span className="font-mono text-[11px] font-semibold text-muted-foreground shrink-0">
                            {selectedVehicle.speed} km/h
                          </span>
                        </div>

                        <h4 className="font-bold text-xs text-foreground leading-snug pt-0.5 break-words">
                          {selectedVehicle.name}
                        </h4>
                      </div>

                      <button
                        onClick={() => setSelectedVehicle(null)}
                        className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent flex items-center justify-center transition-colors shrink-0 -mr-1 -mt-1"
                        aria-label="Close popup"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="overflow-y-auto pr-1 flex-1 space-y-2 mt-2 text-xs">
                      <p className="text-xs font-medium leading-relaxed text-foreground/90 break-words">
                        Heading {selectedVehicle.heading}° toward {selectedVehicle.destination}. Currently {selectedVehicle.status.replace("_", " ")}.
                      </p>

                      <div className="pt-2 border-t border-border/80 font-mono text-[10px] font-semibold text-muted-foreground flex justify-between items-center">
                        <span>
                          UNIT: <strong className="text-foreground font-bold">{selectedVehicle.id}</strong>
                        </span>

                        <span>
                          STATUS: <strong className="text-foreground font-bold uppercase">{selectedVehicle.status}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              )}

              {/* ------------------------------------------------------ */}
              {/* Emergency Service Popup                                */}
              {/* ------------------------------------------------------ */}

              {selectedEmergencyService && (
                <Popup
                  latitude={selectedEmergencyService.lat}
                  longitude={selectedEmergencyService.lng}
                  anchor="left"
                  offset={24}
                  maxWidth="300px"
                  closeButton={false}
                  closeOnClick={false}
                  onClose={() => setSelectedEmergencyService(null)}
                  style={{ zIndex: 9999999 }}
                >
                  <EmergencyServicePopup
                    service={selectedEmergencyService}
                    onClose={() => setSelectedEmergencyService(null)}
                    onCenter={() => {
                      mapRef.current?.flyTo({
                        center: [
                          selectedEmergencyService.lng,
                          selectedEmergencyService.lat,
                        ],
                        zoom: 15.5,
                        duration: 1000,
                      });
                    }}
                  />
                </Popup>
              )}

              {selectedTransportHub && (
                <Popup
                  latitude={selectedTransportHub.lat}
                  longitude={selectedTransportHub.lng}
                  anchor="left"
                  offset={24}
                  maxWidth="300px"
                  closeButton={false}
                  closeOnClick={false}
                  onClose={() => setSelectedTransportHub(null)}
                  style={{ zIndex: 9999999 }}
                >
                  <TransportHubPopup
                    hub={selectedTransportHub}
                    onClose={() => setSelectedTransportHub(null)}
                    onRecenter={(lat, lng) => {
                      mapRef.current?.flyTo({
                        center: [lng, lat],
                        zoom: 15.5,
                        duration: 1000,
                      });
                    }}
                  />
                </Popup>
              )}
            </Map>
          ) : null}
        </div>

        {/* Right-side Area Infrastructure Panel Card */}
        {showClusterSidePanel && selectedInfrastructureCluster && (
          <AreaInfrastructurePanel
            cluster={selectedInfrastructureCluster}
            onClose={() => setShowClusterSidePanel(false)}
            onViewMoreHub={(hub) => {
              setSelectedEmergencyService(null);
              setSelectedTransportHub(hub);
              flyTo(hub.lat, hub.lng, 14.5);
            }}
            onViewMoreService={(service) => {
              setSelectedTransportHub(null);
              setSelectedEmergencyService(service);
              flyTo(service.lat, service.lng, 14.5);
            }}
            onViewFullAreaModal={() => {
              setShowFullClusterModal(true);
            }}
            rightOffset={rightOffset}
            isDragging={isCopilotDragging}
          />
        )}
      </div>

      {/* Area Infrastructure Modal */}
      {showFullClusterModal && selectedInfrastructureCluster && (
        <AreaInfrastructureModal
          cluster={selectedInfrastructureCluster}
          onClose={() => setShowFullClusterModal(false)}
          onSelectHub={(hub) => {
            setSelectedEmergencyService(null);
            setSelectedTransportHub(hub);
            flyTo(hub.lat, hub.lng, 14);
          }}
          onSelectService={(service) => {
            setSelectedTransportHub(null);
            setSelectedEmergencyService(service);
            flyTo(service.lat, service.lng, 14);
          }}
        />
      )}
    </div>
  );
}
