"use client";

import React, { memo } from "react";
import { X, Compass, Gauge, Accessibility, Clock, MapPin, Radio } from "lucide-react";
import type { PublicTransportData } from "@/shared";
import { PublicTransportIcon, getPublicTransportTheme } from "./PublicTransportIcon";

interface TallinnBusPopupProps {
  vehicle: PublicTransportData;
  onClose: () => void;
}

export const TallinnBusPopup = memo(function TallinnBusPopup({
  vehicle,
  onClose,
}: TallinnBusPopupProps) {
  const theme = getPublicTransportTheme(vehicle.type);

  // Convert bearing degrees to cardinal direction string
  const getCardinalDirection = (deg: number): string => {
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
  };

  const timeString = vehicle.timestamp
    ? new Date(vehicle.timestamp).toLocaleTimeString()
    : "Just now";

  return (
    <div
      className="rounded-xl border border-slate-800 bg-[#0C1017]/96 text-slate-100 p-3.5 shadow-2xl backdrop-blur-md w-[280px] text-xs select-none animate-in fade-in zoom-in-95 duration-150 relative"
      style={{ boxShadow: `0 12px 32px rgba(0,0,0,0.85)` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80 gap-2">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center p-1.5 rounded-lg border border-slate-700/60 shrink-0"
            style={{ backgroundColor: `${theme.color}15` }}
          >
            <PublicTransportIcon type={vehicle.type} size={20} color={theme.color} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span
                className="font-black text-xs px-2 py-0.5 rounded text-white flex items-center gap-1 leading-none"
                style={{ backgroundColor: theme.color }}
              >
                Line {vehicle.route}
              </span>
              <span className="text-[10px] uppercase font-mono text-slate-400">
                #{vehicle.id}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium mt-0.5">
              {theme.label} Vehicle
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800/80 transition-colors"
          aria-label="Close popup"
        >
          <X size={15} />
        </button>
      </div>

      {/* Main Body */}
      <div className="py-2.5 space-y-2">
        {/* Destination Headsign */}
        <div>
          <span className="text-[9px] text-slate-400 font-medium uppercase tracking-wider block mb-0.5">
            Destination / Headsign
          </span>
          <div className="text-xs font-bold text-white flex items-center gap-1.5 bg-slate-950/80 px-2 py-1.5 rounded-md border border-slate-800/80">
            <MapPin size={13} style={{ color: theme.color }} className="shrink-0" />
            <span className="truncate">{vehicle.destination || "In Service"}</span>
          </div>
        </div>

        {/* Telemetry Stats Grid */}
        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-md p-1.5 flex items-center gap-1.5">
            <Gauge size={14} className="text-slate-400 shrink-0" />
            <div>
              <span className="text-[8px] text-slate-400 uppercase font-medium block">Speed</span>
              <span className="font-bold text-slate-200 text-[11px]">
                {Math.round(vehicle.speed)} km/h
              </span>
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-md p-1.5 flex items-center gap-1.5">
            <Compass size={14} className="text-slate-400 shrink-0" />
            <div>
              <span className="text-[8px] text-slate-400 uppercase font-medium block">Heading</span>
              <span className="font-bold text-slate-200 text-[11px]">
                {vehicle.bearing}° ({getCardinalDirection(vehicle.bearing)})
              </span>
            </div>
          </div>
        </div>

        {/* Accessibility & Features */}
        <div className="flex items-center justify-between bg-slate-950/40 px-2 py-1 rounded-md border border-slate-800/60">
          <div className="flex items-center gap-1.5">
            <Accessibility size={13} className={vehicle.lowFloor ? "text-cyan-400" : "text-slate-500"} />
            <span className="text-[10px] font-medium text-slate-300">
              {vehicle.lowFloor ? "Low-Floor Accessible" : "Standard Entry"}
            </span>
          </div>
          {vehicle.tripId && (
            <span className="text-[9px] font-mono text-slate-400 bg-slate-800/60 px-1 py-0.2 rounded">
              Trip #{vehicle.tripId}
            </span>
          )}
        </div>

        {/* Footer info: Live Telemetry & Time */}
        <div className="pt-0.5 flex items-center justify-between text-[9px] text-slate-400">
          <div className="flex items-center gap-1">
            <Radio size={11} className="text-emerald-400" />
            <span className="font-medium text-emerald-400">Tallinn Live Data</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Clock size={10} />
            <span>{timeString}</span>
          </div>
        </div>
      </div>
    </div>
  );
});
