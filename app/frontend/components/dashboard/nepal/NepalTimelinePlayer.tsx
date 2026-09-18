"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  NEPAL_TIMELINE_EVENTS,
  NepalTimelineEvent,
  TIMELINE_MIN_SECONDS,
  TIMELINE_MAX_SECONDS,
  REPLAY_START_SECONDS,
  formatNptTime,
  formatUtcTime,
} from "@/frontend/data/nepalIncidentData";

interface NepalTimelinePlayerProps {
  currentSeconds: number;
  onSeek: (seconds: number) => void;
  activeEvent: NepalTimelineEvent;
  onSelectEvent: (event: NepalTimelineEvent) => void;
}

const PLAYBACK_SPEEDS = [
  { label: "0.25x", value: 0.25 },
  { label: "0.5x", value: 0.5 },
  { label: "0.75x", value: 0.75 },
  { label: "Normal (1x)", value: 1 },
  { label: "1.25x", value: 1.25 },
  { label: "1.5x", value: 1.5 },
  { label: "2x", value: 2 },
  { label: "5x (Fast)", value: 5 },
  { label: "15x (Replay)", value: 15 },
  { label: "30x (Sim)", value: 30 },
  { label: "60x (Turbo)", value: 60 },
  { label: "120x (Max)", value: 120 },
];

const QUALITIES = [
  { label: "1080p60 HD", value: "1080p" },
  { label: "720p60 HD", value: "720p" },
  { label: "480p", value: "480p" },
  { label: "360p", value: "360p" },
  { label: "Auto", value: "auto" },
];

const SUBTITLE_OPTIONS = [
  { label: "Off", value: "off" },
  { label: "English (Auto-generated)", value: "en" },
  { label: "Nepali (Emergency Alerts)", value: "ne" },
  { label: "All Telemetry Logs", value: "logs" },
];

export function NepalTimelinePlayer({
  currentSeconds,
  onSeek,
  activeEvent,
  onSelectEvent,
}: NepalTimelinePlayerProps) {
  // Playback states
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(30);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [selectedSubtitle, setSelectedSubtitle] = useState("en");
  const [selectedQuality, setSelectedQuality] = useState("1080p");
  const [isLooping, setIsLooping] = useState(false);
  const [showEventMarkers, setShowEventMarkers] = useState(true);

  // Settings menu states
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"main" | "speed" | "subtitles" | "quality">("main");

  // Interaction / Scrubber states
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState<NepalTimelineEvent | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const scrubberRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const settingsMenuRef = useRef<HTMLDivElement | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const currentSecondsRef = useRef(currentSeconds);

  // Sync ref
  useEffect(() => {
    currentSecondsRef.current = currentSeconds;
  }, [currentSeconds]);

  // Close settings popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        settingsMenuRef.current &&
        !settingsMenuRef.current.contains(e.target as Node)
      ) {
        setIsSettingsOpen(false);
        setSettingsTab("main");
      }
    };
    if (isSettingsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSettingsOpen]);

  const totalDuration = TIMELINE_MAX_SECONDS - TIMELINE_MIN_SECONDS;

  // Animation frame playback loop
  const animate = useCallback(
    (timestamp: number) => {
      if (lastTickRef.current != null) {
        const deltaMs = timestamp - lastTickRef.current;
        const advancedSeconds = (deltaMs / 1000) * speedMultiplier;
        const nextSeconds = currentSecondsRef.current + advancedSeconds;

        if (nextSeconds >= TIMELINE_MAX_SECONDS) {
          if (isLooping) {
            currentSecondsRef.current = REPLAY_START_SECONDS;
            onSeek(REPLAY_START_SECONDS);
          } else {
            onSeek(TIMELINE_MAX_SECONDS);
            setIsPlaying(false);
            lastTickRef.current = null;
            return;
          }
        } else {
          currentSecondsRef.current = nextSeconds;
          onSeek(nextSeconds);
        }
      }
      lastTickRef.current = timestamp;
      requestRef.current = requestAnimationFrame(animate);
    },
    [speedMultiplier, isLooping, onSeek]
  );

  useEffect(() => {
    if (isPlaying) {
      lastTickRef.current = performance.now();
      requestRef.current = requestAnimationFrame(animate);
    } else {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
      lastTickRef.current = null;
    }

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying, animate]);

  // Percentage calculations
  const playheadPercent = Math.max(
    0,
    Math.min(100, ((currentSeconds - TIMELINE_MIN_SECONDS) / totalDuration) * 100)
  );

  // Simulated buffer percent (always 100% fully loaded)
  const bufferedPercent = 100;

  // Milestones
  const milestones = useMemo(() => {
    return NEPAL_TIMELINE_EVENTS.map((ev) => {
      const pos =
        ((ev.secondsFromMidnight - TIMELINE_MIN_SECONDS) / totalDuration) * 100;
      return {
        event: ev,
        position: Math.max(0, Math.min(100, pos)),
      };
    });
  }, [totalDuration]);

  // Hovered milestone tooltip
  const hoveredMilestone = useMemo(() => {
    if (!hoveredEvent) return null;
    return milestones.find((m) => m.event.eventId === hoveredEvent.eventId);
  }, [hoveredEvent, milestones]);

  // Pointer scrubber calculation
  const getSecondsFromPointer = (clientX: number) => {
    if (!scrubberRef.current) return currentSeconds;
    const rect = scrubberRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return TIMELINE_MIN_SECONDS + ratio * totalDuration;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setIsPlaying(false);
    const secs = getSecondsFromPointer(e.clientX);
    onSeek(secs);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubberRef.current) return;
    const rect = scrubberRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(ratio * 100);

    if (isDragging) {
      const secs = TIMELINE_MIN_SECONDS + ratio * totalDuration;
      onSeek(secs);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  };

  const handlePointerLeave = () => {
    if (!isDragging) {
      setHoverPosition(null);
      setHoveredEvent(null);
    }
  };

  // Step back / forward
  const handleStepBack = () => {
    const prev = [...NEPAL_TIMELINE_EVENTS]
      .reverse()
      .find((ev) => ev.secondsFromMidnight < currentSeconds - 10);
    if (prev) {
      onSeek(prev.secondsFromMidnight);
      onSelectEvent(prev);
    } else {
      onSeek(REPLAY_START_SECONDS);
    }
  };

  const handleStepForward = () => {
    const next = NEPAL_TIMELINE_EVENTS.find(
      (ev) => ev.secondsFromMidnight > currentSeconds + 10
    );
    if (next) {
      onSeek(next.secondsFromMidnight);
      onSelectEvent(next);
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      if (containerRef.current?.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else if ((containerRef.current as any)?.webkitRequestFullscreen) {
        (containerRef.current as any).webkitRequestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if ((document as any).webkitExitFullscreen) {
        (document as any).webkitExitFullscreen();
      }
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Hover time string
  const hoverTimeStr = useMemo(() => {
    if (hoverPosition == null) return "";
    const secs = TIMELINE_MIN_SECONDS + (hoverPosition / 100) * totalDuration;
    return formatNptTime(secs);
  }, [hoverPosition, totalDuration]);

  // Current formatted timestamp
  const currentTimeFormatted = formatNptTime(currentSeconds);
  const totalTimeFormatted = formatNptTime(TIMELINE_MAX_SECONDS);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-gradient-to-t from-black via-[#0a0a0a]/95 to-black/80 border-t border-white/10 text-white font-sans select-none z-30 shadow-2xl transition-all"
    >
      {/* Subtitles Overlay (YouTube Captions Bar) */}
      {subtitlesEnabled && selectedSubtitle !== "off" && (
        <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 pointer-events-none z-40">
          <div className="bg-black/85 text-white px-4 py-1.5 rounded text-sm md:text-base font-semibold tracking-wide border border-white/10 backdrop-blur-md shadow-xl max-w-xl text-center">
            <span className="text-red-400 font-mono text-xs mr-2 font-bold uppercase">
              [{activeEvent.eventId}]
            </span>
            <span>{activeEvent.eventType} — {activeEvent.location}</span>
          </div>
        </div>
      )}

      {/* Floating Milestone Tooltip Appearing Above the Timeline (YouTube Preview style) */}
      {hoveredEvent && hoveredMilestone && (() => {
        const pos = hoveredMilestone.position;
        const clampedLeft = Math.max(16, Math.min(84, pos));

        return (
          <div
            style={{ left: `${clampedLeft}%` }}
            className="absolute bottom-full mb-2 -translate-x-1/2 pointer-events-none z-50 transition-all duration-150"
          >
            <div className="relative flex flex-col items-center p-2 rounded-lg bg-[#0f0f0f]/95 border border-white/15 shadow-2xl backdrop-blur-md text-xs text-white whitespace-nowrap">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase">
                  {hoveredEvent.eventId}
                </span>
                <span className="font-mono text-[11px] font-semibold text-zinc-300">
                  {hoveredEvent.timeNpt} NPT
                </span>
              </div>
              <span className="font-medium text-white max-w-[220px] truncate">
                {hoveredEvent.eventType}
              </span>
              <span className="text-[10px] text-zinc-400 max-w-[220px] truncate">
                📍 {hoveredEvent.location}
              </span>

              {/* Pointer Caret */}
              <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0f0f0f] border-r border-b border-white/15 rotate-45" />
            </div>
          </div>
        );
      })()}

      {/* YouTube Interactive Settings Popover Menu */}
      {isSettingsOpen && (
        <div
          ref={settingsMenuRef}
          className="absolute bottom-14 right-4 z-50 w-64 rounded-xl bg-[#0f0f0f]/95 border border-white/15 text-white shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {settingsTab === "main" && (
            <div className="py-1 text-xs">
              {/* Playback Speed */}
              <button
                onClick={() => setSettingsTab("speed")}
                className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-2.5 text-zinc-200">
                  <span className="material-symbols-outlined text-lg">speed</span>
                  <span>Playback speed</span>
                </div>
                <div className="flex items-center gap-1 text-zinc-400 font-mono">
                  <span>{speedMultiplier}x</span>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </div>
              </button>

              {/* Subtitles / Captions */}
              <button
                onClick={() => setSettingsTab("subtitles")}
                className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-2.5 text-zinc-200">
                  <span className="material-symbols-outlined text-lg">subtitles</span>
                  <span>Subtitles / CC</span>
                </div>
                <div className="flex items-center gap-1 text-zinc-400">
                  <span>
                    {SUBTITLE_OPTIONS.find((s) => s.value === selectedSubtitle)?.label.split(" ")[0]}
                  </span>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </div>
              </button>

              {/* Quality */}
              <button
                onClick={() => setSettingsTab("quality")}
                className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-2.5 text-zinc-200">
                  <span className="material-symbols-outlined text-lg">high_quality</span>
                  <span>Quality</span>
                </div>
                <div className="flex items-center gap-1 text-zinc-400">
                  <span>{selectedQuality}</span>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </div>
              </button>

              <div className="h-px bg-white/10 my-1" />

              {/* Annotations / Event Markers Toggle */}
              <button
                onClick={() => setShowEventMarkers((prev) => !prev)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-white/10 transition-colors text-zinc-200"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-lg">timeline</span>
                  <span>Timeline Markers</span>
                </div>
                <span className={`material-symbols-outlined text-lg ${showEventMarkers ? "text-red-500" : "text-zinc-500"}`}>
                  {showEventMarkers ? "toggle_on" : "toggle_off"}
                </span>
              </button>

              {/* Loop Replay Toggle */}
              <button
                onClick={() => setIsLooping((prev) => !prev)}
                className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-white/10 transition-colors text-zinc-200"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-lg">repeat</span>
                  <span>Loop Replay</span>
                </div>
                <span className={`material-symbols-outlined text-lg ${isLooping ? "text-red-500" : "text-zinc-500"}`}>
                  {isLooping ? "toggle_on" : "toggle_off"}
                </span>
              </button>
            </div>
          )}

          {/* Submenu: Playback Speed */}
          {settingsTab === "speed" && (
            <div className="py-1 text-xs max-h-64 overflow-y-auto">
              <button
                onClick={() => setSettingsTab("main")}
                className="w-full px-3.5 py-2 flex items-center gap-2 border-b border-white/10 hover:bg-white/10 text-zinc-300 font-semibold"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
                <span>Playback speed</span>
              </button>
              {PLAYBACK_SPEEDS.map((spd) => (
                <button
                  key={spd.value}
                  onClick={() => {
                    setSpeedMultiplier(spd.value);
                    setSettingsTab("main");
                    setIsSettingsOpen(false);
                  }}
                  className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-white/10 transition-colors text-zinc-200"
                >
                  <span className="font-mono">{spd.label}</span>
                  {speedMultiplier === spd.value && (
                    <span className="material-symbols-outlined text-sm text-red-500">check</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Submenu: Subtitles */}
          {settingsTab === "subtitles" && (
            <div className="py-1 text-xs">
              <button
                onClick={() => setSettingsTab("main")}
                className="w-full px-3.5 py-2 flex items-center gap-2 border-b border-white/10 hover:bg-white/10 text-zinc-300 font-semibold"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
                <span>Subtitles / CC</span>
              </button>
              {SUBTITLE_OPTIONS.map((sub) => (
                <button
                  key={sub.value}
                  onClick={() => {
                    setSelectedSubtitle(sub.value);
                    setSubtitlesEnabled(sub.value !== "off");
                    setSettingsTab("main");
                    setIsSettingsOpen(false);
                  }}
                  className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-white/10 transition-colors text-zinc-200"
                >
                  <span>{sub.label}</span>
                  {selectedSubtitle === sub.value && (
                    <span className="material-symbols-outlined text-sm text-red-500">check</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Submenu: Quality */}
          {settingsTab === "quality" && (
            <div className="py-1 text-xs">
              <button
                onClick={() => setSettingsTab("main")}
                className="w-full px-3.5 py-2 flex items-center gap-2 border-b border-white/10 hover:bg-white/10 text-zinc-300 font-semibold"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
                <span>Quality</span>
              </button>
              {QUALITIES.map((q) => (
                <button
                  key={q.value}
                  onClick={() => {
                    setSelectedQuality(q.value);
                    setSettingsTab("main");
                    setIsSettingsOpen(false);
                  }}
                  className="w-full px-3.5 py-2 flex items-center justify-between hover:bg-white/10 transition-colors text-zinc-200"
                >
                  <span>{q.label}</span>
                  {selectedQuality === q.value && (
                    <span className="material-symbols-outlined text-sm text-red-500">check</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main YouTube Scrubber Progress Bar Area */}
      <div className="relative px-3 pt-2 group/scrubber">
        <div
          ref={scrubberRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          className="relative h-3 w-full flex items-center cursor-pointer py-1"
        >
          {/* Background Track Bar */}
          <div className="relative h-1 group-hover/scrubber:h-1.5 w-full bg-white/20 rounded-full overflow-hidden transition-all duration-150">
            {/* Buffered Track Bar */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-white/40 transition-all duration-300"
              style={{ width: `${bufferedPercent}%` }}
            />
            {/* Played Progress Track Bar (YouTube Signature Red #FF0000) */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-[#FF0000] transition-all duration-75"
              style={{ width: `${playheadPercent}%` }}
            />
          </div>

          {/* Event Markers Pips (YouTube Chapter Dots) */}
          {showEventMarkers &&
            milestones.map(({ event, position }) => {
              const isSelected = activeEvent.eventId === event.eventId;
              return (
                <div
                  key={event.eventId}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSeek(event.secondsFromMidnight);
                    onSelectEvent(event);
                  }}
                  onMouseEnter={() => setHoveredEvent(event)}
                  onMouseLeave={() => setHoveredEvent(null)}
                  style={{ left: `${position}%` }}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 cursor-pointer"
                >
                  <div
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      isSelected
                        ? "bg-white scale-150 ring-2 ring-red-600"
                        : "bg-white/70 hover:scale-125 hover:bg-white"
                    }`}
                  />
                </div>
              );
            })}

          {/* Scrubber Knob (Red Dot Slider Indicator) */}
          <div
            style={{ left: `${playheadPercent}%` }}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#FF0000] shadow-[0_0_10px_rgba(255,0,0,0.8)] border border-white opacity-0 group-hover/scrubber:opacity-100 transition-opacity duration-150 pointer-events-none z-20"
          />

          {/* Hover Time Scrubbing Guide */}
          {hoverPosition !== null && !isDragging && (
            <div
              style={{ left: `${hoverPosition}%` }}
              className="absolute top-0 bottom-0 w-px bg-white/60 pointer-events-none z-15"
            >
              <div className="absolute -top-6 -translate-x-1/2 bg-black/90 text-white font-mono text-[10px] px-1.5 py-0.5 rounded border border-white/20 shadow-md whitespace-nowrap">
                {hoverTimeStr}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom YouTube Controls Layout Bar */}
      <div className="px-3 pb-2.5 flex items-center justify-between gap-3">
        {/* Left Controls: Play/Pause, Step, Volume, Timestamp */}
        <div className="flex items-center gap-1.5 md:gap-3">
          {/* Play / Pause Toggle Button */}
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-9 h-9 flex items-center justify-center text-white/90 hover:text-white hover:bg-white/10 rounded-full transition-all active:scale-95"
            title={isPlaying ? "Pause (k)" : "Play (k)"}
          >
            <span className="material-symbols-outlined text-[28px] leading-none">
              {isPlaying ? "pause" : "play_arrow"}
            </span>
          </button>

          {/* Step Back Button */}
          <button
            onClick={handleStepBack}
            className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
            title="Previous event milestone"
          >
            <span className="material-symbols-outlined text-xl leading-none">skip_previous</span>
          </button>

          {/* Step Forward Button */}
          <button
            onClick={handleStepForward}
            className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
            title="Next event milestone"
          >
            <span className="material-symbols-outlined text-xl leading-none">skip_next</span>
          </button>

          {/* Time Display (YouTube Format) */}
          <div className="flex items-center gap-1 text-xs md:text-sm font-mono text-zinc-300 ml-1">
            <span className="text-white font-semibold tabular-nums">{currentTimeFormatted}</span>
            <span className="text-zinc-500">/</span>
            <span className="text-zinc-400 tabular-nums">{totalTimeFormatted}</span>
          </div>

          {/* Active Milestone Event Badge */}
          <div className="hidden lg:flex items-center gap-1.5 ml-2 px-2 py-0.5 rounded bg-white/10 border border-white/15 text-xs">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-red-400 font-bold">{activeEvent.eventId}</span>
            <span className="text-zinc-300 truncate max-w-[140px]">{activeEvent.eventType}</span>
          </div>
        </div>

        {/* Right Controls: Subtitles, Settings, PIP, Fullscreen */}
        <div className="flex items-center gap-1">
          {/* Subtitles / CC Toggle */}
          <button
            onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
            className={`w-8 h-8 flex flex-col items-center justify-center rounded-full transition-all ${
              subtitlesEnabled
                ? "text-white hover:bg-white/10"
                : "text-white/40 hover:text-white/80 hover:bg-white/10"
            }`}
            title="Subtitles/closed captions (c)"
          >
            <span className="material-symbols-outlined text-[22px] leading-none">subtitles</span>
            {subtitlesEnabled && <div className="w-3 h-0.5 bg-[#FF0000] rounded-full -mt-0.5" />}
          </button>

          {/* YouTube Settings Gear Button */}
          <button
            onClick={() => {
              setIsSettingsOpen((prev) => !prev);
              setSettingsTab("main");
            }}
            className={`w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all ${
              isSettingsOpen ? "rotate-45 text-white bg-white/10" : ""
            }`}
            title="Settings"
          >
            <span className="material-symbols-outlined text-[22px] leading-none">settings</span>
          </button>

          {/* Miniplayer / Picture in Picture */}
          <button
            onClick={() => {
              if (document.pictureInPictureElement) {
                document.exitPictureInPicture().catch(() => {});
              } else if (containerRef.current && "requestPictureInPicture" in containerRef.current) {
                (containerRef.current as any).requestPictureInPicture().catch(() => {});
              }
            }}
            className="w-8 h-8 hidden sm:flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
            title="Miniplayer (i)"
          >
            <span className="material-symbols-outlined text-[22px] leading-none">picture_in_picture_alt</span>
          </button>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 flex items-center justify-center text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all"
            title="Fullscreen (f)"
          >
            <span className="material-symbols-outlined text-[22px] leading-none">
              {isFullscreen ? "fullscreen_exit" : "fullscreen"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default NepalTimelinePlayer;
