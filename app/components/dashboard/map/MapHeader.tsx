import { Crosshair, Layers3, Satellite, Map as MapIcon, ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";

type MapTheme = "dark" | "voyager" | "satellite";

interface MapHeaderProps {
  mapTheme: MapTheme;
  setMapTheme: (theme: MapTheme) => void;
  is3D: boolean;
  toggle3D: () => void;
  resetView: () => void;
}

export function MapHeader({
  mapTheme,
  setMapTheme,
  is3D,
  toggle3D,
  resetView,
}: MapHeaderProps) {
  return (
    <div className="bg-card border border-border rounded-t-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-card-foreground">
      {/* Basemap Selection - Defaults to Dark Monochrome Vector for optimal marker contrast */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 font-semibold text-xs tracking-wider text-foreground">
          <ShieldAlert className="w-5 h-5 text-blue-400" />
          <span>TACTICAL MAP MATRIX</span>
        </div>

        <div className="flex items-center bg-muted/80 border border-border rounded-lg p-1 gap-1">
          <button
            onClick={() => setMapTheme("dark")}
            title="Dark Vector (Recommended for Marker Contrast)"
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              mapTheme === "dark"
                ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/50"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            <MapIcon className="w-4 h-4" />
            Dark Vector
          </button>

          <button
            onClick={() => setMapTheme("voyager")}
            title="Voyager Light Vector"
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all ${
              mapTheme === "voyager"
                ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/50"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            Voyager
          </button>

          <button
            onClick={() => setMapTheme("satellite")}
            title="Aerial Imagery"
            className={`min-h-[38px] px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
              mapTheme === "satellite"
                ? "bg-blue-600 text-white shadow-sm ring-1 ring-blue-400/50"
                : "text-muted-foreground hover:text-foreground hover:bg-background/50"
            }`}
          >
            <Satellite className="w-4 h-4" />
            Aerial
          </button>
        </div>
      </div>

      {/* Action Controls - 44x44px touch targets minimum, h-5 w-5 icons */}
      <div className="ml-auto flex items-center gap-2">
        <Button
          size="default"
          variant="outline"
          onClick={toggle3D}
          aria-label={is3D ? "3D Tactical View Active" : "Activate 3D Pitch"}
          title={is3D ? "3D Tactical View Active" : "Activate 3D Pitch"}
          className={`h-11 w-11 p-0 border flex items-center justify-center transition-all min-h-[44px] min-w-[44px] ${
            is3D
              ? "bg-blue-600 text-white border-blue-400 shadow-md ring-2 ring-blue-500/30"
              : "border-border text-foreground hover:bg-accent"
          }`}
        >
          <Layers3 className="w-5 h-5" />
        </Button>

        <Button
          size="default"
          variant="outline"
          onClick={resetView}
          aria-label="Recenter Map Camera"
          title="Recenter Map Camera"
          className="h-11 w-11 p-0 border border-border flex items-center justify-center text-foreground hover:bg-accent min-h-[44px] min-w-[44px]"
        >
          <Crosshair className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

