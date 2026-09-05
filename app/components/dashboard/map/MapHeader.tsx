import { Crosshair, Layers3, Satellite, Map as MapIcon } from "lucide-react";

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
    <div className="bg-card border border-border rounded-t-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-card-foreground text-xs">
      <div className="flex items-center gap-2">
        <div className="flex items-center bg-muted border border-border rounded-lg p-0.5">
          <button
            onClick={() => setMapTheme("satellite")}
            title="Aerial view"
            className={`px-2 py-1 text-[10px] rounded transition-colors flex items-center gap-1 ${
              mapTheme === "satellite"
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Satellite className="w-3 h-3" />
            Aerial
          </button>

          <button
            onClick={() => setMapTheme("dark")}
            title="Dark map"
            className={`px-2 py-1 text-[10px] rounded transition-colors ${
              mapTheme === "dark"
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Dark
          </button>

          <button
            onClick={() => setMapTheme("voyager")}
            title="Voyager map"
            className={`px-2 py-1 text-[10px] rounded transition-colors ${
              mapTheme === "voyager"
                ? "bg-primary text-primary-foreground font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Voyager
          </button>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          size="sm"
          variant="ghost"
          onClick={toggle3D}
          aria-label={is3D ? "3D map active" : "Activate 3D map"}
          title={is3D ? "3D map active" : "Activate 3D map"}
          className={`group relative h-7 w-7 p-0 border flex items-center justify-center transition-colors ${
            is3D
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-popover px-1.5 py-0.5 text-[10px] text-popover-foreground opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
            {is3D ? "3D map active" : "Activate 3D map"}
          </span>
          <Layers3 className="w-3.5 h-3.5" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={resetView}
          aria-label="Recenter map"
          title="Recenter map"
          className="group relative h-7 w-7 p-0 border border-border flex items-center justify-center"
        >
          <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-popover px-1.5 py-0.5 text-[10px] text-popover-foreground opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
            Recenter map
          </span>
          <Crosshair className="w-3.5 h-3.5" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => {}}
          aria-label="Open legend"
          title="Open legend"
          className="group relative h-7 w-7 p-0 border border-border flex items-center justify-center"
        >
          <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-popover px-1.5 py-0.5 text-[10px] text-popover-foreground opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
            Open legend
          </span>
          <MapIcon className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
