import { X, AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import type { Incident } from "../data";

interface MapIncidentPopupProps {
  selectedIncident: Incident;
  setSelectedIncident: (incident: Incident | null) => void;
}

export function MapIncidentPopup({
  selectedIncident,
  setSelectedIncident,
}: MapIncidentPopupProps) {
  const getSeverityBadgeClass = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
      case "emergency":
        return "bg-red-500/20 text-red-400 border-red-500/50 uppercase font-semibold text-[10px] tracking-wider";
      case "warning":
      case "attention":
        return "bg-amber-500/20 text-amber-400 border-amber-500/50 uppercase font-semibold text-[10px] tracking-wider";
      case "normal":
      case "safe":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50 uppercase font-semibold text-[10px] tracking-wider";
      default:
        return "bg-blue-500/20 text-blue-400 border-blue-500/50 uppercase font-semibold text-[10px] tracking-wider";
    }
  };

  return (
    <div className="bg-popover/95 backdrop-blur text-popover-foreground p-4 rounded-xl border border-border shadow-2xl max-w-xs min-w-[260px] animate-in fade-in-50 zoom-in-95">
      <div className="flex justify-between items-start gap-3">
        <div className="space-y-1">
          <div className="flex gap-2 items-center">
            <Badge className={getSeverityBadgeClass(selectedIncident.severity)}>
              {selectedIncident.severity === "critical" && <AlertTriangle className="w-3 h-3 mr-1 inline" />}
              {selectedIncident.severity}
            </Badge>

            <span className="font-mono text-xs font-semibold text-muted-foreground">
              {selectedIncident.timestamp}
            </span>
          </div>

          <h4 className="font-bold text-sm text-foreground leading-tight pt-1">
            {selectedIncident.title}
          </h4>
        </div>

        {/* 44x44px touch area for close button with h-5 w-5 icon */}
        <button
          onClick={() => setSelectedIncident(null)}
          className="h-11 w-11 p-3 -mr-2 -mt-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent flex items-center justify-center transition-colors min-h-[44px] min-w-[44px]"
          aria-label="Close popup"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <p className="text-xs font-medium mt-2 leading-relaxed text-foreground/90">
        {selectedIncident.description}
      </p>

      <div className="mt-3 pt-2 border-t border-border/80 font-mono text-[11px] font-semibold text-muted-foreground flex justify-between items-center">
        <span>NODE: <strong className="text-foreground font-bold">{selectedIncident.nodeId}</strong></span>
        <span>STATUS: <strong className="text-foreground font-bold uppercase">{selectedIncident.status}</strong></span>
      </div>
    </div>
  );
}

