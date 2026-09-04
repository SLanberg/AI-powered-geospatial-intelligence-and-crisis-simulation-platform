"use client";

import React, { useState, useMemo, useRef, useSyncExternalStore } from "react";
import Map, {
  Marker,
  Popup,
  NavigationControl,
  FullscreenControl,
  MapRef,
} from "react-map-gl/maplibre";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  AlertTriangle,
  Layers,
  Crosshair,
  ShieldAlert,
  X,
  Compass,
  Satellite,
  Activity,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CrisisTimeline } from "./CrisisTimeline";
import {
  MOCK_INCIDENTS,
  MOCK_CLUSTERS,
  TALLINN_DISTRICTS,
  Incident,
  ClusterPoint,
  TallinnDistrict,
} from "./data";

interface MapContainerProps {
  showIncidents: boolean;
  showClusters: boolean;
  crisisActive: boolean;
  setCrisisActive: (active: boolean) => void;
  selectedTime: string;
  setSelectedTime: React.Dispatch<React.SetStateAction<string>>;
  selectedIncident: Incident | null;
  setSelectedIncident: (incident: Incident | null) => void;
}

// Robust MapLibre style specifications with high-availability raster tile backends
const MAP_STYLES: Record<string, { name: string; icon: string; style: maplibregl.StyleSpecification }> = {
  dark: {
    name: "Dark Matter",
    icon: "dark",
    style: {
      version: 8,
      sources: {
        "carto-dark": {
          type: "raster",
          tiles: [
            "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
            "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
            "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
            "https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png",
          ],
          tileSize: 256,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
        },
      },
      layers: [
        {
          id: "carto-dark-layer",
          type: "raster",
          source: "carto-dark",
          minzoom: 0,
          maxzoom: 20,
        },
      ],
    },
  },
  voyager: {
    name: "Voyager Street",
    icon: "voyager",
    style: {
      version: 8,
      sources: {
        "carto-voyager": {
          type: "raster",
          tiles: [
            "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
            "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
            "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
            "https://d.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
          ],
          tileSize: 256,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; <a href="https://carto.com/attributions">CARTO</a>',
        },
      },
      layers: [
        {
          id: "carto-voyager-layer",
          type: "raster",
          source: "carto-voyager",
          minzoom: 0,
          maxzoom: 20,
        },
      ],
    },
  },
  satellite: {
    name: "Satellite",
    icon: "satellite",
    style: {
      version: 8,
      sources: {
        "esri-imagery": {
          type: "raster",
          tiles: [
            "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          ],
          tileSize: 256,
          attribution: "&copy; Esri, Maxar, Earthstar Geographics",
        },
      },
      layers: [
        {
          id: "esri-imagery-layer",
          type: "raster",
          source: "esri-imagery",
          minzoom: 0,
          maxzoom: 19,
        },
      ],
    },
  },
};

// SSR-safe client mount hook without useEffect setState
function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
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
  const isClient = useIsClient();
  const mapRef = useRef<MapRef | null>(null);

  const [activeDistrict, setActiveDistrict] = useState<string>("all");
  const [mapTheme, setMapTheme] = useState<"dark" | "voyager" | "satellite">("dark");
  const [is3D, setIs3D] = useState<boolean>(false);
  const [selectedCluster, setSelectedCluster] = useState<ClusterPoint | null>(null);
  const [sideDrawerOpen, setSideDrawerOpen] = useState<boolean>(true);

  // Initial Tallinn viewport state
  const [viewState, setViewState] = useState({
    latitude: 59.4370,
    longitude: 24.7535,
    zoom: 12.3,
    bearing: 0,
    pitch: 0,
  });

  // Filter incidents based on selected time step or crisis mode
  const filteredIncidents = useMemo(() => {
    if (!showIncidents) return [];
    if (selectedTime === "08:47") return MOCK_INCIDENTS;
    if (selectedTime === "08:40") return MOCK_INCIDENTS.slice(4);
    if (selectedTime === "08:44") return MOCK_INCIDENTS.slice(2);
    return MOCK_INCIDENTS;
  }, [showIncidents, selectedTime]);

  // Recenter map on Tallinn core
  const resetView = () => {
    setActiveDistrict("all");
    setIs3D(false);
    mapRef.current?.flyTo({
      center: [24.7535, 59.4370],
      zoom: 12.3,
      pitch: 0,
      bearing: 0,
      duration: 1200,
    });
    setViewState({
      latitude: 59.4370,
      longitude: 24.7535,
      zoom: 12.3,
      bearing: 0,
      pitch: 0,
    });
  };

  // Fly to specific Tallinn district
  const handleSelectDistrict = (district: TallinnDistrict) => {
    setActiveDistrict(district.id);
    mapRef.current?.flyTo({
      center: [district.lng, district.lat],
      zoom: district.zoom,
      pitch: is3D ? 45 : 0,
      bearing: is3D ? -20 : 0,
      duration: 1400,
    });
    setViewState((prev) => ({
      ...prev,
      latitude: district.lat,
      longitude: district.lng,
      zoom: district.zoom,
    }));
  };

  // Toggle 3D isometric pitch view
  const toggle3D = () => {
    const nextPitch = is3D ? 0 : 45;
    const nextBearing = is3D ? 0 : -20;
    setIs3D(!is3D);
    mapRef.current?.flyTo({
      pitch: nextPitch,
      bearing: nextBearing,
      duration: 1000,
    });
    setViewState((prev) => ({
      ...prev,
      pitch: nextPitch,
      bearing: nextBearing,
    }));
  };

  // Focus on incident
  const focusIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setSelectedCluster(null);
    mapRef.current?.flyTo({
      center: [incident.lng, incident.lat],
      zoom: 14.8,
      duration: 1200,
    });
  };

  if (!isClient) {
    return (
      <div className="w-full h-[680px] bg-[#070A11] rounded-xl border border-slate-800/80 flex items-center justify-center text-slate-500 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
          <span>INITIALIZING TALLINN GEOSPATIAL VECTOR ENGINE...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col font-sans select-none">
      {/* Top Map Header & Controls Bar */}
      <div className="bg-[#090D16] border border-slate-800/90 rounded-t-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-slate-300 text-xs">
        {/* Left: Tallinn Geo Status & District Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-semibold tracking-wider uppercase text-slate-100 text-xs">
              Tallinn Grid Engine
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-slate-400 border-l border-slate-800 pl-3">
            <span>59.4370° N, 24.7535° E</span>
            <span className="text-slate-600">|</span>
            <span className="text-blue-400">HARJUMAA SECTOR</span>
          </div>

          {/* Quick District Navigation Chips */}
          <div className="hidden xl:flex items-center gap-1 ml-2 pl-2 border-l border-slate-800/80">
            {TALLINN_DISTRICTS.map((district) => (
              <button
                key={district.id}
                onClick={() => handleSelectDistrict(district)}
                className={`px-2 py-0.5 rounded text-[10.5px] font-mono transition-all ${
                  activeDistrict === district.id
                    ? "bg-blue-600/30 text-blue-300 border border-blue-500/50 font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                }`}
                title={district.description}
              >
                {district.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Map Style, 3D Mode, Drawer Toggle, Recenter */}
        <div className="flex items-center gap-2 font-mono text-[11px]">
          {/* Map Layer Style Switcher */}
          <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setMapTheme("dark")}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                mapTheme === "dark"
                  ? "bg-blue-600/30 text-blue-300 border border-blue-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Dark Matter
            </button>
            <button
              onClick={() => setMapTheme("voyager")}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                mapTheme === "voyager"
                  ? "bg-blue-600/30 text-blue-300 border border-blue-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Voyager
            </button>
            <button
              onClick={() => setMapTheme("satellite")}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-colors flex items-center gap-1 ${
                mapTheme === "satellite"
                  ? "bg-blue-600/30 text-blue-300 border border-blue-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Satellite className="w-3 h-3" />
              Aerial
            </button>
          </div>

          {/* 3D Isometric Pitch Toggle */}
          <Button
            size="sm"
            variant="ghost"
            onClick={toggle3D}
            className={`h-7 px-2 text-[11px] font-mono border ${
              is3D
                ? "bg-blue-950/60 border-blue-700 text-blue-300"
                : "border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
            title="Toggle 3D Perspective Tilt"
          >
            <Compass className={`w-3.5 h-3.5 mr-1 ${is3D ? "text-blue-400 animate-spin" : "text-slate-500"}`} />
            {is3D ? "3D ON" : "2D FLAT"}
          </Button>

          {/* Recenter */}
          <Button
            size="sm"
            variant="ghost"
            onClick={resetView}
            className="h-7 px-2 text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800"
            title="Reset Map to Tallinn Core"
          >
            <Crosshair className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Recenter
          </Button>

          {/* Incident Feed Drawer Toggle */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSideDrawerOpen(!sideDrawerOpen)}
            className={`h-7 px-2 text-[11px] border ${
              sideDrawerOpen
                ? "bg-slate-800/80 text-slate-200 border-slate-700"
                : "border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
            title="Toggle Live Incident Feed Panel"
          >
            <Activity className="w-3.5 h-3.5 mr-1 text-blue-400" />
            Feed ({filteredIncidents.length})
          </Button>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div className="relative w-full h-[640px] lg:h-[calc(100vh-230px)] min-h-[580px] bg-[#07090F] border-x border-b border-slate-800/90 rounded-b-xl overflow-hidden shadow-2xl shadow-blue-950/30">
        <Map
          ref={mapRef}
          mapLib={maplibregl}
          {...viewState}
          onMove={(evt) => setViewState(evt.viewState)}
          mapStyle={MAP_STYLES[mapTheme].style}
          style={{ width: "100%", height: "100%" }}
          attributionControl={false}
        >
          <NavigationControl position="bottom-right" showCompass={true} />
          <FullscreenControl position="bottom-right" />

          {/* Cluster Markers */}
          {showClusters &&
            MOCK_CLUSTERS.map((cluster) => (
              <Marker
                key={cluster.id}
                latitude={cluster.lat}
                longitude={cluster.lng}
                anchor="center"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  setSelectedCluster(cluster);
                  setSelectedIncident(null);
                }}
              >
                <div className="group cursor-pointer relative flex items-center justify-center">
                  {/* Outer pulse wave */}
                  <div className="absolute w-14 h-14 rounded-full bg-blue-500/20 animate-ping pointer-events-none" />
                  <div className="absolute w-11 h-11 rounded-full bg-blue-600/25 blur-sm" />
                  <div className="w-10 h-10 rounded-full bg-[#0B132B] border-2 border-blue-400 text-blue-200 font-mono font-bold text-xs flex items-center justify-center shadow-lg shadow-blue-900/60 backdrop-blur group-hover:scale-115 transition-transform z-10">
                    {cluster.incidentCount}
                  </div>
                </div>
              </Marker>
            ))}

          {/* Incident Markers */}
          {filteredIncidents.map((incident) => {
            const isSelected = selectedIncident?.id === incident.id;
            const isCritical = incident.severity === "critical";
            const isWarning = incident.severity === "warning";

            return (
              <Marker
                key={incident.id}
                latitude={incident.lat}
                longitude={incident.lng}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  focusIncident(incident);
                }}
              >
                <div className="group cursor-pointer flex flex-col items-center">
                  {/* Radar Pulse Effect */}
                  <div className="relative flex items-center justify-center">
                    <div
                      className={`absolute w-8 h-8 rounded-full animate-ping pointer-events-none ${
                        isCritical
                          ? "bg-rose-500/40"
                          : isWarning
                          ? "bg-amber-500/30"
                          : "bg-blue-500/30"
                      }`}
                    />
                    <div
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shadow-lg transition-transform group-hover:scale-125 ${
                        isSelected
                          ? "ring-2 ring-white scale-125 shadow-rose-500/50"
                          : ""
                      } ${
                        isCritical
                          ? "bg-rose-950 border-rose-500 text-rose-300"
                          : isWarning
                          ? "bg-amber-950 border-amber-500 text-amber-300"
                          : "bg-blue-950 border-blue-500 text-blue-300"
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Marker Micro Badge */}
                  <div
                    className={`mt-1 px-1.5 py-0.5 rounded font-mono text-[9px] font-semibold whitespace-nowrap shadow-md border backdrop-blur transition-all ${
                      isSelected
                        ? "bg-slate-900 text-slate-100 border-blue-500 scale-105"
                        : "bg-slate-950/90 text-slate-300 border-slate-800 group-hover:border-slate-700"
                    }`}
                  >
                    {incident.timestamp} | {incident.nodeId}
                  </div>
                </div>
              </Marker>
            );
          })}

          {/* Selected Incident Popup Inspection */}
          {selectedIncident && (
            <Popup
              latitude={selectedIncident.lat}
              longitude={selectedIncident.lng}
              anchor="top"
              offset={16}
              closeButton={false}
              closeOnClick={false}
              onClose={() => setSelectedIncident(null)}
              className="z-20"
            >
              <div className="bg-[#0B0F19]/95 backdrop-blur-md text-slate-200 p-3.5 rounded-lg border border-slate-700 shadow-2xl max-w-xs font-sans">
                <div className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={
                          selectedIncident.severity === "critical"
                            ? "destructive"
                            : "outline"
                        }
                        className="text-[9px] px-1.5 py-0 h-4 font-mono uppercase"
                      >
                        {selectedIncident.severity}
                      </Badge>
                      <span className="font-mono text-[10.5px] text-slate-400">
                        {selectedIncident.timestamp}
                      </span>
                    </div>
                    <h4 className="font-semibold text-xs text-slate-100 mt-1">
                      {selectedIncident.title}
                    </h4>
                  </div>
                  <button
                    onClick={() => setSelectedIncident(null)}
                    className="text-slate-400 hover:text-slate-200 p-0.5 rounded hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <p className="text-[11px] text-slate-300 leading-relaxed mb-2.5">
                  {selectedIncident.description}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/80 bg-slate-950/60 p-2 rounded">
                  <div>
                    <span className="text-slate-500">NODE:</span> {selectedIncident.nodeId}
                  </div>
                  <div className="text-right uppercase">
                    <span className="text-slate-500">STATUS:</span>{" "}
                    <span className="text-rose-400 font-bold">{selectedIncident.status}</span>
                  </div>
                  <div className="col-span-2 text-slate-500 text-[9.5px]">
                    COORDS: {selectedIncident.lat.toFixed(4)}° N, {selectedIncident.lng.toFixed(4)}° E
                  </div>
                </div>
              </div>
            </Popup>
          )}

          {/* Cluster Popup */}
          {selectedCluster && (
            <Popup
              latitude={selectedCluster.lat}
              longitude={selectedCluster.lng}
              anchor="top"
              offset={16}
              closeButton={false}
              closeOnClick={false}
              onClose={() => setSelectedCluster(null)}
              className="z-20"
            >
              <div className="bg-[#0B0F19]/95 backdrop-blur-md text-slate-200 p-3 rounded-lg border border-blue-900/80 shadow-2xl max-w-xs font-sans">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5 mb-2">
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-semibold text-xs text-slate-100">
                      {selectedCluster.name}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedCluster(null)}
                    className="text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="text-[11px] text-slate-300 space-y-1 font-mono">
                  <div>INCIDENTS: {selectedCluster.incidentCount} ACTIVE</div>
                  <div>PRIMARY: {selectedCluster.primaryCategory}</div>
                  <div>RADIUS: {selectedCluster.radiusKm} km</div>
                </div>
              </div>
            </Popup>
          )}
        </Map>

        {/* Floating HUD: Map Overlay Legend & Metrics */}
        <div className="absolute top-3 left-3 pointer-events-auto z-10 flex flex-col gap-2">
          <div className="bg-[#090D16]/95 backdrop-blur border border-slate-800 rounded-lg p-2.5 text-[11px] font-mono text-slate-300 space-y-1.5 shadow-xl">
            <div className="flex items-center justify-between gap-4 text-[10px] text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-800/60 pb-1">
              <span>TALLINN SECTOR RADAR</span>
              <span className="text-blue-400">ONLINE</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span>Critical</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Warning</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Nominal</span>
              </div>
            </div>
            <div className="text-[9.5px] text-slate-500 pt-0.5">
              ZOOM: {viewState.zoom.toFixed(1)} | PITCH: {viewState.pitch.toFixed(0)}°
            </div>
          </div>
        </div>

        {/* Floating Right-Side Incident Feed Drawer */}
        {sideDrawerOpen && (
          <div className="absolute top-3 right-14 bottom-16 w-72 bg-[#090D16]/95 backdrop-blur border border-slate-800/90 rounded-lg shadow-2xl flex flex-col z-10 font-sans overflow-hidden transition-all">
            <div className="px-3 py-2 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                <span className="font-semibold text-xs tracking-wider uppercase text-slate-100">
                  Tallinn Telemetry Feed
                </span>
              </div>
              <button
                onClick={() => setSideDrawerOpen(false)}
                className="text-slate-500 hover:text-slate-300 p-0.5"
                title="Hide Feed"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
              {filteredIncidents.map((incident) => {
                const isSelected = selectedIncident?.id === incident.id;
                const isCritical = incident.severity === "critical";

                return (
                  <div
                    key={incident.id}
                    onClick={() => focusIncident(incident)}
                    className={`p-2 rounded border text-left cursor-pointer transition-all ${
                      isSelected
                        ? "bg-blue-950/50 border-blue-500 shadow-sm"
                        : "bg-[#070A11]/90 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-mono text-[10px] text-blue-400 font-semibold">
                        {incident.id}
                      </span>
                      <Badge
                        variant={isCritical ? "destructive" : "outline"}
                        className="text-[8.5px] px-1 py-0 h-3.5 font-mono uppercase"
                      >
                        {incident.severity}
                      </Badge>
                    </div>

                    <div className="text-[11px] font-medium text-slate-200 line-clamp-1">
                      {incident.title}
                    </div>

                    <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-500 mt-1">
                      <span>{incident.timestamp}</span>
                      <span className="text-slate-400">{incident.nodeId}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-2 border-t border-slate-800 bg-[#070A11] text-[10px] font-mono text-slate-500 flex items-center justify-between">
              <span>ACTIVE ANOMALIES</span>
              <span className="text-rose-400 font-bold">{filteredIncidents.length} NODES</span>
            </div>
          </div>
        )}

        {/* Selected Incident Drawer / Bottom Banner inside Map */}
        {selectedIncident && (
          <div className="absolute bottom-3 left-3 right-14 lg:right-80 z-10">
            <div className="bg-[#090D16]/95 backdrop-blur border border-blue-900/80 rounded-lg p-3 text-slate-200 flex items-center justify-between gap-4 shadow-2xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-8 w-8 rounded bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-300 shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-blue-400 font-semibold">
                      {selectedIncident.id}
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      @ {selectedIncident.timestamp}
                    </span>
                    <Badge
                      variant="destructive"
                      className="text-[9px] px-1 py-0 h-3.5 uppercase font-mono"
                    >
                      {selectedIncident.severity}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-xs text-slate-100 truncate">
                    {selectedIncident.title}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedIncident(null)}
                  className="h-7 text-xs bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Dismiss
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 08:47 Crisis Timeline Bar docked at bottom of map */}
      <CrisisTimeline
        selectedTime={selectedTime}
        setSelectedTime={setSelectedTime}
        crisisActive={crisisActive}
      />
    </div>
  );
}
