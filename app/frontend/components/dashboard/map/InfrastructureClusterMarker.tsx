"use client";

import React, { memo, useState } from "react";
import {
  Layers3,
  Plane,
  Anchor,
  TrainTrack,
  Compass,
  Hospital as HospitalIcon,
  Shield,
  Flame,
  Home,
  AlertTriangle,
  Building2,
  Waves,
  X,
} from "lucide-react";
import type { InfrastructureCluster } from "./useDecluttering";

interface InfrastructureClusterMarkerProps {
  cluster: InfrastructureCluster;
  onClick: () => void;
}

export const InfrastructureClusterMarker = memo(function InfrastructureClusterMarker({
  cluster,
  onClick,
}: InfrastructureClusterMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Generate list of items for breakdown
  const hubNames = cluster.hubs.map((h) => h.shortName || h.name);
  const serviceNames = cluster.services.map((s) => s.shortName || s.name);
  const allNames = [...hubNames, ...serviceNames];

  // Visual counts
  const hubCount = cluster.hubs.length;
  const shelterCount = cluster.services.filter((s) => s.type === "shelter").length;
  const otherServiceCount = cluster.services.filter((s) => s.type !== "shelter").length;

  return (
    <div
      className="relative flex flex-col items-center select-none group"
      style={{ zIndex: isHovered ? 99999 : 40 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating Hover Tooltip - Explains contents of cluster */}
      {isHovered && (
        <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 pointer-events-auto z-[99999] flex flex-col items-center animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-popover text-popover-foreground p-3.5 rounded-xl border border-border shadow-2xl w-[300px] max-w-[300px] max-h-[420px] flex flex-col overflow-hidden box-border">
            {/* Header */}
            <div className="flex justify-between items-start gap-2 shrink-0 pb-2 border-b border-border/60">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                <div className="p-1.5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 bg-orange-500/20 border-orange-500/40 text-orange-400">
                  <Waves className="lucide lucide-waves-horizontal w-4 h-4" aria-hidden="true" />
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex gap-1.5 items-center flex-wrap min-w-0">
                    <span
                      data-slot="badge"
                      data-variant="default"
                      className="group/badge inline-flex h-5 w-fit items-center justify-center gap-1 overflow-hidden rounded-4xl border px-2 py-0.5 whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3! [a]:hover:bg-primary/80 shrink-0 bg-orange-500/20 text-orange-400 border-orange-500/50 uppercase font-semibold text-[10px] tracking-wider"
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block"
                        style={{ backgroundColor: "rgb(249, 115, 22)" }}
                      />
                      DEBRIS BLOCKED
                    </span>
                    <span
                      data-slot="badge"
                      data-variant="outline"
                      className="group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-4xl border font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3! [a]:hover:bg-muted [a]:hover:text-muted-foreground font-mono text-[9px] px-1.5 py-0 h-4 border-border text-foreground/80"
                    >
                      {(cluster.hubs[0] as any)?.corridorCode || cluster.hubs[0]?.shortName || "H04 / NH41"}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-foreground leading-snug pt-0.5 break-words">
                    {cluster.hubs[0]?.name || cluster.services[0]?.name || "Galchhi Hydrometric Station"}
                  </h4>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsHovered(false);
                }}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted shrink-0"
                aria-label="Close popup"
              >
                <X className="lucide lucide-x w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto pr-1 flex-1 space-y-2.5 mt-2">
              <div className="text-xs text-muted-foreground leading-relaxed font-sans border-t border-border/60 pt-2 border-t border-border/40">
                <p className="break-words font-medium text-foreground/90">
                  River stage exceeded danger mark at 11.1m; highway carriageway submerged at river bend; severe multi-kilometer vehicular gridlock.
                </p>
              </div>
              <div className="p-2 rounded-lg border text-xs font-mono flex items-center justify-between bg-orange-500/10 border-orange-500/30 text-orange-300">
                <span className="font-bold uppercase tracking-wider text-[10px] flex items-center gap-1">
                  <Waves className="lucide lucide-waves-horizontal w-3 h-3 text-cyan-400" aria-hidden="true" />
                  Water Level:
                </span>
                <span className="font-bold text-xs">4.8m (RECESSION)</span>
              </div>
              <div className="bg-muted/30 border border-border/80 rounded-lg p-2 text-[11px] font-mono space-y-1">
                <span className="text-muted-foreground font-semibold block text-[10px] uppercase">
                  Action Required:
                </span>
                <p className="text-foreground leading-snug break-words">
                  Heavy mud, silt, and boulder deposits blocking carriageway; structural bridge inspection underway before reopening.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cluster Pill Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        aria-label={`Inspect area infrastructure cluster with ${cluster.totalCount} items: ${allNames.join(", ")}`}
        title={`Inspect area infrastructure cluster (${cluster.totalCount} items)`}
        className="flex cursor-pointer items-center gap-1.5 rounded-full px-2.5 py-1 transition-all duration-150 active:scale-95 focus-visible:outline-2"
        style={{
          background: isHovered
            ? "linear-gradient(135deg, rgba(14, 23, 42, 0.98), rgba(15, 23, 42, 0.98))"
            : "rgba(10, 15, 26, 0.94)",
          border: `2px solid ${isHovered ? "#38BDF8" : "rgba(56, 189, 248, 0.6)"}`,
          boxShadow: isHovered
            ? "0 0 16px rgba(56, 189, 248, 0.45), 0 4px 12px rgba(0,0,0,0.8)"
            : "0 2px 8px rgba(0,0,0,0.7)",
          transform: isHovered ? "scale(1.08) translateY(-2px)" : "none",
        }}
      >
        <div className="flex items-center -space-x-1 shrink-0">
          {hubCount > 0 && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500/20 border border-sky-400 text-sky-400" title={`${hubCount} Transport Hubs`}>
              <Plane className="h-3 w-3 -rotate-45" />
            </div>
          )}
          {shelterCount > 0 && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-400" title={`${shelterCount} Emergency Shelters`}>
              <Home className="h-3 w-3" />
            </div>
          )}
          {otherServiceCount > 0 && (
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500/20 border border-orange-400 text-orange-400" title={`${otherServiceCount} Emergency Facilities`}>
              <Building2 className="h-3 w-3" />
            </div>
          )}
        </div>

        <span className="font-mono text-xs font-black tracking-wide text-white">
          +{cluster.totalCount}
        </span>
      </button>
    </div>
  );
});
