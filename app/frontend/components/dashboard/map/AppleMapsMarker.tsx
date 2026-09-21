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

type Cfg = { color: string; label: string };

const CONFIGS: Record<EmergencyServiceType, Cfg> = {
  hospital: {
    color: "#0284C7",
    label: "Hospital (24/7 ER)",
  },
  clinic: {
    color: "#06B6D4",
    label: "Outpatient Clinic",
  },
  police: {
    color: "#3B82F6",
    label: "Police Station",
  },
  fire_station: {
    color: "#F97316",
    label: "Fire & Rescue",
  },
  shelter: {
    color: "#10B981",
    label: "Emergency Shelter",
  },
  hazard_site: {
    color: "#A855F7",
    label: "Hazard Site",
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
}: AppleMapsMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);

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

  const activeHover = !isSelected && isHovered;

  return (
    <div
      className="relative flex flex-col items-center select-none group"
      style={{ zIndex: isSelected ? 1000000 : isHovered ? 999999 : 20 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating Hover Tooltip - Positioned on Top */}
      {!isSelected && isHovered && (
        <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 pointer-events-none z-[99999] flex flex-col items-center animate-in fade-in zoom-in-95 duration-150">
          <div
            className="rounded-lg px-2.5 py-1.5 border flex flex-col items-center text-center w-max max-w-[260px] min-w-[120px] overflow-hidden shadow-2xl backdrop-blur-md box-border"
            style={{
              backgroundColor: "rgba(10, 14, 22, 0.96)",
              borderColor: cfg.color,
              boxShadow: "0 4px 14px rgba(0,0,0,0.85)",
            }}
          >
            <span
              className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded mb-0.5 max-w-full truncate min-w-0 block"
              style={{ backgroundColor: `${cfg.color}25`, color: cfg.color }}
            >
              {cfg.label}
            </span>
            <span className="text-xs font-extrabold text-white leading-tight truncate max-w-full w-full min-w-0 block">
              {service.shortName || service.name}
            </span>
            {service.address && service.address !== "Address unavailable" && (
              <span className="text-[10px] text-slate-400 font-medium truncate max-w-full w-full min-w-0 block mt-0.5">
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
        className="relative flex cursor-pointer flex-col items-center bg-transparent p-0 transition-transform duration-150 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ outlineColor: cfg.color }}
      >
        {/* Main Pin Icon Frame */}
        <div
          style={{
            width: isSelected ? 36 : activeHover ? 32 : 28,
            height: isSelected ? 36 : activeHover ? 32 : 28,
            borderRadius: isSelected ? 10 : 8,
            border: isSelected ? `2.5px solid ${cfg.color}` : `2px solid ${cfg.color}`,
            background: isSelected ? "rgba(10, 15, 26, 0.98)" : "rgba(13, 18, 26, 0.96)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isSelected
              ? `0 4px 12px rgba(0,0,0,0.6), 0 0 0 2px ${cfg.color}`
              : activeHover
              ? `0 2px 8px rgba(0,0,0,0.5)`
              : "0 1px 3px rgba(0,0,0,0.4)",
            transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
            transform: isSelected ? "translateY(-4px)" : activeHover ? "translateY(-2px)" : "none",
          }}
        >
          <Icon
            style={{
              color: cfg.color,
              width: isSelected ? 19 : activeHover ? 17 : 15,
              height: isSelected ? 19 : activeHover ? 17 : 15,
              strokeWidth: isSelected ? 2.8 : 2.4,
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

        {/* Ground Target Square */}
        <div className="relative flex items-center justify-center mt-[1px]">
          <div
            className="w-2.5 h-2.5 rounded-none border border-slate-950 transition-transform duration-100"
            style={{
              backgroundColor: cfg.color,
              transform: isSelected ? "scale(1.4)" : activeHover ? "scale(1.25)" : "scale(1)",
            }}
          />
        </div>
      </button>
    </div>
  );
});

