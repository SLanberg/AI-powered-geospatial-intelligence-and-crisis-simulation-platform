"use client";

import { Layers3 } from "lucide-react";

import type { EmergencyService } from "../emergencyServicesData";

interface EmergencyServiceClusterMarkerProps {
  services: EmergencyService[];
  onClick: () => void;
}

export function EmergencyServiceClusterMarker({
  services,
  onClick,
}: EmergencyServiceClusterMarkerProps) {
  const serviceTypes = new Set(services.map((service) => service.type));
  const includesMedical = serviceTypes.has("hospital") || serviceTypes.has("clinic");
  const includesPolice = serviceTypes.has("police");
  const includesFire = serviceTypes.has("fire_station");
  const accent = includesMedical
    ? "#FF3B30"
    : includesPolice
      ? "#007AFF"
      : includesFire
        ? "#FF9500"
        : "#34C759";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Expand cluster of ${services.length} emergency service locations`}
      title={`${services.length} emergency service locations — zoom in to expand`}
      className="group relative flex h-10 w-10 items-center justify-center rounded-full border-2 transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        backgroundColor: "rgba(18, 24, 32, 0.96)",
        borderColor: accent,
        color: "#F8FAFC",
        boxShadow: `0 0 0 4px ${accent}22`,
      }}
    >
      <Layers3 aria-hidden="true" className="absolute h-4 w-4 opacity-70" />
      <span className="relative mt-5 rounded-sm px-1 text-[10px] font-bold leading-3 tabular-nums" style={{ backgroundColor: "#121820" }}>
        +{services.length}
      </span>
    </button>
  );
}
