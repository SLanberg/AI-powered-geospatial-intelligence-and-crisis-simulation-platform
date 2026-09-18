"use client";

import { Layers3 } from "lucide-react";

import type { EmergencyService } from "../emergencyServicesData";

interface EmergencyServiceClusterMarkerProps {
  services: EmergencyService[];
  onClick: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  hospital: "#0284C7",
  clinic: "#06B6D4",
  police: "#3B82F6",
  fire_station: "#F97316",
  shelter: "#10B981",
  hazard_site: "#A855F7",
};

function getPieGradient(services: EmergencyService[]) {
  if (services.length === 0) return "#34C759";

  const counts: Record<string, number> = {};
  for (const s of services) {
    const color = TYPE_COLORS[s.type] || "#34C759";
    counts[color] = (counts[color] || 0) + 1;
  }

  const entries = Object.entries(counts);
  if (entries.length === 1) {
    return entries[0][0];
  }

  const total = services.length;
  let currentPercentage = 0;
  const stops: string[] = [];

  for (const [color, count] of entries) {
    const start = currentPercentage;
    const end = currentPercentage + (count / total) * 100;
    stops.push(`${color} ${start.toFixed(1)}% ${end.toFixed(1)}%`);
    currentPercentage = end;
  }

  return `conic-gradient(${stops.join(", ")})`;
}

export function EmergencyServiceClusterMarker({
  services,
  onClick,
}: EmergencyServiceClusterMarkerProps) {
  const pieGradient = getPieGradient(services);

  const breakdown = Object.entries(
    services.reduce((acc, s) => {
      const label =
        s.type === "hospital" || s.type === "clinic"
          ? "Medical"
          : s.type === "police"
          ? "Police"
          : s.type === "fire_station"
          ? "Fire & Rescue"
          : "Other";
      acc[label] = (acc[label] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  )
    .map(([label, count]) => `${count} ${label}`)
    .join(", ");

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Expand cluster of ${services.length} emergency service locations (${breakdown})`}
      title={`${services.length} emergency service locations (${breakdown}) — click to zoom in`}
      className="group relative flex h-10 w-10 items-center justify-center rounded-full p-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 transition-transform duration-150 hover:scale-105 active:scale-95 shadow-md"
      style={{
        background: pieGradient,
      }}
    >
      <div className="flex h-full w-full items-center justify-center rounded-full bg-[#0F172A] text-[#FFFFFF]">
        <Layers3 aria-hidden="true" className="absolute h-4 w-4 opacity-85 text-sky-400" />
        <span
          className="relative mt-5 rounded-md px-1.5 py-0.5 text-xs font-black leading-none tabular-nums text-white border border-slate-700 shadow-sm"
          style={{ backgroundColor: "#0A0E17" }}
        >
          +{services.length}
        </span>
      </div>
    </button>
  );
}
