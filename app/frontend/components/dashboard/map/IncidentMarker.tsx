"use client";

import React, { memo, useState } from "react";
import {
  AlertTriangle,
  Zap,
  Flame,
  Droplets,
  Radio,
  Car,
  ShieldAlert,
  Activity,
  AlertCircle,
} from "lucide-react";
import type { Incident } from "../data";
import { MakiIcon, getMakiIconNameForIncident } from "./MakiIcon";

interface IncidentMarkerProps {
  inc: Incident;
  isSelected?: boolean;
  onClick: (inc: Incident) => void;
}

export const IncidentMarker = memo(function IncidentMarker({
  inc,
  isSelected = false,
  onClick,
}: IncidentMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);

  const severity = (inc.severity || "info").toLowerCase();
  const isCritical = severity === "critical" || severity === "emergency";
  const isWarning = severity === "warning" || severity === "attention";
  const isActive = inc.status === "active";

  const config = isCritical
    ? {
        color: "#EF4444",
        pulseBg: "bg-red-500",
        badgeBg: "bg-red-500/20 text-red-300 border-red-500/40",
        border: "border-red-500",
        label: "CRITICAL ALERT",
      }
    : isWarning
    ? {
        color: "#F59E0B",
        pulseBg: "bg-amber-500",
        badgeBg: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        border: "border-amber-500",
        label: "WARNING",
      }
    : {
        color: "#06B6D4",
        pulseBg: "bg-cyan-500",
        badgeBg: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
        border: "border-cyan-500",
        label: "INCIDENT",
      };

  const makiIconName = getMakiIconNameForIncident(inc);
  const activeHover = !isSelected && isHovered;

  return (
    <div
      className="relative flex flex-col items-center select-none group"
      style={{ zIndex: isSelected ? 1000000 : isHovered ? 999999 : 45 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Floating Hover Tactical Tooltip */}
      {!isSelected && isHovered && (
        <div className="absolute bottom-[calc(100%+10px)] left-1/2 -translate-x-1/2 pointer-events-none z-[999999] flex flex-col items-center animate-in fade-in zoom-in-95 duration-150">
          <div
            className="rounded-lg px-2.5 py-1.5 border flex flex-col items-center text-center w-max max-w-[280px] min-w-[130px] overflow-hidden shadow-md box-border"
            style={{
              backgroundColor: "rgba(10, 14, 22, 0.96)",
              borderColor: config.color,
              boxShadow: "0 4px 12px rgba(0,0,0,0.6)",
            }}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className={`text-[9px] font-mono font-black tracking-wider uppercase px-1.5 py-0.2 rounded border ${config.badgeBg}`}
              >
                {config.label}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                {inc.timestamp}
              </span>
            </div>
            <span className="text-xs font-bold text-white leading-snug truncate max-w-full w-full min-w-0 block">
              {inc.title}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-full">
              <span>{inc.category}</span>
              <span>·</span>
              <span className="text-slate-300 font-semibold">{inc.nodeId}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Location Marker Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClick(inc);
        }}
        aria-label={`${config.label}: ${inc.title}`}
        aria-pressed={isSelected}
        title={`${config.label}: ${inc.title} (${inc.nodeId})`}
        className="relative flex cursor-pointer flex-col items-center bg-transparent p-0 transition-all duration-150 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ outlineColor: config.color }}
      >
        {/* Main Tactical Pin Icon Frame */}
        <div
          style={{
            width: isSelected ? 38 : activeHover ? 34 : 30,
            height: isSelected ? 38 : activeHover ? 34 : 30,
            borderRadius: 10,
            border: isSelected
              ? `2.5px solid #FFFFFF`
              : `2px solid ${config.color}`,
            background: isSelected
              ? config.color
              : "rgba(12, 16, 26, 0.96)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: isSelected
              ? "0 4px 12px rgba(0,0,0,0.6)"
              : activeHover
              ? "0 2px 8px rgba(0,0,0,0.5)"
              : "0 1px 3px rgba(0,0,0,0.4)",
            transition: "all 150ms cubic-bezier(0.4, 0, 0.2, 1)",
            transform: isSelected
              ? "translateY(-4px) scale(1.1)"
              : activeHover
              ? "translateY(-2px) scale(1.05)"
              : "none",
          }}
        >
          <div className={isSelected ? "text-white" : ""}>
            <MakiIcon
              name={makiIconName}
              size={isSelected ? 18 : activeHover ? 16 : 14}
              className={isSelected ? "text-white drop-shadow" : ""}
            />
          </div>
        </div>

        {/* Pin Stem Pointer pointing directly to the ground location coordinate */}
        <div
          className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px]"
          style={{
            borderTopColor: isSelected ? "#FFFFFF" : config.color,
            marginTop: -1,
          }}
        />

        {/* Ground Target Beacon Square / Crosshair */}
        <div className="relative flex items-center justify-center mt-[1px]">
          <div
            className="w-2.5 h-2.5 rounded-none border border-slate-950 transition-transform duration-100"
            style={{
              backgroundColor: isSelected ? "#FFFFFF" : config.color,
              transform: isSelected ? "scale(1.4)" : activeHover ? "scale(1.2)" : "scale(1)",
            }}
          />
        </div>

        {/* Tactical Node ID Label Tag */}
        <div
          className={`
            mt-1 whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[9px] font-bold shadow-md transition-all
            ${
              isSelected
                ? "bg-slate-950 text-white border-2 border-white shadow-xl scale-110"
                : activeHover
                ? "bg-slate-950/95 text-white border border-slate-500 shadow-md"
                : "bg-slate-950/90 text-slate-200 border border-slate-700/80"
            }
          `}
          style={isSelected ? { borderColor: config.color } : {}}
        >
          <span className="flex items-center gap-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${config.pulseBg}`}
            />
            {inc.nodeId || inc.id}
          </span>
        </div>
      </button>
    </div>
  );
});
