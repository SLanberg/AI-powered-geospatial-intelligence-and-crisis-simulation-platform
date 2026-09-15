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

import { Car, Siren, Bus, MapPin, Target, Anchor, X, Plane } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import type { FlightVector } from "@/app/api/flights/route";
import type { VesselData } from "@/app/api/vessels/route";

import {
  ROAD_CORRIDORS,
  tickTrafficEngine,
  type Vehicle,
  type TrafficSegment,
} from "@/lib/trafficEngine";

import { MapToolbar } from "./map/MapToolbar";
import { MapIncidentPopup } from "./map/MapIncidentPopup";
import { useMapInteractions } from "./map/useMapInteractions";
import { MapObjectVector } from "./map/MapObjectVector";
import { clusterEmergencyServices } from "./map/useDecluttering";
import { MakiIcon, getMakiIconNameForIncident } from "./map/MakiIcon";
import { TelemetryFeed } from "./map/TelemetryFeed";

import {
  MOCK_INCIDENTS,
  type Incident,
  type MapAction,
} from "./data";

import { AppleMapsMarker } from "./map/AppleMapsMarker";
import { EmergencyServiceClusterMarker } from "./map/EmergencyServiceClusterMarker";
import { EmergencyServicePopup } from "./map/EmergencyServicePopup";

import {
  TALLINN_EMERGENCY_SERVICES,
  type EmergencyService,
} from "./emergencyServicesData";

import { TransportHubMarker } from "./map/TransportHubMarker";
import { TransportHubPopup } from "./map/TransportHubPopup";
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

  showTelemetryFeed?: boolean;

  onCloseTelemetryFeed?: () => void;

  mapAction?: MapAction | null;

  onClearMapAction?: () => void;
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
        className="relative group cursor-pointer transition-transform hover:scale-110 hover:z-40 will-change-transform"
        onClick={handleClick}
      >
        {isSelected && (
          <span className="absolute -inset-1.5 rounded-full bg-amber-400/40 animate-ping pointer-events-none" />
        )}
        <MapObjectVector
          domain="air"
          type={airType}
          heading={flight.heading}
          status="normal"
          size={30}
          isSelected={isSelected}
        />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap bg-slate-900 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-semibold px-2 py-0.5 rounded shadow-lg">
          {flight.callsign || flight.id} ({Math.round(flight.altitude)}m)
        </div>
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
        className="relative group cursor-pointer transition-transform hover:scale-110 hover:z-40 will-change-transform"
        onClick={handleClick}
      >
        {isSelected && (
          <span className="absolute -inset-1.5 rounded-full bg-cyan-400/40 animate-ping pointer-events-none" />
        )}
        <MapObjectVector
          domain="maritime"
          type={vessel.shipCategory}
          heading={vessel.heading}
          status="normal"
          size={30}
          isSelected={isSelected}
        />
        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 whitespace-nowrap bg-slate-900 text-cyan-300 border border-cyan-500/40 text-[10px] font-mono font-semibold px-2 py-0.5 rounded shadow-lg">
          {vessel.name || `MMSI ${vessel.mmsi}`} ({vessel.sog} kts)
        </div>
      </div>
    </Marker>
  );
});

export function MapContainer({
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
  showTelemetryFeed = true,
  onCloseTelemetryFeed,
  mapAction,
  onClearMapAction,
}: MapContainerProps) {
  const mapRef = useRef<MapRef | null>(null);

  const [mapTheme, setMapTheme] =
    useState<MapTheme>("dark");

  const [is3D, setIs3D] =
    useState(false);

  const [internalShowHeatmap, setInternalShowHeatmap] = useState(false);
  const activeShowHeatmap = showHeatmap ?? internalShowHeatmap;
  const activeSetShowHeatmap = setShowHeatmap ?? setInternalShowHeatmap;

  const [incidentList, setIncidentList] = useState<Incident[]>(MOCK_INCIDENTS);

  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Incident[]>;
      if (customEvent.detail) {
        setIncidentList([...customEvent.detail]);
      }
    };
    window.addEventListener("scada-incidents-updated", handleUpdate);
    return () => window.removeEventListener("scada-incidents-updated", handleUpdate);
  }, []);

  const isClient = useIsClient();

  const [isMapReady, setIsMapReady] =
    useState(false);

  /*
   * This is intentionally preserved.
   *
   * It is emergency-service declustering, not incident clustering.
   */
  const [
    emergencyServiceClusters,
    setEmergencyServiceClusters,
  ] = useState<
    ReturnType<typeof clusterEmergencyServices>
  >([]);

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
  /* Fetch OpenSky flights                                                  */
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
          Array.isArray(data.flights)
        ) {
          setFlights(data.flights);
        }
      } catch (_err) {
        // silent fallback
      }
    };

    fetchFlights();

    const interval = setInterval(
      fetchFlights,
      10000,
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
      15000,
    );

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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
    const moveInterval = setInterval(() => {
      // 1. Advance flights based on heading and velocity (m/s)
      setFlights((prevFlights) => {
        if (!prevFlights || prevFlights.length === 0) return prevFlights;
        return prevFlights.map((f) => {
          if (!f.velocity || f.velocity <= 0 || f.isGround) return f;
          const headingRad = (f.heading * Math.PI) / 180;
          const distMeters = f.velocity * 1.0; // 1s step
          const dLat = (distMeters * Math.cos(headingRad)) / 111320;
          const dLng = (distMeters * Math.sin(headingRad)) / (111320 * Math.cos((f.lat * Math.PI) / 180));
          return {
            ...f,
            lat: f.lat + dLat,
            lng: f.lng + dLng,
          };
        });
      });

      // 2. Advance vessels based on heading/cog and sog (knots)
      setVessels((prevVessels) => {
        if (!prevVessels || prevVessels.length === 0) return prevVessels;
        return prevVessels.map((v) => {
          if (!v.sog || v.sog <= 0) return v;
          const speedMs = v.sog * 0.514444; // knots to m/s
          const headingToUse = (v.heading && v.heading !== 511) ? v.heading : (v.cog || 0);
          const headingRad = (headingToUse * Math.PI) / 180;
          const distMeters = speedMs * 1.0; // 1s step
          const dLat = (distMeters * Math.cos(headingRad)) / 111320;
          const dLng = (distMeters * Math.sin(headingRad)) / (111320 * Math.cos((v.lat * Math.PI) / 180));
          return {
            ...v,
            lat: v.lat + dLat,
            lng: v.lng + dLng,
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

  /* Emergency-service declustering updates as the map zoom changes. */
  useEffect(() => {
    if (!isMapReady) return;

    setEmergencyServiceClusters(
      clusterEmergencyServices(
        TALLINN_EMERGENCY_SERVICES,
        mapRef.current,
        viewState.zoom,
      ),
    );
  }, [
    isMapReady,
    viewState.zoom,
  ]);

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
      MOCK_INCIDENTS.map(
        (incident) => [
          incident.id,
          incident,
        ],
      ),
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
    }
  }, [mapAction, flyTo]);

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

          return;
        }
      }

      baseHandleMapClick(event);
    },
    [
      baseHandleMapClick,
      flights,
      vessels,
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
    <div className="w-full h-full flex flex-col flex-1 select-none">
      {/* ---------------------------------------------------------------- */}
      {/* Map                                                               */}
      {/* ---------------------------------------------------------------- */}

      <div className="relative w-full h-full flex-1 min-h-[580px]">
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
          incidentCount={MOCK_INCIDENTS.length}
        />

        {mapAction && (
          <div className="absolute top-4 left-16 z-40 bg-[#121820]/95 border border-red-500/60 rounded-xl px-4 py-2.5 text-white shadow-2xl backdrop-blur-md flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center justify-center shrink-0">
                <Target className="w-4 h-4 text-red-400 animate-pulse" />
              </div>
              <div>
                <div className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                  AI MAP ACTION ACTIVE
                </div>
                <div className="text-xs font-semibold text-slate-100 font-mono">
                  {mapAction.title || "Incident Concentration Hotspots Highlighted"}
                </div>
              </div>
            </div>
            {onClearMapAction && (
              <button
                type="button"
                onClick={onClearMapAction}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-mono font-medium rounded-lg text-slate-200 transition-colors shrink-0"
              >
                Clear Overlay
              </button>
            )}
          </div>
        )}

        <div className="absolute inset-0 overflow-hidden rounded-xl border border-border bg-background">
          {isClient ? (
            <Map
              ref={mapRef}
              reuseMaps={true}
              mapLib={maplibregl}
              initialViewState={
                viewState
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
              onLoad={() =>
                setIsMapReady(true)
              }
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
                  ? ["vessel-circles"]
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
                  {filteredIncidents.map((inc) => {
                    const isCritical = inc.severity === "critical";
                    const isWarning = inc.severity === "warning";
                    const isSelected = selectedIncident?.id === inc.id;
                    const makiIconName = getMakiIconNameForIncident(inc);

                    // Minimal tactical color palette
                    const dotBg = isCritical
                      ? "bg-red-600 border-white text-white"
                      : isWarning
                      ? "bg-amber-500 border-white text-slate-950"
                      : "bg-emerald-500 border-white text-slate-950";

                    return (
                      <Marker
                        key={`incident-maki-marker-${inc.id}`}
                        latitude={inc.lat}
                        longitude={inc.lng}
                        anchor="center"
                        onClick={(e) => {
                          e.originalEvent.stopPropagation();
                          setSelectedIncident(inc);
                        }}
                      >
                        <div
                          className={`relative cursor-pointer group flex flex-col items-center select-none ${
                            isSelected ? "z-50" : "z-30"
                          }`}
                        >
                          {/* Minimal Tactical Dot Container */}
                          <div
                            className={`
                              flex
                              items-center
                              justify-center
                              h-6
                              w-6
                              rounded-full
                              border
                              shadow-sm
                              transition-transform
                              group-hover:scale-110
                              ${dotBg}
                              ${isSelected ? "ring-2 ring-white ring-offset-1 ring-offset-slate-950 scale-110" : ""}
                            `}
                          >
                            <MakiIcon name={makiIconName} size={13} />
                          </div>

                          {/* Minimal Tactical Node ID Label */}
                          <div
                            className={`
                              mt-0.5
                              whitespace-nowrap
                              rounded
                              bg-slate-900/90
                              border
                              border-slate-700/60
                              px-1
                              py-0.2
                              font-mono
                              text-[9px]
                              font-medium
                              text-slate-200
                              shadow-sm
                              ${isSelected ? "border-white/60 text-white font-bold" : ""}
                            `}
                          >
                            {inc.nodeId}
                          </div>
                        </div>
                      </Marker>
                    );
                  })}

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
              {/* Heatmap Layer                                          */}
              {/* ------------------------------------------------------ */}
              {activeShowHeatmap && (
                <Source
                  id="incidents-heatmap"
                  type="geojson"
                  data={incidentHeatmapGeoJSON}
                >
                  <Layer {...INCIDENT_HEATMAP} />
                </Source>
              )}

              {/* ------------------------------------------------------ */}
              {/* AI Map Action Highlight District Overlay Rings         */}
              {/* ------------------------------------------------------ */}
              {mapAction?.highlightedDistricts && mapAction.highlightedDistricts.length > 0 && (
                <>
                  {mapAction.highlightedDistricts.map((dist, idx) => {
                    const isTarget = dist.id === mapAction.targetDistrictId;
                    const ringColor = dist.severity === "critical"
                      ? "rgba(239, 68, 68, 0.45)"
                      : dist.severity === "warning"
                      ? "rgba(245, 158, 11, 0.45)"
                      : "rgba(14, 165, 233, 0.45)";

                    const borderColor = dist.severity === "critical"
                      ? "#ef4444"
                      : dist.severity === "warning"
                      ? "#f59e0b"
                      : "#0ea5e9";

                    return (
                      <Marker
                        key={`mapaction-region-${dist.id}-${idx}`}
                        latitude={dist.lat}
                        longitude={dist.lng}
                        anchor="center"
                      >
                        <div className="relative flex items-center justify-center pointer-events-none">
                          {/* Outer animated heat pulsing halo */}
                          <div
                            className="absolute rounded-full animate-ping opacity-75"
                            style={{
                              width: isTarget ? "160px" : "110px",
                              height: isTarget ? "160px" : "110px",
                              backgroundColor: ringColor,
                            }}
                          />
                          {/* Smooth gradient heat circle */}
                          <div
                            className="relative rounded-full backdrop-blur-[2px] border-2 shadow-2xl flex flex-col items-center justify-center transition-all"
                            style={{
                              width: isTarget ? "140px" : "95px",
                              height: isTarget ? "140px" : "95px",
                              background: `radial-gradient(circle, ${ringColor} 0%, rgba(15, 23, 42, 0.65) 100%)`,
                              borderColor: borderColor,
                            }}
                          >
                            <span className="font-mono text-[10px] font-extrabold uppercase tracking-wider text-white px-2 py-0.5 rounded bg-slate-950/80 border border-white/20 shadow-md">
                              {dist.name}
                            </span>
                            <span className="font-mono text-[9px] font-bold text-amber-300 mt-1 bg-slate-900/90 px-1.5 py-0.2 rounded">
                              {dist.count} {dist.count === 1 ? "Incident" : "Incidents"}
                            </span>
                          </div>
                        </div>
                      </Marker>
                    );
                  })}
                </>
              )}

              {/* ------------------------------------------------------ */}
              {/* Incident popup                                          */}
              {/* ------------------------------------------------------ */}

              {selectedIncident && (
                <Popup
                  latitude={
                    selectedIncident.lat
                  }
                  longitude={
                    selectedIncident.lng
                  }
                  anchor="left"
                  offset={36}
                  closeButton={false}
                  closeOnClick={false}
                  onClose={() =>
                    setSelectedIncident(
                      null,
                    )
                  }
                >
                  <MapIncidentPopup
                    selectedIncident={
                      selectedIncident
                    }
                    setSelectedIncident={
                      setSelectedIncident
                    }
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
                      <div className="flex items-center gap-1.5 bg-slate-950/90 text-sky-300 border border-sky-400/80 px-2.5 py-1 rounded-md text-[10px] font-mono font-semibold shadow-lg shadow-sky-500/30 whitespace-nowrap animate-bounce">
                        <Target className="w-3.5 h-3.5 text-sky-400 animate-spin" />

                        <span>
                          DESTINATION:{" "}
                          {
                            selectedVehicle.destination
                          }
                        </span>
                      </div>

                      <div className="relative flex items-center justify-center mt-1">
                        <span className="absolute inline-flex h-6 w-6 rounded-full bg-sky-500/40 animate-ping" />

                        <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-white border-2 border-background shadow-md">
                          <MapPin className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                    </div>
                  </Marker>
                )}

              {/* ------------------------------------------------------ */}
              {/* Live vehicle markers                                   */}
              {/* ------------------------------------------------------ */}

              {activeShowVehicles &&
                vehicles.map((v) => {
                  const isSelected =
                    selectedVehicle?.id ===
                    v.id;

                  return (
                    <Marker
                      key={`vehicle-${v.id}`}
                      latitude={v.lat}
                      longitude={v.lng}
                      anchor="center"
                      onClick={(e) => {
                        e.originalEvent.stopPropagation();

                        setSelectedVehicle(
                          v,
                        );
                      }}
                    >
                      <div
                        className={`relative cursor-pointer group flex items-center justify-center transition-transform hover:scale-125 p-1 ${isSelected
                            ? "ring-2 ring-sky-400 rounded-full scale-110"
                            : ""
                          }`}
                        title={`${v.name} (${v.speed} km/h) - ${v.destination}`}
                      >
                        {v.type ===
                          "ambulance" ? (
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-rose-600 border-2 border-white shadow-md shadow-rose-500/50">
                            <Siren className="w-4 h-4 text-white animate-pulse" />
                          </div>
                        ) : v.type ===
                          "police" ? (
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-md shadow-blue-500/50">
                            <Siren className="w-3.5 h-3.5 text-white" />
                          </div>
                        ) : v.type ===
                          "fire_engine" ? (
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-600 border-2 border-white shadow-md shadow-orange-500/50">
                            <Siren className="w-4 h-4 text-white animate-bounce" />
                          </div>
                        ) : v.type ===
                          "bus" ? (
                          <div className="flex items-center justify-center w-6 h-6 rounded-md bg-amber-600 border border-white shadow-sm">
                            <Bus className="w-3.5 h-3.5 text-white" />
                          </div>
                        ) : v.type ===
                          "yacht" ? (
                          <div
                            className="flex items-center justify-center w-7 h-7 rounded-full bg-cyan-600 border-2 border-white shadow-md shadow-cyan-500/60 ring-2 ring-cyan-400/40"
                            style={{
                              transform: `rotate(${v.heading}deg)`,
                            }}
                          >
                            <Anchor className="w-4 h-4 text-white" />
                          </div>
                        ) : (
                          /* Civilian cars showing traffic congestion */
                          <div
                            className={`flex items-center justify-center rounded-full border border-white shadow-sm transition-all ${v.status ===
                                "delayed"
                                ? "w-6 h-6 bg-amber-500 ring-2 ring-rose-500/80 animate-pulse"
                                : "w-5 h-5 bg-emerald-600"
                              }`}
                            style={{
                              transform: `rotate(${v.heading}deg)`,
                            }}
                          >
                            <Car className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    </Marker>
                  );
                })}

              {/* ------------------------------------------------------ */}
              {/* Emergency services                                     */}
              {/* ------------------------------------------------------ */}

              {showEmergencyServices &&
                emergencyServiceClusters.map(
                  (cluster) =>
                    cluster.services.length >
                      1 ? (
                      <Marker
                        key={cluster.id}
                        latitude={
                          cluster.lat
                        }
                        longitude={
                          cluster.lng
                        }
                        anchor="center"
                      >
                        <EmergencyServiceClusterMarker
                          services={
                            cluster.services
                          }
                          onClick={() => {
                            setSelectedEmergencyService(
                              null,
                            );

                            flyTo(
                              cluster.lat,
                              cluster.lng,
                              Math.max(
                                14.5,
                                viewState.zoom +
                                1.75,
                              ),
                            );
                          }}
                        />
                      </Marker>
                    ) : (
                      <Marker
                        key={cluster.id}
                        latitude={
                          cluster.lat
                        }
                        longitude={
                          cluster.lng
                        }
                        anchor="bottom"
                      >
                        <AppleMapsMarker
                          service={
                            cluster.services[0]
                          }
                          isSelected={
                            selectedEmergencyService?.id ===
                            cluster
                              .services[0]
                              .id
                          }
                          onClick={
                            handleEmergencyServiceClick
                          }
                          showLabel={
                            selectedEmergencyService?.id ===
                            cluster
                              .services[0]
                              .id ||
                            viewState.zoom >=
                            14.25
                          }
                        />
                      </Marker>
                    ),
                )}

              {/* ------------------------------------------------------ */}
              {/* Transport Hubs (Airports, Railway Stations, Ports)     */}
              {/* ------------------------------------------------------ */}

              {showTransportHubs &&
                TALLINN_TRANSPORT_HUBS.map((hub) => (
                  <Marker
                    key={hub.id}
                    latitude={hub.lat}
                    longitude={hub.lng}
                    anchor="bottom"
                  >
                    <TransportHubMarker
                      hub={hub}
                      isSelected={selectedTransportHub?.id === hub.id}
                      onClick={handleTransportHubClick}
                      showLabel={
                        selectedTransportHub?.id === hub.id ||
                        viewState.zoom >= 11.2
                      }
                    />
                  </Marker>
                ))}

              {/* ------------------------------------------------------ */}
              {/* WebGL background layers for Flights & Vessels          */}
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
              {/* AIS Vessel Popup                                       */}
              {/* ------------------------------------------------------ */}

              {selectedVessel && (
                <Popup
                  latitude={
                    selectedVessel.lat
                  }
                  longitude={
                    selectedVessel.lng
                  }
                  anchor="left"
                  offset={36}
                  closeButton={false}
                  closeOnClick={false}
                  onClose={() =>
                    setSelectedVessel(
                      null,
                    )
                  }
                >
                  <div className="bg-popover text-popover-foreground p-4 rounded-xl border border-border shadow-2xl max-w-xs min-w-[260px] animate-in fade-in-50 zoom-in-95">
                    <div className="flex justify-between items-start gap-3">
                      <div className="space-y-1">
                        <div className="flex gap-2 items-center">
                          <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50 uppercase font-semibold text-[10px] tracking-wider">
                            <Anchor className="w-3 h-3 mr-1 inline" />

                            {
                              selectedVessel.shipCategory
                            }
                          </Badge>

                          <span className="font-mono text-xs font-semibold text-muted-foreground">
                            MMSI:{" "}
                            {
                              selectedVessel.mmsi
                            }
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-foreground leading-tight pt-1">
                          {
                            selectedVessel.name
                          }
                        </h4>
                      </div>

                      <button
                        onClick={() =>
                          setSelectedVessel(
                            null,
                          )
                        }
                        className="h-11 w-11 p-3 -mr-2 -mt-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
                        aria-label="Close popup"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="text-xs font-medium mt-2 leading-relaxed text-foreground/90">
                      Speed{" "}
                      {selectedVessel.sog}{" "}
                      kts (
                      {Math.round(
                        selectedVessel.sog *
                        1.852,
                      )}{" "}
                      km/h) · Heading{" "}
                      {
                        selectedVessel.heading
                      }
                      °
                    </p>

                    <div className="mt-2 text-xs font-mono text-cyan-300 bg-cyan-950/40 p-2 rounded border border-cyan-800/40">
                      Destination:{" "}
                      <span className="text-foreground font-semibold">
                        {
                          selectedVessel.destination
                        }
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-border/80 font-mono text-[11px] font-semibold text-muted-foreground flex justify-between items-center">
                      <span>
                        CALLSIGN:{" "}
                        <strong className="text-foreground font-bold uppercase">
                          {
                            selectedVessel.callSign ||
                            "N/A"
                          }
                        </strong>
                      </span>

                      <span>
                        TYPE CODE:{" "}
                        <strong className="text-foreground font-bold uppercase">
                          {
                            selectedVessel.shipType ||
                            "AIS"
                          }
                        </strong>
                      </span>
                    </div>
                  </div>
                </Popup>
              )}

              {/* ------------------------------------------------------ */}
              {/* Airspace Flight Popup                                  */}
              {/* ------------------------------------------------------ */}

              {selectedFlight && (
                <Popup
                  latitude={selectedFlight.lat}
                  longitude={selectedFlight.lng}
                  anchor="left"
                  offset={36}
                  closeButton={false}
                  closeOnClick={false}
                  onClose={() => setSelectedFlight(null)}
                >
                  <div className="bg-popover text-popover-foreground p-4 rounded-xl border border-border shadow-2xl max-w-xs min-w-[260px] animate-in fade-in-50 zoom-in-95">
                    <div className="flex justify-between items-start gap-3">
                      <div className="space-y-1">
                        <div className="flex gap-2 items-center">
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/50 uppercase font-semibold text-[10px] tracking-wider">
                            <Plane className="w-3 h-3 mr-1 inline" />
                            {selectedFlight.callsign.includes("HELI") || selectedFlight.altitude < 300
                              ? "Helicopter"
                              : selectedFlight.callsign.includes("MIL")
                              ? "Military"
                              : "Commercial"}
                          </Badge>

                          <span className="font-mono text-xs font-semibold text-muted-foreground">
                            {selectedFlight.country}
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-foreground leading-tight pt-1 font-mono">
                          {selectedFlight.callsign || selectedFlight.id}
                        </h4>
                      </div>

                      <button
                        onClick={() => setSelectedFlight(null)}
                        className="h-11 w-11 p-3 -mr-2 -mt-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
                        aria-label="Close popup"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="text-xs font-medium mt-2 leading-relaxed text-foreground/90">
                      Alt {Math.round(selectedFlight.altitude)} m ({Math.round(selectedFlight.altitude * 3.28084)} ft) · Speed {Math.round(selectedFlight.velocity * 3.6)} km/h ({Math.round(selectedFlight.velocity * 1.94384)} kts) · Heading {selectedFlight.heading}°
                    </p>

                    <div className="mt-2 text-xs font-mono text-amber-300 bg-amber-950/40 p-2 rounded border border-amber-800/40 flex justify-between">
                      <span>Vertical Rate:</span>
                      <span className="text-foreground font-semibold">
                        {selectedFlight.verticalRate > 0 ? `+${selectedFlight.verticalRate} m/s` : `${selectedFlight.verticalRate} m/s`}
                      </span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-border/80 font-mono text-[11px] font-semibold text-muted-foreground flex justify-between items-center">
                      <span>
                        ICAO24:{" "}
                        <strong className="text-foreground font-bold uppercase">
                          {selectedFlight.id}
                        </strong>
                      </span>

                      <span>
                        STATUS:{" "}
                        <strong className="text-foreground font-bold uppercase">
                          {selectedFlight.isGround ? "ON GROUND" : "AIRBORNE"}
                        </strong>
                      </span>
                    </div>
                  </div>
                </Popup>
              )}

              {/* ------------------------------------------------------ */}
              {/* Vehicle Popup                                          */}
              {/* ------------------------------------------------------ */}

              {selectedVehicle && (
                <Popup
                  latitude={
                    selectedVehicle.lat
                  }
                  longitude={
                    selectedVehicle.lng
                  }
                  anchor="left"
                  offset={36}
                  closeButton={false}
                  closeOnClick={false}
                  onClose={() =>
                    setSelectedVehicle(
                      null,
                    )
                  }
                >
                  <div className="bg-popover text-popover-foreground p-4 rounded-xl border border-border shadow-2xl max-w-xs min-w-[260px] animate-in fade-in-50 zoom-in-95">
                    <div className="flex justify-between items-start gap-3">
                      <div className="space-y-1">
                        <div className="flex gap-2 items-center">
                          <Badge
                            className={`uppercase font-semibold text-[10px] tracking-wider ${selectedVehicle.type ===
                                "ambulance"
                                ? "bg-red-500/20 text-red-400 border-red-500/50"
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

                          <span className="font-mono text-xs font-semibold text-muted-foreground">
                            {
                              selectedVehicle.speed
                            }{" "}
                            km/h
                          </span>
                        </div>

                        <h4 className="font-bold text-sm text-foreground leading-tight pt-1">
                          {
                            selectedVehicle.name
                          }
                        </h4>
                      </div>

                      <button
                        onClick={() =>
                          setSelectedVehicle(
                            null,
                          )
                        }
                        className="h-11 w-11 p-3 -mr-2 -mt-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
                        aria-label="Close popup"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <p className="text-xs font-medium mt-2 leading-relaxed text-foreground/90">
                      Heading{" "}
                      {
                        selectedVehicle.heading
                      }
                      ° toward{" "}
                      {
                        selectedVehicle.destination
                      }
                      . Currently{" "}
                      {selectedVehicle.status.replace(
                        "_",
                        " ",
                      )}
                      .
                    </p>

                    <div className="mt-3 pt-2 border-t border-border/80 font-mono text-[11px] font-semibold text-muted-foreground flex justify-between items-center">
                      <span>
                        UNIT:{" "}
                        <strong className="text-foreground font-bold">
                          {
                            selectedVehicle.id
                          }
                        </strong>
                      </span>

                      <span>
                        STATUS:{" "}
                        <strong className="text-foreground font-bold uppercase">
                          {
                            selectedVehicle.status
                          }
                        </strong>
                      </span>
                    </div>
                  </div>
                </Popup>
              )}

              {/* ------------------------------------------------------ */}
              {/* Emergency Service Popup                                */}
              {/* ------------------------------------------------------ */}

              {selectedEmergencyService && (
                <Popup
                  latitude={
                    selectedEmergencyService.lat
                  }
                  longitude={
                    selectedEmergencyService.lng
                  }
                  anchor="left"
                  offset={36}
                  closeButton={false}
                  closeOnClick={false}
                  onClose={() =>
                    setSelectedEmergencyService(
                      null,
                    )
                  }
                >
                  <EmergencyServicePopup
                    service={
                      selectedEmergencyService
                    }
                    onClose={() =>
                      setSelectedEmergencyService(
                        null,
                      )
                    }
                    onCenter={() => {
                      mapRef.current?.flyTo(
                        {
                          center: [
                            selectedEmergencyService.lng,
                            selectedEmergencyService.lat,
                          ],
                          zoom: 15.5,
                          duration: 1000,
                        },
                      );
                    }}
                  />
                </Popup>
              )}

              {selectedTransportHub && (
                <Popup
                  latitude={selectedTransportHub.lat}
                  longitude={selectedTransportHub.lng}
                  anchor="top"
                  offset={15}
                  closeButton={false}
                  closeOnClick={false}
                  onClose={() => setSelectedTransportHub(null)}
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

        {/* Telemetry Feed overlay inside map */}
        {showTelemetryFeed && (
          <TelemetryFeed
            filteredIncidents={filteredIncidents}
            setSelectedIncident={setSelectedIncident}
            flyTo={flyTo}
            onClose={() => onCloseTelemetryFeed?.()}
            onSelectIncident={(incident) => setSelectedIncident(incident)}
          />
        )}
      </div>



    </div>
  );
}
