"use client";

import React, { useMemo, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MapContainer } from "@/components/dashboard/MapContainer";
import { IncidentMatrix } from "@/components/dashboard/IncidentMatrix";
import { AIAssistant } from "@/components/dashboard/AIAssistant";
import { MediaFeed } from "@/components/dashboard/MediaFeed";

import { Incident, MOCK_INCIDENTS } from "@/components/dashboard/data";
import {
  Radio,
  PanelRightOpen,
  PanelRightClose,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";

export default function NeuralCityDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("map");
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [crisisActive, setCrisisActive] = useState<boolean>(true);
  const [selectedTime, setSelectedTime] = useState<string>("08:47");
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [feedOpen, setFeedOpen] = useState(true);
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
        {/* Top Command Bar & Action Controls */}
        <header className="w-full bg-card border border-border rounded-xl px-4 py-2.5 mb-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
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
          {/* Right Action Controls */}
          <div className="flex items-center gap-3 font-mono text-xs">
            <button
              type="button"
              onClick={() => setFeedOpen((open) => !open)}
              aria-label={feedOpen ? "Close telemetry feed" : "Open telemetry feed"}
              title={feedOpen ? "Close telemetry feed" : "Open telemetry feed"}
              className="group relative flex items-center justify-center rounded-lg border border-border bg-muted/80 h-7 w-7 p-0 text-foreground transition-all hover:border-primary/60 hover:text-primary"
            >
              <span className="pointer-events-none absolute left-1/2 top-full z-50 mt-1 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-popover px-1.5 py-0.5 text-[10px] text-popover-foreground opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
                {feedOpen ? "Close telemetry feed" : "Open telemetry feed"}
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


        {/* Viewport Content Switcher */}
        {activeTab === "incidents" ? (
          <div className="w-full flex-1">
            <IncidentMatrix onSelectIncident={handleSelectIncidentFromMatrix} />
          </div>
        ) : activeTab === "media" ? (
          <div className="w-full flex-1">
            <MediaFeed />
          </div>
        ) : (
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
              showTelemetryFeed={feedOpen}
              onCloseTelemetryFeed={() => setFeedOpen(false)}
            />
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
