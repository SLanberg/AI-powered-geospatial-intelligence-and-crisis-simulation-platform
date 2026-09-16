"use client";

import React, { useState } from "react";
import {
  X,
  MapPin,
  Phone,
  Plus,
  Heart,
  Shield,
  Flame,
  Home,
  AlertTriangle,
  Navigation,
  ExternalLink,
  Check,
  Camera,
  Info,
  FlameKindling,
  Activity,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { EmergencyService, EmergencyServiceType } from "../emergencyServicesData";
import { getHazardCategoryConfig } from "./AppleMapsMarker";

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

  const isClinic =
    service.type === "clinic" ||
    /kliinik|polikliinik|tervisekeskus|meditsiin|arst|clinic/i.test(service.name);

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
      icon: <Heart className="w-3 h-3 mr-1 inline stroke-[2.5] fill-rose-500/30" />,
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
    shelter: {
      badgeLabel: "shelter",
      badgeClass:
        "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 uppercase font-semibold text-[10px] tracking-wider",
      icon: <Home className="w-3 h-3 mr-1 inline stroke-[2.5]" />,
    },
    hazard_site: {
      badgeLabel: "hazard site",
      badgeClass:
        "bg-red-500/20 text-red-400 border-red-500/50 uppercase font-semibold text-[10px] tracking-wider",
      icon: <AlertTriangle className="w-3 h-3 mr-1 inline stroke-[2.5]" />,
    },
  };

  const hazardConfig = service.type === "hazard_site" ? getHazardCategoryConfig(service) : null;

  const current = isClinic
    ? typeConfig.clinic
    : hazardConfig
    ? {
        badgeLabel: hazardConfig.label,
        badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/50 uppercase font-semibold text-[10px] tracking-wider",
        icon: <hazardConfig.icon className="w-3 h-3 mr-1 inline stroke-[2.5]" />,
      }
    : typeConfig[service.type] || typeConfig.hospital;

  // Generate detailed situational description based on type, name & risk
  const getDetailedSituationalReport = () => {
    const nameLower = service.name.toLowerCase();
    
    if (service.type === "hazard_site") {
      if (hazardConfig?.label === "Logistics & Storage Depot") {
        return {
          title: "Logistics & Warehouse Facility (Päästeamet)",
          text: `Warehouse and freight logistics facility "${service.name}" officially registered with Päästeamet for high-density storage, bulk cargo handling, or potential hazardous materials transit.`,
          tag: "Logistics & Storage Risk",
          color: "border-rose-500/40 bg-rose-950/30 text-rose-200"
        };
      }
      if (hazardConfig?.label === "Fuel & Gas Facility") {
        return {
          title: "Fuel & Petroleum Storage Facility (Päästeamet)",
          text: `Facility "${service.name}" is designated as a High-Risk Hazardous Fuel Site due to bulk storage and handling of volatile petroleum (gasoline, diesel) and LPG. Requires continuous fire safety monitoring under 112 emergency dispatch protocols.`,
          tag: "High Fuel & Fire Hazard",
          color: "border-orange-500/40 bg-orange-950/30 text-orange-200"
        };
      }
      if (hazardConfig?.label === "Chemical & Industrial Hazard") {
        return {
          title: "Chemical & Explosives Site (Päästeamet)",
          text: `Facility "${service.name}" is designated as a Chemical/Explosive Industrial Risk node handling hazardous compounds, ammonia, or volatile synthesis agents. Requires HAZMAT isolation protocols upon emergency response.`,
          tag: "Chemical HAZMAT Site",
          color: "border-purple-500/40 bg-purple-950/30 text-purple-200"
        };
      }
      if (hazardConfig?.label === "Energy Infrastructure") {
        return {
          title: "Critical Energy Substation / Power Plant",
          text: `High-voltage electrical substation or power generation facility "${service.name}". Critical grid infrastructure component subject to arc-flash hazards and electrical fire safety monitoring.`,
          tag: "High Voltage Grid Site",
          color: "border-yellow-500/40 bg-yellow-950/30 text-yellow-200"
        };
      }
      if (hazardConfig?.label === "Maritime & Port Facility") {
        return {
          title: "Maritime Port & Water Infrastructure",
          text: `Port terminal or water treatment facility "${service.name}". Overseen for harbor security, maritime chemical transfer, and coastal emergency preparedness.`,
          tag: "Maritime Terminal",
          color: "border-cyan-500/40 bg-cyan-950/30 text-cyan-200"
        };
      }
      return {
        title: "Industrial Manufacturing & Hazard Site",
        text: `Heavy industrial manufacturing site "${service.name}" officially registered with Päästeamet for high operational risk, thermal processing, or structural hazard oversight.`,
        tag: "Industrial Risk Facility",
        color: "border-rose-500/40 bg-rose-950/30 text-rose-200"
      };
    }

    if (isClinic) {
      return {
        title: "Outpatient Clinic / Medical Center",
        text: `Facility "${service.name}" provides specialized outpatient care and consultation services. Represented with a Heart icon to distinguish diagnostic and ambulatory clinics from full-scale 24/7 emergency inpatient hospitals.`,
        tag: "Outpatient Clinic",
        color: "border-rose-500/40 bg-rose-950/30 text-rose-200"
      };
    }

    if (service.type === "hospital") {
      return {
        title: "Inpatient Hospital & Emergency Room",
        text: `Facility "${service.name}" is a major regional inpatient medical center equipped with 24/7 Emergency Medicine (EMO/ER), trauma care units, and intensive care capacity.`,
        tag: "Inpatient Hospital ER",
        color: "border-pink-500/40 bg-pink-950/30 text-pink-200"
      };
    }

    if (service.type === "police") {
      return {
        title: "Police & Border Guard (PPA)",
        text: `Police station and operational dispatch post responsible for law enforcement, rapid response, and public safety.`,
        tag: "Law Enforcement",
        color: "border-blue-500/40 bg-blue-950/30 text-blue-200"
      };
    }

    if (service.type === "fire_station") {
      return {
        title: "Rescue & Fire Brigade (Päästekomando)",
        text: `Active fire station equipped with heavy rescue vehicles, HAZMAT containment units, and rapid firefighting crews.`,
        tag: "Rescue & Fire Response",
        color: "border-amber-500/40 bg-amber-950/30 text-amber-200"
      };
    }

    return {
      title: "Civil Infrastructure Node",
      text: `Registered infrastructure site in the Estonian national emergency response and civil protection registry.`,
      tag: "Crisis Node",
      color: "border-slate-700 bg-slate-900/40 text-slate-200"
    };
  };

  const situationReport = getDetailedSituationalReport();

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

      {/* Detailed Situational & Operational Report Box */}
      <div className={`mt-2.5 p-2.5 rounded-lg border text-xs space-y-1 ${situationReport.color}`}>
        <div className="flex items-center justify-between font-bold text-[11px] uppercase tracking-wider">
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 shrink-0" />
            {situationReport.title}
          </span>
          <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-black/40 border border-current">
            {situationReport.tag}
          </span>
        </div>
        <p className="text-[11px] leading-snug font-medium opacity-95">
          {situationReport.text}
        </p>
      </div>

      {/* Contact & Emergency Hotline */}
      <div className="mt-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-foreground/90">
          <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <a
            href={`tel:${(service.phone || "").replace(/\s+/g, "")}`}
            className="text-foreground hover:text-primary font-mono text-[11px] font-medium transition-colors"
          >
            {service.phone || "+372 112"}
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
