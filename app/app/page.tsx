"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MapContainer } from "@/components/dashboard/MapContainer";
import { IncidentMatrix } from "@/components/dashboard/IncidentMatrix";
import { AIAssistant } from "@/components/dashboard/AIAssistant";

import { Incident, MOCK_CLUSTERS, MOCK_INCIDENTS } from "@/components/dashboard/data";
import {
  Activity,
  Layers,
  Server,
  AlertTriangle,
  Radio,
  Zap,
  ShieldAlert,
  Sparkles,
  PanelRightOpen,
  PanelRightClose,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function NeuralCityDashboard() {
  const [activeTab, setActiveTab] = useState<string>("map");
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [showClusters, setShowClusters] = useState<boolean>(true);
  const [crisisActive, setCrisisActive] = useState<boolean>(true);
  const [selectedTime, setSelectedTime] = useState<string>("08:47");
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  const handleSelectIncidentFromMatrix = (incident: Incident) => {
    setSelectedIncident(incident);
    setActiveTab("map");
  };

  return (
    <div className="min-h-screen w-full bg-[#05070D] text-slate-100 flex font-sans selection:bg-blue-600/40">
      {/* Left sidebar navigation (~220px wide) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Command Center Content Area - Full fluid width */}
      <main
        className={`ml-[220px] flex-1 min-h-screen flex flex-col px-4 md:px-6 py-4 w-[calc(100%-220px)] overflow-x-hidden transition-all duration-300 ease-in-out ${
          aiOpen ? "lg:mr-[420px]" : ""
        }`}
      >
        {/* Top Command Bar & Tallinn Grid Telemetry Ribbon */}
        <header className="w-full bg-[#080B14]/90 backdrop-blur border border-slate-800/80 rounded-xl px-4 py-2.5 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-lg shadow-black/40">
          {/* Left: City & Grid Status */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <h1 className="font-bold text-sm tracking-wider uppercase text-slate-100 font-sans">
                Tallinn Grid Command
              </h1>
            </div>

            <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-slate-400 border-l border-slate-800 pl-3">
              <span className="text-blue-400 font-medium">SECTOR 37-TLN</span>
              <span className="text-slate-600">/</span>
              <span>HARJU ELECTRICAL NODE</span>
            </div>

            <Badge
              variant="outline"
              className={`hidden md:inline-flex font-mono text-[10px] px-2 py-0.5 ${crisisActive
                  ? "bg-rose-950/70 text-rose-300 border-rose-800 animate-pulse"
                  : "bg-emerald-950/50 text-emerald-300 border-emerald-800"
                }`}
            >
              {crisisActive ? "ALERT LEVEL: TIER-1 ANOMALY (08:47)" : "SYSTEM STATUS: NOMINAL"}
            </Badge>
          </div>

          {/* Right: Real-time Telemetry Indicators */}
          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="flex items-center gap-4 bg-[#05070D]/80 border border-slate-800/80 rounded-lg px-3 py-1 text-[11px]">
              <div className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap w-3.5 h-3.5 text-amber-400" aria-hidden="true"><path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z"></path></svg>
                <span className="text-slate-500">FREQ:</span>
                <span className="text-slate-200 font-bold">49.92 Hz</span>
                <span className="text-rose-400 text-[9.5px]">(-0.08)</span>
              </div>
              <div className="hidden lg:flex items-center gap-1.5 border-l border-slate-800 pl-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity w-3.5 h-3.5 text-emerald-400" aria-hidden="true"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path></svg>
                <span className="text-slate-500">LOSS:</span>
                <span className="text-emerald-400 font-bold">0.04%</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 border-l border-slate-800 pl-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-radio w-3.5 h-3.5 text-blue-400" aria-hidden="true"><path d="M16.247 7.761a6 6 0 0 1 0 8.478"></path><path d="M19.075 4.933a10 10 0 0 1 0 14.134"></path><path d="M4.925 19.067a10 10 0 0 1 0-14.134"></path><path d="M7.753 16.239a6 6 0 0 1 0-8.478"></path><circle cx="12" cy="12" r="2"></circle></svg>
                <span className="text-slate-500">NODES:</span>
                <span className="text-slate-200 font-bold">1,420/1,424</span>
              </div>
              <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-triangle-alert w-3.5 h-3.5 text-rose-400" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
                <span className="text-slate-500">ACTIVE:</span>
                <span className="text-rose-300 font-bold">6</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAiOpen((open) => !open)}
              aria-label={aiOpen ? "Close secondary sidebar" : "Open secondary sidebar"}
              className="flex items-center gap-2 rounded-lg border border-slate-700/80 bg-[#05070D]/80 px-2.5 py-1.5 text-[9px] font-mono uppercase tracking-[0.18em] text-slate-300 shadow-sm shadow-black/30 transition-all hover:border-blue-500/60 hover:text-blue-300"
            >
              <span className={`h-2 w-2 rounded-full ${aiOpen ? "bg-emerald-400" : "bg-slate-500"}`} />
              <span>Menu</span>
              {aiOpen ? (
                <PanelRightClose className="h-3.5 w-3.5 text-slate-200" />
              ) : (
                <PanelRightOpen className="h-3.5 w-3.5 text-slate-200" />
              )}
            </button>
          </div>
        </header>

        {/* Viewport Content Switcher */}
        {activeTab === "map" || activeTab === "timeline" ? (
          <div className="w-full flex-1 flex flex-col">
            <MapContainer
              showIncidents={showIncidents}
              showClusters={showClusters}
              crisisActive={crisisActive}
              setCrisisActive={setCrisisActive}
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
              selectedIncident={selectedIncident}
              setSelectedIncident={setSelectedIncident}
            />
          </div>
        ) : activeTab === "incidents" ? (
          <div className="w-full flex-1">
            <IncidentMatrix onSelectIncident={handleSelectIncidentFromMatrix} />
          </div>
        ) : activeTab === "clusters" ? (
          <div className="w-full space-y-4">
            {/* Cluster Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MOCK_CLUSTERS.map((cluster) => (
                <div
                  key={cluster.id}
                  className="bg-[#090D16] border border-slate-800/80 rounded-xl p-4 space-y-2 hover:border-blue-500/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-blue-400" />
                      <span className="font-semibold text-xs text-slate-100">
                        {cluster.name}
                      </span>
                    </div>
                    <Badge className="bg-blue-950 text-blue-300 border-blue-800 font-mono text-[10px]">
                      {cluster.id}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 text-slate-400 border-t border-slate-800/60">
                    <div>
                      <span className="text-slate-500">INCIDENTS:</span>{" "}
                      <span className="text-rose-400 font-bold">{cluster.incidentCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">RADIUS:</span> {cluster.radiusKm} km
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-500">TYPE:</span> {cluster.primaryCategory}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Interactive Cluster Map View */}
            <div className="w-full">
              <MapContainer
                showIncidents={showIncidents}
                showClusters={true}
                crisisActive={crisisActive}
                setCrisisActive={setCrisisActive}
                selectedTime={selectedTime}
                setSelectedTime={setSelectedTime}
                selectedIncident={selectedIncident}
                setSelectedIncident={setSelectedIncident}
              />
            </div>
          </div>
        ) : (
          /* Telemetry & Diagnostics Full Panel */
          <div className="w-full space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-slate-800/90 bg-[#080B14]">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono">
                  <span>GRID FREQUENCY</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl text-slate-100 font-bold font-mono mt-2">49.92 Hz</div>
                <div className="text-[10px] text-rose-400 mt-1 font-mono">
                  -0.08 Hz (08:47:01 Drop detected)
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800/90 bg-[#080B14]">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono">
                  <span>PACKET LOSS RATE</span>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl text-slate-100 font-bold font-mono mt-2">0.04%</div>
                <div className="text-[10px] text-emerald-400 mt-1 font-mono">
                  Subsea & terrestrial links stable
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800/90 bg-[#080B14]">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono">
                  <span>SENSOR HEARTBEATS</span>
                  <Radio className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl text-slate-100 font-bold font-mono mt-2">
                  1,420 / 1,424
                </div>
                <div className="text-[10px] text-amber-400 mt-1 font-mono">
                  4 Kristiine sensors unacknowledged
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-800/90 bg-[#080B14]">
                <div className="flex items-center justify-between text-slate-500 text-[11px] font-mono">
                  <span>FAILOVER PROTOCOL</span>
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl text-rose-400 font-bold font-mono mt-2">ENGAGED</div>
                <div className="text-[10px] text-slate-400 mt-1 font-mono">
                  Vanalinn & Ülemiste isolations active
                </div>
              </div>
            </div>

            {/* Substation Relay Telemetry Grid */}
            <div className="bg-[#080B14] border border-slate-800/80 rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-blue-400" />
                  <h3 className="font-semibold text-xs tracking-wider uppercase text-slate-100 font-sans">
                    Tallinn Substation Primary Relays
                  </h3>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] bg-slate-900 border-slate-800 text-slate-400">
                  REAL-TIME TELEMETRY STREAM
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
                {MOCK_INCIDENTS.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-3 rounded-lg border border-slate-800/70 bg-[#05070D] flex items-center justify-between"
                  >
                    <div>
                      <div className="text-[10px] text-slate-500">{inc.nodeId}</div>
                      <div className="text-xs font-semibold text-slate-200 mt-0.5">
                        {inc.title.split(" ")[0]} Sector
                      </div>
                      <div className="text-[9.5px] text-slate-400 mt-0.5">{inc.category}</div>
                    </div>
                    <Badge
                      variant={inc.severity === "critical" ? "destructive" : "outline"}
                      className="text-[9px] uppercase font-mono"
                    >
                      {inc.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <AIAssistant isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </div>
  );
}
