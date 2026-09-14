"use client";

import React from "react";

export type DomainType = "air" | "maritime" | "ground";

export type AirObjectType =
  | "plane"
  | "commercial"
  | "helicopter"
  | "ga"
  | "military"
  | "special";

export type MaritimeObjectType =
  | "vessel"
  | "cargo"
  | "tanker"
  | "passenger"
  | "ferry"
  | "speedboat"
  | "tug"
  | "special";

export type GroundObjectType =
  | "rail"
  | "train"
  | "transit"
  | "bus"
  | "tram"
  | "truck"
  | "cargo_truck";

export type ObjectType = AirObjectType | MaritimeObjectType | GroundObjectType;

export type TargetStatus = "normal" | "warning" | "alarm" | "critical" | "lost" | "inactive";

interface MapObjectVectorProps {
  domain: DomainType;
  type: ObjectType;
  heading: number; // 0 - 360 degrees
  status?: TargetStatus;
  size?: number; // size in px, default 34
  isSelected?: boolean;
}

/**
 * Standardized Transport & Overlay Color Palette
 */
export const DOMAIN_COLOR_PALETTE = {
  air: {
    commercial: "#FFC700", // Civilian / Commercial Aviation (Bright Yellow)
    helicopter: "#00C7FF", // Helicopter / General Aviation (Electric Light Blue)
    military: "#AF52DE",   // Military / Special Aviation (Dark Purple / Magenta)
  },
  maritime: {
    cargo: "#00A896",     // Cargo ships & Tankers (Deep Blue / Turquoise)
    passenger: "#00F5D4", // Passenger ships & Ferries (Bright Cyan / Turquoise)
    special: "#2EC4B6",   // Special vessels: tugs, pilots, rescue (Malachite / Dark Green)
  },
  ground: {
    rail: "#8E8E93",      // Rail transport: trains, commuter rail (Steel / Neutral Gray)
    transit: "#30D158",   // Public city transit: buses, trams (Bright Green)
    cargo: "#C67D5A",     // Freight road transport: trucks, logistics (Terracotta / Brown)
  },
  overlay: {
    alarm: "#FF3B30",     // Critical status / Emergency SOS (Bright Red)
    lost: "#48484A",      // Lost signal / Inactive (Muted Dark Gray)
    warning: "#FF9500",   // Warning status (Orange)
  },
};

export function getObjectFillColor(domain: DomainType, type: ObjectType, status: TargetStatus = "normal"): string {
  if (status === "lost" || status === "inactive") {
    return DOMAIN_COLOR_PALETTE.overlay.lost;
  }

  if (domain === "air") {
    if (type === "military" || type === "special") return DOMAIN_COLOR_PALETTE.air.military;
    if (type === "helicopter" || type === "ga") return DOMAIN_COLOR_PALETTE.air.helicopter;
    return DOMAIN_COLOR_PALETTE.air.commercial;
  }

  if (domain === "maritime") {
    if (type === "passenger" || type === "ferry" || type === "speedboat") return DOMAIN_COLOR_PALETTE.maritime.passenger;
    if (type === "tug" || type === "special") return DOMAIN_COLOR_PALETTE.maritime.special;
    return DOMAIN_COLOR_PALETTE.maritime.cargo;
  }

  if (domain === "ground") {
    if (type === "rail" || type === "train") return DOMAIN_COLOR_PALETTE.ground.rail;
    if (type === "transit" || type === "bus" || type === "tram") return DOMAIN_COLOR_PALETTE.ground.transit;
    return DOMAIN_COLOR_PALETTE.ground.cargo;
  }

  return "#FFC700";
}

export function MapObjectVector({
  domain,
  type,
  heading,
  status = "normal",
  size = 34,
  isSelected = false,
}: MapObjectVectorProps) {
  const domainFill = getObjectFillColor(domain, type, status);

  // Contour status ring (Separate border element, does NOT obscure primary domain color)
  const getStatusRingStyle = () => {
    switch (status) {
      case "alarm":
      case "critical":
        return "border-2 border-[#FF3B30] ring-2 ring-[#FF3B30]/40 animate-pulse";
      case "warning":
        return "border-2 border-[#FF9500] ring-1 ring-[#FF9500]/30";
      case "lost":
      case "inactive":
        return "border-2 border-dashed border-[#48484A] opacity-60";
      case "normal":
      default:
        return "border border-slate-700/80";
    }
  };

  return (
    <div
      className={`relative flex items-center justify-center rounded-full bg-slate-950/85 backdrop-blur-xs transition-transform ${getStatusRingStyle()} ${
        isSelected ? "ring-2 ring-cyan-400 scale-110 z-20" : ""
      }`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      {/* Rotatable SVG Silhouette */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
        style={{ transform: `rotate(${heading}deg)` }}
      >
        {domain === "air" ? (
          type === "helicopter" || type === "ga" ? (
            /* Helicopter Silhouette SVG */
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 drop-shadow-xs"
              fill={domainFill}
            >
              <circle cx="12" cy="12" r="1.5" fill="#ffffff" />
              <path d="M12 2a.75.75 0 0 1 .75.75V7h5.25a.75.75 0 0 1 0 1.5H12.75v3.5h3.5a1.25 1.25 0 0 1 1.25 1.25v.75H19a.75.75 0 0 1 0 1.5h-1.5v.5a.75.75 0 0 1-1.5 0v-.5h-8v.5a.75.75 0 0 1-1.5 0v-.5H5a.75.75 0 0 1 0-1.5h1.5v-.75A1.25 1.25 0 0 1 7.75 12h3.5V8.5H6a.75.75 0 0 1 0-1.5h5.25V2.75A.75.75 0 0 1 12 2z" />
            </svg>
          ) : (
            /* Airplane Silhouette SVG */
            <svg
              viewBox="0 0 24 24"
              className="w-5 h-5 drop-shadow-xs"
              fill={domainFill}
            >
              <path d="M12 1.5L9.5 8.5H2L4.5 13H9.5V18.5L7 20.5V22.5L12 21L17 22.5V20.5L14.5 18.5V13H19.5L22 8.5H14.5L12 1.5Z" />
            </svg>
          )
        ) : domain === "maritime" ? (
          type === "passenger" || type === "ferry" || type === "speedboat" ? (
            /* Speedboat / Passenger Hull Silhouette SVG */
            <svg
              viewBox="0 0 24 24"
              className="w-5.5 h-5.5 drop-shadow-xs"
              fill={domainFill}
            >
              <path d="M12 1.5C10.5 4.5 9 8 8 13C7.5 15.5 8 19 9 22.5H15C16 19 16.5 15.5 16 13C15 8 13.5 4.5 12 1.5ZM12 5.5L13.5 10H10.5L12 5.5Z" />
            </svg>
          ) : (
            /* Vessel Hull Silhouette SVG (Cargo/Ship) */
            <svg
              viewBox="0 0 24 24"
              className="w-5.5 h-5.5 drop-shadow-xs"
              fill={domainFill}
            >
              <path d="M12 1C10 4 8.5 7.5 8.5 12.5C8.5 17 9 20 9.5 23H14.5C15 20 15.5 17 15.5 12.5C15.5 7.5 14 4 12 1ZM10 10H14V14H10V10Z" />
            </svg>
          )
        ) : (
          /* Ground Transport Vehicle Silhouette SVG */
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 drop-shadow-xs"
            fill={domainFill}
          >
            <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
          </svg>
        )}
      </div>
    </div>
  );
}

