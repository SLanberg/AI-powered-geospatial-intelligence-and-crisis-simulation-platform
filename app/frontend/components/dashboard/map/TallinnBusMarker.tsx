"use client";

import React, { memo, useState } from "react";
import type { PublicTransportData } from "@/shared";
import { PublicTransportIcon, getPublicTransportTheme } from "./PublicTransportIcon";

interface TallinnBusMarkerProps {
  vehicle: PublicTransportData;
  isSelected?: boolean;
  onClick: (vehicle: PublicTransportData) => void;
  zoom?: number;
}

/**
 * Convert bearing degrees to cardinal direction string with arrow symbol
 */
function getCardinalDirection(deg: number): { text: string; arrow: string } {
  const directions = [
    { text: "N", arrow: "↑" },
    { text: "NE", arrow: "↗" },
    { text: "E", arrow: "→" },
    { text: "SE", arrow: "↘" },
    { text: "S", arrow: "↓" },
    { text: "SW", arrow: "↙" },
    { text: "W", arrow: "←" },
    { text: "NW", arrow: "↖" },
  ];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
}

/**
 * MUJI-Inspired Minimalist Public Transport Marker
 * High legibility, serene typography, zero clutter, exact road placement with prominent direction arrows.
 */
export const TallinnBusMarker = memo(function TallinnBusMarker({
  vehicle,
  isSelected = false,
  onClick,
  zoom = 14,
}: TallinnBusMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const theme = getPublicTransportTheme(vehicle.type);

  const isLowZoom = zoom < 12;
  const isHighZoom = zoom >= 14.5;
  const cardDir = getCardinalDirection(vehicle.bearing);

  return (
    <div
      className="relative flex items-center justify-center select-none group cursor-pointer"
      style={{
        zIndex: isSelected ? 99999 : isHovered ? 9999 : 50,
        width: 0,
        height: 0,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Tooltip on Hover - MUJI Product Card */}
      {isHovered && !isSelected && (
        <div className="absolute bottom-7 left-1/2 -translate-x-1/2 pointer-events-none z-[99999] flex flex-col items-center animate-in fade-in zoom-in-95 duration-150">
          <div
            className="rounded-lg px-2.5 py-1.5 border border-slate-700/80 bg-[#0B0F17]/96 text-slate-100 shadow-2xl backdrop-blur-md flex flex-col items-center text-center w-max max-w-[220px]"
            style={{
              boxShadow: "0 8px 24px rgba(0,0,0,0.75)",
            }}
          >
            {/* Header: Line Badge & ID */}
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="text-[10px] font-black tracking-wide px-1.5 py-0.2 rounded text-white flex items-center gap-1 leading-tight"
                style={{ backgroundColor: theme.color }}
              >
                <PublicTransportIcon type={vehicle.type} size={11} color="#ffffff" />
                Line {vehicle.route}
              </span>
              <span className="text-[9px] text-slate-400 font-mono">
                #{vehicle.id}
              </span>
            </div>

            {/* Headsign Destination */}
            <span className="text-[11px] font-bold text-white truncate max-w-full block leading-tight">
              {vehicle.destination || "In Service"}
            </span>

            {/* Telemetry Stats with Cardinal Arrow */}
            <div className="flex items-center gap-1.5 text-[9px] text-slate-300 mt-1 pt-1 border-t border-slate-800/80 w-full justify-center">
              <span>{Math.round(vehicle.speed)} km/h</span>
              <span>•</span>
              <span className="flex items-center gap-0.5 font-medium text-white">
                {cardDir.arrow} {vehicle.bearing}° {cardDir.text}
              </span>
              {vehicle.lowFloor && (
                <>
                  <span>•</span>
                  <span className="text-cyan-400 font-medium">♿ Low-Floor</span>
                </>
              )}
            </div>
          </div>

          {/* Minimalist Pointer Triangle */}
          <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-slate-700/80" />
        </div>
      )}

      {/* Outer Prominent Directional Navigation Arrow (Rotates around vehicle coordinate center) */}
      <div
        className="absolute pointer-events-none transition-transform duration-300 z-20 flex items-center justify-center"
        style={{
          transform: `rotate(${vehicle.bearing}deg)`,
          width: 0,
          height: 0,
        }}
      >
        {/* Crisp Upward Vector Arrow positioned outside the top edge of the marker */}
        <div
          className="absolute"
          style={{
            top: isLowZoom ? "-16px" : "-20px",
          }}
        >
          <svg
            viewBox="0 0 16 18"
            width={isLowZoom ? 12 : 14}
            height={isLowZoom ? 14 : 16}
            fill="none"
            className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]"
          >
            {/* High-contrast Arrowhead with thick stroke & solid fill */}
            <path
              d="M8 1L15 16L8 12.5L1 16L8 1Z"
              fill={theme.color}
              stroke="#ffffff"
              strokeWidth="1.8"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* Main MUJI Vehicle Marker Button (Centered exactly on coordinates) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick(vehicle);
        }}
        aria-label={`${theme.label} Line ${vehicle.route} to ${vehicle.destination}, Heading ${vehicle.bearing} degrees`}
        className="absolute flex items-center justify-center cursor-pointer select-none bg-transparent p-0 transition-transform duration-150 active:scale-95 z-10"
        style={{
          transform: "translate(-50%, -50%)",
        }}
      >
        {/* MUJI Capsule Marker Body */}
        {isLowZoom ? (
          /* Low Zoom: Minimalist Transit Circle Badge */
          <div
            className="flex items-center justify-center rounded-full transition-all duration-150 border shadow-lg"
            style={{
              width: isSelected ? 26 : isHovered ? 24 : 20,
              height: isSelected ? 26 : isHovered ? 24 : 20,
              backgroundColor: "rgba(11, 15, 23, 0.96)",
              borderColor: isSelected ? "#ffffff" : theme.color,
              boxShadow: isSelected
                ? `0 0 0 2px ${theme.color}, 0 4px 10px rgba(0,0,0,0.85)`
                : "0 2px 6px rgba(0,0,0,0.6)",
            }}
          >
            <span
              className="text-[9px] font-black leading-none text-white"
              style={{ color: isSelected ? "#ffffff" : theme.color }}
            >
              {vehicle.route}
            </span>
          </div>
        ) : (
          /* Mid / High Zoom: MUJI Clean Capsule Pill */
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all duration-150 border backdrop-blur-md shadow-lg"
            style={{
              backgroundColor: isSelected ? "rgba(15, 23, 42, 0.98)" : "rgba(11, 16, 26, 0.94)",
              borderColor: isSelected ? "#ffffff" : "rgba(71, 85, 105, 0.9)",
              boxShadow: isSelected
                ? `0 0 0 2.5px ${theme.color}, 0 6px 16px rgba(0,0,0,0.85)`
                : isHovered
                ? `0 4px 12px rgba(0,0,0,0.75), 0 0 0 1px ${theme.color}`
                : `0 2px 8px rgba(0,0,0,0.65)`,
            }}
          >
            {/* Mode Color Indicator Dot */}
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: theme.color }}
            />

            {/* Mode Vector Icon */}
            <PublicTransportIcon
              type={vehicle.type}
              size={13}
              color={theme.color}
              className="shrink-0"
            />

            {/* Route Number Text */}
            <span className="text-[11px] font-black text-white tracking-tight leading-none">
              {vehicle.route}
            </span>

            {/* Mini Cardinal Bearing Arrow Icon inside Pill */}
            <span
              className="text-[10px] font-bold text-slate-300 leading-none"
              title={`Heading ${vehicle.bearing}° (${cardDir.text})`}
            >
              {cardDir.arrow}
            </span>

            {/* Destination Preview on High Zoom */}
            {isHighZoom && vehicle.destination && (
              <span className="text-[10px] font-medium text-slate-300 truncate max-w-[75px] pl-1 border-l border-slate-700/80 leading-none">
                {vehicle.destination}
              </span>
            )}
          </div>
        )}
      </button>
    </div>
  );
});
