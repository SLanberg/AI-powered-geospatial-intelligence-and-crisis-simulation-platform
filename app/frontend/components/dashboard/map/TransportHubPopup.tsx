"use client";

import React, { useState } from "react";
import {
  X,
  MapPin,
  Phone,
  Globe,
  Plane,
  Anchor,
  TrainTrack,
  Compass,
  Navigation,
  ExternalLink,
  Check,
  Layers,
  Users,
  Activity,
  Building2,
  Camera,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { TransportHub, TransportHubType } from "../transportHubsData";

interface TransportHubPopupProps {
  hub: TransportHub;
  onClose: () => void;
  onRecenter?: (lat: number, lng: number) => void;
}

export function TransportHubPopup({
  hub,
  onClose,
  onRecenter,
}: TransportHubPopupProps) {
  const [copied, setCopied] = useState(false);

  const typeConfig: Record<
    TransportHubType,
    {
      badgeLabel: string;
      badgeClass: string;
      icon: React.ReactNode;
    }
  > = {
    airport: {
      badgeLabel: "AIRPORT",
      badgeClass:
        "bg-sky-500/20 text-sky-400 border-sky-500/50 uppercase font-semibold text-[10px] tracking-wider",
      icon: <Plane className="w-3 h-3 mr-1 inline stroke-[2.5]" />,
    },
    heliport: {
      badgeLabel: "HELIPORT",
      badgeClass:
        "bg-sky-500/20 text-sky-400 border-sky-500/50 uppercase font-semibold text-[10px] tracking-wider",
      icon: <Plane className="w-3 h-3 mr-1 inline stroke-[2.5]" />,
    },
    railway: {
      badgeLabel: "RAIL HUB",
      badgeClass:
        "bg-amber-500/20 text-amber-400 border-amber-500/50 uppercase font-semibold text-[10px] tracking-wider",
      icon: <TrainTrack className="w-3 h-3 mr-1 inline stroke-[2.5]" />,
    },
    port: {
      badgeLabel: "SEA PORT",
      badgeClass:
        "bg-cyan-500/20 text-cyan-400 border-cyan-500/50 uppercase font-semibold text-[10px] tracking-wider",
      icon: <Anchor className="w-3 h-3 mr-1 inline stroke-[2.5]" />,
    },
  };

  const current = typeConfig[hub.type] || {
    badgeLabel: "TRANSPORT HUB",
    badgeClass:
      "bg-slate-500/20 text-slate-400 border-slate-500/50 uppercase font-semibold text-[10px] tracking-wider",
    icon: <Compass className="w-3 h-3 mr-1 inline stroke-[2.5]" />,
  };

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${hub.lat.toFixed(6)}, ${hub.lng.toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0A0E17] text-popover-foreground p-3.5 rounded-xl border border-border w-[300px] max-w-[300px] max-h-[420px] flex flex-col overflow-hidden box-border z-[9999999]">
      {/* Header Bar */}
      <div className="flex justify-between items-start gap-2 pb-2 border-b border-border/80 shrink-0">
        <div className="space-y-0.5 min-w-0 flex-1">
          <div className="flex gap-1.5 items-center flex-wrap min-w-0">
            <Badge className={`shrink-0 ${current.badgeClass}`}>
              {current.icon}
              {current.badgeLabel}
            </Badge>

            <Badge
              variant="outline"
              className={`shrink-0 font-mono text-[9px] px-1.5 py-0 h-4 font-semibold tracking-wider uppercase ${
                hub.status === "busy"
                  ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  : hub.status === "alert"
                  ? "bg-destructive/15 text-destructive border-destructive/30"
                  : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-none mr-1 ${
                  hub.status === "busy"
                    ? "bg-amber-400"
                    : hub.status === "alert"
                    ? "bg-destructive"
                    : "bg-emerald-400"
                }`}
              />
              {hub.status === "busy" ? "HIGH TRAFFIC" : hub.status.toUpperCase()}
            </Badge>
          </div>

          <h4 className="font-bold text-xs text-foreground leading-snug pt-0.5 break-words">
            {hub.name}
          </h4>
          {hub.nameEn && hub.nameEn !== hub.name && (
            <p className="text-[10px] text-muted-foreground italic">{hub.nameEn}</p>
          )}
        </div>

        <button
          onClick={onClose}
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent flex items-center justify-center transition-colors shrink-0 -mr-1 -mt-1"
          aria-label="Close popup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Area - Scrollable container */}
      <div className="mt-2 overflow-y-auto pr-1 flex-1 space-y-2.5 text-xs">
        {/* Category & Location Details */}
        <div className="grid grid-cols-2 gap-2 bg-muted/30 p-2.5 rounded-lg border border-border/60">
          <div>
            <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider block">
              District / City
            </span>
            <span className="text-foreground font-medium flex items-center gap-1 mt-0.5 truncate">
              <Building2 className="w-3 h-3 text-muted-foreground shrink-0" />
              {hub.district}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider block">
              Address
            </span>
            <span className="text-foreground font-medium flex items-center gap-1 mt-0.5 truncate" title={hub.address}>
              <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
              {hub.address}
            </span>
          </div>
        </div>

        {/* Dynamic Telemetry / Operational Metrics */}
        <div className="grid grid-cols-2 gap-2">
          {hub.dailyPassengers && (
            <div className="bg-muted/40 p-2.5 rounded-lg border border-border/60">
              <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Users className="w-3 h-3 text-sky-400" />
                Daily Pax Flow
              </span>
              <span className="font-mono text-sm font-bold text-foreground block mt-0.5">
                {hub.dailyPassengers.toLocaleString()}
              </span>
            </div>
          )}

          {hub.activeTerminalCount && (
            <div className="bg-muted/40 p-2.5 rounded-lg border border-border/60">
              <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-3 h-3 text-emerald-400" />
                Terminals
              </span>
              <span className="font-mono text-sm font-bold text-foreground block mt-0.5">
                {hub.activeTerminalCount} Active
              </span>
            </div>
          )}
        </div>

        {/* Operational Description */}
        {hub.description && (
          <div className="p-2.5 bg-muted/20 rounded-lg border border-border/40 text-muted-foreground text-xs leading-relaxed">
            {hub.description}
          </div>
        )}

        {/* Google Maps Satellite View Embed */}
        <div className="relative rounded-lg overflow-hidden border border-border/80 bg-black/40 group">
          <iframe
            title={`Google Maps Satellite view of ${hub.name}`}
            width="100%"
            height="120"
            className="w-full h-28 border-0 rounded-lg"
            loading="lazy"
            src={`https://maps.google.com/maps?q=${hub.lat},${hub.lng}&t=k&z=17&ie=UTF8&iwloc=&output=embed`}
          />
          <div className="absolute bottom-1.5 right-1.5 flex gap-1 z-10">
            <a
              href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${hub.lat},${hub.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-0.5 bg-background hover:bg-accent text-foreground text-[10px] font-mono font-medium rounded border border-border/80 flex items-center gap-1 transition-colors"
            >
              <Camera className="w-3 h-3 text-sky-400" />
              Street View
            </a>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${hub.name}, ${hub.city || hub.district || ""}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2 py-0.5 bg-background hover:bg-accent text-foreground text-[10px] font-mono font-medium rounded border border-border/80 flex items-center gap-1 transition-colors"
            >
              <ExternalLink className="w-3 h-3 text-emerald-400" />
              Google Maps
            </a>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 pt-1">
          {onRecenter && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRecenter(hub.lat, hub.lng)}
              className="flex-1 h-7 text-[11px] font-medium border-border/80 hover:bg-accent hover:text-accent-foreground"
            >
              <Navigation className="w-3 h-3 mr-1 text-primary" />
              Recenter View
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            title="Copy Coordinates"
            onClick={handleCopyCoords}
            className="h-7 px-2.5 text-[11px] border-border/80 hover:bg-accent hover:text-accent-foreground font-mono flex items-center gap-1"
          >
            {copied ? (
              <Check className="w-3 h-3 text-emerald-400" />
            ) : (
              <MapPin className="w-3 h-3 text-muted-foreground" />
            )}
            <span>Coords</span>
          </Button>
        </div>

        {/* Footer bar */}
        <div className="pt-2 border-t border-border/80 font-mono text-[11px] font-semibold text-muted-foreground flex justify-between items-center gap-2">
          <span className="truncate">
            ID: <strong className="text-foreground font-bold uppercase">{hub.id}</strong>
          </span>
          <span className="shrink-0">
            STATUS: <strong className="text-foreground font-bold uppercase">{hub.status}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
