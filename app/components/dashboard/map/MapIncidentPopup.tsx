import { X, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Incident } from "../data";
import { MakiIcon, getMakiIconNameForIncident } from "./MakiIcon";

interface MapIncidentPopupProps {
  selectedIncident: Incident;
  setSelectedIncident: (incident: Incident | null) => void;
}

export function MapIncidentPopup({
  selectedIncident,
  setSelectedIncident,
}: MapIncidentPopupProps) {
  const makiIconName = getMakiIconNameForIncident(selectedIncident);

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

  const getIconContainerColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-500/20 border-red-500/40 text-red-400";
      case "warning":
        return "bg-amber-500/20 border-amber-500/40 text-amber-400";
      default:
        return "bg-emerald-500/20 border-emerald-500/40 text-emerald-400";
    }
  };

  return (
    <div className="bg-popover/95 backdrop-blur text-popover-foreground p-4 rounded-xl border border-border shadow-2xl w-80 max-w-[calc(100vw-2rem)] animate-in fade-in-50 zoom-in-95 overflow-hidden box-border">
      <div className="flex justify-between items-start gap-2.5">
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          {/* Maki Icon Badge Container */}
          <div className={`p-2 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${getIconContainerColor(selectedIncident.severity)}`}>
            <MakiIcon name={makiIconName} size={18} />
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex gap-2 items-center flex-wrap min-w-0">
              <Badge className={`shrink-0 ${getSeverityBadgeClass(selectedIncident.severity)}`}>
                {selectedIncident.severity.toLowerCase() === "critical" && <AlertTriangle className="w-3 h-3 mr-1 inline shrink-0" />}
                {selectedIncident.severity}
              </Badge>

              <span className="font-mono text-xs font-semibold text-muted-foreground shrink-0">
                {selectedIncident.timestamp}
              </span>
            </div>

            <h4 className="font-bold text-sm text-foreground leading-tight pt-0.5 break-words">
              {selectedIncident.title}
            </h4>
          </div>
        </div>

        {/* Close Button: aligned nicely within padding bounds without overflowing card */}
        <button
          onClick={() => setSelectedIncident(null)}
          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent flex items-center justify-center transition-colors shrink-0 -mr-1 -mt-1"
          aria-label="Close popup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs font-medium mt-2.5 leading-relaxed text-foreground/90 break-words">
        {selectedIncident.description}
      </p>

      <div className="mt-3 pt-2.5 border-t border-border/80 font-mono text-[11px] font-semibold text-muted-foreground flex justify-between items-center gap-2 flex-wrap min-w-0">
        <span className="min-w-0 truncate">NODE: <strong className="text-foreground font-bold">{selectedIncident.nodeId}</strong></span>
        <span className="shrink-0">STATUS: <strong className="text-foreground font-bold uppercase">{selectedIncident.status}</strong></span>
      </div>
    </div>
  );
}

