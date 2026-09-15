"use client";

import React, { useMemo, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { MapContainer } from "@/components/dashboard/MapContainer";
import { IncidentMatrix } from "@/components/dashboard/IncidentMatrix";
import { AIAssistant } from "@/components/dashboard/AIAssistant";
import { MediaFeed } from "@/components/dashboard/MediaFeed";
import { NavBar } from "@/components/dashboard/NavBar";

import { Incident, MOCK_INCIDENTS } from "@/components/dashboard/data";

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
        className={`flex-1 h-screen flex flex-col overflow-x-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen ? "ml-[220px] w-[calc(100%-220px)]" : "ml-0 w-full"
        } ${aiOpen ? "lg:mr-[420px]" : ""}`}
      >
        {/* Top Command Bar & Action Controls */}
        <NavBar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          feedOpen={feedOpen}
          setFeedOpen={setFeedOpen}
          aiOpen={aiOpen}
          setAiOpen={setAiOpen}
        />

        {/* Viewport Content Switcher */}
        {activeTab === "incidents" ? (
          <div className="w-full flex-1 p-4 overflow-y-auto">
            <IncidentMatrix onSelectIncident={handleSelectIncidentFromMatrix} />
          </div>
        ) : activeTab === "media" ? (
          <div className="w-full flex-1 p-4 overflow-y-auto">
            <MediaFeed />
          </div>
        ) : (
          <div className="w-full flex-1 flex flex-col h-[calc(100vh-49px)]">
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
