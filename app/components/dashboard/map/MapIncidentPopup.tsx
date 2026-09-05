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
    <div className="bg-[#0B0F19] text-slate-200 p-3 rounded-lg border border-slate-700 shadow-xl max-w-xs">
      <div className="flex justify-between gap-3">
        <div>
          <div className="flex gap-2 items-center">
            <Badge
              variant={selectedIncident.severity === "critical" ? "destructive" : "outline"}
              className="text-[9px]"
            >
              {selectedIncident.severity}
            </Badge>

            <span className="font-mono text-[10px] text-slate-400">
              {selectedIncident.timestamp}
            </span>
          </div>

          <h4 className="font-semibold text-xs mt-1">{selectedIncident.title}</h4>
        </div>

        <button onClick={() => setSelectedIncident(null)}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-[11px] mt-2 leading-relaxed">{selectedIncident.description}</p>

      <div className="mt-2 pt-2 border-t border-slate-800 font-mono text-[10px] text-slate-500">
        NODE: {selectedIncident.nodeId}
        <br />
        STATUS: {selectedIncident.status}
      </div>
    </div>
  );
}
