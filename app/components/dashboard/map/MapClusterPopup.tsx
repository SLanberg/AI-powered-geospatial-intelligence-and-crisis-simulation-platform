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
    <div className="bg-popover text-popover-foreground p-3 rounded-lg border border-border shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-primary" />
          <span className="font-semibold text-xs">{selectedCluster.name}</span>
        </div>

        <button onClick={() => setSelectedCluster(null)} className="text-muted-foreground hover:text-popover-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="mt-2 text-[10px] font-mono text-muted-foreground space-y-1">
        <div>INCIDENTS: {selectedCluster.incidentCount}</div>
        <div>PRIMARY: {selectedCluster.primaryCategory}</div>
        <div>RADIUS: {selectedCluster.radiusKm} km</div>
      </div>
    </div>
  );
}
