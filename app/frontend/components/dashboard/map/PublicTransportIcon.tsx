"use client";

import React from "react";
import type { PublicTransportType } from "@/shared";

export interface PublicTransportIconProps extends React.SVGProps<SVGSVGElement> {
  type: PublicTransportType | string;
  size?: number;
  className?: string;
  color?: string;
}

export interface TransitTheme {
  color: string;
  bg: string;
  badgeBg: string;
  border: string;
  label: string;
  darkBg: string;
}

/**
 * Get Google Transit style color theme for Tallinn public transport vehicles
 */
export function getPublicTransportTheme(type: PublicTransportType | string): TransitTheme {
  switch (type) {
    case "tram":
      return {
        color: "#10b981", // Emerald Green
        bg: "#064e3b",
        badgeBg: "rgba(16, 185, 129, 0.2)",
        border: "#34d399",
        label: "Tram",
        darkBg: "rgba(6, 78, 59, 0.95)",
      };
    case "trolleybus":
      return {
        color: "#0288d1", // Deep Transit Cyan
        bg: "#0c4a6e",
        badgeBg: "rgba(2, 136, 209, 0.2)",
        border: "#38bdf8",
        label: "Trolleybus",
        darkBg: "rgba(12, 74, 110, 0.95)",
      };
    case "night_bus":
      return {
        color: "#8b5cf6", // Transit Purple
        bg: "#4c1d95",
        badgeBg: "rgba(139, 92, 246, 0.2)",
        border: "#c084fc",
        label: "Night Bus",
        darkBg: "rgba(76, 29, 149, 0.95)",
      };
    case "bus":
    default:
      return {
        color: "#0065b3", // Tallinn Royal Blue / Google Transit Blue (#1a73e8)
        bg: "#1e3a8a",
        badgeBg: "rgba(0, 101, 179, 0.2)",
        border: "#60a5fa",
        label: "Bus",
        darkBg: "rgba(30, 58, 138, 0.95)",
      };
  }
}

/**
 * High-precision Google Maps Transit Style SVG Icon Component
 */
export function PublicTransportIcon({
  type,
  size = 18,
  className = "",
  color,
  ...props
}: PublicTransportIconProps) {
  const theme = getPublicTransportTheme(type);
  const iconColor = color || "currentColor";

  const renderIconContent = () => {
    switch (type) {
      case "tram":
        // Modern Front Tram SVG with Pantograph overhead collector
        return (
          <g fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {/* Pantograph (Overhead wire connector) */}
            <path d="M12 2v2M8 4h8M9.5 4l2.5 3 2.5-3" strokeWidth="1.4" />
            
            {/* Tram Body Outer Shell */}
            <rect x="4" y="7" width="16" height="14" rx="2.5" fill={iconColor} fillOpacity="0.15" />
            
            {/* Windshield */}
            <rect x="5.5" y="8.5" width="13" height="5.5" rx="1" fill={iconColor} fillOpacity="0.3" />
            
            {/* Route/Destination Header Box */}
            <rect x="8" y="7.5" width="8" height="1.5" rx="0.5" fill={iconColor} />
            
            {/* Lower Headlights & Bumper */}
            <circle cx="7.5" cy="17.5" r="1.2" fill={iconColor} />
            <circle cx="16.5" cy="17.5" r="1.2" fill={iconColor} />
            <line x1="10" y1="17.5" x2="14" y2="17.5" strokeWidth="2" />
            
            {/* Tracks/Wheels base */}
            <path d="M6 21h12M7 21l-1 2M17 21l1 2" strokeWidth="1.5" />
          </g>
        );

      case "trolleybus":
        // Modern Trolleybus SVG with Overhead Dual Trolley Poles
        return (
          <g fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {/* Overhead Dual Trolley Poles */}
            <line x1="6" y1="1.5" x2="10.5" y2="6.5" strokeWidth="1.4" />
            <line x1="18" y1="1.5" x2="13.5" y2="6.5" strokeWidth="1.4" />
            <circle cx="6" cy="1.5" r="0.8" fill={iconColor} />
            <circle cx="18" cy="1.5" r="0.8" fill={iconColor} />
            
            {/* Bus Body */}
            <rect x="4" y="6.5" width="16" height="14.5" rx="2.5" fill={iconColor} fillOpacity="0.15" />
            
            {/* Windshield */}
            <rect x="5.5" y="8" width="13" height="5.5" rx="1" fill={iconColor} fillOpacity="0.3" />
            
            {/* Side Mirrors */}
            <line x1="2.5" y1="9.5" x2="4" y2="9.5" strokeWidth="1.8" />
            <line x1="20" y1="9.5" x2="21.5" y2="9.5" strokeWidth="1.8" />
            
            {/* Headlights */}
            <circle cx="7" cy="17" r="1.2" fill={iconColor} />
            <circle cx="17" cy="17" r="1.2" fill={iconColor} />
            <rect x="10" y="16.2" width="4" height="1.6" rx="0.5" fill={iconColor} />
            
            {/* Wheels */}
            <rect x="5.5" y="21" width="3" height="1.5" rx="0.5" fill={iconColor} />
            <rect x="15.5" y="21" width="3" height="1.5" rx="0.5" fill={iconColor} />
          </g>
        );

      case "night_bus":
        // Night Bus SVG with Crescent Moon Accent
        return (
          <g fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {/* Crescent Moon Header */}
            <path d="M17.5 2a3 3 0 0 0-3 3 3 3 0 0 0 2.2 2.9A3.2 3.2 0 0 1 15 8a3 3 0 0 1-3-3c0-.6.17-1.16.47-1.63A3 3 0 0 0 17.5 2z" fill={iconColor} stroke="none" />
            
            {/* Bus Body */}
            <rect x="4" y="6" width="16" height="15" rx="2.5" fill={iconColor} fillOpacity="0.15" />
            
            {/* Windshield */}
            <rect x="5.5" y="7.5" width="13" height="5.5" rx="1" fill={iconColor} fillOpacity="0.3" />
            
            {/* Side Mirrors */}
            <line x1="2.5" y1="9" x2="4" y2="9" strokeWidth="1.8" />
            <line x1="20" y1="9" x2="21.5" y2="9" strokeWidth="1.8" />
            
            {/* Headlights */}
            <circle cx="7" cy="17" r="1.2" fill={iconColor} />
            <circle cx="17" cy="17" r="1.2" fill={iconColor} />
            
            {/* Wheels */}
            <rect x="5.5" y="21" width="3" height="1.8" rx="0.5" fill={iconColor} />
            <rect x="15.5" y="21" width="3" height="1.8" rx="0.5" fill={iconColor} />
          </g>
        );

      case "bus":
      default:
        // Google Maps Standard Front Bus SVG
        return (
          <g fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {/* Bus Body Outer Frame */}
            <rect x="4" y="3.5" width="16" height="16.5" rx="3" fill={iconColor} fillOpacity="0.15" />
            
            {/* Destination Sign Box Header */}
            <rect x="7.5" y="4.8" width="9" height="1.8" rx="0.6" fill={iconColor} />
            
            {/* Main Windshield Glass */}
            <rect x="5.5" y="7.5" width="13" height="6" rx="1.2" fill={iconColor} fillOpacity="0.35" />
            
            {/* Windshield Center Divider Line */}
            <line x1="12" y1="7.5" x2="12" y2="13.5" strokeWidth="1.2" strokeOpacity="0.7" />
            
            {/* Side Mirrors */}
            <path d="M2.5 9h1.5M20 9h1.5" strokeWidth="1.8" />
            
            {/* Headlights & Front Grille */}
            <circle cx="7" cy="16.5" r="1.3" fill={iconColor} />
            <circle cx="17" cy="16.5" r="1.3" fill={iconColor} />
            <line x1="10" y1="16.5" x2="14" y2="16.5" strokeWidth="2" />
            
            {/* Bottom Tires */}
            <rect x="5.5" y="20" width="3.2" height="2" rx="0.6" fill={iconColor} />
            <rect x="15.3" y="20" width="3.2" height="2" rx="0.6" fill={iconColor} />
          </g>
        );
    }
  };

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`shrink-0 inline-block align-middle ${className}`}
      aria-hidden="true"
      {...props}
    >
      {renderIconContent()}
    </svg>
  );
}
