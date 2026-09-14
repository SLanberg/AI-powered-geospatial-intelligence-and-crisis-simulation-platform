"use client";

import React from "react";
import {
  Map,
  AlertTriangle,
  Activity,
  Radio,
  Cpu,
  Newspaper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  isOpen = true,
}: SidebarProps) {
  const navItems = [
    { id: "map", label: "Operational picture", icon: Map, badge: null },
    {
      id: "incidents",
      label: "Incidents",
      icon: AlertTriangle,
      badge: "6 Active",
      badgeVariant: "destructive" as const,
    },
    { id: "telemetry", label: "Telemetry", icon: Activity, badge: null },
    { id: "media", label: "Media", icon: Newspaper, badge: "LIVE" },
  ];

  if (!isOpen) return null;

  return (
    <>
      <aside className="fixed left-0 top-0 bottom-0 w-[220px] bg-sidebar border-r border-sidebar-border z-30 flex flex-col justify-between select-none text-sidebar-foreground font-sans transition-all duration-300 ease-in-out">
        {/* Brand Header */}
        <div>
          <div className="p-4 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                  <Cpu className="w-3.5 h-3.5" />
                </div>
                <span className="font-semibold text-sm tracking-wider text-sidebar-foreground uppercase">
                  Neural City
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-muted-foreground font-mono">
              <span>TALLINN GRID</span>
              <span className="text-primary font-medium">CORE v0.1</span>
            </div>
          </div>

          <Separator className="bg-sidebar-border" />

          {/* Primary Navigation */}
          <div className="p-2 space-y-1">
            <div className="px-2 py-1.5 text-[10px] font-mono font-medium tracking-wider text-muted-foreground uppercase">
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
                      ? "bg-sidebar-accent text-sidebar-accent-foreground border-l-2 border-primary rounded-r-md rounded-l-none font-semibold"
                      : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 mr-2.5 shrink-0 ${
                      isActive ? "text-primary" : "text-muted-foreground"
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
                          ? "bg-primary/20 text-primary border-primary/40"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>

        </div>

        {/* Footer / Node Status */}
        <div className="p-3 border-t border-sidebar-border bg-sidebar-accent/30 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-muted-foreground">
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

          <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-muted-foreground pt-1 border-t border-sidebar-border">
            <div>
              LATENCY: <span className="text-sidebar-foreground">12ms</span>
            </div>
            <div className="text-right">
              SYNC: <span className="text-sidebar-foreground">100%</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
