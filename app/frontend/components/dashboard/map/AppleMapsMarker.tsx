"use client";

import React, { memo } from "react";
import { Shield, Flame, Plus, Heart, Home, AlertTriangle, Fuel, Zap, Droplets, Factory, FlaskConical, Warehouse } from "lucide-react";
import type { EmergencyService, EmergencyServiceType } from "../emergencyServicesData";

/*
 * Emergency marker: category is always expressed by a recognizable vector
 * symbol as well as by colour. Labels are intentionally opt-in at city zoom.
 */

type Cfg = { color: string; label: string };

const CONFIGS: Record<EmergencyServiceType, Cfg> = {
  hospital: { color: "#F472B6", label: "Hospital" },
  clinic: { color: "#EC4899", label: "Clinic" },
  police: { color: "#007AFF", label: "Police" },
  fire_station: { color: "#FF9500", label: "Fire & rescue" },
  shelter: { color: "#10B981", label: "Shelter" },
  hazard_site: { color: "#EF4444", label: "Hazard Site" },
};

/** Helper to categorize hazard sites by building function / name */
export function getHazardCategoryConfig(service: EmergencyService): { color: string; label: string; icon: React.ElementType } {
  const name = service.name.toLowerCase();
  
  // Logistics, Storage & Warehouses (e.g., Ladu, DSV, Schenker, Cargo, Logistics)
  if (/ladu|warehouse|logistika|logistics|dsv|schenker|cargo|depoo|hoiustamine/i.test(name)) {
    return { color: "#E11D48", label: "Logistics & Storage Depot", icon: Warehouse };
  }

  // Fuel & Gas Stations / Terminals / Petroleum
  if (/tankla|circle k|alexela|neste|terminal|vedelgaas|lpg|bensiin|kütus|oil service|liwathon|milstrand|bct/i.test(name)) {
    return { color: "#F97316", label: "Fuel & Gas Facility", icon: Fuel };
  }

  // Chemical, Alcohol & Explosives Industries
  if (/keemia|keemiatööstus|ammoniaak|orica|vatsa|spirit|moe|keemia vkt|reideni plaat|silmet|vatsa/i.test(name)) {
    return { color: "#A855F7", label: "Chemical & Industrial Hazard", icon: FlaskConical };
  }

  // Energy & Electrical Substation Infrastructure
  if (/alajaam|elektri|energeetika|substation|power|soojus|utilitas|eesti energia/i.test(name)) {
    return { color: "#EAB308", label: "Energy Infrastructure", icon: Zap };
  }

  // Marine, Port & Water Treatment
  if (/sadam|kallas|vesi|veepuhastus|dbt|vaala|veevärk/i.test(name)) {
    return { color: "#06B6D4", label: "Maritime & Port Facility", icon: Droplets };
  }

  // Heavy Manufacturing / Industrial Complex
  if (/tehas|tootmine|tööstus|vabrik|kombinaat|ehitus|metall|saeveski/i.test(name)) {
    return { color: "#E11D48", label: "Heavy Industrial Facility", icon: Factory };
  }

  // Fallback High-Risk Industrial Hazard
  return { color: "#E11D48", label: "Industrial & Hazard Facility", icon: Factory };
}

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
  const isClinic =
    service.type === "clinic" ||
    /kliinik|polikliinik|tervisekeskus|meditsiin|arst|clinic/i.test(service.name);

  const hazardConfig = service.type === "hazard_site" ? getHazardCategoryConfig(service) : null;

  const cfg = isClinic
    ? CONFIGS.clinic
    : hazardConfig
    ? { color: hazardConfig.color, label: hazardConfig.label }
    : CONFIGS[service.type] ?? CONFIGS.hospital;

  const Icon = isClinic
    ? Heart
    : hazardConfig
    ? hazardConfig.icon
    : service.type === "hospital"
    ? Plus
    : service.type === "police"
    ? Shield
    : service.type === "fire_station"
    ? Flame
    : service.type === "shelter"
    ? Home
    : AlertTriangle;


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
