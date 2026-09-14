"use client";

import React, { useMemo, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MapContainer } from "@/components/dashboard/MapContainer";
import { IncidentMatrix } from "@/components/dashboard/IncidentMatrix";
import { AIAssistant } from "@/components/dashboard/AIAssistant";
import { TelemetryFeed } from "@/components/dashboard/map/TelemetryFeed";

import { Incident, MOCK_INCIDENTS } from "@/components/dashboard/data";
import {
  Activity,
  Server,
  AlertTriangle,
  Radio,
  Zap,
  ShieldAlert,
  Sparkles,
  PanelRightOpen,
  PanelRightClose,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function NeuralCityDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("map");
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [crisisActive, setCrisisActive] = useState<boolean>(true);
  const [selectedTime, setSelectedTime] = useState<string>("08:47");
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [sideDrawerOpen, setSideDrawerOpen] = useState(true);
  const [feedMinimized, setFeedMinimized] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiContext, setAiContext] = useState<string | null>(null);

  const filteredIncidents = useMemo(() => {
    switch (selectedTime) {
      case "08:40":
        return MOCK_INCIDENTS.slice(4);
      case "08:44":
        return MOCK_INCIDENTS.slice(2);
      case "08:47":
      default:
        return MOCK_INCIDENTS;
    }
  }, [selectedTime]);

  const handleSelectIncidentFromMatrix = (incident: Incident) => {
    setSelectedIncident(incident);
    setActiveTab("map");
  };

  const handleUseFeedContext = (context: string) => {
    setAiContext(context);
    setAiOpen(true);
  };

  const handleFeedSelectIncident = (incident: Incident) => {
    setSelectedIncident(incident);
    setActiveTab("map");
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex font-sans selection:bg-primary/20">
      {/* Left sidebar navigation (~220px wide or collapsed) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((open) => !open)}
      />

      {/* Main Command Center Content Area - Full fluid width */}
      <main
        className={`flex-1 min-h-screen flex flex-col px-4 md:px-6 py-4 overflow-x-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen ? "ml-[220px] w-[calc(100%-220px)]" : "ml-0 w-full"
        } ${aiOpen ? "lg:mr-[420px]" : ""}`}
      >
        {/* Top Command Bar & Tallinn Grid Telemetry Ribbon */}
        <header className="w-full bg-card/90 backdrop-blur border border-border rounded-xl px-4 py-2.5 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              aria-label={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              className="group relative flex items-center justify-center rounded-lg border border-border bg-muted/80 h-7 w-7 p-0 text-foreground transition-all hover:border-primary/60 hover:text-primary"
            >
              <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-popover px-1.5 py-0.5 text-[10px] text-popover-foreground opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                {sidebarOpen ? "Hide sidebar" : "Show sidebar"}
              </span>
              {sidebarOpen ? (
                <PanelLeftClose className="h-3.5 w-3.5 text-foreground" />
              ) : (
                <PanelLeftOpen className="h-3.5 w-3.5 text-foreground" />
              )}
            </button>
          </div>
          {/* Right: Real-time Telemetry Indicators */}
          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="flex items-center gap-4 bg-muted/80 border border-border rounded-lg px-3 py-1 text-[11px]">
              <div className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-zap w-3.5 h-3.5 text-amber-400" aria-hidden="true"><path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z"></path></svg>
                <span className="text-muted-foreground">FREQ:</span>
                <span className="text-foreground font-bold">49.92 Hz</span>
                <span className="text-rose-400 text-[9.5px]">(-0.08)</span>
              </div>
              <div className="hidden lg:flex items-center gap-1.5 border-l border-border pl-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity w-3.5 h-3.5 text-emerald-400" aria-hidden="true"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"></path></svg>
                <span className="text-muted-foreground">LOSS:</span>
                <span className="text-emerald-400 font-bold">0.04%</span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5 border-l border-border pl-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-radio w-3.5 h-3.5 text-primary" aria-hidden="true"><path d="M16.247 7.761a6 6 0 0 1 0 8.478"></path><path d="M19.075 4.933a10 10 0 0 1 0 14.134"></path><path d="M4.925 19.067a10 10 0 0 1 0-14.134"></path><path d="M7.753 16.239a6 6 0 0 1 0-8.478"></path><circle cx="12" cy="12" r="2"></circle></svg>
                <span className="text-muted-foreground">NODES:</span>
                <span className="text-foreground font-bold">1,420/1,424</span>
              </div>
              <div className="flex items-center gap-1.5 border-l border-border pl-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-triangle-alert w-3.5 h-3.5 text-rose-400" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
                <span className="text-muted-foreground">ACTIVE:</span>
                <span className="text-rose-300 font-bold">6</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSideDrawerOpen((open) => !open)}
              aria-expanded={sideDrawerOpen}
              aria-label={sideDrawerOpen ? "Close feed" : "Open feed"}
              title={sideDrawerOpen ? "Close feed" : "Open feed"}
              className="group relative inline-flex shrink-0 items-center justify-center bg-clip-padding font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50 gap-1 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5 h-7 w-7 p-0 border border-border bg-muted text-foreground"
            >
              <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-popover px-1.5 py-0.5 text-[10px] text-popover-foreground opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                {sideDrawerOpen ? "Close feed" : "Open feed"}
              </span>
              <Radio className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setAiOpen((open) => !open)}
              aria-label={aiOpen ? "Close secondary sidebar" : "Open secondary sidebar"}
              title={aiOpen ? "Close secondary sidebar" : "Open secondary sidebar"}
              className="group relative flex items-center justify-center rounded-lg border border-border bg-muted/80 h-7 w-7 p-0 text-foreground transition-all hover:border-primary/60 hover:text-primary"
            >
              <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-popover px-1.5 py-0.5 text-[10px] text-popover-foreground opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                {aiOpen ? "Close secondary sidebar" : "Open secondary sidebar"}
              </span>
              {aiOpen ? (
                <PanelRightClose className="h-3.5 w-3.5 text-foreground" />
              ) : (
                <PanelRightOpen className="h-3.5 w-3.5 text-foreground" />
              )}
            </button>
          </div>
        </header>

        {sideDrawerOpen && (
          <div className="pointer-events-none absolute inset-x-0 top-20 z-30 flex justify-end pr-4 md:pr-6">
            <div className="pointer-events-auto">
              <TelemetryFeed
                filteredIncidents={filteredIncidents}
                setSelectedIncident={setSelectedIncident}
                flyTo={() => undefined}
                isMinimized={feedMinimized}
                onToggleMinimize={() => setFeedMinimized((value) => !value)}
                onClose={() => setSideDrawerOpen(false)}
                onUseContext={handleUseFeedContext}
                onSelectIncident={handleFeedSelectIncident}
              />
            </div>
          </div>
        )}

        {/* Viewport Content Switcher */}
        {activeTab === "map" || activeTab === "timeline" ? (
          <div className="w-full flex-1 flex flex-col">
            <MapContainer
              showIncidents={showIncidents}
              crisisActive={crisisActive}
              setCrisisActive={setCrisisActive}
              onUseFeedContext={handleUseFeedContext}
              selectedTime={selectedTime}
              setSelectedTime={setSelectedTime}
              selectedIncident={selectedIncident}
              setSelectedIncident={setSelectedIncident}
              setShowIncidents={setShowIncidents}
            />
          </div>
        ) : activeTab === "incidents" ? (
          <div className="w-full flex-1">
            <IncidentMatrix onSelectIncident={handleSelectIncidentFromMatrix} />
          </div>
        ) : (
          /* Telemetry & Diagnostics Full Panel */
          <div className="w-full space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between text-muted-foreground text-[11px] font-mono">
                  <span>GRID FREQUENCY</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl text-card-foreground font-bold font-mono mt-2">49.92 Hz</div>
                <div className="text-[10px] text-rose-400 mt-1 font-mono">
                  -0.08 Hz (08:47:01 Drop detected)
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between text-muted-foreground text-[11px] font-mono">
                  <span>PACKET LOSS RATE</span>
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl text-card-foreground font-bold font-mono mt-2">0.04%</div>
                <div className="text-[10px] text-emerald-400 mt-1 font-mono">
                  Subsea & terrestrial links stable
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between text-muted-foreground text-[11px] font-mono">
                  <span>SENSOR HEARTBEATS</span>
                  <Radio className="w-4 h-4 text-primary" />
                </div>
                <div className="text-2xl text-card-foreground font-bold font-mono mt-2">
                  1,420 / 1,424
                </div>
                <div className="text-[10px] text-amber-400 mt-1 font-mono">
                  4 Kristiine sensors unacknowledged
                </div>
              </div>

              <div className="p-4 rounded-xl border border-border bg-card">
                <div className="flex items-center justify-between text-muted-foreground text-[11px] font-mono">
                  <span>FAILOVER PROTOCOL</span>
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl text-rose-400 font-bold font-mono mt-2">ENGAGED</div>
                <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                  Vanalinn & Ülemiste isolations active
                </div>
              </div>
            </div>

            {/* Substation Relay Telemetry Grid */}
            <div className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-xs tracking-wider uppercase text-card-foreground font-sans">
                    Tallinn Substation Primary Relays
                  </h3>
                </div>
                <Badge variant="outline" className="font-mono text-[10px] bg-muted border-border text-muted-foreground">
                  REAL-TIME TELEMETRY STREAM
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 font-mono text-xs">
                {MOCK_INCIDENTS.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-3 rounded-lg border border-border bg-muted/40 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-[10px] text-muted-foreground">{inc.nodeId}</div>
                      <div className="text-xs font-semibold text-card-foreground mt-0.5">
                        {inc.title.split(" ")[0]} Sector
                      </div>
                      <div className="text-[9.5px] text-muted-foreground mt-0.5">{inc.category}</div>
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

      <AIAssistant
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        context={aiContext}
        onClearContext={() => setAiContext(null)}
      />
    </div>
  );
}
