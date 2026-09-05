import { Radio } from "lucide-react";

import { Badge } from "@/components/ui/badge";

import type { ClusterPoint, Incident } from "../data";

interface TelemetryFeedProps {
  filteredIncidents: Incident[];
  setSelectedIncident: (incident: Incident | null) => void;
  setSelectedCluster: (cluster: ClusterPoint | null) => void;
  flyTo: (latitude: number, longitude: number, zoom: number) => void;
}

export function TelemetryFeed({
  filteredIncidents,
  setSelectedIncident,
  setSelectedCluster,
  flyTo,
}: TelemetryFeedProps) {
  return (
    <div className="absolute top-3 right-14 bottom-16 w-72 bg-[#090D16]/95 border border-slate-800 rounded-lg shadow-xl flex flex-col z-10 overflow-hidden">
      <div className="px-3 py-2 border-b border-slate-800 flex items-center gap-2">
        <Radio className="w-3.5 h-3.5 text-rose-400" />

        <span className="font-semibold text-xs uppercase">
          Tallinn Telemetry Feed
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredIncidents.map((incident) => (
          <button
            key={incident.id}
            onClick={() => {
              setSelectedIncident(incident);
              setSelectedCluster(null);
              flyTo(incident.lat, incident.lng, 14.8);
            }}
            className="w-full text-left p-2 rounded border border-slate-800 bg-[#070A11] hover:border-slate-700"
          >
            <div className="flex justify-between">
              <span className="font-mono text-[10px] text-blue-400">
                {incident.id}
              </span>

              <Badge
                variant={incident.severity === "critical" ? "destructive" : "outline"}
                className="text-[8px]"
              >
                {incident.severity}
              </Badge>
            </div>

            <div className="text-[11px] mt-1">{incident.title}</div>

            <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1">
              <span>{incident.timestamp}</span>
              <span>{incident.nodeId}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
