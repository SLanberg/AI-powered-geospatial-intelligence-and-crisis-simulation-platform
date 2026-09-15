"use client";

import React, { memo } from "react";
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
  showLabel = true,
}: TransportHubMarkerProps) {
  const cfg = CONFIGS[hub.type] ?? CONFIGS.airport;

  const renderIcon = () => {
    const iconStyle = {
      color: cfg.color,
      width: isSelected ? 16 : 14,
      height: isSelected ? 16 : 14,
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

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(hub);
      }}
      aria-label={`${cfg.label}: ${hub.name}`}
      aria-pressed={isSelected}
      title={`${cfg.label}: ${hub.name}`}
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
        {renderIcon()}
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
          {hub.shortName}
        </span>
      )}
    </button>
  );
});
