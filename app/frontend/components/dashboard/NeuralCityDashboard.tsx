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
  const [feedOpen, setFeedOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiContext, setAiContext] = useState<string | null>(null);
  const [mapAction, setMapAction] = useState<MapAction | null>(null);

  const incidentsData = initialIncidents && initialIncidents.length > 0 ? initialIncidents : (MOCK_INCIDENTS as Incident[]);

  const filteredIncidents = useMemo(() => {
    switch (selectedTime) {
      case "08:40":
        return incidentsData.slice(4);
      case "08:44":
        return incidentsData.slice(2);
      case "08:47":
      default:
        return incidentsData;
    }
  }, [selectedTime, incidentsData]);

  const handleSelectIncidentFromMatrix = (incident: Incident) => {
    setSelectedIncident(incident);
    setActiveTab("map");
  };

  const handleUseFeedContext = (context: string) => {
    setAiContext(context);
    setAiOpen(true);
  };

  const handleMapAction = (action: MapAction) => {
    setMapAction(action);
    setActiveTab("map");
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex font-sans selection:bg-primary/20">
      {/* Left sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((open) => !open)}
      />

      {/* Main Command Center Content Area */}
      <main
        className={`flex-1 h-screen flex flex-col overflow-x-hidden transition-all duration-300 ease-in-out ${
          sidebarOpen ? "ml-[220px]" : "ml-0"
        } ${aiOpen ? "mr-[440px]" : "mr-0"}`}
      >
        {/* Top Command Bar */}
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
            <IncidentMatrix
              onSelectIncident={handleSelectIncidentFromMatrix}
              initialIncidents={initialIncidents}
            />
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
              selectedIncident={selectedIncident as any}
              setSelectedIncident={setSelectedIncident as any}
              setShowIncidents={setShowIncidents}
              showHeatmap={showHeatmap}
              setShowHeatmap={setShowHeatmap}
              showTelemetryFeed={feedOpen}
              onCloseTelemetryFeed={() => setFeedOpen(false)}
              mapAction={mapAction}
              onClearMapAction={() => setMapAction(null)}
            />
          </div>
        )}
      </main>

      <AIAssistant
        isOpen={aiOpen}
        onClose={() => setAiOpen(false)}
        context={aiContext}
        onClearContext={() => setAiContext(null)}
        onMapAction={handleMapAction}
      />
    </div>
  );
}

export default NeuralCityDashboard;
