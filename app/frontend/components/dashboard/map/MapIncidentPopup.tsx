"use client";

import React, { useState } from "react";
import {
  X,
  MapPin,
  Phone,
  AlertTriangle,
  AlertCircle,
  Navigation,
  ExternalLink,
  Check,
  Camera,
  Info,
  Zap,
  Flame,
  Droplets,
  ShieldAlert,
  Radio,
  Car,
  Activity,
  ServerCrash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Incident } from "../data";
import { MakiIcon, getMakiIconNameForIncident } from "./MakiIcon";

interface MapIncidentPopupProps {
  selectedIncident: Incident;
  setSelectedIncident: (incident: Incident | null) => void;
  onCenter?: () => void;
}

export function MapIncidentPopup({
  selectedIncident,
  setSelectedIncident,
  onCenter,
}: MapIncidentPopupProps) {
  const [copied, setCopied] = useState(false);

  const makiIconName = getMakiIconNameForIncident(selectedIncident);
  const severity = (selectedIncident.severity || "info").toLowerCase();
  const isCritical = severity === "critical" || severity === "emergency";
  const isWarning = severity === "warning" || severity === "attention";

  const getSeverityBadgeConfig = () => {
    if (isCritical) {
      return {
        label: "CRITICAL ALERT",
        badgeClass:
          "bg-red-500/20 text-red-300 border-red-500/50 uppercase font-semibold text-[10px] tracking-wider",
        icon: <AlertTriangle className="w-3.5 h-3.5 mr-1 inline stroke-[2.2] text-red-400" />,
        containerBg: "bg-red-500/20 border-red-500/40 text-red-400",
      };
    }
    if (isWarning) {
      return {
        label: "WARNING",
        badgeClass:
          "bg-amber-500/20 text-amber-300 border-amber-500/50 uppercase font-semibold text-[10px] tracking-wider",
        icon: <AlertCircle className="w-3.5 h-3.5 mr-1 inline stroke-[2.2] text-amber-400" />,
        containerBg: "bg-amber-500/20 border-amber-500/40 text-amber-400",
      };
    }
    return {
      label: "INCIDENT",
      badgeClass:
        "bg-sky-500/20 text-sky-300 border-sky-500/50 uppercase font-semibold text-[10px] tracking-wider",
      icon: <Activity className="w-3.5 h-3.5 mr-1 inline stroke-[2.2] text-sky-400" />,
      containerBg: "bg-sky-500/20 border-sky-500/40 text-sky-400",
    };
  };

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return (
          <Badge
            variant="outline"
            className="bg-red-500/15 text-red-400 border-red-500/40 text-[10px] font-mono gap-1 py-0.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Active
          </Badge>
        );
      case "investigating":
        return (
          <Badge
            variant="outline"
            className="bg-amber-500/15 text-amber-400 border-amber-500/40 text-[10px] font-mono gap-1 py-0.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Investigating
          </Badge>
        );
      case "mitigated":
        return (
          <Badge
            variant="outline"
            className="bg-blue-500/15 text-blue-400 border-blue-500/40 text-[10px] font-mono gap-1 py-0.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            Mitigated
          </Badge>
        );
      case "resolved":
        return (
          <Badge
            variant="outline"
            className="bg-emerald-500/15 text-emerald-400 border-emerald-500/40 text-[10px] font-mono gap-1 py-0.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Resolved
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-[10px] font-mono py-0.5">
            {status || "Active"}
          </Badge>
        );
    }
  };

  // Generate detailed situational analysis report based on category & title
  const getSituationalReport = () => {
    const category = (selectedIncident.category || "").toLowerCase();
    const title = (selectedIncident.title || "").toLowerCase();

    if (category.includes("grid") || title.includes("substation") || title.includes("transformer") || title.includes("voltage") || title.includes("power")) {
      return {
        title: "Critical Grid & Power Infrastructure",
        text: `Substation / grid node "${selectedIncident.nodeId}" reported anomalous voltage fluctuation, arc-flash risk, or breaker isolation trip. Automatic SCADA islanding protocol active to protect district telemetry.`,
        tag: "High Voltage Fault",
        color: "border-red-500/40 bg-red-950/30 text-red-200",
        icon: Zap,
      };
    }

    if (category.includes("water") || title.includes("pipe") || title.includes("flood") || title.includes("leak")) {
      return {
        title: "Municipal Water Network Rupture",
        text: `Hydraulic pressure loss and flow anomaly detected at node "${selectedIncident.nodeId}". Emergency isolation valves flagged for containment to prevent localized flooding and road erosion.`,
        tag: "Hydraulic Hazard",
        color: "border-cyan-500/40 bg-cyan-950/30 text-cyan-200",
        icon: Droplets,
      };
    }

    if (category.includes("cyber") || category.includes("telecom") || title.includes("signal") || title.includes("dispatch") || title.includes("intrusion")) {
      return {
        title: "SCADA Telemetry & Communications Link",
        text: `Communication heartbeat failure or telemetry anomaly detected on municipal gateway "${selectedIncident.nodeId}". Encrypted backup link active. Incident triage team assessing payload integrity.`,
        tag: "SCADA Link Disruption",
        color: "border-purple-500/40 bg-purple-950/30 text-purple-200",
        icon: Radio,
      };
    }

    if (category.includes("traffic") || title.includes("collision") || title.includes("junction") || title.includes("transit")) {
      return {
        title: "Traffic Corridor & Urban Flow Deadlock",
        text: `Major traffic artery sensor array at node "${selectedIncident.nodeId}" reported severe flow congestion or signal controller default. Priority routing active for emergency response units.`,
        tag: "Transit Artery Blockade",
        color: "border-amber-500/40 bg-amber-950/30 text-amber-200",
        icon: Car,
      };
    }

    if (category.includes("fire") || category.includes("hazard") || title.includes("fire") || title.includes("thermal")) {
      return {
        title: "Thermal & Structural Safety Hazard",
        text: `Thermal anomaly or emergency hazard reported at node "${selectedIncident.nodeId}". Regional rescue department (Päästeamet) dispatch notified under 112 emergency escalation guidelines.`,
        tag: "Thermal Safety Risk",
        color: "border-orange-500/40 bg-orange-950/30 text-orange-200",
        icon: Flame,
      };
    }

    return {
      title: "SCADA Sensor & Tactical Telemetry Alert",
      text: selectedIncident.description || `Sensor node "${selectedIncident.nodeId}" triggered operational tolerance alert. Dispatch telemetry monitoring active for rapid containment.`,
      tag: isCritical ? "Critical Telemetry" : "Operational Alert",
      color: isCritical
        ? "border-red-500/40 bg-red-950/30 text-red-200"
        : "border-amber-500/40 bg-amber-950/30 text-amber-200",
      icon: isCritical ? ShieldAlert : Info,
    };
  };

  const situationReport = getSituationalReport();
  const ReportIcon = situationReport.icon;
  const severityConfig = getSeverityBadgeConfig();

  const handleCopyCoords = () => {
    if (selectedIncident.lat && selectedIncident.lng) {
      navigator.clipboard.writeText(
        `${selectedIncident.lat.toFixed(6)}, ${selectedIncident.lng.toFixed(6)}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-[#0A0E17] text-popover-foreground p-3.5 rounded-xl border border-border w-[310px] max-w-[310px] max-h-[460px] flex flex-col overflow-hidden box-border z-[9999999] shadow-2xl">
      {/* Header: Badge, Status, Title & Close Button */}
      <div className="flex justify-between items-start gap-2 shrink-0 pb-2 border-b border-border/60">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex gap-1.5 items-center flex-wrap min-w-0">
            <Badge className={`shrink-0 ${severityConfig.badgeClass}`}>
              {severityConfig.icon}
              {selectedIncident.severity}
            </Badge>

            {getStatusBadge(selectedIncident.status)}

            <span className="font-mono text-[11px] font-semibold text-muted-foreground shrink-0">
              {selectedIncident.timestamp}
            </span>
          </div>

          <h4 className="font-bold text-xs text-foreground leading-snug pt-0.5 break-words">
            {selectedIncident.title}
          </h4>
        </div>

        {/* Close button aligned safely within card padding */}
        <button
          onClick={() => setSelectedIncident(null)}
          className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent flex items-center justify-center transition-colors shrink-0 -mr-1 -mt-1"
          aria-label="Close popup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Info Body - Scrollable container up to max card height */}
      <div className="overflow-y-auto pr-1 flex-1 space-y-2.5 mt-2">
        {/* Category & District Location */}
        <p className="text-xs font-medium leading-relaxed text-foreground/90 break-words">
          {selectedIncident.category} · {selectedIncident.district || "Tallinn"} ({selectedIncident.nodeId})
        </p>

        {/* Detailed Situational & Operational Report Box */}
        <div className={`p-2.5 rounded-lg border text-xs space-y-1 ${situationReport.color}`}>
          <div className="flex items-center justify-between font-bold text-[11px] uppercase tracking-wider">
            <span className="flex items-center gap-1">
              <ReportIcon className="w-3.5 h-3.5 shrink-0" />
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

        {/* Contact & Emergency Dispatch Hotline */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-foreground/90">
            <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <a
              href="tel:+372112"
              className="text-foreground hover:text-primary font-mono text-[11px] font-medium transition-colors"
            >
              +372 112 (Emergency)
            </a>
          </div>

          <Badge
            variant="outline"
            className="bg-red-500/15 text-red-400 border-red-500/30 font-mono text-[10px] font-semibold tracking-wider uppercase"
          >
            SOS 112
          </Badge>
        </div>

        {/* Incident Description / Notes */}
        {selectedIncident.description && (
          <div className="px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/80 text-[11px] leading-relaxed text-muted-foreground">
            <span className="text-foreground font-semibold font-mono text-[10px] block uppercase tracking-wider mb-0.5">
              FIELD LOG:
            </span>
            {selectedIncident.description}
          </div>
        )}

        {/* Google Maps Satellite Imagery View */}
        {selectedIncident.lat && selectedIncident.lng && (
          <div className="relative rounded-lg overflow-hidden border border-border/80 bg-black/40 group">
            <iframe
              title={`Google Maps Satellite view of ${selectedIncident.title}`}
              width="100%"
              height="120"
              className="w-full h-28 border-0 rounded-lg"
              loading="lazy"
              src={`https://maps.google.com/maps?q=${selectedIncident.lat},${selectedIncident.lng}&t=k&z=18&ie=UTF8&iwloc=&output=embed`}
            />
            <div className="absolute bottom-1.5 right-1.5 flex gap-1 z-10">
              <a
                href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedIncident.lat},${selectedIncident.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 bg-background hover:bg-accent text-foreground text-[10px] font-mono font-medium rounded border border-border/80 flex items-center gap-1 transition-colors"
              >
                <Camera className="w-3 h-3 text-sky-400" />
                Street View
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${selectedIncident.title}, Tallinn`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2 py-0.5 bg-background hover:bg-accent text-foreground text-[10px] font-mono font-medium rounded border border-border/80 flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="w-3 h-3 text-emerald-400" />
                Google Maps
              </a>
            </div>
          </div>
        )}

        {/* Action buttons: Center View, Copy Coordinates */}
        <div className="flex items-center gap-1.5 pt-1">
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
        <div className="pt-2 border-t border-border/80 font-mono text-[11px] font-semibold text-muted-foreground flex justify-between items-center gap-2">
          <span className="truncate">
            NODE: <strong className="text-foreground font-bold uppercase">{selectedIncident.nodeId}</strong>
          </span>
          <span className="shrink-0">
            STATUS: <strong className="text-foreground font-bold uppercase">{selectedIncident.status}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
