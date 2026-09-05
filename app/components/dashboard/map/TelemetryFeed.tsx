import React, { useEffect, useRef, useState } from "react";
import { Grip, Minus, Radio, Sparkles, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import type { ClusterPoint, Incident } from "../data";

interface TelemetryFeedProps {
  filteredIncidents: Incident[];
  setSelectedIncident: (incident: Incident | null) => void;
  setSelectedCluster: (cluster: ClusterPoint | null) => void;
  flyTo: (latitude: number, longitude: number, zoom: number) => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  onClose: () => void;
  onUseContext: (context: string) => void;
  onSelectIncident?: (incident: Incident) => void;
}

export function TelemetryFeed({
  filteredIncidents,
  setSelectedIncident,
  setSelectedCluster,
  flyTo,
  isMinimized,
  onToggleMinimize,
  onClose,
  onUseContext,
  onSelectIncident,
}: TelemetryFeedProps) {
  const [position, setPosition] = useState({ x: 18, y: 24 });
  const dragStateRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      if (!dragState) return;

      const deltaX = event.clientX - dragState.startX;
      const deltaY = event.clientY - dragState.startY;

      setPosition({
        x: dragState.originX + deltaX,
        y: dragState.originY + deltaY,
      });
    };

    const handleUp = () => {
      dragStateRef.current = null;
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);

    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button")) return;

    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: position.x,
      originY: position.y,
    };
  };

  const contextText = filteredIncidents.length
    ? filteredIncidents
        .map(
          (incident) =>
            `${incident.id} | ${incident.severity.toUpperCase()} | ${incident.title} | ${incident.nodeId} | ${incident.timestamp}`,
        )
        .join("\n")
    : "No active incidents in the current telemetry feed.";

  return (
    <div
      className="absolute z-20 w-[290px] overflow-hidden rounded-xl border border-border bg-card/95 text-card-foreground shadow-2xl backdrop-blur-sm"
      style={{ left: `${position.x}px`, top: `${position.y}px` }}
    >
      <div
        className="flex items-center justify-between gap-2 border-b border-border bg-muted/60 px-3 py-2 cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
      >
        <div className="flex items-center gap-2">
          <Grip className="h-3.5 w-3.5 text-muted-foreground" />
          <Radio className="h-3.5 w-3.5 text-rose-400" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-card-foreground">
            Telemetry Feed
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={isMinimized ? "Expand feed" : "Minimize feed"}
            onClick={onToggleMinimize}
            className="rounded-md border border-border bg-background/40 p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Minus className="h-3 w-3" />
          </button>

          <button
            type="button"
            aria-label="Use feed context in AI"
            onClick={() => onUseContext(contextText)}
            className="rounded-md border border-border bg-background/40 p-1 text-primary transition-colors hover:bg-primary/10"
          >
            <Sparkles className="h-3 w-3" />
          </button>

          <button
            type="button"
            aria-label="Close feed"
            onClick={onClose}
            className="rounded-md border border-border bg-background/40 p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="max-h-[420px] overflow-y-auto p-2 space-y-1.5">
          {filteredIncidents.map((incident) => (
            <button
              key={incident.id}
              onClick={() => {
                onSelectIncident?.(incident);
                setSelectedIncident(incident);
                setSelectedCluster(null);
                flyTo(incident.lat, incident.lng, 14.8);
              }}
              className="w-full rounded-lg border border-border bg-muted/30 p-2 text-left transition-colors hover:bg-muted/60"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[10px] font-semibold text-primary">
                  {incident.id}
                </span>

                <Badge
                  variant={incident.severity === "critical" ? "destructive" : "outline"}
                  className="text-[8px]"
                >
                  {incident.severity}
                </Badge>
              </div>

              <div className="mt-1 text-[11px] text-card-foreground">{incident.title}</div>

              <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-muted-foreground">
                <span>{incident.timestamp}</span>
                <span>{incident.nodeId}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
