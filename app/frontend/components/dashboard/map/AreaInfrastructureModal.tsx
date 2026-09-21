"use client";

import React, { useState } from "react";
import {
  X,
  Building2,
  Plane,
  Anchor,
  TrainTrack,
  Compass,
  Hospital as HospitalIcon,
  Shield,
  Flame,
  Home,
  AlertTriangle,
  Phone,
  Globe,
  MapPin,
  ExternalLink,
  Layers3,
  ZoomIn,
  Navigation,
} from "lucide-react";
import type { InfrastructureCluster } from "./useDecluttering";
import type { TransportHub, TransportHubType } from "../transportHubsData";
import type { EmergencyService, EmergencyServiceType } from "../emergencyServicesData";

interface AreaInfrastructureModalProps {
  cluster: InfrastructureCluster;
  onClose: () => void;
  onSelectHub?: (hub: TransportHub) => void;
  onSelectService?: (service: EmergencyService) => void;
  onZoomToArea?: (lat: number, lng: number) => void;
}

export function AreaInfrastructureModal({
  cluster,
  onClose,
  onSelectHub,
  onSelectService,
  onZoomToArea,
}: AreaInfrastructureModalProps) {
  const [filter, setFilter] = useState<"all" | "hubs" | "services">("all");

  const showHubs = filter === "all" || filter === "hubs";
  const showServices = filter === "all" || filter === "services";

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-200">
      <div className="relative flex flex-col w-full max-w-2xl max-h-[85vh] bg-[#0C1017] border border-sky-500/40 rounded-xl shadow-xl overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-[#121824]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-400">
              <Layers3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-wide text-white">
                  Area Infrastructure Overview
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-sky-500/20 text-sky-300 border border-sky-500/40">
                  {cluster.totalCount} Facilities
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Location: {cluster.lat.toFixed(4)}°N, {cluster.lng.toFixed(4)}°E • {cluster.hubs.length} Transport Nodes, {cluster.services.length} Emergency Facilities
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Navigation Bar */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-800/80 bg-[#0E131D]">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                filter === "all"
                  ? "bg-sky-500 text-slate-950 shadow-md"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              All Facilities ({cluster.totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("hubs")}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                filter === "hubs"
                  ? "bg-sky-500 text-slate-950 shadow-md"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              Transport Hubs ({cluster.hubs.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("services")}
              className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                filter === "services"
                  ? "bg-orange-500 text-slate-950 shadow-md"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              Emergency Services ({cluster.services.length})
            </button>
          </div>

          {onZoomToArea && (
            <button
              type="button"
              onClick={() => {
                onZoomToArea(cluster.lat, cluster.lng);
                onClose();
              }}
              className="flex items-center gap-1.5 text-xs font-bold text-sky-400 hover:text-sky-300 px-2.5 py-1 rounded border border-sky-500/30 hover:bg-sky-500/10 transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              Zoom To Area
            </button>
          )}
        </div>

        {/* Scrollable Content List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* SECTION: TRANSPORT HUBS */}
          {showHubs && cluster.hubs.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 pb-1 border-b border-sky-500/20 text-sky-400 font-extrabold text-xs uppercase tracking-wider">
                <Plane className="w-4 h-4 -rotate-45 text-sky-400" />
                Transport Hubs & Relief Logistics Nodes ({cluster.hubs.length})
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {cluster.hubs.map((hub) => (
                  <div
                    key={hub.id}
                    className="p-3.5 rounded-lg bg-[#111622] border border-sky-500/20 hover:border-sky-500/50 transition-colors space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-sky-400 uppercase tracking-wide bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30">
                            {hub.category || hub.type}
                          </span>
                          <h4 className="text-sm font-extrabold text-white group-hover:text-sky-300 transition-colors">
                            {hub.name}
                          </h4>
                        </div>
                        {hub.shortName && hub.shortName !== hub.name && (
                          <span className="text-xs font-semibold text-slate-400 block mt-0.5">
                            Identifier: {hub.shortName}
                          </span>
                        )}
                      </div>

                      {onSelectHub && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectHub(hub);
                            onClose();
                          }}
                          className="px-2.5 py-1 text-xs font-bold bg-sky-500/15 hover:bg-sky-500 text-sky-300 hover:text-slate-950 rounded border border-sky-500/30 transition-all shrink-0 flex items-center gap-1"
                        >
                          <Navigation className="w-3 h-3" /> Inspect Hub
                        </button>
                      )}
                    </div>

                    {/* Operational Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/60 p-2.5 rounded border border-slate-800">
                      <div>
                        <span className="text-slate-400 font-medium">District/Location:</span>{" "}
                        <span className="text-slate-200 font-bold">{hub.district || hub.city || "Transit Corridor"}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Pax Flow:</span>{" "}
                        <span className="text-sky-300 font-bold">
                          {hub.dailyPassengers ? `${hub.dailyPassengers.toLocaleString()} / day` : hub.passengerVolume || "Active"}
                        </span>
                      </div>
                      {(hub.hourlyCapacity || hub.capacity || hub.throughput) && (
                        <div>
                          <span className="text-slate-400 font-medium">Throughput / Cap:</span>{" "}
                          <span className="text-emerald-400 font-bold">
                            {hub.hourlyCapacity || hub.capacity || hub.throughput}
                          </span>
                        </div>
                      )}
                      {hub.status && (
                        <div>
                          <span className="text-slate-400 font-medium">Status:</span>{" "}
                          <span className="text-emerald-400 font-bold uppercase">{hub.status}</span>
                        </div>
                      )}
                      {hub.phone && (
                        <div className="flex items-center gap-1 text-slate-300 col-span-2">
                          <Phone className="w-3 h-3 text-sky-400 shrink-0" />
                          <span className="font-mono text-[11px]">{hub.phone}</span>
                        </div>
                      )}
                    </div>

                    {hub.description && (
                      <p className="text-xs text-slate-300 leading-relaxed font-normal">
                        {hub.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION: EMERGENCY SERVICES */}
          {showServices && cluster.services.length > 0 && (
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center gap-2 pb-1 border-b border-orange-500/20 text-orange-400 font-extrabold text-xs uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-orange-400" />
                Emergency Facilities & Rescue Bases ({cluster.services.length})
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {cluster.services.map((service) => (
                  <div
                    key={service.id}
                    className="p-3.5 rounded-lg bg-[#111622] border border-orange-500/20 hover:border-orange-500/50 transition-colors space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-orange-400 uppercase tracking-wide bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/30">
                            {service.type.replace("_", " ")}
                          </span>
                          <h4 className="text-sm font-extrabold text-white group-hover:text-orange-300 transition-colors">
                            {service.name}
                          </h4>
                        </div>
                        {service.address && (
                          <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                            <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
                            <span>{service.address}</span>
                          </div>
                        )}
                      </div>

                      {onSelectService && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectService(service);
                            onClose();
                          }}
                          className="px-2.5 py-1 text-xs font-bold bg-orange-500/15 hover:bg-orange-500 text-orange-300 hover:text-slate-950 rounded border border-orange-500/30 transition-all shrink-0 flex items-center gap-1"
                        >
                          <Navigation className="w-3 h-3" /> Inspect Facility
                        </button>
                      )}
                    </div>

                    {/* Operational Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900/60 p-2.5 rounded border border-slate-800">
                      {service.phone && (
                        <div className="flex items-center gap-1 text-slate-300">
                          <Phone className="w-3 h-3 text-orange-400 shrink-0" />
                          <span className="font-mono text-[11px]">{service.phone}</span>
                        </div>
                      )}
                      {service.beds !== undefined && service.beds > 0 && (
                        <div>
                          <span className="text-slate-400 font-medium">Capacity:</span>{" "}
                          <span className="text-slate-200 font-bold">{service.beds} ER Beds</span>
                        </div>
                      )}
                      {service.status && (
                        <div>
                          <span className="text-slate-400 font-medium">Status:</span>{" "}
                          <span className="text-emerald-400 font-bold uppercase">{service.status}</span>
                        </div>
                      )}
                      {service.district && (
                        <div>
                          <span className="text-slate-400 font-medium">District:</span>{" "}
                          <span className="text-slate-200 font-bold">{service.district}</span>
                        </div>
                      )}
                    </div>

                    {(service.category || service.vehicles || service.fleet) && (
                      <p className="text-xs text-slate-300 leading-relaxed font-normal">
                        {service.category}{service.vehicles ? ` • Fleet: ${service.vehicles}` : service.fleet ? ` • Fleet: ${service.fleet}` : ""}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 bg-[#121824] text-xs text-slate-400">
          <span>Click any facility card to focus camera and inspect specific details</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            Close Overview
          </button>
        </div>

      </div>
    </div>
  );
}
