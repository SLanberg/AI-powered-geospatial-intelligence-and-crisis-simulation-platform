"use client";

import React from "react";
import {
  Map,
  AlertTriangle,
  Layers,
  Clock,
  Activity,
  SlidersHorizontal,
  ShieldAlert,
  Radio,
  ChevronRight,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";


interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  showIncidents: boolean;
  setShowIncidents: (show: boolean) => void;
  showClusters: boolean;
  setShowClusters: (show: boolean) => void;
  crisisActive: boolean;
  setCrisisActive: (active: boolean) => void;
  selectedTime: string;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  showIncidents,
  setShowIncidents,
  showClusters,
  setShowClusters,
  crisisActive,
  setCrisisActive,
  selectedTime,
}: SidebarProps) {

  const navItems = [
    { id: "map", label: "Map View", icon: Map, badge: null },
    {
      id: "incidents",
      label: "Incidents",
      icon: AlertTriangle,
      badge: "6 Active",
      badgeVariant: "destructive" as const,
    },
    { id: "clusters", label: "Clusters", icon: Layers, badge: "3" },
    {
      id: "timeline",
      label: "08:47 Crisis",
      icon: Clock,
      badge: selectedTime === "08:47" ? "LIVE" : selectedTime,
      badgeVariant: "default" as const,
    },
    { id: "telemetry", label: "Telemetry", icon: Activity, badge: null },
  ];

  return (
    <>
      <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-[#090D16] border-r border-slate-800/80 z-30 flex flex-col justify-between select-none text-slate-300 font-sans">
        {/* Brand Header */}
        <div>
          <div className="p-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-sm tracking-wider text-slate-100 uppercase">
                  Neural City
                </span>
              </div>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>TALLINN GRID</span>
              <span className="text-blue-400/90 font-medium">CORE v0.1</span>
            </div>
          </div>

          <Separator className="bg-slate-800/60" />

          {/* Primary Navigation */}
          <div className="p-2 space-y-1">
            <div className="px-2 py-1.5 text-[10px] font-mono font-medium tracking-wider text-slate-500 uppercase">
              Command Center
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full justify-start h-9 px-2.5 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-blue-600/15 text-blue-300 border-l-2 border-blue-500 rounded-r-md rounded-l-none font-semibold"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 mr-2.5 shrink-0 ${
                      isActive ? "text-blue-400" : "text-slate-500"
                    }`}
                  />
                  <span className="truncate flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <Badge
                      variant={item.badgeVariant || "outline"}
                      className={`ml-auto text-[10px] px-1.5 py-0 h-4 font-mono font-normal ${
                        item.badge === "LIVE"
                          ? "bg-rose-950/80 text-rose-300 border-rose-800 animate-pulse"
                          : isActive
                          ? "bg-blue-900/40 text-blue-300 border-blue-800/60"
                          : "bg-slate-800/80 text-slate-400 border-slate-700/60"
                      }`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>

          <Separator className="my-2 bg-slate-800/60" />

          {/* Viewport Layers & Controls */}
          <div className="p-2 space-y-2">
            <div className="px-2 py-1 text-[10px] font-mono font-medium tracking-wider text-slate-500 uppercase flex items-center justify-between">
              <span>Layers & Filters</span>
              <SlidersHorizontal className="w-3 h-3 text-slate-600" />
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setShowIncidents(!showIncidents)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors ${
                  showIncidents
                    ? "bg-slate-800/80 text-slate-200"
                    : "text-slate-500 hover:text-slate-400 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      showIncidents ? "bg-rose-500" : "bg-slate-600"
                    }`}
                  />
                  <span>Incidents</span>
                </div>
                <span className="font-mono text-[10px] text-slate-500">6</span>
              </button>

              <button
                onClick={() => setShowClusters(!showClusters)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors ${
                  showClusters
                    ? "bg-slate-800/80 text-slate-200"
                    : "text-slate-500 hover:text-slate-400 hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      showClusters ? "bg-blue-500" : "bg-slate-600"
                    }`}
                  />
                  <span>Clusters</span>
                </div>
                <span className="font-mono text-[10px] text-slate-500">3</span>
              </button>
            </div>

            <Separator className="my-2 bg-slate-800/40" />

            {/* 08:47 Crisis Event Quick Mode */}
            <div className="px-1">
              <button
                onClick={() => setCrisisActive(!crisisActive)}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-md border text-xs font-medium transition-all ${
                  crisisActive
                    ? "bg-rose-950/40 border-rose-900/80 text-rose-200 shadow-sm shadow-rose-950"
                    : "bg-slate-900/50 border-slate-800/80 text-slate-400 hover:text-slate-300 hover:border-slate-700"
                }`}
              >
                <ShieldAlert
                  className={`w-4 h-4 shrink-0 ${
                    crisisActive ? "text-rose-400 animate-pulse" : "text-slate-500"
                  }`}
                />
                <div className="flex flex-col text-left flex-1 min-w-0">
                  <span className="text-[11px] font-semibold tracking-tight truncate">
                    08:47 Crisis Mode
                  </span>
                  <span className="text-[9.5px] font-mono text-slate-500 truncate">
                    {crisisActive ? "Timeline Scrub Active" : "Click to view event"}
                  </span>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-transform ${
                    crisisActive ? "rotate-90 text-rose-400" : "text-slate-600"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer / Node Status */}
        <div className="p-3 border-t border-slate-800/80 bg-[#070A11] space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              <span className="font-mono text-[10px]">EE-TLN-CORE</span>
            </div>
            <Badge
              variant="outline"
              className="text-[9px] px-1 py-0 h-3.5 bg-emerald-950/40 text-emerald-400 border-emerald-900/60 font-mono"
            >
              ONLINE
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800/40">
            <div>
              LATENCY: <span className="text-slate-300">12ms</span>
            </div>
            <div className="text-right">
              SYNC: <span className="text-slate-300">100%</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
