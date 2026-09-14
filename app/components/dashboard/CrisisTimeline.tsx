"use client";

import React, { useEffect, useState } from "react";
import { Play, Pause, RotateCcw, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MOCK_INCIDENTS, type Incident } from "./data";

export interface TimelineSubEvent {
  title: string;
  category: string;
  severity: "critical" | "warning" | "info" | "normal";
  description: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  fullTime: string;
  title: string;
  category: "Grid Failure" | "Traffic Flow" | "Telecom Node" | "Emergency Dispatch" | "Sensor Anomaly" | "System Status";
  severity: "critical" | "warning" | "info" | "normal";
  intensity: number; // 0 to 100
  description: string;
  incidentId?: string;
  registeredIncidentsCount?: number;
  subEvents?: TimelineSubEvent[];
}

export const EVENT_TIMELINE: TimelineEvent[] = [
  {
    id: "EV-0840",
    time: "08:40",
    fullTime: "08:40:00:00",
    title: "Baseline Grid Telemetry",
    category: "System Status",
    severity: "normal",
    intensity: 20,
    description: "All grid substations and traffic nodes operating within nominal telemetry limits.",
    registeredIncidentsCount: 0,
  },
  {
    id: "EV-0842",
    time: "08:42",
    fullTime: "08:42:15:00",
    title: "Port Link Telemetry Ping",
    category: "Telecom Node",
    severity: "info",
    intensity: 35,
    description: "Subsea link latency increased to 48ms. Terrestrial fallback standby engaged.",
    incidentId: "INC-0847-05",
    registeredIncidentsCount: 1,
  },
  {
    id: "EV-0844",
    time: "08:44",
    fullTime: "08:44:30:00",
    title: "Ülemiste Feeder Surge",
    category: "Grid Failure",
    severity: "warning",
    intensity: 60,
    description: "Voltage harmonics surge detected in Ülemiste Industrial Feeder Alpha.",
    incidentId: "INC-0847-02",
    registeredIncidentsCount: 1,
  },
  {
    id: "EV-0846",
    time: "08:46",
    fullTime: "08:46:10:00",
    title: "Kristiine Sensor Vibrations",
    category: "Sensor Anomaly",
    severity: "warning",
    intensity: 45,
    description: "Environmental acoustic sensor array recorded pre-trip acoustic harmonics.",
    incidentId: "INC-0847-06",
    registeredIncidentsCount: 2,
  },
  {
    id: "EV-0847",
    time: "08:47",
    fullTime: "08:47:05:00",
    title: "Vanalinn Substation Trip & Ülemiste Feeder Surge",
    category: "Grid Failure",
    severity: "critical",
    intensity: 100,
    description: "Dual critical events: Automated breaker isolated Ülemiste sectors B & C, followed by Vanalinn Relay #4 trip.",
    incidentId: "INC-0847-01",
    registeredIncidentsCount: 5,
    subEvents: [
      {
        title: "Ülemiste Feeder Isolation",
        category: "Grid Failure",
        severity: "critical",
        description: "Automated circuit breaker isolated tech park sectors B & C.",
      },
      {
        title: "Vanalinn Substation #4 Trip",
        category: "Grid Failure",
        severity: "critical",
        description: "Primary isolation relay tripped. Cascading frequency drop across Old Town district.",
      },
    ],
  },
  {
    id: "EV-0848",
    time: "08:48",
    fullTime: "08:47:18:00",
    title: "Viru Signal Controller Freeze",
    category: "Traffic Flow",
    severity: "warning",
    intensity: 75,
    description: "Optical traffic sensors lost heartbeat. Intersection defaulted to amber pulse.",
    incidentId: "INC-0847-03",
    registeredIncidentsCount: 4,
  },
  {
    id: "EV-0849",
    time: "08:49",
    fullTime: "08:47:30:00",
    title: "Dispatch Routing Packet Drop",
    category: "Emergency Dispatch",
    severity: "warning",
    intensity: 65,
    description: "Emergency vehicle priority routing server experienced 1.4s packet drop.",
    incidentId: "INC-0847-04",
    registeredIncidentsCount: 3,
  },
  {
    id: "EV-0850",
    time: "08:50",
    fullTime: "08:50:00:00",
    title: "Automated Failover Engaged",
    category: "Grid Failure",
    severity: "warning",
    intensity: 50,
    description: "Automated grid rerouting engaged reserve transformer bank #2.",
    registeredIncidentsCount: 2,
  },
  {
    id: "EV-0852",
    time: "08:52",
    fullTime: "08:52:10:00",
    title: "Secondary Dispatch Active",
    category: "Traffic Flow",
    severity: "info",
    intensity: 35,
    description: "Emergency vehicle routing restored on secondary terrestrial backbone.",
    registeredIncidentsCount: 1,
  },
  {
    id: "EV-0855",
    time: "08:55",
    fullTime: "08:55:00:00",
    title: "Grid Telemetry Stabilization",
    category: "System Status",
    severity: "normal",
    intensity: 25,
    description: "District grid frequency stabilized to 50.02 Hz nominal.",
    registeredIncidentsCount: 0,
  },
  {
    id: "EV-0900",
    time: "09:00",
    fullTime: "09:00:00:00",
    title: "Post-Incident Audit Complete",
    category: "System Status",
    severity: "normal",
    intensity: 15,
    description: "Automated post-incident diagnostics verified zero active breaker faults.",
    registeredIncidentsCount: 0,
  },
];

interface CrisisTimelineProps {
  selectedTime: string;
  setSelectedTime: React.Dispatch<React.SetStateAction<string>>;
  crisisActive: boolean;
  selectedIncident?: Incident | null;
  setSelectedIncident?: (incident: Incident | null) => void;
}

export function CrisisTimeline({
  selectedTime,
  setSelectedTime,
  selectedIncident,
  setSelectedIncident,
}: CrisisTimelineProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);

  // Auto playback ticker
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSelectedTime((prevTime: string) => {
        const currentIndex = EVENT_TIMELINE.findIndex((s) => s.time === prevTime);
        const nextIndex = (currentIndex + 1) % EVENT_TIMELINE.length;
        const nextEvent = EVENT_TIMELINE[nextIndex];

        if (setSelectedIncident && nextEvent.incidentId) {
          const inc = MOCK_INCIDENTS.find((i) => i.id === nextEvent.incidentId);
          if (inc) setSelectedIncident(inc);
        }

        return nextEvent.time;
      });
    }, 2200);

    return () => clearInterval(interval);
  }, [isPlaying, setSelectedTime, setSelectedIncident]);

  const handleSelectEvent = (event: TimelineEvent) => {
    setIsPlaying(false);
    setSelectedTime(event.time);
    if (setSelectedIncident && event.incidentId) {
      const inc = MOCK_INCIDENTS.find((i) => i.id === event.incidentId);
      if (inc) setSelectedIncident(inc);
    }
  };

  const activeEvent = EVENT_TIMELINE.find((e) => e.time === selectedTime) || EVENT_TIMELINE[4];

  // Helper to count registered incidents matching timestamp or assigned fallback
  const getIncidentDetailsForTime = (time: string, explicitCount?: number) => {
    const matched = MOCK_INCIDENTS.filter((inc) => inc.timestamp.startsWith(time));
    const count = explicitCount ?? (matched.length > 0 ? matched.length : 0);
    return { count, incidents: matched };
  };

  return (
    <div className="bg-[#18191c] text-zinc-300 border-t border-zinc-800 px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4 font-mono select-none">
      {/* NLE Transport Controls */}
      <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            className="min-h-[44px] min-w-[44px] h-11 w-11 bg-zinc-800/80 border-zinc-700 text-zinc-200 hover:bg-zinc-700 hover:text-white"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause Timeline (Space)" : "Play Timeline (Space)"}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="min-h-[44px] min-w-[44px] h-11 w-11 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            onClick={() => {
              setIsPlaying(false);
              setSelectedTime("08:47");
              const crisisInc = MOCK_INCIDENTS.find((i) => i.id === "INC-0847-01");
              if (crisisInc && setSelectedIncident) setSelectedIncident(crisisInc);
            }}
            title="Reset Playhead to 08:47:00:00"
          >
            <RotateCcw className="w-5 h-5" />
          </Button>
        </div>

        {/* NLE Timecode & Playhead Display */}
        <div className="flex items-center gap-2 text-xs">
          <Clock className="w-5 h-5 text-zinc-400" />
          <span className="text-zinc-400 uppercase tracking-wider text-xs font-semibold">TC:</span>
          <span className="text-zinc-100 font-mono font-bold tracking-wider bg-zinc-900 px-3 py-1.5 rounded border border-zinc-700 text-xs shadow-sm">
            {activeEvent.fullTime}
          </span>
        </div>
      </div>

      {/* High Density Sleek White Line Timeline Track */}
      <div className="w-full max-w-2xl flex flex-col justify-end pt-1">
        {/* Track Container */}
        <div className="relative bg-zinc-950/90 border border-zinc-800 rounded p-1.5 overflow-hidden shadow-inner">
          {/* Background Ruler Grid (Dense Thin Lines) */}
          <div className="absolute inset-0 flex justify-between pointer-events-none px-2 py-1 opacity-25">
            {Array.from({ length: 48 }).map((_, i) => (
              <div key={i} className="w-[1px] h-full bg-white/40" />
            ))}
          </div>

          {/* Bar Clips Track (Thin White Lines, Close Spacing) */}
          <div className="relative flex items-end justify-between gap-[3px] h-[44px] px-1 z-10">
            {EVENT_TIMELINE.map((event) => {
              const isSelected = selectedTime === event.time;
              const isHovered = hoveredEventId === event.id;
              const { count: incidentCount, incidents } = getIncidentDetailsForTime(
                event.time,
                event.registeredIncidentsCount
              );

              // Height based on intensity
              const heightPercent = Math.max(25, event.intensity);

              return (
                <div
                  key={event.id}
                  onMouseEnter={() => setHoveredEventId(event.id)}
                  onMouseLeave={() => setHoveredEventId(null)}
                  onClick={() => handleSelectEvent(event)}
                  className="relative flex-1 flex flex-col items-center justify-end h-full cursor-pointer group"
                >
                  {/* Clean High-Tech Hover Card showing registered incidents */}
                  {isHovered && (
                    <div className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 z-50 min-w-[230px] max-w-[280px] p-2.5 bg-zinc-950/95 border border-zinc-700/80 rounded-md shadow-2xl backdrop-blur-md text-zinc-300 font-sans text-xs space-y-1.5 pointer-events-none">
                      <div className="flex items-center justify-between border-b border-zinc-800/90 pb-1.5 font-mono text-[10px]">
                        <span className="text-zinc-200 font-semibold tracking-wider">{event.fullTime}</span>
                        <div className="flex items-center gap-1">
                          {incidentCount > 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-tight uppercase bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5 text-red-400" />
                              {incidentCount} {incidentCount === 1 ? "Incident" : "Incidents"} Registered
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium tracking-tight uppercase bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                              0 Incidents (Nominal)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="font-semibold text-zinc-100 text-[11px] leading-tight flex items-center justify-between gap-2">
                        <span>{event.title}</span>
                        <span className="text-[9px] uppercase px-1 rounded bg-zinc-800 text-zinc-400 border border-zinc-700">
                          {event.category}
                        </span>
                      </div>

                      <div className="text-[10px] text-zinc-400 leading-snug line-clamp-2">
                        {event.description}
                      </div>

                      {/* Display breakdown of simultaneous events if any */}
                      {event.subEvents && event.subEvents.length > 0 && (
                        <div className="pt-1.5 border-t border-zinc-800/80 space-y-1">
                          <div className="text-[9px] font-mono uppercase text-amber-400 font-semibold tracking-wider">
                            Simultaneous Events ({event.subEvents.length})
                          </div>
                          <div className="space-y-1">
                            {event.subEvents.map((sub, idx) => (
                              <div key={idx} className="bg-zinc-900/90 p-1.5 rounded border border-zinc-800 space-y-0.5">
                                <div className="flex items-center justify-between text-[10px] font-medium text-zinc-200">
                                  <span>{sub.title}</span>
                                  <span className="text-[9px] px-1 rounded bg-red-950/80 text-red-400 border border-red-800/40 uppercase font-mono">
                                    {sub.severity}
                                  </span>
                                </div>
                                <div className="text-[9.5px] text-zinc-400 leading-tight">{sub.description}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Display breakdown of registered incidents if any */}
                      {incidents.length > 0 && (
                        <div className="pt-1.5 border-t border-zinc-800/80 space-y-1">
                          <div className="text-[9px] font-mono uppercase text-zinc-500 tracking-wider">
                            Active Signals ({incidents.length})
                          </div>
                          <div className="space-y-0.5 max-h-24 overflow-y-auto">
                            {incidents.map((inc) => (
                              <div
                                key={inc.id}
                                className="flex items-center justify-between text-[10px] text-zinc-300 bg-zinc-900/90 px-1.5 py-0.5 rounded border border-zinc-800"
                              >
                                <span className="truncate max-w-[170px] font-medium">{inc.title}</span>
                                <span
                                  className={`text-[9px] px-1 rounded uppercase font-mono ${
                                    inc.severity === "critical"
                                      ? "text-red-400 bg-red-950/60"
                                      : inc.severity === "warning"
                                      ? "text-amber-400 bg-amber-950/60"
                                      : "text-blue-400 bg-blue-950/60"
                                  }`}
                                >
                                  {inc.severity}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Playhead Needle Line (Selected Event) */}
                  {isSelected && (
                    <div className="absolute -top-2 bottom-0 w-[2px] bg-white z-20 pointer-events-none shadow-[0_0_12px_rgba(255,255,255,0.9)]">
                      <div className="absolute -top-1 -left-[3px] w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                    </div>
                  )}

                  {/* Sleek Professional Thin White Line Bar */}
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full max-w-[3px] rounded-t-[1px] transition-all duration-150 ${
                      isSelected
                        ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]"
                        : isHovered
                        ? "bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)] scale-y-105"
                        : "bg-white/40 hover:bg-white/80"
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Minimal Timecode Axis */}
        <div className="w-full pt-1 px-2 flex items-center justify-between font-mono text-xs text-zinc-400">
          {EVENT_TIMELINE.map((event) => {
            const isSelected = selectedTime === event.time;

            return (
              <button
                key={`tc-${event.id}`}
                onClick={() => handleSelectEvent(event)}
                className={`min-h-[44px] min-w-[28px] px-1 flex items-center justify-center transition-colors focus:outline-none ${
                  isSelected ? "text-white font-bold tracking-wider underline underline-offset-4 decoration-2 decoration-blue-500" : "hover:text-zinc-100 text-zinc-400 font-semibold"
                }`}
              >
                {event.time}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

