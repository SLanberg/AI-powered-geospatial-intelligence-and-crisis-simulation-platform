"use client";

import React from "react";
import { Plane, Anchor, TrainTrack, Compass, MapPin, Phone, Globe, X, ExternalLink, Activity, Users, Layers } from "lucide-react";
import type { TransportHub } from "../transportHubsData";

interface TransportHubPopupProps {
  hub: TransportHub;
  onClose: () => void;
  onRecenter?: (lat: number, lng: number) => void;
}

export function TransportHubPopup({ hub, onClose, onRecenter }: TransportHubPopupProps) {
  const getTypeBadge = () => {
    switch (hub.type) {
      case "airport":
        return {
          label: "AIRPORT",
          color: "#38BDF8",
          bgColor: "rgba(56, 189, 248, 0.12)",
          borderColor: "rgba(56, 189, 248, 0.4)",
          Icon: Plane,
        };
      case "heliport":
        return {
          label: "HELIPORT",
          color: "#38BDF8",
          bgColor: "rgba(56, 189, 248, 0.12)",
          borderColor: "rgba(56, 189, 248, 0.4)",
          Icon: Plane,
        };
      case "railway":
        return {
          label: "RAIL HUB",
          color: "#F59E0B",
          bgColor: "rgba(245, 158, 11, 0.12)",
          borderColor: "rgba(245, 158, 11, 0.4)",
          Icon: TrainTrack,
        };
      case "port":
        return {
          label: "SEA PORT",
          color: "#22D3EE",
          bgColor: "rgba(34, 211, 238, 0.12)",
          borderColor: "rgba(34, 211, 238, 0.4)",
          Icon: Anchor,
        };
      default:
        return {
          label: "TRANSPORT HUB",
          color: "#94A3B8",
          bgColor: "rgba(148, 163, 184, 0.12)",
          borderColor: "rgba(148, 163, 184, 0.4)",
          Icon: Compass,
        };
    }
  };

  const badge = getTypeBadge();
  const IconComponent = badge.Icon;

  return (
    <div
      className="w-80 sm:w-96 rounded-xl border border-slate-700/80 bg-[#0F172A]/95 text-slate-100 p-4 shadow-2xl backdrop-blur-md transition-all animate-in fade-in zoom-in-95 duration-150 select-text"
      style={{
        boxShadow: `0 10px 30px -5px rgba(0,0,0,0.8), 0 0 15px ${badge.color}22`,
      }}
    >
      {/* Header Bar */}
      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase border"
              style={{
                color: badge.color,
                backgroundColor: badge.bgColor,
                borderColor: badge.borderColor,
              }}
            >
              <IconComponent className="w-3.5 h-3.5" />
              {badge.label}
            </span>

            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                hub.status === "busy"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                  : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  hub.status === "busy" ? "bg-amber-400 animate-pulse" : "bg-emerald-400"
                }`}
              />
              {hub.status === "busy" ? "HIGH TRAFFIC" : "OPERATIONAL"}
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-100 leading-tight mt-1">
            {hub.name}
          </h3>
          <p className="text-xs font-medium text-slate-400 italic">
            {hub.nameEn || hub.category}
          </p>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-100 hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body Details */}
      <div className="py-3 space-y-2.5 text-xs">
        {/* Category & District */}
        <div className="grid grid-cols-2 gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              District / City
            </span>
            <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
              {hub.district}, {hub.city}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Facility Type
            </span>
            <span className="text-slate-200 font-medium truncate block mt-0.5" title={hub.category}>
              {hub.category}
            </span>
          </div>
        </div>

        {/* Address */}
        <div className="text-slate-300 flex items-center justify-between text-xs px-1">
          <span className="text-slate-400">Address:</span>
          <span className="font-medium text-slate-200">{hub.address}</span>
        </div>

        {/* Passenger & Cargo stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/80 flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <div className="text-[10px] text-slate-400">Passenger Volume</div>
              <div className="font-bold text-slate-200">{hub.passengerVolume}</div>
            </div>
          </div>

          {hub.cargoVolume && (
            <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/80 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <div className="text-[10px] text-slate-400">Cargo Volume</div>
                <div className="font-bold text-slate-200">{hub.cargoVolume}</div>
              </div>
            </div>
          )}
        </div>

        {/* Terminals / Lines */}
        {hub.activeLinesOrTerminals && hub.activeLinesOrTerminals.length > 0 && (
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
              <Layers className="w-3 h-3 text-slate-400" />
              Active Terminals & Lines ({hub.activeLinesOrTerminals.length})
            </span>
            <div className="flex flex-wrap gap-1">
              {hub.activeLinesOrTerminals.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-slate-800/90 text-slate-200 text-[10px] font-medium rounded border border-slate-700/60"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <p className="text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60 text-[11px]">
          {hub.description}
        </p>

        {/* Phone & Links */}
        <div className="flex items-center justify-between pt-1 text-[11px]">
          {hub.phone ? (
            <span className="text-slate-400 flex items-center gap-1">
              <Phone className="w-3 h-3 text-slate-400" />
              {hub.phone}
            </span>
          ) : (
            <span />
          )}

          {hub.website && (
            <a
              href={hub.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-400 hover:text-sky-300 flex items-center gap-1 underline underline-offset-2 font-medium"
            >
              <Globe className="w-3 h-3" />
              Official Website
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
        {onRecenter && (
          <button
            onClick={() => onRecenter(hub.lat, hub.lng)}
            className="w-full py-1.5 px-3 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Compass className="w-3.5 h-3.5" />
            Focus Map Camera
          </button>
        )}
      </div>
    </div>
  );
}
