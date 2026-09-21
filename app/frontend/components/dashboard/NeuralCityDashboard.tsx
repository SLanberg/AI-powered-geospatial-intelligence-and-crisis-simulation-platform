"use client";

import React, { useMemo, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MapContainer } from "@/components/dashboard/MapContainer";
import { IncidentMatrix } from "@/frontend/components/dashboard/incidents/IncidentMatrix";
import { AIAssistant } from "@/frontend/components/dashboard/ai/AIAssistant";
import { MediaFeed } from "@/components/dashboard/MediaFeed";
import { NavBar } from "@/components/dashboard/NavBar";
import { Incident } from "@/shared";
import { MOCK_INCIDENTS, MapAction } from "@/components/dashboard/data";
import { NepalIncidentReplayView } from "@/frontend/components/dashboard/nepal/NepalIncidentReplayView";
import {
  REPLAY_START_SECONDS,
  getActiveEvent,
  NepalTimelineEvent,
} from "@/frontend/data/nepalIncidentData";

export interface NeuralCityDashboardProps {
  initialIncidents?: Incident[];
}

export function NeuralCityDashboard({ initialIncidents }: NeuralCityDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("map");
  const [showIncidents, setShowIncidents] = useState<boolean>(true);
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [crisisActive, setCrisisActive] = useState<boolean>(true);
  const [selectedTime, setSelectedTime] = useState<string>("08:47");
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiContext, setAiContext] = useState<string | null>(null);
  const [mapAction, setMapAction] = useState<MapAction | null>(null);

  // Nepal Replay synchronized state
  const [replaySeconds, setReplaySeconds] = useState<number>(REPLAY_START_SECONDS);
  const [copilotDefaultMode, setCopilotDefaultMode] = useState<"chat" | "analysis">("chat");

  // Copilot expandable dock width
  const [copilotWidth, setCopilotWidth] = useState<number>(446);
  const [isCopilotDragging, setIsCopilotDragging] = useState<boolean>(false);

  // Restore saved width from localStorage
  React.useEffect(() => {
    try {
      const savedWidth = localStorage.getItem("nc_copilot_drawer_width");
      if (savedWidth) {
        const parsed = parseInt(savedWidth, 10);
        if (!isNaN(parsed) && parsed >= 446) {
          const maxWidth = Math.min(window.innerWidth - 40, 1400);
          setCopilotWidth(Math.min(parsed, maxWidth));
        } else if (!isNaN(parsed)) {
          setCopilotWidth(446);
        }
      }
    } catch {}
  }, []);

  // Trigger map resize event when AI panel or Sidebar toggles
  const handleToggleAi = React.useCallback((updater: React.SetStateAction<boolean>) => {
    setAiOpen((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (next) {
        setCopilotDefaultMode((cur) => cur);
      }
      setTimeout(() => window.dispatchEvent(new Event("resize")), 220);
      return next;
    });
  }, []);

  const handleToggleSidebar = React.useCallback((updater: React.SetStateAction<boolean>) => {
    setSidebarOpen((prev) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      setTimeout(() => window.dispatchEvent(new Event("resize")), 320);
      return next;
    });
  }, []);

  const [currentIncidents, setCurrentIncidents] = useState<Incident[]>(initialIncidents ?? []);

  // Sync initialIncidents when prop changes
  React.useEffect(() => {
    if (initialIncidents !== undefined) {
      setCurrentIncidents(initialIncidents);
    }
  }, [initialIncidents]);

  // Real-time synchronization when incidents are created, updated, or deleted
  React.useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<Incident[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setCurrentIncidents((prev) => {
          if (
            prev.length === customEvent.detail.length &&
            prev.every((item, idx) => item.id === customEvent.detail[idx]?.id)
          ) {
            return prev;
          }
          return customEvent.detail;
        });
      }
    };
    window.addEventListener("scada-incidents-updated", handleUpdate);
    return () => window.removeEventListener("scada-incidents-updated", handleUpdate);
  }, []);

  const activeNepalEvent = useMemo(() => getActiveEvent(replaySeconds), [replaySeconds]);

  const filteredIncidents = useMemo(() => {
    switch (selectedTime) {
      case "08:40":
        return currentIncidents.slice(4);
      case "08:44":
        return currentIncidents.slice(2);
      case "08:47":
      default:
        return currentIncidents;
    }
  }, [selectedTime, currentIncidents]);

  const handleTabChange = React.useCallback((newTab: string) => {
    setActiveTab(newTab);
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });
  }, []);

  const handleSelectIncidentFromMatrix = React.useCallback((incident: Incident) => {
    setSelectedIncident(incident);
    setActiveTab("map");
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });
  }, []);

  const handleUseFeedContext = React.useCallback((context: string) => {
    setAiContext(context);
    setCopilotDefaultMode("chat");
    setAiOpen(true);
  }, []);

  const handleMapAction = React.useCallback((action: MapAction) => {
    setMapAction(action);
    setActiveTab("map");
    requestAnimationFrame(() => {
      window.dispatchEvent(new Event("resize"));
    });
  }, []);

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex font-sans">
      {/* Left sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        isOpen={sidebarOpen}
        onToggle={() => handleToggleSidebar((open) => !open)}
        incidentCount={currentIncidents.length}
      />

      {/* Main Command Center Content Area - Map renders full-bleed under translucent Copilot drawer */}
      <main
        style={{
          transition: "margin-left 150ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className={`flex-1 h-screen flex flex-col overflow-x-hidden ${
          sidebarOpen ? "ml-[220px]" : "ml-0"
        }`}
      >
        {/* Top Command Bar - Shifts smoothly with Copilot */}
        <NavBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={handleToggleSidebar}
          aiOpen={aiOpen}
          setAiOpen={handleToggleAi}
          copilotWidth={copilotWidth}
          isCopilotDragging={isCopilotDragging}
        />

        {/* Viewport Content Switcher - All views preserved in DOM for instant 0ms tab switching */}
        <div
          className={`w-full flex-1 flex flex-col h-[calc(100vh-49px)] ${
            activeTab === "nepal" ? "block" : "hidden"
          }`}
        >
          <NepalIncidentReplayView
            currentSeconds={replaySeconds}
            onSeek={setReplaySeconds}
            onOpenRealTimeAnalysis={() => {
              setCopilotDefaultMode("analysis");
              setAiOpen(true);
            }}
            copilotWidth={copilotWidth}
            aiOpen={aiOpen}
            isCopilotDragging={isCopilotDragging}
          />
        </div>

        <div
          className={`w-full flex-1 p-4 overflow-y-auto ${
            activeTab === "incidents" ? "block" : "hidden"
          }`}
        >
          <IncidentMatrix
            onSelectIncident={handleSelectIncidentFromMatrix}
            initialIncidents={currentIncidents}
          />
        </div>

        <div
          className={`w-full flex-1 p-4 overflow-y-auto ${
            activeTab === "media" ? "block" : "hidden"
          }`}
        >
          <MediaFeed />
        </div>

        <div
          className={`w-full flex-1 flex flex-col h-[calc(100vh-49px)] ${
            activeTab === "map" || !activeTab ? "block" : "hidden"
          }`}
        >
          <MapContainer
            incidents={filteredIncidents}
            showIncidents={showIncidents}
            crisisActive={crisisActive}
            setCrisisActive={setCrisisActive}
            onUseFeedContext={handleUseFeedContext}
            selectedTime={selectedTime}
            setSelectedTime={setSelectedTime}
            selectedIncident={selectedIncident as any}
            setSelectedIncident={setSelectedIncident as any}
            setShowIncidents={setShowIncidents}
            showHeatmap={showHeatmap}
            setShowHeatmap={setShowHeatmap}
            mapAction={mapAction}
            onClearMapAction={() => setMapAction(null)}
            copilotWidth={copilotWidth}
            aiOpen={aiOpen}
            isCopilotDragging={isCopilotDragging}
          />
        </div>
      </main>

      <AIAssistant
        isOpen={aiOpen}
        onClose={() => handleToggleAi(false)}
        context={aiContext}
        onClearContext={() => setAiContext(null)}
        onMapAction={handleMapAction}
        activeTab={activeTab}
        activeNepalEvent={activeNepalEvent}
        currentReplaySeconds={replaySeconds}
        onSeekReplay={setReplaySeconds}
        selectedIncident={selectedIncident}
        incidents={filteredIncidents}
        defaultMode={copilotDefaultMode}
        width={copilotWidth}
        onWidthChange={setCopilotWidth}
        isDragging={isCopilotDragging}
        onDraggingChange={setIsCopilotDragging}
      />
    </div>
  );
}

export default NeuralCityDashboard;
