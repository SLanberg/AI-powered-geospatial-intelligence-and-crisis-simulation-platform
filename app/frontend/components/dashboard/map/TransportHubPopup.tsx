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
    <div className="bg-popover text-popover-foreground p-4 rounded-xl border border-border shadow-2xl w-80 sm:w-96 max-w-[calc(100vw-2rem)] animate-in fade-in-50 zoom-in-95 overflow-hidden box-border">
      {/* Header Bar */}
      <div className="flex justify-between items-start gap-2.5 pb-2.5 border-b border-border/80">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex gap-2 items-center flex-wrap min-w-0">
            <Badge className={`shrink-0 ${current.badgeClass}`}>
              {current.icon}
              {current.badgeLabel}
            </Badge>

            <Badge
              variant="outline"
              className={`shrink-0 font-mono text-[10px] font-semibold tracking-wider uppercase ${
                hub.status === "busy"
                  ? "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  : hub.status === "alert"
                  ? "bg-destructive/15 text-destructive border-destructive/30"
                  : "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full mr-1 ${
                  hub.status === "busy"
                    ? "bg-amber-400 animate-pulse"
                    : hub.status === "alert"
                    ? "bg-destructive animate-ping"
                    : "bg-emerald-400"
                }`}
              />
              {hub.status === "busy" ? "HIGH TRAFFIC" : hub.status.toUpperCase()}
            </Badge>
          </div>

          <h4 className="font-bold text-base text-foreground leading-tight pt-1 break-words">
            {hub.name}
          </h4>
          {hub.nameEn && hub.nameEn !== hub.name && (
            <p className="text-xs text-muted-foreground italic">{hub.nameEn}</p>
          )}
        </div>

        <button
          onClick={onClose}
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent flex items-center justify-center transition-colors shrink-0 -mr-1 -mt-1"
          aria-label="Close popup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="mt-3 space-y-2.5 text-xs">
        {/* Category & Location Details */}
        <div className="grid grid-cols-2 gap-2 bg-muted/30 p-2.5 rounded-lg border border-border/60">
          <div>
            <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider block">
              District / City
            </span>
            <span className="text-foreground font-medium flex items-center gap-1 mt-0.5 truncate">
              <MapPin className="w-3 h-3 text-primary shrink-0" />
              {hub.district}, {hub.city}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider block">
              Facility Type
            </span>
            <span className="text-foreground font-medium truncate block mt-0.5" title={hub.category}>
              {hub.category}
            </span>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-center justify-between text-xs px-1 text-muted-foreground">
          <span>Address:</span>
          <span className="font-medium text-foreground">{hub.address}</span>
        </div>

        {/* Passenger & Cargo stats grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/40 p-2 rounded-lg border border-border/80 flex items-center gap-2">
            <Users className="w-4 h-4 text-sky-400 shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-mono text-muted-foreground">Passengers</div>
              <div className="font-semibold text-foreground truncate">{hub.passengerVolume}</div>
            </div>
          </div>

          {hub.cargoVolume ? (
            <div className="bg-muted/40 p-2 rounded-lg border border-border/80 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-mono text-muted-foreground">Cargo Flow</div>
                <div className="font-semibold text-foreground truncate">{hub.cargoVolume}</div>
              </div>
            </div>
          ) : (
            <div className="bg-muted/40 p-2 rounded-lg border border-border/80 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="min-w-0">
                <div className="text-[10px] font-mono text-muted-foreground">Status</div>
                <div className="font-semibold text-foreground truncate uppercase">{hub.status}</div>
              </div>
            </div>
          )}
        </div>

        {/* Active Terminals & Lines */}
        {hub.activeLinesOrTerminals && hub.activeLinesOrTerminals.length > 0 && (
          <div>
            <span className="text-[10px] font-mono font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5 flex items-center gap-1">
              <Layers className="w-3 h-3 text-muted-foreground" />
              Active Terminals & Lines ({hub.activeLinesOrTerminals.length})
            </span>
            <div className="flex flex-wrap gap-1">
              {hub.activeLinesOrTerminals.map((item, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-muted/60 text-foreground text-[10px] font-mono rounded border border-border/60"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description text block */}
        {hub.description && (
          <p className="text-foreground/90 leading-relaxed bg-muted/30 p-2.5 rounded-lg border border-border/60 text-[11px]">
            {hub.description}
          </p>
        )}

        {/* Phone & Website links */}
        <div className="flex items-center justify-between pt-1 text-[11px] gap-2">
          {hub.phone ? (
            <div className="flex items-center gap-1 text-foreground/90">
              <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <a
                href={`tel:${hub.phone.replace(/\s+/g, "")}`}
                className="text-foreground hover:text-primary font-mono text-[11px] font-medium transition-colors"
              >
                {hub.phone}
              </a>
            </div>
          ) : (
            <span />
          )}

          {hub.website && (
            <a
              href={hub.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-mono text-[11px] font-medium transition-colors flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5" />
              Official Website
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Google Maps Satellite Imagery View */}
      <div className="relative mt-2.5 rounded-lg overflow-hidden border border-border/80 bg-black/40 group">
        <iframe
          title={`Google Maps Satellite view of ${hub.name}`}
          width="100%"
          height="125"
          className="w-full h-32 border-0 rounded-lg filter contrast-[1.05] brightness-95 transition-all"
          loading="lazy"
          src={`https://maps.google.com/maps?q=${hub.lat},${hub.lng}&t=k&z=17&ie=UTF8&iwloc=&output=embed`}
        />
        <div className="absolute bottom-1.5 right-1.5 flex gap-1 z-10">
          <a
            href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${hub.lat},${hub.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-0.5 bg-background/90 hover:bg-background text-foreground text-[10px] font-mono font-medium rounded border border-border/80 shadow flex items-center gap-1 backdrop-blur transition-colors"
          >
            <Camera className="w-3 h-3 text-sky-400" />
            Street View
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${hub.lat},${hub.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-0.5 bg-background/90 hover:bg-background text-foreground text-[10px] font-mono font-medium rounded border border-border/80 shadow flex items-center gap-1 backdrop-blur transition-colors"
          >
            <ExternalLink className="w-3 h-3 text-emerald-400" />
            Google Maps
          </a>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-3 flex items-center gap-1.5">
        {onRecenter && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRecenter(hub.lat, hub.lng)}
            className="flex-1 h-7 text-[11px] font-medium border-border/80 hover:bg-accent hover:text-accent-foreground"
          >
            <Navigation className="w-3 h-3 mr-1 text-primary" />
            Center View
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
      <div className="mt-3 pt-2 border-t border-border/80 font-mono text-[11px] font-semibold text-muted-foreground flex justify-between items-center gap-2">
        <span className="truncate">
          ID: <strong className="text-foreground font-bold uppercase">{hub.id}</strong>
        </span>
        <span className="shrink-0">
          STATUS: <strong className="text-foreground font-bold uppercase">{hub.status}</strong>
        </span>
      </div>
    </div>
  );
}


