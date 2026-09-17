"use client";

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import Map, {
  Layer,
  Marker,
  MapRef,
  NavigationControl,
  FullscreenControl,
  Popup,
  Source,
} from "react-map-gl/maplibre";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  AlertTriangle,
  Radio,
  Waves,
  ShieldAlert,
  Send,
  Route,
  Navigation,
  Truck,
  Siren,
  Layers,
  MapPin,
  Box,
  Crosshair,
  Satellite,
  Compass,
  X,
  ExternalLink,
  Plane,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  NEPAL_TIMELINE_EVENTS,
  NepalTimelineEvent,
  RIVER_STATIONS,
  RiverStation,
  TRISHULI_RIVER_PATH,
  REPLAY_START_SECONDS,
  getActiveEvent,
  getWavePropagationKm,
  getStationDynamicState,
  getStationRouteDynamicStatus,
  formatNptTime,
} from "@/frontend/data/nepalIncidentData";
import { NEPAL_EMERGENCY_SERVICES } from "@/frontend/data/nepalEmergencyServicesData";
import { NEPAL_TRANSPORT_HUBS } from "@/frontend/data/nepalTransportHubsData";
import type { EmergencyService } from "@/components/dashboard/emergencyServicesData";
import type { TransportHub } from "../transportHubsData";
import { AppleMapsMarker } from "../map/AppleMapsMarker";
import { EmergencyServiceClusterMarker } from "../map/EmergencyServiceClusterMarker";
import { InfrastructureClusterMarker } from "../map/InfrastructureClusterMarker";
import { AreaInfrastructureModal } from "../map/AreaInfrastructureModal";
import { AreaInfrastructurePanel } from "../map/AreaInfrastructurePanel";
import { EmergencyServicePopup } from "../map/EmergencyServicePopup";
import { TransportHubMarker } from "../map/TransportHubMarker";
import { TransportHubPopup } from "../map/TransportHubPopup";
import { clusterEmergencyServices, clusterInfrastructure, type InfrastructureCluster } from "../map/useDecluttering";
import { NepalTimelinePlayer } from "./NepalTimelinePlayer";
import { MapToolbar, type LayerConfig } from "../map/MapToolbar";

if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
}

const CARTO_API_KEY =
  process.env.NEXT_PUBLIC_CARTO_API_KEY ||
  process.env.CARTO_API_KEY ||
  "";

const CARTO_KEY_PARAM = CARTO_API_KEY
  ? `?key=${encodeURIComponent(CARTO_API_KEY)}`
  : "";

const MAP_GLYPHS = "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf";

/* -------------------------------------------------------------------------- */
/* Map Styles - Matching Operational Picture Theme & Color Scheme             */
/* -------------------------------------------------------------------------- */
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
          "raster-contrast": 0.35,
          "raster-opacity": 0.92,
        },
      },
    ],
  },
  satellite: {
    version: 8 as const,
    glyphs: MAP_GLYPHS,
    sources: {
      esri: {
        type: "raster" as const,
        tiles: [
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        ],
        tileSize: 256,
        attribution:
          "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
      },
    },
    layers: [
      {
        id: "esri",
        type: "raster" as const,
        source: "esri",
        minzoom: 0,
        maxzoom: 20,
        paint: {
          "raster-fade-duration": 0,
          "raster-brightness-min": 0.05,
          "raster-brightness-max": 0.95,
          "raster-contrast": 0.15,
        },
      },
    ],
  },
};

/* -------------------------------------------------------------------------- */
/* Toolbar Palette matching Operational Picture MapToolbar                    */
/* -------------------------------------------------------------------------- */
const C = {
  bg: "#1E1E1E",
  bgHover: "#2A2D2E",
  bgActive: "#37373D",
  border: "#333333",
  accent: "#007ACC",
  text: "#CCCCCC",
  textMuted: "#858585",
  textBright: "#E8E8E8",
} as const;

export interface NepalIncidentReplayViewProps {
  currentSeconds?: number;
  onSeek?: (seconds: number) => void;
  onOpenRealTimeAnalysis?: () => void;
}

export function NepalIncidentReplayView({
  currentSeconds: propCurrentSeconds,
  onSeek: propOnSeek,
  onOpenRealTimeAnalysis,
}: NepalIncidentReplayViewProps) {
  const [internalSeconds, setInternalSeconds] = useState<number>(REPLAY_START_SECONDS);
  const currentSeconds = propCurrentSeconds !== undefined ? propCurrentSeconds : internalSeconds;

  const handleSeek = useCallback((secs: number) => {
    setInternalSeconds(secs);
    if (propOnSeek) propOnSeek(secs);
  }, [propOnSeek]);

  const [selectedStation, setSelectedStation] = useState<RiverStation | null>(null);
  const [selectedEmergencyService, setSelectedEmergencyService] = useState<EmergencyService | null>(null);
  const [selectedTransportHub, setSelectedTransportHub] = useState<TransportHub | null>(null);
  const [selectedInfrastructureCluster, setSelectedInfrastructureCluster] = useState<InfrastructureCluster | null>(null);
  const [showClusterSidePanel, setShowClusterSidePanel] = useState(false);
  const [showFullClusterModal, setShowFullClusterModal] = useState(false);
  const [mapTheme, setMapTheme] = useState<"dark" | "voyager" | "satellite">("dark");
  const [is3D, setIs3D] = useState(true);

  // Layer toggles
  const [showRiverCorridor, setShowRiverCorridor] = useState(true);
  const [showStations, setShowStations] = useState(true);
  const [showEmergencyServices, setShowEmergencyServices] = useState(true);
  const [showTransportHubs, setShowTransportHubs] = useState(true);

  const nepalCustomLayers: LayerConfig[] = useMemo(
    () => [
      {
        id: "emergency",
        label: "Emergency Services",
        icon: <Siren size={14} className="text-[#FF3B30]" />,
        visible: showEmergencyServices,
        count: NEPAL_EMERGENCY_SERVICES.length,
        onToggle: () => setShowEmergencyServices((p) => !p),
      },
      {
        id: "transport_hubs",
        label: "Transport Hubs",
        icon: <Plane size={14} className="text-sky-400" />,
        visible: showTransportHubs,
        count: NEPAL_TRANSPORT_HUBS.length,
        onToggle: () => setShowTransportHubs((p) => !p),
      },
      {
        id: "river_corridor",
        label: "Flood Surge Corridor",
        icon: <Waves size={14} className="text-cyan-400" />,
        visible: showRiverCorridor,
        count: "165km",
        onToggle: () => setShowRiverCorridor((p) => !p),
      },
      {
        id: "gauge_stations",
        label: "Water Sensors (River Gauges)",
        icon: <Waves size={14} className="text-cyan-400" />,
        visible: showStations,
        count: RIVER_STATIONS.length,
        onToggle: () => setShowStations((p) => !p),
      },
    ],
    [showEmergencyServices, showTransportHubs, showRiverCorridor, showStations]
  );

  const [mapZoom, setMapZoom] = useState<number>(9.3);
  const mapRef = useRef<MapRef | null>(null);

  // Active event derived from replay seconds
  const activeEvent = useMemo(
    () => getActiveEvent(currentSeconds),
    [currentSeconds]
  );

  // Dynamic wave distance
  const waveDistanceKm = useMemo(
    () => getWavePropagationKm(currentSeconds),
    [currentSeconds]
  );

  // Progress of debris/flood front (0 to 1)
  const waveProgressRatio = Math.min(1, waveDistanceKm / 165);

  // Filtered river path up to current wave progress
  const activeRiverPoints = useMemo(() => {
    const totalPoints = TRISHULI_RIVER_PATH.length;
    const reachedCount = Math.max(
      2,
      Math.min(totalPoints, Math.ceil(waveProgressRatio * totalPoints))
    );
    return TRISHULI_RIVER_PATH.slice(0, reachedCount);
  }, [waveProgressRatio]);

  // Full corridor GeoJSON
  const fullRiverGeoJson: GeoJSON.FeatureCollection = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Trishuli - Narayani River Corridor" },
          geometry: {
            type: "LineString",
            coordinates: TRISHULI_RIVER_PATH,
          },
        },
      ],
    };
  }, []);

  // Active flood surge wave GeoJSON
  const activeWaveGeoJson: GeoJSON.FeatureCollection = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { status: "Active Surge Front" },
          geometry: {
            type: "LineString",
            coordinates: activeRiverPoints,
          },
        },
      ],
    };
  }, [activeRiverPoints]);

  // Highlighted road/river corridor segment for the selected station
  const selectedStationSegmentGeoJson: GeoJSON.FeatureCollection | null = useMemo(() => {
    if (!selectedStation) return null;
    let closestIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < TRISHULI_RIVER_PATH.length; i++) {
      const pt = TRISHULI_RIVER_PATH[i];
      const dist = Math.hypot(
        pt[0] - selectedStation.coordinates[0],
        pt[1] - selectedStation.coordinates[1]
      );
      if (dist < minDist) {
        minDist = dist;
        closestIdx = i;
      }
    }
    const startIdx = Math.max(0, closestIdx - 1);
    const endIdx = Math.min(TRISHULI_RIVER_PATH.length, closestIdx + 2);
    const segment = TRISHULI_RIVER_PATH.slice(startIdx, endIdx);
    if (segment.length < 2) return null;

    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: selectedStation.affectedRoute.name },
          geometry: {
            type: "LineString",
            coordinates: segment,
          },
        },
      ],
    };
  }, [selectedStation]);

  // Unified Area Infrastructure clusters (Emergency Services + Transport Hubs)
  const infraClusters = useMemo(() => {
    const services = showEmergencyServices ? NEPAL_EMERGENCY_SERVICES : [];
    const hubs = showTransportHubs ? NEPAL_TRANSPORT_HUBS : [];
    return clusterInfrastructure(services, hubs, mapRef.current, mapZoom);
  }, [showEmergencyServices, showTransportHubs, mapZoom]);

  // Jump to event
  const handleSelectEvent = (event: NepalTimelineEvent) => {
    handleSeek(event.secondsFromMidnight);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: event.coordinates,
        zoom: 11,
        duration: 1200,
      });
    }
  };

  // Center on station
  const handleSelectStation = (station: RiverStation) => {
    setSelectedStation(station);
    setSelectedEmergencyService(null);
    setSelectedTransportHub(null);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: station.coordinates,
        zoom: 12,
        duration: 1000,
      });
    }
  };

  // Reset view
  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [85.05, 28.05],
        zoom: 9.3,
        pitch: is3D ? 35 : 0,
        bearing: is3D ? -15 : 0,
        duration: 1000,
      });
    }
  };

  // Toggle 3D
  const handleToggle3D = () => {
    const next3D = !is3D;
    setIs3D(next3D);
    if (mapRef.current) {
      mapRef.current.easeTo({
        pitch: next3D ? 35 : 0,
        bearing: next3D ? -15 : 0,
        duration: 800,
      });
    }
  };

  // Station stats breakdown
  const stationStats = useMemo(() => {
    let nominal = 0;
    let surging = 0;
    let danger = 0;
    let compromised = 0;
    let recession = 0;

    RIVER_STATIONS.forEach((stn) => {
      const state = getStationDynamicState(stn, currentSeconds);
      if (state.status === "NOMINAL") nominal++;
      else if (state.status === "SURGING") surging++;
      else if (state.status === "DANGER") danger++;
      else if (state.status === "COMPROMISED") compromised++;
      else if (state.status === "RECESSION") recession++;
    });

    return { nominal, surging, danger, compromised, recession };
  }, [currentSeconds]);

  return (
    <div className="w-full h-full flex flex-col flex-1 select-text bg-background font-sans">
      {/* ---------------------------------------------------------------- */}
      {/* Top Header / Status Bar with Operational Picture Styling          */}
      {/* ---------------------------------------------------------------- */}
      <header className="px-4 py-2.5 bg-card border-b border-border flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-sm z-20">
        {/* Left: Replay Title & Status */}
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Nepal Cascade Replay • Langtang - Trishuli Corridor
              </h1>
              <Badge variant="outline" className="font-mono text-[9px] px-1.5 py-0 border-border text-muted-foreground">
                165 KM BASIN
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
              <span>Simulation Time:</span>
              <span className="text-amber-400 font-bold">
                {formatNptTime(currentSeconds)} NPT
              </span>
              <span>• Active Milestone:</span>
              <span className="text-red-400 font-semibold">{activeEvent.eventId}</span>
            </div>
          </div>
        </div>

        {/* Right: HUD Metrics & Copilot Link */}
        <div className="flex items-center gap-2.5">
          {/* Wave Distance Meter */}
          <div className="bg-muted/40 border border-border/80 rounded-md px-2.5 py-1 flex items-center gap-2 shadow-sm">
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-muted-foreground uppercase leading-none">
                Flood Front Distance
              </span>
              <span className="text-xs font-mono font-bold text-cyan-300 leading-tight">
                {waveDistanceKm.toFixed(1)} km / 165 km
              </span>
            </div>
          </div>

          {/* Mass SMS Warnings Card */}
          <div className="bg-muted/40 border border-border/80 rounded-md px-2.5 py-1 flex items-center gap-2 shadow-sm">
            <Send className="w-3.5 h-3.5 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[9px] font-mono text-muted-foreground uppercase leading-none">
                Mass SMS Dispatched
              </span>
              <span className="text-xs font-mono font-bold text-amber-300 leading-tight">
                {currentSeconds >= 33330 ? "679,295 alerts" : "0 (Pending Trigger)"}
              </span>
            </div>
          </div>

          {/* Telemetry Status Breakdown */}
          <div className="bg-muted/40 border border-border/80 rounded-md px-2.5 py-1 hidden sm:flex items-center gap-2.5 shadow-sm">
            <Waves className="w-3.5 h-3.5 text-cyan-400" />
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="text-cyan-400 font-semibold" title="Nominal Baseline">
                ● {stationStats.nominal} Nom
              </span>
              <span className="text-amber-400 font-semibold" title="Surging / High Water">
                ● {stationStats.surging + stationStats.danger} Surge
              </span>
              <span className="text-slate-400 font-semibold" title="Compromised Stations">
                ● {stationStats.compromised} Offline
              </span>
              {stationStats.recession > 0 && (
                <span className="text-orange-400 font-semibold" title="Post-Peak Flood Recession">
                  ● {stationStats.recession} Recession
                </span>
              )}
            </div>
          </div>

          {/* Open Real Time Analysis inside Neural City Copilot */}
          {onOpenRealTimeAnalysis && (
            <button
              type="button"
              onClick={onOpenRealTimeAnalysis}
              className="px-2.5 py-1 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-semibold rounded-md flex items-center gap-1.5 transition-all shadow-sm"
              title="Open Real time analysis in Neural City Copilot"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Real time analysis</span>
            </button>
          )}
        </div>
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Map Viewport Area - Layout Matching Operational Picture          */}
      {/* ---------------------------------------------------------------- */}
      <div className="relative w-full h-full flex-1 min-h-[580px]">
        {/* Compact vertical toolbars overlaid on map */}
        <MapToolbar
          mapTheme={mapTheme}
          setMapTheme={setMapTheme}
          is3D={is3D}
          toggle3D={handleToggle3D}
          resetView={handleResetView}
          customLayers={nepalCustomLayers}
        />

        {/* Map Container Frame matching Operational Picture MapContainer */}
        <div className="absolute inset-0 overflow-hidden rounded-xl border border-border bg-background">
          <Map
            ref={mapRef}
            initialViewState={{
              longitude: 85.05,
              latitude: 28.05,
              zoom: 9.3,
              pitch: 35,
              bearing: -15,
            }}
            mapStyle={MAP_STYLES[mapTheme]}
            style={{ width: "100%", height: "100%" }}
            attributionControl={false}
            onMove={(e) => setMapZoom(e.viewState.zoom)}
          >
            <NavigationControl position="bottom-right" showCompass={true} showZoom={true} />
            <FullscreenControl position="bottom-right" />

            {/* Base river corridor outline */}
            {showRiverCorridor && (
              <Source id="full-river" type="geojson" data={fullRiverGeoJson}>
                <Layer
                  id="river-base-glow"
                  type="line"
                  paint={{
                    "line-color": "#0ea5e9",
                    "line-width": 5,
                    "line-opacity": 0.25,
                  }}
                />
                <Layer
                  id="river-base-line"
                  type="line"
                  paint={{
                    "line-color": "#0284c7",
                    "line-width": 2.5,
                    "line-opacity": 0.5,
                    "line-dasharray": [2, 1],
                  }}
                />
              </Source>
            )}

            {/* Active flood surge wave front */}
            {showRiverCorridor && (
              <Source id="active-wave" type="geojson" data={activeWaveGeoJson}>
                <Layer
                  id="wave-glow"
                  type="line"
                  paint={{
                    "line-color": "#ef4444",
                    "line-width": 8,
                    "line-opacity": 0.6,
                  }}
                />
                <Layer
                  id="wave-core"
                  type="line"
                  paint={{
                    "line-color": "#fbbf24",
                    "line-width": 3.5,
                    "line-opacity": 0.95,
                  }}
                />
              </Source>
            )}

            {/* Selected Station Affected Route Highlight on Map */}
            {selectedStationSegmentGeoJson && (
              <Source id="selected-station-route" type="geojson" data={selectedStationSegmentGeoJson}>
                <Layer
                  id="station-route-glow"
                  type="line"
                  paint={{
                    "line-color": "#f59e0b",
                    "line-width": 10,
                    "line-opacity": 0.5,
                  }}
                />
                <Layer
                  id="station-route-core"
                  type="line"
                  paint={{
                    "line-color": "#ef4444",
                    "line-width": 4,
                    "line-opacity": 1,
                  }}
                />
              </Source>
            )}

            {/* Unified Area Infrastructure & Transport Hub Clusters */}
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
                          setSelectedStation(null);
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
                        onClick={(s) => {
                          setSelectedStation(null);
                          setSelectedTransportHub(null);
                          setSelectedInfrastructureCluster(null);
                          setSelectedEmergencyService(s);
                        }}
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
                        onClick={(h) => {
                          setSelectedStation(null);
                          setSelectedEmergencyService(null);
                          setSelectedInfrastructureCluster(null);
                          setSelectedTransportHub(h);
                        }}
                      />
                    </Marker>
                  );
                }

                return null;
              })}

            {/* Monitoring River Stations / Water Sensors Markers */}
            {showStations &&
              RIVER_STATIONS.map((station) => {
                const state = getStationDynamicState(station, currentSeconds);
                const isSelected = selectedStation?.id === station.id;

                return (
                  <Marker
                    key={station.id}
                    longitude={station.coordinates[0]}
                    latitude={station.coordinates[1]}
                    anchor="center"
                    onClick={(e) => {
                      e.originalEvent.stopPropagation();
                      handleSelectStation(station);
                    }}
                  >
                    <div className="relative group cursor-pointer flex flex-col items-center">
                      <div
                        className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center transition-all duration-300 shadow-md relative"
                        style={{
                          backgroundColor: state.color,
                          transform: isSelected ? "scale(1.3)" : "scale(1)",
                        }}
                        title={`Water Sensor: ${station.name} (${state.status})`}
                      >
                        <Waves className="w-3.5 h-3.5 text-white shrink-0" />
                        {state.status === "COMPROMISED" ? (
                          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-600 border border-white flex items-center justify-center shadow">
                            <X className="w-2 h-2 text-white stroke-[3]" />
                          </div>
                        ) : state.status === "SURGING" || state.status === "DANGER" ? (
                          <span className="absolute inset-0 rounded-full bg-white/40 animate-ping pointer-events-none" />
                        ) : null}
                      </div>

                      {/* Station Label */}
                      <div className="mt-1 bg-card/95 border border-border px-1.5 py-0.5 rounded shadow-md pointer-events-none whitespace-nowrap flex items-center gap-1">
                        <Waves className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                        <span className="font-mono text-[9px] font-bold text-foreground">
                          {station.name.split("/")[0].trim()}
                        </span>
                        {state.status !== "NOMINAL" && (
                          <span
                            className="text-[8.5px] font-mono font-bold"
                            style={{ color: state.color }}
                          >
                            ({state.waterLevel}m)
                          </span>
                        )}
                      </div>
                    </div>
                  </Marker>
                );
              })}

            {/* Emergency Service Facility Popup Details */}
            {selectedEmergencyService && (
              <Popup
                longitude={selectedEmergencyService.lng}
                latitude={selectedEmergencyService.lat}
                anchor="left"
                offset={24}
                maxWidth="300px"
                closeButton={false}
                closeOnClick={false}
                onClose={() => setSelectedEmergencyService(null)}
              >
                <EmergencyServicePopup
                  service={selectedEmergencyService}
                  onClose={() => setSelectedEmergencyService(null)}
                  onCenter={() => {
                    if (mapRef.current) {
                      mapRef.current.flyTo({
                        center: [selectedEmergencyService.lng, selectedEmergencyService.lat],
                        zoom: 14,
                        duration: 800,
                      });
                    }
                  }}
                />
              </Popup>
            )}

            {/* Transport Hub Details Popup */}
            {selectedTransportHub && (
              <Popup
                longitude={selectedTransportHub.lng}
                latitude={selectedTransportHub.lat}
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
                    if (mapRef.current) {
                      mapRef.current.flyTo({
                        center: [lng, lat],
                        zoom: 14,
                        duration: 800,
                      });
                    }
                  }}
                />
              </Popup>
            )}

            {/* Station Popup Details */}
            {selectedStation && (
              <Popup
                longitude={selectedStation.coordinates[0]}
                latitude={selectedStation.coordinates[1]}
                anchor="left"
                offset={24}
                maxWidth="300px"
                closeButton={false}
                closeOnClick={false}
                onClose={() => setSelectedStation(null)}
              >
                {(() => {
                  const state = getStationDynamicState(selectedStation, currentSeconds);
                  const routeStatus = getStationRouteDynamicStatus(selectedStation, currentSeconds);
                  const affectedRoute = selectedStation.affectedRoute;

                  const isCritical =
                    routeStatus.status === "IMPASSABLE" || routeStatus.status === "SEVERED";
                  const isWarning = routeStatus.status === "PRE-EMPTIVE CLOSURE";
                  const isRecession = routeStatus.status === "DEBRIS BLOCKED";

                  const iconContainerColor = isCritical
                    ? "bg-red-500/20 border-red-500/40 text-red-400"
                    : isWarning
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-400"
                      : isRecession
                        ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                        : "bg-blue-500/20 border-blue-500/40 text-blue-400";

                  const telemetryReportColor = isCritical
                    ? "bg-red-500/10 border-red-500/30 text-red-300"
                    : isWarning
                      ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                      : isRecession
                        ? "bg-orange-500/10 border-orange-500/30 text-orange-300"
                        : "bg-blue-500/10 border-blue-500/30 text-blue-300";

                  return (
                    <div className="bg-popover text-popover-foreground p-3.5 rounded-xl border border-border shadow-2xl w-[300px] max-w-[300px] max-h-[420px] flex flex-col animate-in fade-in-50 zoom-in-95 overflow-hidden box-border">
                      {/* Header */}
                      <div className="flex justify-between items-start gap-2 shrink-0 pb-2 border-b border-border/60">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          <div className={`p-1.5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${iconContainerColor}`}>
                            <Waves className="w-4 h-4" />
                          </div>

                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex gap-1.5 items-center flex-wrap min-w-0">
                              <Badge className={`shrink-0 ${routeStatus.badgeClass}`}>
                                {isCritical ? (
                                  <AlertTriangle className="w-3 h-3 mr-1 inline shrink-0" />
                                ) : (
                                  <span
                                    className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block"
                                    style={{ backgroundColor: routeStatus.color }}
                                  />
                                )}
                                {routeStatus.status}
                              </Badge>

                              <Badge
                                variant="outline"
                                className="font-mono text-[9px] px-1.5 py-0 h-4 border-border text-foreground/80"
                              >
                                {affectedRoute.corridorCode}
                              </Badge>
                            </div>

                            <h4 className="font-bold text-xs text-foreground leading-snug pt-0.5 break-words">
                              {selectedStation.name}
                            </h4>
                          </div>
                        </div>

                        <button
                          onClick={() => setSelectedStation(null)}
                          className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted shrink-0"
                          aria-label="Close popup"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Info Content - Scrollable container up to max card height */}
                      <div className="overflow-y-auto pr-1 flex-1 space-y-2.5 mt-2">
                        {/* Route Impact Summary */}
                        <div className="text-xs text-muted-foreground leading-relaxed font-sans border-t border-border/60 pt-2 border-t border-border/40">
                          <p className="break-words font-medium text-foreground/90">
                            {affectedRoute.impactSummary}
                          </p>
                        </div>

                        {/* Hydrological Telemetry State */}
                        <div className={`p-2 rounded-lg border text-xs font-mono flex items-center justify-between ${telemetryReportColor}`}>
                          <span className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                            <Waves className="w-3 h-3 text-cyan-400" />
                            Water Level:
                          </span>
                          <span className="font-bold text-xs">
                            {state.waterLevel}m ({state.status})
                          </span>
                        </div>

                        {/* Diversion / Action Required */}
                        <div className="bg-muted/30 border border-border/80 rounded-lg p-2 text-[11px] font-mono space-y-1">
                          <span className="text-muted-foreground font-semibold block text-[10px] uppercase">
                            Action Required:
                          </span>
                          <p className="text-foreground leading-snug break-words">
                            {routeStatus.actionRequired}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </Popup>
            )}
          </Map>

          {/* Right-side Area Infrastructure Panel Card */}
          {showClusterSidePanel && selectedInfrastructureCluster && (
            <AreaInfrastructurePanel
              cluster={selectedInfrastructureCluster}
              onClose={() => setShowClusterSidePanel(false)}
              onViewMoreHub={(hub) => {
                setSelectedStation(null);
                setSelectedEmergencyService(null);
                setSelectedTransportHub(hub);
                if (mapRef.current) {
                  mapRef.current.flyTo({
                    center: [hub.lng, hub.lat],
                    zoom: 14.5,
                    duration: 800,
                  });
                }
              }}
              onViewMoreService={(service) => {
                setSelectedStation(null);
                setSelectedTransportHub(null);
                setSelectedEmergencyService(service);
                if (mapRef.current) {
                  mapRef.current.flyTo({
                    center: [service.lng, service.lat],
                    zoom: 14.5,
                    duration: 800,
                  });
                }
              }}
              onViewFullAreaModal={() => {
                setShowFullClusterModal(true);
              }}
            />
          )}
        </div>
      </div>

      {/* Area Infrastructure Modal */}
      {showFullClusterModal && selectedInfrastructureCluster && (
        <AreaInfrastructureModal
          cluster={selectedInfrastructureCluster}
          onClose={() => setShowFullClusterModal(false)}
          onSelectHub={(hub) => {
            setSelectedStation(null);
            setSelectedEmergencyService(null);
            setSelectedTransportHub(hub);
            if (mapRef.current) {
              mapRef.current.flyTo({
                center: [hub.lng, hub.lat],
                zoom: 14,
                duration: 800,
              });
            }
          }}
          onSelectService={(service) => {
            setSelectedStation(null);
            setSelectedTransportHub(null);
            setSelectedEmergencyService(service);
            if (mapRef.current) {
              mapRef.current.flyTo({
                center: [service.lng, service.lat],
                zoom: 14,
                duration: 800,
              });
            }
          }}
          onZoomToArea={(lat, lng) => {
            if (mapRef.current) {
              mapRef.current.flyTo({
                center: [lng, lat],
                zoom: 14,
                duration: 800,
              });
            }
          }}
        />
      )}

      {/* Docked Nepal Timeline Player Bar at Bottom */}
      <NepalTimelinePlayer
        currentSeconds={currentSeconds}
        onSeek={handleSeek}
        activeEvent={activeEvent}
        onSelectEvent={handleSelectEvent}
      />
    </div>
  );
}

export default NepalIncidentReplayView;
