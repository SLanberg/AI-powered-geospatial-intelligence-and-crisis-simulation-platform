"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Clock,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { MOCK_INCIDENTS, type Incident } from "./data";
import { MakiIcon, getMakiIconNameForIncident } from "./map/MakiIcon";

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
  category:
  | "Grid Failure"
  | "Traffic Flow"
  | "Telecom Node"
  | "Emergency Dispatch"
  | "Sensor Anomaly"
  | "System Status";
  severity: "critical" | "warning" | "info" | "normal";
  intensity: number;
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
    description:
      "All grid substations and traffic nodes operating within nominal telemetry limits.",
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
    description:
      "Subsea link latency increased to 48ms. Terrestrial fallback standby engaged.",
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
    description:
      "Voltage harmonics surge detected in Ülemiste Industrial Feeder Alpha.",
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
    description:
      "Environmental acoustic sensor array recorded pre-trip acoustic harmonics.",
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
    description:
      "Dual critical events: Automated breaker isolated Ülemiste sectors B & C, followed by Vanalinn Relay #4 trip.",
    incidentId: "INC-0847-01",
    registeredIncidentsCount: 5,
    subEvents: [
      {
        title: "Ülemiste Feeder Isolation",
        category: "Grid Failure",
        severity: "critical",
        description:
          "Automated circuit breaker isolated tech park sectors B & C.",
      },
      {
        title: "Vanalinn Substation #4 Trip",
        category: "Grid Failure",
        severity: "critical",
        description:
          "Primary isolation relay tripped. Cascading frequency drop across Old Town district.",
      },
    ],
  },
  {
    id: "EV-0848",
    time: "08:48",
    fullTime: "08:48:00:00",
    title: "Viru Signal Controller Freeze",
    category: "Traffic Flow",
    severity: "warning",
    intensity: 75,
    description:
      "Optical traffic sensors lost heartbeat. Intersection defaulted to amber pulse.",
    incidentId: "INC-0847-03",
    registeredIncidentsCount: 4,
  },
  {
    id: "EV-0849",
    time: "08:49",
    fullTime: "08:49:00:00",
    title: "Dispatch Routing Packet Drop",
    category: "Emergency Dispatch",
    severity: "warning",
    intensity: 65,
    description:
      "Emergency vehicle priority routing server experienced 1.4s packet drop.",
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
    description:
      "Automated grid rerouting engaged reserve transformer bank #2.",
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
    description:
      "Emergency vehicle routing restored on secondary terrestrial backbone.",
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
    description:
      "District grid frequency stabilized to 50.02 Hz nominal.",
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
    description:
      "Automated post-incident diagnostics verified zero active breaker faults.",
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

type TimelinePoint = {
  event: TimelineEvent;
  seconds: number;
  position: number;
};

type IncidentCluster = {
  position: number;
  events: TimelineEvent[];
  count: number;
};

const PLAYBACK_SPEED = 10;
const CLUSTER_THRESHOLD_PERCENT = 1.8;

function parseTimelineTime(value: string): number {
  const clean = value.split(":").slice(0, 3);

  const hours = Number(clean[0] ?? 0);
  const minutes = Number(clean[1] ?? 0);
  const seconds = Number(clean[2] ?? 0);

  return hours * 3600 + minutes * 60 + seconds;
}

function formatTimelineTime(totalSeconds: number): string {
  const rounded = Math.max(0, Math.floor(totalSeconds));

  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const seconds = rounded % 60;

  return [hours, minutes, seconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function formatShortTimelineTime(totalSeconds: number): string {
  const rounded = Math.max(0, Math.floor(totalSeconds));

  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

function severityClass(severity: TimelineEvent["severity"]) {
  switch (severity) {
    case "critical":
      return "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]";

    case "warning":
      return "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.65)]";

    case "info":
      return "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.55)]";

    default:
      return "bg-zinc-500";
  }
}

function severityTextClass(severity: TimelineEvent["severity"]) {
  switch (severity) {
    case "critical":
      return "text-red-400";

    case "warning":
      return "text-amber-400";

    case "info":
      return "text-blue-400";

    default:
      return "text-zinc-400";
  }
}

export function CrisisTimeline({
  selectedTime,
  setSelectedTime,
  selectedIncident,
  setSelectedIncident,
}: CrisisTimelineProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const scrubberRef = useRef<HTMLDivElement | null>(null);
  const playbackRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);
  const currentSecondsRef = useRef<number>(0);

  const timelinePoints = useMemo<TimelinePoint[]>(() => {
    const start = parseTimelineTime(EVENT_TIMELINE[0].fullTime);
    const end = parseTimelineTime(
      EVENT_TIMELINE[EVENT_TIMELINE.length - 1].fullTime
    );

    const duration = Math.max(1, end - start);

    return EVENT_TIMELINE.map((event) => {
      const seconds = parseTimelineTime(event.fullTime);
      const position = ((seconds - start) / duration) * 100;

      return {
        event,
        seconds,
        position: Math.max(0, Math.min(100, position)),
      };
    });
  }, []);

  const startSeconds = timelinePoints[0]?.seconds ?? 0;
  const endSeconds =
    timelinePoints[timelinePoints.length - 1]?.seconds ?? startSeconds + 1;

  const durationSeconds = Math.max(1, endSeconds - startSeconds);

  const selectedSeconds = useMemo(() => {
    const selectedEvent = EVENT_TIMELINE.find(
      (event) => event.time === selectedTime
    );

    return selectedEvent
      ? parseTimelineTime(selectedEvent.fullTime)
      : parseTimelineTime("08:47:00");
  }, [selectedTime]);

  useEffect(() => {
    currentSecondsRef.current = selectedSeconds;
  }, [selectedSeconds]);

  const selectedPosition =
    ((selectedSeconds - startSeconds) / durationSeconds) * 100;

  const waveformPoints = useMemo(() => {
    const width = 1000;
    const baseline = 92;
    const amplitude = 65;

    return timelinePoints.map((point, index) => {
      const x = (point.position / 100) * width;

      const previous =
        timelinePoints[Math.max(0, index - 1)]?.event.intensity ??
        point.event.intensity;

      const next =
        timelinePoints[Math.min(timelinePoints.length - 1, index + 1)]?.event
          .intensity ?? point.event.intensity;

      const smoothedIntensity =
        point.event.intensity * 0.55 + previous * 0.225 + next * 0.225;

      const y =
        baseline -
        (Math.max(0, Math.min(100, smoothedIntensity)) / 100) * amplitude;

      return { x, y };
    });
  }, [timelinePoints]);

  const waveformPath = useMemo(() => {
    if (waveformPoints.length === 0) return "";

    if (waveformPoints.length === 1) {
      const point = waveformPoints[0];

      return `M ${point.x} 92 L ${point.x} ${point.y} L ${point.x} 92 Z`;
    }

    let path = `M ${waveformPoints[0].x} 92 `;
    path += `L ${waveformPoints[0].x} ${waveformPoints[0].y} `;

    for (let i = 0; i < waveformPoints.length - 1; i++) {
      const current = waveformPoints[i];
      const next = waveformPoints[i + 1];

      const midpointX = (current.x + next.x) / 2;

      path += `C ${midpointX} ${current.y}, ${midpointX} ${next.y}, ${next.x} ${next.y} `;
    }

    const last = waveformPoints[waveformPoints.length - 1];

    path += `L ${last.x} 92 Z`;

    return path;
  }, [waveformPoints]);

  const incidentEvents = useMemo(
    () => timelinePoints.filter((point) => point.event.incidentId),
    [timelinePoints]
  );

  const incidentClusters = useMemo<IncidentCluster[]>(() => {
    const clusters: IncidentCluster[] = [];

    for (const point of incidentEvents) {
      const previous = clusters[clusters.length - 1];

      if (
        previous &&
        Math.abs(previous.position - point.position) <
        CLUSTER_THRESHOLD_PERCENT
      ) {
        previous.events.push(point.event);
        previous.count +=
          point.event.registeredIncidentsCount ??
          (point.event.incidentId ? 1 : 0);

        previous.position =
          previous.events.reduce((sum, event) => {
            const timelinePoint = timelinePoints.find(
              (item) => item.event.id === event.id
            );

            return sum + (timelinePoint?.position ?? 0);
          }, 0) / previous.events.length;
      } else {
        clusters.push({
          position: point.position,
          events: [point.event],
          count:
            point.event.registeredIncidentsCount ??
            (point.event.incidentId ? 1 : 0),
        });
      }
    }

    return clusters;
  }, [incidentEvents, timelinePoints]);

  const activeEvent = useMemo(() => {
    let closest = timelinePoints[0];

    for (const point of timelinePoints) {
      if (
        Math.abs(point.seconds - selectedSeconds) <
        Math.abs(closest.seconds - selectedSeconds)
      ) {
        closest = point;
      }
    }

    return closest?.event ?? EVENT_TIMELINE[0];
  }, [selectedSeconds, timelinePoints]);

  const hoverEvent = useMemo(() => {
    if (hoveredEventId) {
      return EVENT_TIMELINE.find((event) => event.id === hoveredEventId);
    }

    if (hoverPosition == null) return null;

    let closest = timelinePoints[0];

    for (const point of timelinePoints) {
      if (
        Math.abs(point.position - hoverPosition) <
        Math.abs(closest.position - hoverPosition)
      ) {
        closest = point;
      }
    }

    return closest?.event ?? null;
  }, [hoveredEventId, hoverPosition, timelinePoints]);

  const hoverTime = useMemo(() => {
    if (hoverPosition == null) return "";

    const seconds =
      startSeconds + (hoverPosition / 100) * durationSeconds;

    return formatTimelineTime(seconds);
  }, [hoverPosition, startSeconds, durationSeconds]);

  const setTimeFromSeconds = (seconds: number) => {
    const clamped = Math.max(startSeconds, Math.min(endSeconds, seconds));

    currentSecondsRef.current = clamped;

    const exactOrClosest = timelinePoints.reduce((closest, point) => {
      return Math.abs(point.seconds - clamped) <
        Math.abs(closest.seconds - clamped)
        ? point
        : closest;
    }, timelinePoints[0]);

    if (exactOrClosest) {
      setSelectedTime(exactOrClosest.event.time);

      if (setSelectedIncident && exactOrClosest.event.incidentId) {
        const incident = MOCK_INCIDENTS.find(
          (item) => item.id === exactOrClosest.event.incidentId
        );

        if (incident) {
          setSelectedIncident(incident);
        }
      }
    }
  };

  const getSecondsFromPointer = (clientX: number) => {
    const element = scrubberRef.current;

    if (!element) return startSeconds;

    const rect = element.getBoundingClientRect();

    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const position = rect.width === 0 ? 0 : x / rect.width;

    return startSeconds + position * durationSeconds;
  };

  const getPositionFromPointer = (clientX: number) => {
    const element = scrubberRef.current;

    if (!element) return 0;

    const rect = element.getBoundingClientRect();

    if (rect.width === 0) return 0;

    return Math.max(
      0,
      Math.min(100, ((clientX - rect.left) / rect.width) * 100)
    );
  };

  const handleTimelinePointerDown = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    event.currentTarget.setPointerCapture(event.pointerId);

    setIsPlaying(false);
    setIsDragging(true);

    const seconds = getSecondsFromPointer(event.clientX);

    setTimeFromSeconds(seconds);
  };

  const handleTimelinePointerMove = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    const position = getPositionFromPointer(event.clientX);

    setHoverPosition(position);

    if (!isDragging) return;

    const seconds = getSecondsFromPointer(event.clientX);

    setTimeFromSeconds(seconds);
  };

  const handleTimelinePointerUp = (
    event: React.PointerEvent<HTMLDivElement>
  ) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setIsDragging(false);
  };

  const handleTimelinePointerLeave = () => {
    if (!isDragging) {
      setHoverPosition(null);
      setHoveredEventId(null);
    }
  };

  const handleSelectEvent = (event: TimelineEvent) => {
    setIsPlaying(false);

    const seconds = parseTimelineTime(event.fullTime);

    currentSecondsRef.current = seconds;

    setSelectedTime(event.time);

    if (setSelectedIncident && event.incidentId) {
      const incident = MOCK_INCIDENTS.find(
        (item) => item.id === event.incidentId
      );

      if (incident) {
        setSelectedIncident(incident);
      }
    }
  };

  useEffect(() => {
    if (!isPlaying) {
      if (playbackRef.current !== null) {
        cancelAnimationFrame(playbackRef.current);
        playbackRef.current = null;
      }

      lastFrameRef.current = null;

      return;
    }

    const animate = (timestamp: number) => {
      if (lastFrameRef.current == null) {
        lastFrameRef.current = timestamp;
      }

      const deltaSeconds =
        ((timestamp - lastFrameRef.current) / 1000) * PLAYBACK_SPEED;

      lastFrameRef.current = timestamp;

      const nextSeconds = currentSecondsRef.current + deltaSeconds;

      if (nextSeconds >= endSeconds) {
        currentSecondsRef.current = endSeconds;
        setTimeFromSeconds(endSeconds);
        setIsPlaying(false);

        playbackRef.current = null;
        lastFrameRef.current = null;

        return;
      }

      currentSecondsRef.current = nextSeconds;

      const closest = timelinePoints.reduce((closestPoint, point) => {
        return Math.abs(point.seconds - nextSeconds) <
          Math.abs(closestPoint.seconds - nextSeconds)
          ? point
          : closestPoint;
      }, timelinePoints[0]);

      setSelectedTime(closest.event.time);

      if (closest.event.incidentId && setSelectedIncident) {
        const incident = MOCK_INCIDENTS.find(
          (item) => item.id === closest.event.incidentId
        );

        if (incident) {
          setSelectedIncident(incident);
        }
      }

      playbackRef.current = requestAnimationFrame(animate);
    };

    playbackRef.current = requestAnimationFrame(animate);

    return () => {
      if (playbackRef.current !== null) {
        cancelAnimationFrame(playbackRef.current);
        playbackRef.current = null;
      }

      lastFrameRef.current = null;
    };
  }, [
    isPlaying,
    endSeconds,
    timelinePoints,
    setSelectedTime,
    setSelectedIncident,
  ]);

  const resetTimeline = () => {
    setIsPlaying(false);

    const resetEvent =
      EVENT_TIMELINE.find((event) => event.id === "EV-0847") ??
      EVENT_TIMELINE[0];

    const resetSeconds = parseTimelineTime(resetEvent.fullTime);

    currentSecondsRef.current = resetSeconds;

    setSelectedTime(resetEvent.time);

    if (setSelectedIncident && resetEvent.incidentId) {
      const incident = MOCK_INCIDENTS.find(
        (item) => item.id === resetEvent.incidentId
      );

      if (incident) {
        setSelectedIncident(incident);
      }
    }
  };

  const handleMarkerClick = (
    event: React.MouseEvent,
    cluster: IncidentCluster
  ) => {
    event.stopPropagation();

    const target = cluster.events[0];

    if (target) {
      handleSelectEvent(target);
    }
  };

  const axisLabels = useMemo(() => {
    const count = 6;

    return Array.from({ length: count }, (_, index) => {
      const position = (index / (count - 1)) * 100;

      const seconds =
        startSeconds + (position / 100) * durationSeconds;

      return {
        position,
        label: formatShortTimelineTime(seconds),
      };
    });
  }, [startSeconds, durationSeconds]);

  const playheadPosition = Math.max(
    0,
    Math.min(100, selectedPosition)
  );

  return (
    <div className="w-full bg-[#101318] text-zinc-200 border-t border-[#263140] px-4 py-3 select-text shadow-2xl">
      <div className="flex flex-wrap items-center gap-4 w-full">
        
        {/* 1. Media Controls Cluster */}
        <div className="flex items-center gap-2 shrink-0 bg-[#1A222E] border border-[#2D3B4E] p-1.5 rounded-xl shadow-inner">
          <Button
            size="icon"
            variant="ghost"
            className={`h-9 w-9 rounded-lg transition-all ${
              isPlaying
                ? "bg-red-500/25 text-red-400 border border-red-500/50 shadow-sm shadow-red-500/20"
                : "bg-[#007AFF]/25 text-sky-300 border border-[#007AFF]/50 hover:bg-[#007AFF]/40"
            }`}
            onClick={() => setIsPlaying((value) => !value)}
            title={isPlaying ? "Pause Timeline" : "Play Timeline"}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-9 w-9 text-zinc-300 hover:bg-white/10 hover:text-white rounded-lg border border-transparent hover:border-zinc-700"
            onClick={resetTimeline}
            title="Reset timeline"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>

          <span className="hidden sm:inline-block font-mono text-[10px] font-extrabold text-sky-300 bg-sky-950/80 px-2 py-1 rounded border border-sky-500/30 tracking-wider">
            {PLAYBACK_SPEED}X REPLAY
          </span>
        </div>

        {/* 2. Dedicated Time-State Telemetry Card */}
        <div className="flex items-center gap-3 shrink-0 bg-[#1A222E] border border-[#2D3B4E] px-3 py-1.5 rounded-xl shadow-md">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-sky-400 animate-pulse" />
            <span className="font-mono text-sm font-black text-white tabular-nums tracking-wider drop-shadow-sm">
              {formatTimelineTime(selectedSeconds)}
            </span>
          </div>

          <div className="h-4 w-px bg-zinc-700/80" />

          <div className="flex items-center gap-1.5">
            <span
              className={`h-2 w-2 rounded-full ${severityClass(
                activeEvent.severity
              )}`}
            />
            <span
              className={`font-mono text-[10px] font-extrabold uppercase tracking-wider ${severityTextClass(
                activeEvent.severity
              )}`}
            >
              {activeEvent.severity}
            </span>
          </div>
        </div>

        {/* 3. Main Interactive Scrubber & Waveform Track */}
        <div className="flex-1 min-w-[280px]">
          <div
            ref={scrubberRef}
            className="relative h-[72px] w-full cursor-pointer touch-none select-none bg-[#121720]/80 rounded-lg border border-[#232F40] px-1"
            onPointerDown={handleTimelinePointerDown}
            onPointerMove={handleTimelinePointerMove}
            onPointerUp={handleTimelinePointerUp}
            onPointerCancel={handleTimelinePointerUp}
            onPointerLeave={handleTimelinePointerLeave}
            onPointerEnter={(event) => {
              setHoverPosition(getPositionFromPointer(event.clientX));
            }}
          >
            {/* Hover timestamp preview */}
            {hoverPosition !== null && (
              <div
                className="absolute bottom-full mb-2 -translate-x-1/2 z-40 pointer-events-none"
                style={{
                  left: `${hoverPosition}%`,
                }}
              >
                <div className="rounded-md border border-zinc-600 bg-zinc-950 px-2.5 py-1.5 shadow-2xl">
                  <div className="font-mono text-xs font-bold text-white">
                    {hoverTime}
                  </div>

                  {hoverEvent?.incidentId && (
                    <div className="mt-1 flex items-center gap-1.5 whitespace-nowrap">
                      <span
                        className={`h-2 w-2 rounded-full ${severityClass(
                          hoverEvent.severity
                        )}`}
                      />

                      <span className="text-[11px] font-semibold text-zinc-200">
                        {hoverEvent.registeredIncidentsCount ?? 1}{" "}
                        {(hoverEvent.registeredIncidentsCount ?? 1) === 1
                          ? "incident"
                          : "incidents"}
                      </span>

                      <span className="max-w-[180px] truncate text-[11px] text-zinc-400">
                        {hoverEvent.title}
                      </span>
                    </div>
                  )}

                  {hoverEvent?.subEvents &&
                    hoverEvent.subEvents.length > 0 && (
                      <div className="mt-0.5 text-[10px] font-semibold text-zinc-400">
                        {hoverEvent.subEvents.length} related events
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Incident annotation strip */}
            <div className="absolute left-0 right-0 top-0 h-5">
              {incidentClusters.map((cluster, index) => {
                const primaryEvent = cluster.events[0];

                if (!primaryEvent) return null;

                return (
                  <button
                    key={`${primaryEvent.id}-${index}`}
                    type="button"
                    onClick={(event) =>
                      handleMarkerClick(event, cluster)
                    }
                    onPointerEnter={(event) => {
                      event.stopPropagation();
                      setHoveredEventId(primaryEvent.id);
                      setHoverPosition(cluster.position);
                    }}
                    onPointerLeave={(event) => {
                      event.stopPropagation();
                      setHoveredEventId(null);
                    }}
                    className="absolute top-1 -translate-x-1/2 flex items-center justify-center p-1.5 rounded-full focus:outline-none z-20"
                    style={{
                      left: `${cluster.position}%`,
                    }}
                    title={primaryEvent.title}
                  >
                    <span
                      className={`block h-2 w-2 rounded-full transition-transform ${severityClass(primaryEvent.severity)
                        } ${hoveredEventId === primaryEvent.id
                          ? "scale-[2.0] ring-2 ring-white"
                          : ""
                        }`}
                    />

                    {cluster.count > 1 && (
                      <span
                        className={`absolute left-3 -top-1.5 min-w-[16px] h-[16px] px-1 rounded-full border border-zinc-600 bg-zinc-950 text-[9px] leading-[14px] font-mono font-black ${severityTextClass(
                          primaryEvent.severity
                        )}`}
                      >
                        {cluster.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* SVG waveform */}
            <div className="absolute inset-x-0 top-5 bottom-1">
              <svg
                viewBox="0 0 1000 100"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full overflow-visible"
              >
                <defs>
                  <linearGradient
                    id="timelineActivityGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#007AFF"
                      stopOpacity="0.45"
                    />
                    <stop
                      offset="100%"
                      stopColor="#007AFF"
                      stopOpacity="0.05"
                    />
                  </linearGradient>
                </defs>

                {/* Base activity waveform */}
                <path
                  d={waveformPath}
                  fill="url(#timelineActivityGradient)"
                  className="text-sky-400"
                />

                {/* Subtle baseline */}
                <line
                  x1="0"
                  y1="92"
                  x2="1000"
                  y2="92"
                  stroke="#3A4A60"
                  strokeWidth="1.5"
                  vectorEffect="non-scaling-stroke"
                />

                {/* Incident-specific highlights */}
                {incidentEvents.map((point) => {
                  const waveformPoint = waveformPoints.find(
                    (_, index) =>
                      timelinePoints[index]?.event.id ===
                      point.event.id
                  );

                  if (!waveformPoint) return null;

                  const radius =
                    point.event.severity === "critical"
                      ? 16
                      : point.event.severity === "warning"
                        ? 12
                        : 8;

                  const opacity =
                    point.event.severity === "critical"
                      ? 0.35
                      : point.event.severity === "warning"
                        ? 0.25
                        : 0.15;

                  const color =
                    point.event.severity === "critical"
                      ? "#FF3B30"
                      : point.event.severity === "warning"
                        ? "#FF9500"
                        : "#38BDF8";

                  return (
                    <circle
                      key={`glow-${point.event.id}`}
                      cx={waveformPoint.x}
                      cy={waveformPoint.y}
                      r={radius}
                      fill={color}
                      opacity={opacity}
                    />
                  );
                })}
              </svg>

              {/* Explicit High-Contrast Needle / Cursor Playhead */}
              <div
                className="absolute top-0 bottom-0 pointer-events-none z-30 transition-all duration-75 ease-out"
                style={{
                  left: `${playheadPosition}%`,
                }}
              >
                {/* Glowing vertical aura column */}
                <div className="absolute top-0 bottom-0 w-6 -translate-x-1/2 bg-gradient-to-r from-transparent via-red-500/20 to-transparent" />

                {/* High-Contrast Red Needle Body Line */}
                <div className="absolute top-0 bottom-0 w-[2.5px] -translate-x-1/2 bg-[#FF3B30] shadow-[0_0_10px_rgba(255,59,48,0.95)]" />

                {/* Top Needle Diamond Pin Head Handle */}
                <div className="absolute -top-2.5 -left-[7px] h-3.5 w-3.5 rotate-45 bg-[#FF3B30] border-2 border-white shadow-lg shadow-red-500/60" />

                {/* Bottom Needle Pin Base Dot */}
                <div className="absolute -bottom-1 -left-[5px] h-3 w-3 rounded-full bg-[#FF3B30] border-2 border-white shadow-md" />
              </div>

              {/* Hover position indicator */}
              {hoverPosition !== null && !isDragging && (
                <div
                  className="absolute top-0 bottom-0 w-px bg-white/40 pointer-events-none border-dashed border-r border-white/60"
                  style={{
                    left: `${hoverPosition}%`,
                  }}
                />
              )}
            </div>
          </div>

          {/* Time axis */}
          <div className="relative h-4 w-full mt-1">
            {axisLabels.map((label, index) => (
              <span
                key={`${label.label}-${index}`}
                className={`absolute -translate-x-1/2 font-mono text-[10px] font-bold tabular-nums ${
                  index === 0
                    ? "text-zinc-400"
                    : index === axisLabels.length - 1
                    ? "text-zinc-400"
                    : "text-zinc-300"
                }`}
                style={{
                  left: `${label.position}%`,
                }}
              >
                {label.label}
              </span>
            ))}
          </div>
        </div>

        {/* 4. Active Event Details Context */}
        <div className="hidden xl:flex shrink-0 items-center gap-2.5 max-w-[260px] bg-[#1A222E] border border-[#2D3B4E] px-3 py-2 rounded-xl shadow-md">
          {activeEvent.incidentId ? (
            <>
              {(() => {
                const activeInc = MOCK_INCIDENTS.find(i => i.id === activeEvent.incidentId);
                const makiName = activeInc ? getMakiIconNameForIncident(activeInc) : "caution";
                return (
                  <div className={`p-1.5 rounded-lg bg-black/40 border flex items-center justify-center shrink-0 ${
                    activeEvent.severity === "critical"
                      ? "text-red-400 border-red-500/50 shadow-sm shadow-red-500/30"
                      : activeEvent.severity === "warning"
                        ? "text-amber-400 border-amber-500/50 shadow-sm shadow-amber-500/30"
                        : "text-sky-400 border-sky-500/50 shadow-sm shadow-sky-500/30"
                  }`}>
                    <MakiIcon name={makiName} size={16} />
                  </div>
                );
              })()}

              <div className="min-w-0">
                <div
                  className={`font-mono text-[10px] font-black uppercase tracking-wider ${severityTextClass(
                    activeEvent.severity
                  )}`}
                >
                  {activeEvent.severity} STATUS
                </div>

                <div className="truncate text-xs font-bold text-zinc-100" title={activeEvent.title}>
                  {activeEvent.title}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Nominal Operational State
            </div>
          )}
        </div>

      </div>
    </div>
  );
}