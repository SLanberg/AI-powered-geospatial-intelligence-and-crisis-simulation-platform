"use client";

import React from "react";
import {
  X,
  Layers3,
  Plane,
  Anchor,
  TrainTrack,
  Compass,
  Hospital as HospitalIcon,
  Shield,
  Flame,
  Home,
  AlertTriangle,
  Building2,
  ChevronRight,
  MapPin,
  Phone,
  ZoomIn,
} from "lucide-react";
import type { InfrastructureCluster } from "./useDecluttering";
import type { TransportHub } from "../transportHubsData";
import type { EmergencyService } from "../emergencyServicesData";

interface AreaInfrastructurePanelProps {
  cluster: InfrastructureCluster;
  onClose: () => void;
  onViewMoreHub: (hub: TransportHub) => void;
  onViewMoreService: (service: EmergencyService) => void;
  onViewFullAreaModal: () => void;
}

export function AreaInfrastructurePanel({
  cluster,
  onClose,
  onViewMoreHub,
  onViewMoreService,
  onViewFullAreaModal,
}: AreaInfrastructurePanelProps) {
  return (
    <div className="absolute right-4 top-4 z-[9999] w-84 sm:w-92 max-h-[calc(100%-5rem)] flex flex-col rounded-xl border border-sky-500/40 bg-[#0C1017]/95 backdrop-blur-md shadow-[0_12px_36px_rgba(0,0,0,0.85)] text-slate-100 overflow-hidden animate-in slide-in-from-right-5 duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-[#121824]/90">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400">
            <Layers3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black tracking-wide text-white flex items-center gap-1.5">
              Area Infrastructure
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-500/30">
                +{cluster.totalCount}
              </span>
            </h3>
            <p className="text-[10.5px] font-mono text-slate-400">
              {cluster.hubs.length} Hubs • {cluster.services.length} Emergency Nodes
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          aria-label="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Item Cards List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[60vh]">
        
        {/* TRANSPORT HUBS LIST */}
        {cluster.hubs.length > 0 && (
          <div className="space-y-2">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400 flex items-center gap-1">
              <Plane className="w-3 h-3 -rotate-45" /> Transport Nodes ({cluster.hubs.length})
            </div>

            {cluster.hubs.map((hub) => (
              <div
                key={hub.id}
                className="p-2.5 rounded-lg bg-[#111622] border border-sky-500/20 hover:border-sky-500/40 transition-all flex flex-col gap-1.5 group"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-black uppercase text-sky-400 px-1.5 py-0.5 rounded bg-sky-500/10 border border-sky-500/20 inline-block mb-0.5">
                      {hub.category || hub.type}
                    </span>
                    <h4 className="text-xs font-extrabold text-white truncate group-hover:text-sky-300 transition-colors">
                      {hub.name}
                    </h4>
                    {hub.district && (
                      <p className="text-[10px] text-slate-400 font-medium truncate">
                        {hub.district}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 mt-0.5">
                  {hub.passengerVolume ? (
                    <span className="text-[10px] font-mono text-slate-400 truncate">
                      {hub.passengerVolume}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">Nepal Transit Node</span>
                  )}

                  <button
                    type="button"
                    onClick={() => onViewMoreHub(hub)}
                    className="px-2 py-0.5 rounded text-[10.5px] font-extrabold bg-sky-500/15 hover:bg-sky-500 text-sky-300 hover:text-slate-950 border border-sky-500/30 transition-all flex items-center gap-1 shrink-0"
                  >
                    View more <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* EMERGENCY SERVICES LIST */}
        {cluster.services.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-orange-400 flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Emergency Facilities ({cluster.services.length})
            </div>

            {cluster.services.map((service) => (
              <div
                key={service.id}
                className="p-2.5 rounded-lg bg-[#111622] border border-orange-500/20 hover:border-orange-500/40 transition-all flex flex-col gap-1.5 group"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex-1 min-w-0">
                    <span className="text-[9px] font-black uppercase text-orange-400 px-1.5 py-0.5 rounded bg-orange-500/10 border border-orange-500/20 inline-block mb-0.5">
                      {service.type.replace("_", " ")}
                    </span>
                    <h4 className="text-xs font-extrabold text-white truncate group-hover:text-orange-300 transition-colors">
                      {service.name}
                    </h4>
                    {service.address && (
                      <p className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5 text-orange-400 shrink-0" />
                        <span className="truncate">{service.address}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 mt-0.5">
                  {service.phone ? (
                    <span className="text-[10px] font-mono text-slate-400 truncate flex items-center gap-1">
                      <Phone className="w-2.5 h-2.5 text-slate-400" />
                      {service.phone}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 font-mono">Emergency Node</span>
                  )}

                  <button
                    type="button"
                    onClick={() => onViewMoreService(service)}
                    className="px-2 py-0.5 rounded text-[10.5px] font-extrabold bg-orange-500/15 hover:bg-orange-500 text-orange-300 hover:text-slate-950 border border-orange-500/30 transition-all flex items-center gap-1 shrink-0"
                  >
                    View more <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-slate-800 bg-[#121824]/90 flex items-center justify-between">
        <button
          type="button"
          onClick={onViewFullAreaModal}
          className="w-full py-1.5 px-3 rounded-lg text-xs font-extrabold bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-slate-950 border border-sky-500/40 transition-all text-center flex items-center justify-center gap-1.5"
        >
          <Layers3 className="w-3.5 h-3.5" /> View Full Area Report
        </button>
      </div>

    </div>
  );
}
