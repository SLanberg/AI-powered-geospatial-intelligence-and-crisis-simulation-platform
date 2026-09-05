import { Layers, X } from "lucide-react";

import type { ClusterPoint } from "../data";

interface MapClusterPopupProps {
  selectedCluster: ClusterPoint;
  setSelectedCluster: (cluster: ClusterPoint | null) => void;
}

export function MapClusterPopup({
  selectedCluster,
  setSelectedCluster,
}: MapClusterPopupProps) {
  return (
    <div className="bg-[#0B0F19] text-slate-200 p-3 rounded-lg border border-blue-900 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold text-xs">{selectedCluster.name}</span>
        </div>

        <button onClick={() => setSelectedCluster(null)}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-2 text-[10px] font-mono text-slate-400 space-y-1">
        <div>INCIDENTS: {selectedCluster.incidentCount}</div>
        <div>PRIMARY: {selectedCluster.primaryCategory}</div>
        <div>RADIUS: {selectedCluster.radiusKm} km</div>
      </div>
    </div>
  );
}
