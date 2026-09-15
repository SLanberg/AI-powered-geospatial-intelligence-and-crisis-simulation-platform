"use client";

import React, { useState } from "react";
import {
  X,
  MapPin,
  Phone,
  Plus,
  HeartPulse,
  Shield,
  Flame,
  Navigation,
  ExternalLink,
  Check,
  Camera,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EmergencyService, EmergencyServiceType } from "../emergencyServicesData";

interface EmergencyServicePopupProps {
  service: EmergencyService;
  onClose: () => void;
  onCenter?: () => void;
}

export function EmergencyServicePopup({
  service,
  onClose,
  onCenter,
}: EmergencyServicePopupProps) {
  const [copied, setCopied] = useState(false);

  const typeConfig: Record<
    EmergencyServiceType,
    {
      badgeLabel: string;
      badgeClass: string;
      icon: React.ReactNode;
    }
  > = {
    hospital: {
      badgeLabel: "hospital",
      badgeClass:
        "bg-pink-500/20 text-pink-300 border-pink-500/50 uppercase font-semibold text-[10px] tracking-wider",
      icon: <Plus className="w-3 h-3 mr-1 inline stroke-[3]" />,
    },
    clinic: {
      badgeLabel: "clinic",
      badgeClass:
        "bg-rose-500/20 text-rose-400 border-rose-500/50 uppercase font-semibold text-[10px] tracking-wider",
      icon: <HeartPulse className="w-3 h-3 mr-1 inline stroke-[2.5]" />,
    },
    police: {
      badgeLabel: "police",
      badgeClass:
        "bg-blue-500/20 text-blue-400 border-blue-500/50 uppercase font-semibold text-[10px] tracking-wider",
      icon: <Shield className="w-3 h-3 mr-1 inline stroke-[2.5]" />,
    },
    fire_station: {
      badgeLabel: "fire dept",
      badgeClass:
        "bg-amber-500/20 text-amber-400 border-amber-500/50 uppercase font-semibold text-[10px] tracking-wider",
      icon: <Flame className="w-3 h-3 mr-1 inline stroke-[2.5]" />,
    },
  };

  const current = typeConfig[service.type] || typeConfig.hospital;

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${service.lat.toFixed(6)}, ${service.lng.toFixed(6)}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-popover text-popover-foreground p-4 rounded-xl border border-border shadow-2xl w-80 max-w-[calc(100vw-2rem)] animate-in fade-in-50 zoom-in-95 overflow-hidden box-border">
      {/* Header: Badge, Hours, Title & Close Button */}
      <div className="flex justify-between items-start gap-2.5">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex gap-2 items-center flex-wrap min-w-0">
            <Badge className={`shrink-0 ${current.badgeClass}`}>
              {current.icon}
              {current.badgeLabel}
            </Badge>

            <span className="font-mono text-xs font-semibold text-muted-foreground shrink-0">
              {service.hours}
            </span>
          </div>

          <h4 className="font-bold text-sm text-foreground leading-tight pt-1 break-words">
            {service.name}
          </h4>
        </div>

        {/* Close button aligned safely within card padding */}
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent flex items-center justify-center transition-colors shrink-0 -mr-1 -mt-1"
          aria-label="Close popup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Description / Category & Location */}
      <p className="text-xs font-medium mt-2 leading-relaxed text-foreground/90 break-words">
        {service.category} · {service.address}, {service.district}
      </p>

      {/* Contact & Emergency Hotline */}
      <div className="mt-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-foreground/90">
          <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <a
            href={`tel:${service.phone.replace(/\s+/g, "")}`}
            className="text-foreground hover:text-primary font-mono text-[11px] font-medium transition-colors"
          >
            {service.phone}
          </a>
        </div>

        {service.emergency && (
          <Badge
            variant="outline"
            className="bg-destructive/15 text-destructive border-destructive/30 font-mono text-[10px] font-semibold tracking-wider uppercase"
          >
            SOS {service.emergency}
          </Badge>
        )}
      </div>

      {/* Resources / Capacity if applicable */}
      {(service.beds || service.vehicles || service.fleet) && (
        <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/80 text-[11px] font-mono flex items-center justify-between">
          <span className="text-muted-foreground font-medium">RESOURCES:</span>
          <span className="text-foreground font-semibold">
            {service.beds ? `${service.beds} Inpatient Beds` : service.vehicles || service.fleet}
          </span>
        </div>
      )}

      {/* Google Maps Satellite Imagery View */}
      <div className="relative mt-2.5 rounded-lg overflow-hidden border border-border/80 bg-black/40 group">
        <iframe
          title={`Google Maps Satellite view of ${service.name}`}
          width="100%"
          height="120"
          className="w-full h-28 border-0 rounded-lg filter contrast-[1.05] brightness-95 transition-all"
          loading="lazy"
          src={`https://maps.google.com/maps?q=${service.lat},${service.lng}&t=k&z=18&ie=UTF8&iwloc=&output=embed`}
        />
        <div className="absolute bottom-1.5 right-1.5 flex gap-1 z-10">
          <a
            href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${service.lat},${service.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-0.5 bg-background/90 hover:bg-background text-foreground text-[10px] font-mono font-medium rounded border border-border/80 shadow flex items-center gap-1 backdrop-blur transition-colors"
          >
            <Camera className="w-3 h-3 text-sky-400" />
            Street View
          </a>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${service.name}, ${service.address}, Tallinn`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-2 py-0.5 bg-background/90 hover:bg-background text-foreground text-[10px] font-mono font-medium rounded border border-border/80 shadow flex items-center gap-1 backdrop-blur transition-colors"
          >
            <ExternalLink className="w-3 h-3 text-emerald-400" />
            Google Maps
          </a>
        </div>
      </div>

      {/* Action buttons: Center View, External Map, Copy Coordinates */}
      <div className="mt-2.5 flex items-center gap-1.5">
        {onCenter && (
          <Button
            size="sm"
            variant="outline"
            onClick={onCenter}
            className="flex-1 h-7 text-[11px] font-medium border-border/80 hover:bg-accent hover:text-accent-foreground"
          >
            <Navigation className="w-3 h-3 mr-1 text-primary" />
            Center View
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={handleCopyCoords}
          className="h-7 px-2.5 text-[11px] border-border/80 hover:bg-accent hover:text-accent-foreground font-mono flex items-center gap-1"
          title="Copy Coordinates"
        >
          {copied ? (
            <Check className="w-3 h-3 text-emerald-400" />
          ) : (
            <MapPin className="w-3 h-3 text-muted-foreground" />
          )}
          <span>Coords</span>
        </Button>
      </div>

      {/* Footer bar adhering to application popup styling */}
      <div className="mt-3 pt-2 border-t border-border/80 font-mono text-[11px] font-semibold text-muted-foreground flex justify-between items-center gap-2">
        <span className="truncate">ID: <strong className="text-foreground font-bold uppercase">{service.id}</strong></span>
        <span className="shrink-0">STATUS: <strong className="text-foreground font-bold uppercase">{service.status}</strong></span>
      </div>
    </div>
  );
}
