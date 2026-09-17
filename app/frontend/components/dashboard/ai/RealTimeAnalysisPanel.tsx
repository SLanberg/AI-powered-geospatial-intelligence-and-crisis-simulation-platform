"use client";

import React from "react";
import {
  ShieldAlert,
  Cpu,
  CheckCircle2,
  Route,
  Activity,
  AlertTriangle,
  Radio,
  Clock,
  Waves,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  NEPAL_TIMELINE_EVENTS,
  NepalTimelineEvent,
} from "@/frontend/data/nepalIncidentData";
import type { Incident } from "@/shared";

interface RealTimeAnalysisPanelProps {
  activeTab?: string;
  activeNepalEvent?: NepalTimelineEvent | null;
  currentReplaySeconds?: number;
  onSeekReplay?: (seconds: number) => void;
  onSelectNepalEvent?: (event: NepalTimelineEvent) => void;
  selectedIncident?: Incident | null;
}

export function RealTimeAnalysisPanel({
  activeTab = "nepal",
  activeNepalEvent,
  currentReplaySeconds = 31030,
  onSeekReplay,
  onSelectNepalEvent,
  selectedIncident,
}: RealTimeAnalysisPanelProps) {
  const isNepal = activeTab === "nepal" || (!selectedIncident && activeNepalEvent);

  if (isNepal) {
    const activeEvent = activeNepalEvent || NEPAL_TIMELINE_EVENTS[1];

    return (
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs font-sans selection:bg-primary/20">
        {/* Live Analysis Mode Header Banner */}
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-semibold">
              Real Time Analysis • Nepal Cascade
            </span>
          </div>
          <Badge
            variant={
              activeEvent.severity === "critical"
                ? "destructive"
                : activeEvent.severity === "warning"
                ? "default"
                : "secondary"
            }
            className="font-mono text-[9px] px-1.5 py-0 uppercase"
          >
            Confidence: {activeEvent.confidence}
          </Badge>
        </div>

        {/* Active Event Highlight Card */}
        <div className="bg-card/90 border border-border rounded-lg p-3 space-y-2.5 shadow-sm max-h-[500px] overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-red-400">
                {activeEvent.eventId}
              </span>
              <Badge variant="outline" className="font-mono text-[9px] px-1.5 py-0 border-border text-muted-foreground">
                {activeEvent.phase}
              </Badge>
            </div>
            <span className="font-mono text-[11px] text-amber-400 font-semibold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {activeEvent.timeNpt} NPT
            </span>
          </div>

          <h4 className="text-sm font-bold text-foreground leading-snug">
            {activeEvent.eventType}
          </h4>

          <p className="text-muted-foreground text-xs leading-relaxed">
            {activeEvent.eventDescription}
          </p>

          <div className="pt-2 border-t border-border/50 grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div>
              <span className="text-muted-foreground/70 block text-[9px] uppercase">Location</span>
              <span className="text-foreground font-medium">{activeEvent.location}</span>
            </div>
            <div>
              <span className="text-muted-foreground/70 block text-[9px] uppercase">Evidence Type</span>
              <span className="text-foreground font-medium">{activeEvent.evidenceType}</span>
            </div>
          </div>

          {activeEvent.affectedRoute && (
            <div className="bg-red-500/10 border border-red-500/30 rounded p-2 text-[11px] font-mono flex items-start gap-2">
              <Route className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-red-400 block text-[9px] font-bold uppercase tracking-wider">
                  Affected Corridor / Artery
                </span>
                <span className="text-foreground font-semibold">
                  {activeEvent.affectedRoute}
                </span>
              </div>
            </div>
          )}

          {activeEvent.gaugeReading && (
            <div className="bg-muted/40 border border-border/60 rounded p-2 text-[11px] font-mono flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Waves className="w-3 h-3 text-cyan-400" />
                Gauge State:
              </span>
              <span className="text-red-400 font-bold">
                {activeEvent.gaugeReading.levelMeters}m ({activeEvent.gaugeReading.description})
              </span>
            </div>
          )}

          {activeEvent.warningCount && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded p-2 text-[11px] font-mono flex items-center justify-between">
              <span className="text-amber-400 flex items-center gap-1.5">
                <Radio className="w-3 h-3" />
                Mass Alert Reach:
              </span>
              <span className="text-foreground font-bold">
                {activeEvent.warningCount.toLocaleString()} SMS issued
              </span>
            </div>
          )}
        </div>

        {/* AI Hazard Interpretation */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-blue-400 text-[11px] font-semibold uppercase tracking-wider font-mono">
            <Cpu className="w-3.5 h-3.5" />
            AI Hazard Interpretation
          </div>
          <p className="text-blue-200/90 text-xs leading-relaxed italic">
            &ldquo;{activeEvent.aiInterpretation}&rdquo;
          </p>
        </div>

        {/* Recommended AI Operational Task */}
        <div className="bg-card border border-border rounded-lg p-3 space-y-1.5 shadow-sm">
          <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-semibold uppercase tracking-wider font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Recommended Operational Task
          </div>
          <p className="text-foreground text-xs leading-relaxed font-mono">
            {activeEvent.recommendedAiTask}
          </p>
        </div>

        {/* Operational Notes */}
        {activeEvent.notes && (
          <div className="bg-muted/30 border border-border/50 rounded-md p-2.5 text-[11px] text-muted-foreground font-mono">
            <strong className="text-foreground/90 font-medium">Operational Note:</strong>{" "}
            {activeEvent.notes}
          </div>
        )}

        {/* Chronology Milestones */}
        <div className="pt-2 border-t border-border/60 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-wider">
              Chronology Milestones (16 Events)
            </span>
            <span className="text-[9px] font-mono text-muted-foreground/70">Click to Seek Replay</span>
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {NEPAL_TIMELINE_EVENTS.map((ev) => {
              const isCur = activeEvent.eventId === ev.eventId;
              const isPassed = ev.secondsFromMidnight <= currentReplaySeconds;

              return (
                <div
                  key={ev.eventId}
                  onClick={() => {
                    if (onSeekReplay) onSeekReplay(ev.secondsFromMidnight);
                    if (onSelectNepalEvent) onSelectNepalEvent(ev);
                  }}
                  className={`p-2 rounded-md border text-left cursor-pointer transition-all flex items-center justify-between gap-2 ${
                    isCur
                      ? "bg-red-500/15 border-red-500/60 shadow-sm"
                      : isPassed
                      ? "bg-card/80 border-border hover:border-primary/40"
                      : "bg-muted/20 border-border/40 text-muted-foreground/60 hover:border-border"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isCur
                          ? "bg-red-500 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {ev.eventId}
                    </span>
                    <div className="min-w-0">
                      <div className={`text-xs font-semibold truncate ${isCur ? "text-foreground" : "text-muted-foreground"}`}>
                        {ev.eventType}
                      </div>
                      <div className="text-[10px] text-muted-foreground/80 truncate">
                        {ev.location}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-mono text-[10px]">
                    <span className={isCur ? "text-amber-400 font-bold" : "text-muted-foreground"}>
                      {ev.timeNpt}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Tallinn Operational Picture Analysis
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs font-sans">
      <div className="flex items-center justify-between pb-2 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground font-semibold">
            Real Time Analysis • Tallinn Grid
          </span>
        </div>
        <Badge variant="outline" className="font-mono text-[9px] px-1.5 py-0">
          SCADA Online
        </Badge>
      </div>

      {selectedIncident ? (
        <div className="bg-card border border-border rounded-lg p-3.5 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-primary">
              {selectedIncident.id}
            </span>
            <Badge
              variant={selectedIncident.severity === "critical" ? "destructive" : "secondary"}
              className="font-mono text-[9px] uppercase"
            >
              {selectedIncident.severity}
            </Badge>
          </div>

          <h4 className="text-sm font-bold text-foreground">
            {selectedIncident.title}
          </h4>

          <p className="text-muted-foreground text-xs leading-relaxed">
            {selectedIncident.description}
          </p>

          <div className="pt-2 border-t border-border/60 grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div>
              <span className="text-muted-foreground/70 block text-[9px] uppercase">Category</span>
              <span className="text-foreground font-semibold">{selectedIncident.category}</span>
            </div>
            <div>
              <span className="text-muted-foreground/70 block text-[9px] uppercase">Status</span>
              <span className="text-emerald-400 font-semibold">{selectedIncident.status}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card/70 border border-border rounded-lg p-3.5 space-y-2 text-center text-muted-foreground">
          <Activity className="w-5 h-5 mx-auto text-primary animate-pulse" />
          <p className="text-xs font-medium text-foreground">Operational Picture Telemetry Active</p>
          <p className="text-[11px]">Select an incident on the Tallinn map or incident matrix to view focused telemetry dossier.</p>
        </div>
      )}

      {/* Copilot SCADA Telemetry Advisory */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-1.5">
        <div className="flex items-center gap-1.5 text-primary text-[11px] font-semibold uppercase tracking-wider font-mono">
          <Cpu className="w-3.5 h-3.5" />
          Copilot Grid Advisory
        </div>
        <p className="text-muted-foreground text-xs leading-relaxed">
          Tallinn municipal SCADA sensors reporting nominal pressure along Viru and Kristiine arterial corridors. Emergency responders deployed to active sites.
        </p>
      </div>

      {/* Recommended Dispatch Actions */}
      <div className="bg-card border border-border rounded-lg p-3 space-y-1.5 shadow-sm">
        <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-semibold uppercase tracking-wider font-mono">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Automated Emergency Protocol
        </div>
        <p className="text-muted-foreground text-xs font-mono leading-relaxed">
          Maintain perimeter perimeter perimeter perimeter isolation on selected nodes. Relay road closures to Tallinn Transport Authority.
        </p>
      </div>
    </div>
  );
}
