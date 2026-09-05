import { Crosshair, Radio, Satellite } from "lucide-react";

import { Button } from "@/components/ui/button";

type MapTheme = "dark" | "voyager" | "satellite";

interface MapHeaderProps {
  mapTheme: MapTheme;
  setMapTheme: (theme: MapTheme) => void;
  is3D: boolean;
  toggle3D: () => void;
  resetView: () => void;
  sideDrawerOpen: boolean;
  setSideDrawerOpen: React.Dispatch<React.SetStateAction<boolean>>;
  filteredIncidentsCount: number;
}

export function MapHeader({
  mapTheme,
  setMapTheme,
  is3D,
  toggle3D,
  resetView,
  sideDrawerOpen,
  setSideDrawerOpen,
  filteredIncidentsCount,
}: MapHeaderProps) {
  return (
    <div className="bg-[#090D16] border border-slate-800/90 rounded-t-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-slate-300 text-xs">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>

          <span className="font-semibold tracking-wider uppercase text-slate-100">
            Tallinn Grid Engine
          </span>
        </div>

        <div className="hidden sm:block font-mono text-[11px] text-slate-400">
          59.4370° N, 24.7535° E
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={() => setMapTheme("dark")}
            className={`px-2 py-1 text-[10px] rounded transition-colors ${
              mapTheme === "dark"
                ? "bg-blue-600 text-white font-medium"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Dark
          </button>

          <button
            onClick={() => setMapTheme("voyager")}
            className={`px-2 py-1 text-[10px] rounded transition-colors ${
              mapTheme === "voyager"
                ? "bg-blue-600 text-white font-medium"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Voyager
          </button>

          <button
            onClick={() => setMapTheme("satellite")}
            className={`px-2 py-1 text-[10px] rounded transition-colors flex items-center gap-1 ${
              mapTheme === "satellite"
                ? "bg-blue-600 text-white font-medium"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Satellite className="w-3 h-3" />
            Aerial
          </button>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={toggle3D}
          className="h-7 px-2 text-[11px] border border-slate-800"
        >
          {is3D ? "3D ON" : "2D FLAT"}
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={resetView}
          className="h-7 px-2 text-[11px] border border-slate-800"
        >
          <Crosshair className="w-3.5 h-3.5 mr-1" />
          Recenter
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => setSideDrawerOpen((value) => !value)}
          aria-expanded={sideDrawerOpen}
          className={`h-7 px-2 text-[11px] border border-slate-800 ${
            sideDrawerOpen ? "bg-slate-800 text-slate-100" : ""
          }`}
        >
          <Radio className="w-3.5 h-3.5 mr-1" />
          Feed ({filteredIncidentsCount})
        </Button>
      </div>
    </div>
  );
}
