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
  | "special"
  | "yacht"
  | "other";

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
    cargo: "#00A896",     // Cargo ships & General vessels (Deep Teal / Turquoise)
    tanker: "#0284C7",    // Tanker ships (Cobalt / Deep Blue)
    passenger: "#00F5D4", // Passenger ships & Ferries (Bright Cyan / Turquoise)
    yacht: "#EC4899",     // Yachts / Pleasure craft / Speedboats (Vibrant Pink / Rose)
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
    if (type === "passenger" || type === "ferry") return DOMAIN_COLOR_PALETTE.maritime.passenger;
    if (type === "yacht" || type === "speedboat") return DOMAIN_COLOR_PALETTE.maritime.yacht;
    if (type === "tanker") return DOMAIN_COLOR_PALETTE.maritime.tanker;
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

export const MapObjectVector = React.memo(function MapObjectVector({
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
      className={`relative flex items-center justify-center rounded-full bg-slate-950/85 backdrop-blur-xs transition-transform will-change-transform ${getStatusRingStyle()} ${
        isSelected ? "ring-2 ring-cyan-400 scale-110 z-20" : ""
      }`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
    >
      {/* Rotatable SVG Silhouette */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out will-change-transform"
        style={{ transform: `rotate(${heading}deg)` }}
      >
        {domain === "air" ? (
          type === "helicopter" || type === "ga" ? (
            /* High-Precision Maki Heliport / Helicopter Silhouette */
            <svg
              viewBox="0 0 24 24"
              className="w-5.5 h-5.5 drop-shadow-md"
              fill={domainFill}
            >
              {/* Rotor disc hub */}
              <circle cx="12" cy="9.5" r="1.5" fill="#ffffff" />
              {/* Main rotor blades */}
              <path
                d="M12 1.5A0.75 0.75 0 0 1 12.75 2.25V8H18.5A0.75 0.75 0 0 1 18.5 9.5H12.75V15.25A0.75 0.75 0 0 1 11.25 15.25V9.5H5.5A0.75 0.75 0 0 1 5.5 8H11.25V2.25A0.75 0.75 0 0 1 12 1.5Z"
                opacity="0.9"
              />
              {/* Cockpit fuselage & tail rotor boom */}
              <path d="M12 4C10.2 4 8.8 6 8.8 9C8.8 11.5 9.8 13.5 11 16V20.5C10 20.5 9.5 21 9.5 21.5C9.5 22 10 22.5 12 22.5C14 22.5 14.5 22 14.5 21.5C14.5 21 14 20.5 13 20.5V16C14.2 13.5 15.2 11.5 15.2 9C15.2 6 13.8 4 12 4ZM12 6.5C12.8 6.5 13.5 7.2 13.5 8C13.5 8.8 12.8 9.5 12 9.5C11.2 9.5 10.5 8.8 10.5 8C10.5 7.2 11.2 6.5 12 6.5Z" />
            </svg>
          ) : (
            /* High-Precision Maki Airport / Airliner Airplane Silhouette */
            <svg
              viewBox="0 0 24 24"
              className="w-5.5 h-5.5 drop-shadow-md"
              fill={domainFill}
            >
              <path d="M12 2C11.45 2 11 2.45 11 3V8.5L3 13V15L11 12.5V18.5L8.5 20.5V22L12 21L15.5 22V20.5L13 18.5V12.5L21 15V13L13 8.5V3C13 2.45 12.55 2 12 2Z" />
            </svg>
          )
        ) : domain === "maritime" ? (
          type === "yacht" || type === "speedboat" ? (
            /* Yacht / Speedboat Hull Silhouette SVG */
            <svg
              viewBox="0 0 24 24"
              className="w-5.5 h-5.5 drop-shadow-xs"
              fill={domainFill}
            >
              <path d="M12 1.5C10.5 4 9 7.5 8.2 12C7.5 15.5 8 19 9 22.5H15C16 19 16.5 15.5 15.8 12C15 7.5 13.5 4 12 1.5ZM12 5.5L13.8 10.5H10.2L12 5.5Z" />
            </svg>
          ) : type === "passenger" || type === "ferry" ? (
            /* Passenger Ship / Ferry Hull Silhouette SVG */
            <svg
              viewBox="0 0 24 24"
              className="w-5.5 h-5.5 drop-shadow-xs"
              fill={domainFill}
            >
              <path d="M12 1C10 4 8.5 7.5 8.5 12.5C8.5 17 9 20 9.5 23H14.5C15 20 15.5 17 15.5 12.5C15.5 7.5 14 4 12 1ZM9.5 7.5H14.5V9.5H9.5V7.5ZM9.5 11.5H14.5V13.5H9.5V11.5ZM9.5 15.5H14.5V17.5H9.5V15.5Z" />
            </svg>
          ) : (
            /* Vessel Hull Silhouette SVG (Cargo/Ship/Tanker) */
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
});

