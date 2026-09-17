"use client";

import React, { memo, useState } from "react";
import {
  Hospital as HospitalIcon,
  Stethoscope,
  Shield,
  Flame,
  Home,
  AlertTriangle,
  Fuel,
  Zap,
  Droplets,
  Factory,
  FlaskConical,
  Warehouse,
} from "lucide-react";
import type { EmergencyService, EmergencyServiceType } from "../emergencyServicesData";

/*
 * Emergency marker: category is always expressed by a recognizable vector
 * symbol as well as by distinct color palette. Labels are intentionally opt-in
 * on hover or high zoom level to keep map clutter-free and location readable.
 */

type Cfg = { color: string; label: string; bgGlow: string };

const CONFIGS: Record<EmergencyServiceType, Cfg> = {
  hospital: {
    color: "#0284C7",
    label: "Hospital (24/7 ER)",
    bgGlow: "rgba(2, 132, 199, 0.4)",
  },
  clinic: {
    color: "#06B6D4",
    label: "Outpatient Clinic",
    bgGlow: "rgba(6, 182, 212, 0.4)",
  },
  police: {
    color: "#3B82F6",
    label: "Police Station",
    bgGlow: "rgba(59, 130, 246, 0.4)",
  },
  fire_station: {
    color: "#F97316",
    label: "Fire & Rescue",
    bgGlow: "rgba(249, 115, 22, 0.4)",
  },
  shelter: {
    color: "#10B981",
    label: "Emergency Shelter",
    bgGlow: "rgba(16, 185, 129, 0.4)",
  },
  hazard_site: {
    color: "#A855F7",
    label: "Hazard Site",
    bgGlow: "rgba(168, 85, 247, 0.4)",
  },
};

/** Helper to categorize hazard sites by building function / name */
export function getHazardCategoryConfig(service: EmergencyService): { color: string; label: string; icon: React.ElementType } {
  const name = service.name.toLowerCase();
  
  // Logistics, Storage & Warehouses (e.g., Ladu, DSV, Schenker, Cargo, Logistics)
  if (/ladu|warehouse|logistika|logistics|dsv|schenker|cargo|depoo|hoiustamine/i.test(name)) {
    return { color: "#A855F7", label: "Logistics & Storage Depot", icon: Warehouse };
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
    return { color: "#A855F7", label: "Heavy Industrial Facility", icon: Factory };
  }

  // Fallback High-Risk Industrial Hazard
  return { color: "#A855F7", label: "Industrial & Hazard Facility", icon: Factory };
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
  showLabel = false,
}: AppleMapsMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);

  const isClinic =
    service.type === "clinic" ||
    /kliinik|polikliinik|tervisekeskus|meditsiin|arst|clinic/i.test(service.name);

  const hazardConfig = service.type === "hazard_site" ? getHazardCategoryConfig(service) : null;

  const cfg = isClinic
    ? CONFIGS.clinic
    : hazardConfig
    ? { color: hazardConfig.color, label: hazardConfig.label, bgGlow: `${hazardConfig.color}55` }
    : CONFIGS[service.type] ?? CONFIGS.hospital;

  const Icon = isClinic
    ? Stethoscope
    : hazardConfig
    ? hazardConfig.icon
    : service.type === "hospital"
    ? HospitalIcon
    : service.type === "police"
    ? Shield
    : service.type === "fire_station"
    ? Flame
    : service.type === "shelter"
    ? Home
    : AlertTriangle;

  const activeHover = isHovered || isSelected;
  const renderLabel = activeHover || showLabel;

  return (
    <div
      className="relative flex flex-col items-center select-none group"
      style={{ zIndex: isSelected ? 99999 : isHovered ? 9999 : 20 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating Hover / Select Tooltip */}
      {renderLabel && (
        <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 pointer-events-none z-[99999] flex flex-col items-center">
          <div
            className="rounded-lg px-2.5 py-1.5 border flex flex-col items-center text-center whitespace-nowrap min-w-[130px] max-w-[220px]"
            style={{
              backgroundColor: "rgba(10, 14, 22, 0.98)",
              borderColor: cfg.color,
            }}
          >
            <span
              className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded mb-0.5"
              style={{ backgroundColor: `${cfg.color}25`, color: cfg.color }}
            >
              {cfg.label}
            </span>
            <span className="text-xs font-extrabold text-white leading-tight truncate w-full">
              {service.shortName}
            </span>
            {service.address && service.address !== "Address unavailable" && (
              <span className="text-[10px] text-slate-400 font-medium truncate w-full mt-0.5">
                {service.address}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Location Marker Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick(service);
        }}
        aria-label={`${cfg.label}: ${service.name}`}
        aria-pressed={isSelected}
        title={`${cfg.label}: ${service.name}`}
        className="flex cursor-pointer flex-col items-center bg-transparent p-0 transition-transform duration-100 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ outlineColor: cfg.color }}
      >
        {/* Main Pin Icon Frame */}
        <div
          style={{
            width: activeHover ? 32 : 28,
            height: activeHover ? 32 : 28,
            borderRadius: 8,
            border: `2px solid ${cfg.color}`,
            background: "rgba(13, 18, 26, 0.96)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "width 100ms ease, height 100ms ease",
            transform: activeHover ? "translateY(-2px)" : "none",
          }}
        >
          <Icon
            style={{
              color: cfg.color,
              width: activeHover ? 17 : 15,
              height: activeHover ? 17 : 15,
              strokeWidth: 2.4,
            }}
          />
        </div>

        {/* Pin Stem Pointer pointing directly to the ground location coordinate */}
        <div
          className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px]"
          style={{
            borderTopColor: cfg.color,
            marginTop: -1,
          }}
        />

        {/* Ground Target Square (instead of dot, no expensive shadow/pulse) */}
        <div className="relative flex items-center justify-center mt-[1px]">
          <div
            className="w-2.5 h-2.5 rounded-none border border-slate-950 transition-transform duration-100"
            style={{
              backgroundColor: cfg.color,
              transform: activeHover ? "scale(1.25)" : "scale(1)",
            }}
          />
        </div>
      </button>
    </div>
  );
});

