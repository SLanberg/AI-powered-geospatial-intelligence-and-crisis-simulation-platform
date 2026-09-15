import { Crosshair, Box, Satellite, Map as MapIcon, ShieldAlert, Plane, Anchor, Siren, AlertTriangle, Flame, Compass } from "lucide-react";

import { Button } from "@/components/ui/button";

type MapTheme = "dark" | "voyager" | "satellite";

interface MapHeaderProps {
  mapTheme: MapTheme;
  setMapTheme: (theme: MapTheme) => void;
  is3D: boolean;
  toggle3D: () => void;
  resetView: () => void;
  showFlights?: boolean;
  setShowFlights?: (show: boolean | ((prev: boolean) => boolean)) => void;
  showVehicles?: boolean;
  setShowVehicles?: (show: boolean | ((prev: boolean) => boolean)) => void;
  showEmergencyServices?: boolean;
  setShowEmergencyServices?: (show: boolean | ((prev: boolean) => boolean)) => void;
  showTransportHubs?: boolean;
  setShowTransportHubs?: (show: boolean | ((prev: boolean) => boolean)) => void;
  showIncidents?: boolean;
  setShowIncidents?: (show: boolean | ((prev: boolean) => boolean)) => void;
  showHeatmap?: boolean;
  setShowHeatmap?: (show: boolean | ((prev: boolean) => boolean)) => void;
  flightCount?: number;
  vehicleCount?: number;
  emergencyCount?: number;
  transportHubCount?: number;
  incidentCount?: number;
}

export function MapHeader({
  mapTheme,
  setMapTheme,
  is3D,
  toggle3D,
  resetView,
  showFlights = true,
  setShowFlights,
  showVehicles = true,
  setShowVehicles,
  showEmergencyServices = true,
  setShowEmergencyServices,
  showTransportHubs = true,
  setShowTransportHubs,
  showIncidents = true,
  setShowIncidents,
  showHeatmap = false,
  setShowHeatmap,
  flightCount = 0,
  vehicleCount = 0,
  emergencyCount = 0,
  transportHubCount = 0,
  incidentCount = 0,
}: MapHeaderProps) {
  return (
    <div className="bg-[#121820] border border-[#2A3545] rounded-t-xl px-3 py-2.5 flex flex-wrap items-center justify-between gap-3 text-slate-100">
      {/* Basemap Selection - Defaults to Dark Monochrome Vector for optimal marker contrast */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 font-semibold text-xs tracking-wider text-slate-100">
          <ShieldAlert className="w-4 h-4 text-[#34C759]" />
          <span>TACTICAL MAP</span>
        </div>

        <div className="flex items-center bg-[#1E2530] border border-[#2A3545] rounded-md p-1 gap-1" role="group" aria-label="Basemap style">
          <button
            onClick={() => setMapTheme("dark")}
            title="Dark Muted Canvas (Recommended)"
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              mapTheme === "dark"
              ? "bg-[#007AFF] text-white shadow-sm"
                : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
            }`}
          >
            <MapIcon className="w-4 h-4" />
            Tactical
          </button>

          <button
            onClick={() => setMapTheme("voyager")}
            title="Dark street reference"
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              mapTheme === "voyager"
              ? "bg-[#007AFF] text-white shadow-sm"
                : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
            }`}
          >
            Street
          </button>

          <button
            onClick={() => setMapTheme("satellite")}
            title="Aerial Imagery"
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              mapTheme === "satellite"
              ? "bg-[#007AFF] text-white shadow-sm"
                : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
            }`}
          >
            <Satellite className="w-4 h-4" />
            Aerial
          </button>
        </div>

        {/* Each operational domain has an explicit group to avoid ambiguity. */}
        {setShowFlights && setShowVehicles && (
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-[#1E2530] border border-[#2A3545] rounded-md p-1 gap-1" role="group" aria-label="Air and maritime tracking layers">
              <span className="px-1 font-mono text-[9px] font-bold tracking-wider text-sky-300 uppercase">Air & maritime</span>
            <button
              onClick={() => setShowFlights((prev) => !prev)}
              title="Toggle Live Air Domain (Flights & Helicopters)"
              className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                showFlights
                  ? "bg-sky-500/20 text-white border border-sky-400/50"
                  : "text-slate-500 hover:text-slate-100 hover:bg-white/5 opacity-70"
              }`}
            >
              <Plane className="w-4 h-4 text-sky-300" />
              <span>Air</span>
              {showFlights && flightCount > 0 && (
                <span className="bg-sky-950/80 text-sky-200 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                  {flightCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowVehicles((prev) => !prev)}
              title="Toggle Live Maritime Domain (Ships & Speedboats)"
              className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                showVehicles
                  ? "bg-cyan-500/20 text-white border border-cyan-400/50"
                  : "text-slate-500 hover:text-slate-100 hover:bg-white/5 opacity-70"
              }`}
            >
              <Anchor className="w-4 h-4 text-cyan-200" />
              <span>Maritime</span>
              {showVehicles && vehicleCount > 0 && (
                <span className="bg-cyan-950/80 text-cyan-300 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                  {vehicleCount}
                </span>
              )}
            </button>
            </div>

            <div className="flex items-center bg-[#1E2530] border border-[#2A3545] rounded-md p-1 gap-1" role="group" aria-label="Emergency response layers">
              <span className="px-1 font-mono text-[9px] font-bold tracking-wider text-[#FFB4AF] uppercase">Emergency</span>
            {setShowEmergencyServices && (
              <button
                onClick={() => setShowEmergencyServices((prev) => !prev)}
                title="Toggle Emergency Services (Hospitals, Police, Fire Stations)"
                className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  showEmergencyServices
                    ? "bg-[#FF3B30]/15 text-white border border-[#FF3B30]/60"
                    : "text-slate-500 hover:text-slate-100 hover:bg-white/5 opacity-70"
                }`}
              >
                <Siren className="w-4 h-4 text-[#FF3B30]" />
                <span>Services</span>
                {showEmergencyServices && emergencyCount > 0 && (
                  <span className="bg-[#FF3B30]/20 text-[#FFB4AF] text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                    {emergencyCount}
                  </span>
                )}
              </button>
            )}

            {setShowTransportHubs && (
              <button
                onClick={() => setShowTransportHubs((prev) => !prev)}
                title="Toggle Transport Hubs (Airports, Railway Stations, Ports)"
                className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  showTransportHubs
                    ? "bg-sky-500/20 text-sky-200 border border-sky-400/60"
                    : "text-slate-500 hover:text-slate-100 hover:bg-white/5 opacity-70"
                }`}
              >
                <Compass className="w-4 h-4 text-sky-400" />
                <span>Hubs</span>
                {showTransportHubs && transportHubCount > 0 && (
                  <span className="bg-sky-950/80 text-sky-200 text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                    {transportHubCount}
                  </span>
                )}
              </button>
            )}

            {setShowIncidents && (
              <button
                onClick={() => setShowIncidents((prev) => !prev)}
                title="Toggle Incidents (Active Alerts & Hazards)"
                className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  showIncidents
                    ? "bg-[#FF3B30]/15 text-white border border-[#FF3B30]/60"
                    : "text-slate-500 hover:text-slate-100 hover:bg-white/5 opacity-70"
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-[#FF3B30]" />
                <span>Incidents</span>
                {showIncidents && incidentCount > 0 && (
                  <span className="bg-[#FF3B30]/20 text-[#FFB4AF] text-[10px] px-1.5 py-0.5 rounded-full font-mono">
                    {incidentCount}
                  </span>
                )}
              </button>
            )}

            {setShowHeatmap && (
              <button
                onClick={() => setShowHeatmap((prev) => !prev)}
                title="Toggle Heatmap Density Overlay"
                className={`min-h-[38px] px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                  showHeatmap
                    ? "bg-flame-500/20 text-amber-300 border border-amber-500/60 shadow-lg shadow-amber-500/20"
                    : "text-slate-500 hover:text-slate-100 hover:bg-white/5 opacity-70"
                }`}
                style={showHeatmap ? { backgroundColor: "rgba(245, 158, 11, 0.2)", borderColor: "#f59e0b" } : undefined}
              >
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Heatmap</span>
              </button>
            )}

            </div>
          </div>
        )}

      </div>

      {/* Action Controls */}
      <div className="ml-auto flex items-center gap-2">
        <Button
          size="default"
          variant="outline"
          onClick={toggle3D}
          aria-label={is3D ? "3D Tactical View Active" : "Activate 3D Pitch"}
          title={is3D ? "3D Tactical View Active" : "Activate 3D Pitch"}
          className={`h-11 w-11 p-0 border flex items-center justify-center transition-all min-h-[44px] min-w-[44px] ${
            is3D
              ? "bg-[#007AFF]/20 text-[#A9D4FF] border-[#007AFF] shadow-md ring-2 ring-[#007AFF]/30"
              : "border-[#2A3545] bg-[#121820] text-slate-100 hover:bg-[#1E2530]"
          }`}
        >
          <Box className="w-5 h-5" />
        </Button>

        <Button
          size="default"
          variant="outline"
          onClick={resetView}
          aria-label="Recenter Map Camera"
          title="Recenter Map Camera"
          className="h-11 w-11 p-0 border border-[#2A3545] bg-[#121820] flex items-center justify-center text-slate-100 hover:bg-[#1E2530] min-h-[44px] min-w-[44px]"
        >
          <Crosshair className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
