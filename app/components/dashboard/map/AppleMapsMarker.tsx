"use client";

import React, { memo } from "react";
import { Shield, Flame, Plus } from "lucide-react";
import type { EmergencyService, EmergencyServiceType } from "../emergencyServicesData";

/*
 * Emergency marker: category is always expressed by a recognizable vector
 * symbol as well as by colour. Labels are intentionally opt-in at city zoom.
 */

type Cfg = { color: string; label: string };

const CONFIGS: Record<EmergencyServiceType, Cfg> = {
  hospital: { color: "#F472B6", label: "Medical" },
  clinic: { color: "#F472B6", label: "Medical" },
  police: { color: "#007AFF", label: "Police" },
  fire_station: { color: "#FF9500", label: "Fire & rescue" },
};

interface AppleMapsMarkerProps {
  service: EmergencyService;
  isSelected?: boolean;
  onClick: (service: EmergencyService) => void;
  showLabel?: boolean;
}

export const AppleMapsMarker = memo(function AppleMapsMarker({
  service,
  isSelected = false,
  onClick,
  showLabel = true,
}: AppleMapsMarkerProps) {
  const cfg = CONFIGS[service.type] ?? CONFIGS.hospital;

  const Icon =
    service.type === "hospital" || service.type === "clinic"
      ? Plus
      : service.type === "police"
      ? Shield
      : Flame;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(service);
      }}
      aria-label={`${cfg.label}: ${service.name}`}
      aria-pressed={isSelected}
      title={`${cfg.label}: ${service.name}`}
      className="flex cursor-pointer flex-col items-center select-none bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ zIndex: isSelected ? 40 : 20, outlineColor: cfg.color }}
    >
      <div
        style={{
          width: isSelected ? 30 : 26,
          height: isSelected ? 30 : 26,
          borderRadius: 6,
          border: `2px solid ${cfg.color}`,
          background: "rgba(18, 24, 32, 0.94)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "width 120ms ease, height 120ms ease, box-shadow 120ms ease",
          boxShadow: isSelected ? `0 0 0 4px ${cfg.color}33` : "0 1px 3px rgba(0,0,0,0.55)",
          opacity: isSelected ? 1 : 0.96,
        }}
      >
        <Icon
          style={{
            color: cfg.color,
            width: isSelected ? 16 : 14,
            height: isSelected ? 16 : 14,
            strokeWidth: 2.8,
          }}
        />
      </div>

      {showLabel && (
        <span
          style={{
            marginTop: 4,
            padding: "3px 6px",
            borderRadius: 4,
            border: `1px solid ${cfg.color}66`,
            background: "rgba(18, 24, 32, 0.90)",
            color: "#F1F5F9",
            fontSize: 10,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: "0.02em",
            whiteSpace: "nowrap",
            boxShadow: "0 1px 4px rgba(0,0,0,0.45)",
          }}
        >
          {service.shortName}
        </span>
      )}
    </button>
  );
});
