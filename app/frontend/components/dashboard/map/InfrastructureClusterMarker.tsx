"use client";

import React, { memo, useState } from "react";
import {
  Plane,
  Home,
  Building2,
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
            ? "rgba(18, 26, 40, 0.98)"
            : "rgba(10, 15, 26, 0.94)",
          border: isHovered ? "2px solid #38BDF8" : "2px solid rgba(56, 189, 248, 0.6)",
          boxShadow: isHovered
            ? "0 4px 14px rgba(0,0,0,0.85)"
            : "0 2px 8px rgba(0,0,0,0.7)",
          transform: isHovered ? "scale(1.05) translateY(-1px)" : "none",
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
