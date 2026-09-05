import { X } from "lucide-react";

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
  return (
    <div className="bg-popover text-popover-foreground p-3 rounded-lg border border-border shadow-xl max-w-xs">
      <div className="flex justify-between gap-3">
        <div>
          <div className="flex gap-2 items-center">
            <Badge
              variant={selectedIncident.severity === "critical" ? "destructive" : "outline"}
              className="text-[9px]"
            >
              {selectedIncident.severity}
            </Badge>

            <span className="font-mono text-[10px] text-muted-foreground">
              {selectedIncident.timestamp}
            </span>
          </div>

          <h4 className="font-semibold text-xs mt-1 text-popover-foreground">{selectedIncident.title}</h4>
        </div>

        <button onClick={() => setSelectedIncident(null)} className="text-muted-foreground hover:text-popover-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-[11px] mt-2 leading-relaxed text-popover-foreground">{selectedIncident.description}</p>

      <div className="mt-2 pt-2 border-t border-border font-mono text-[10px] text-muted-foreground">
        NODE: {selectedIncident.nodeId}
        <br />
        STATUS: {selectedIncident.status}
      </div>
    </div>
  );
}
