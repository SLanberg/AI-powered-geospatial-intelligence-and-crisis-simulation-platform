"use client";

import React, { memo, useState } from "react";
import { Plane, Anchor, TrainTrack, Compass } from "lucide-react";
import type { TransportHub, TransportHubType } from "../transportHubsData";

type Cfg = { color: string; label: string };

const CONFIGS: Record<TransportHubType, Cfg> = {
  airport: { color: "#38BDF8", label: "Airport" },
  heliport: { color: "#38BDF8", label: "Heliport" },
  railway: { color: "#F59E0B", label: "Railway Hub" },
  port: { color: "#22D3EE", label: "Sea Port" },
};

function HeliportIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={style}
    >
      <line x1="6" y1="4" x2="6" y2="20" />
      <line x1="18" y1="4" x2="18" y2="20" />
      <line x1="6" y1="12" x2="18" y2="12" />
    </svg>
  );
}

interface TransportHubMarkerProps {
  hub: TransportHub;
  isSelected?: boolean;
  onClick: (hub: TransportHub) => void;
  showLabel?: boolean;
}

export const TransportHubMarker = memo(function TransportHubMarker({
  hub,
  isSelected = false,
  onClick,
  showLabel = false,
}: TransportHubMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);
  const cfg = CONFIGS[hub.type] ?? CONFIGS.airport;

  const renderIcon = () => {
    const iconStyle = {
      color: cfg.color,
      width: isSelected || isHovered ? 16 : 14,
      height: isSelected || isHovered ? 16 : 14,
      strokeWidth: 2.8,
    };

    if (hub.type === "heliport") {
      return <HeliportIcon style={iconStyle} />;
    }
    if (hub.type === "airport") {
      return <Plane style={{ ...iconStyle, transform: "rotate(-45deg)" }} />;
    }
    if (hub.type === "railway") {
      return <TrainTrack style={iconStyle} />;
    }
    if (hub.type === "port") {
      return <Anchor style={iconStyle} />;
    }
    return <Compass style={iconStyle} />;
  };

  const activeHover = isHovered || isSelected || showLabel;

  return (
    <div
      className="relative flex flex-col items-center select-none group"
      style={{ zIndex: isSelected ? 99999 : isHovered ? 9999 : 20 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Name Label Tooltip (Shown on Hover or Selection) */}
      {activeHover && (
        <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 pointer-events-none z-[99999] flex flex-col items-center animate-in fade-in zoom-in-95 duration-150">
          <div
            className="rounded-md px-2.5 py-1.5 border flex flex-col items-center text-center whitespace-nowrap min-w-[110px] max-w-[240px]"
            style={{
              backgroundColor: "rgba(10, 14, 20, 0.96)",
              borderColor: cfg.color,
              boxShadow: "0 4px 12px rgba(0,0,0,0.85)",
            }}
          >
            <span
              className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded mb-0.5"
              style={{ backgroundColor: `${cfg.color}25`, color: cfg.color }}
            >
              {hub.category || cfg.label}
            </span>
            <span className="text-xs font-extrabold text-white leading-tight truncate w-full">
              {hub.name || hub.shortName}
            </span>
            {hub.shortName && hub.name && hub.shortName !== hub.name && (
              <span className="text-[10px] text-slate-300 font-semibold truncate w-full mt-0.5">
                ({hub.shortName})
              </span>
            )}
          </div>
        </div>
      )}

      {/* Transport Hub Marker Icon Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick(hub);
        }}
        aria-label={`${cfg.label}: ${hub.name}`}
        aria-pressed={isSelected}
        title={`${cfg.label}: ${hub.name}`}
        className="flex cursor-pointer flex-col items-center select-none bg-transparent p-0 focus-visible:outline-2 focus-visible:outline-offset-2 transition-transform duration-100 active:scale-95"
        style={{ outlineColor: cfg.color }}
      >
        <div
          style={{
            width: isSelected || isHovered ? 30 : 26,
            height: isSelected || isHovered ? 30 : 26,
            borderRadius: 6,
            border: `2px solid ${cfg.color}`,
            background: "rgba(18, 24, 32, 0.94)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "width 120ms ease, height 120ms ease, box-shadow 120ms ease, transform 120ms ease",
            transform: isHovered ? "translateY(-1px)" : "none",
            boxShadow: isSelected || isHovered ? `0 0 0 4px ${cfg.color}44` : "0 1px 3px rgba(0,0,0,0.55)",
            opacity: isSelected || isHovered ? 1 : 0.96,
          }}
        >
          {renderIcon()}
        </div>
      </button>
    </div>
  );
});
