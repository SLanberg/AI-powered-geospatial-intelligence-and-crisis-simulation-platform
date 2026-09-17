import { X, AlertTriangle, Camera, ExternalLink } from "lucide-react";
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
    <div className="bg-[#0A0E17] text-popover-foreground p-3.5 rounded-xl border border-border w-[300px] max-w-[300px] max-h-[420px] flex flex-col overflow-hidden box-border z-[9999999]">
      <div className="flex justify-between items-start gap-2 shrink-0 pb-2 border-b border-border/60">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          {/* Maki Icon Badge Container */}
          <div className={`p-1.5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${getIconContainerColor(selectedIncident.severity)}`}>
            <MakiIcon name={makiIconName} size={16} />
          </div>

          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="flex gap-1.5 items-center flex-wrap min-w-0">
              <Badge className={`shrink-0 ${getSeverityBadgeClass(selectedIncident.severity)}`}>
                {selectedIncident.severity.toLowerCase() === "critical" && <AlertTriangle className="w-3 h-3 mr-1 inline shrink-0" />}
                {selectedIncident.severity}
              </Badge>

              <span className="font-mono text-[11px] font-semibold text-muted-foreground shrink-0">
                {selectedIncident.timestamp}
              </span>
            </div>

            <h4 className="font-bold text-xs text-foreground leading-snug pt-0.5 break-words">
              {selectedIncident.title}
            </h4>
          </div>
        </div>

        {/* Close Button */}
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
        <p className="text-xs font-medium leading-relaxed text-foreground/90 break-words">
          {selectedIncident.description}
        </p>

        {/* Google Maps Satellite View Embed */}
        {selectedIncident.lat && selectedIncident.lng && (
          <div className="relative rounded-lg overflow-hidden border border-border/80 bg-black/40 group">
            <iframe
              title={`Google Maps Satellite view of ${selectedIncident.title}`}
              width="100%"
              height="110"
              className="w-full h-24 border-0 rounded-lg"
              loading="lazy"
              src={`https://maps.google.com/maps?q=${selectedIncident.lat},${selectedIncident.lng}&t=k&z=18&ie=UTF8&iwloc=&output=embed`}
            />
            <div className="absolute bottom-1.5 right-1.5 flex gap-1 z-10">
              <a
                href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${selectedIncident.lat},${selectedIncident.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-1.5 py-0.5 bg-background hover:bg-accent text-foreground text-[9px] font-mono font-medium rounded border border-border/80 flex items-center gap-1 transition-colors"
              >
                <Camera className="w-3 h-3 text-sky-400" />
                Street View
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${selectedIncident.lat},${selectedIncident.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-1.5 py-0.5 bg-background hover:bg-accent text-foreground text-[9px] font-mono font-medium rounded border border-border/80 flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="w-3 h-3 text-emerald-400" />
                Google Maps
              </a>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-border/80 font-mono text-[10px] font-semibold text-muted-foreground flex justify-between items-center gap-2 flex-wrap min-w-0">
          <span className="min-w-0 truncate">NODE: <strong className="text-foreground font-bold">{selectedIncident.nodeId}</strong></span>
          <span className="shrink-0">STATUS: <strong className="text-foreground font-bold uppercase">{selectedIncident.status}</strong></span>
        </div>
      </div>
    </div>
  );
}

