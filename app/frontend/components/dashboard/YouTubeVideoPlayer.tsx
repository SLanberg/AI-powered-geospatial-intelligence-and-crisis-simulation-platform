"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";

interface YouTubeVideoPlayerProps {
  title?: string;
  durationSeconds?: number;
  initialTimeSeconds?: number;
  src?: string;
  onTimeUpdate?: (currentTime: number) => void;
  className?: string;
}

const PLAYBACK_SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 5, 10, 50, 100, 250, 500, 1000];
const QUALITIES = ["1080p60 HD", "720p60", "480p", "360p", "Auto"];
const SUBTITLE_LANGS = ["Off", "English (Auto-generated)", "Spanish", "French", "German"];

export function YouTubeVideoPlayer({
  title = "The Oder of Symetry – How to style like a pro",
  durationSeconds = 180, // 3:00
  initialTimeSeconds = 150, // 2:30
  className = "",
}: YouTubeVideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTimeSeconds);
  const [speed, setSpeed] = useState(1);
  const [quality, setQuality] = useState("1080p60 HD");
  const [subtitles, setSubtitles] = useState("Off");
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Settings popover menu state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsView, setSettingsView] = useState<"main" | "speed" | "quality" | "subtitles">("main");

  // Hover & Scrub states
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Auto-play timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= durationSeconds) {
            setIsPlaying(false);
            return durationSeconds;
          }
          return prev + 1;
        });
      }, 1000 / speed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speed, durationSeconds]);

  // Click outside settings menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
        setSettingsView("main");
      }
    };
    if (isSettingsOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSettingsOpen]);

  // Format time (m:ss or h:mm:ss)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const progressPercent = (currentTime / durationSeconds) * 100;

  // Progress bar pointer events
  const handleSeek = (clientX: number) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setCurrentTime(ratio * durationSeconds);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    handleSeek(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(ratio * 100);
    setHoverTime(ratio * durationSeconds);

    if (isDragging) {
      setCurrentTime(ratio * durationSeconds);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-video max-w-4xl mx-auto rounded-2xl overflow-hidden bg-black text-white shadow-2xl font-sans group ${className}`}
    >
      {/* Background Graphic / Video Placeholder Frame */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-neutral-950 to-black flex items-center justify-center pointer-events-none overflow-hidden">
        {/* Abstract Architectural SVG Background matching screenshot */}
        <svg className="w-full h-full opacity-40 object-cover" viewBox="0 0 800 450" fill="none">
          <path d="M400 50 L100 400 H700 Z" stroke="#ffffff" strokeWidth="1.5" opacity="0.3" />
          <path d="M400 100 L180 380 H620 Z" stroke="#ffffff" strokeWidth="1" opacity="0.25" />
          <path d="M400 150 L250 360 H550 Z" stroke="#ffffff" strokeWidth="1" opacity="0.2" />
          {Array.from({ length: 18 }).map((_, i) => (
            <line
              key={i}
              x1={400 - i * 20}
              y1={50 + i * 18}
              x2={400 + i * 20}
              y2={50 + i * 18}
              stroke="#ffffff"
              strokeWidth="0.8"
              opacity="0.15"
            />
          ))}
        </svg>

        {/* Center Big Play Button on Hover/Pause */}
        {!isPlaying && (
          <button
            onClick={() => setIsPlaying(true)}
            className="absolute z-20 w-16 h-16 rounded-full bg-black/60 border border-white/20 backdrop-blur-md flex items-center justify-center text-white hover:scale-110 hover:bg-red-600 transition-all shadow-2xl"
          >
            <span className="material-symbols-outlined text-4xl ml-1">play_arrow</span>
          </button>
        )}
      </div>

      {/* Top Header Overlay Bar */}
      <div className="absolute top-0 inset-x-0 p-6 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent opacity-90 transition-opacity z-20">
        <h2 className="text-sm md:text-base font-medium tracking-wide text-white/95 font-sans drop-shadow-md">
          {title}
        </h2>

        {/* Cast Icon Top Right */}
        <button
          className="text-white/80 hover:text-white p-1 rounded-full transition-colors"
          title="Cast to device"
        >
          <span className="material-symbols-outlined text-2xl">cast</span>
        </button>
      </div>

      {/* Subtitles Overlay */}
      {subtitlesEnabled && subtitles !== "Off" && (
        <div className="absolute bottom-16 inset-x-0 flex justify-center pointer-events-none z-20">
          <span className="bg-black/80 border border-white/10 text-white px-3 py-1 rounded text-sm backdrop-blur-sm">
            [Music playing in the background]
          </span>
        </div>
      )}

      {/* YouTube Interactive Settings Popup Menu */}
      {isSettingsOpen && (
        <div
          ref={settingsRef}
          className="absolute bottom-16 right-6 z-40 w-60 rounded-xl bg-[#0f0f0f]/95 border border-white/15 text-white shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {settingsView === "main" && (
            <div className="py-1 text-xs">
              <button
                onClick={() => setSettingsView("speed")}
                className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">speed</span>
                  <span>Playback speed</span>
                </div>
                <div className="flex items-center gap-1 text-zinc-400">
                  <span>{speed === 1 ? "Normal" : `${speed}x`}</span>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </div>
              </button>

              <button
                onClick={() => setSettingsView("subtitles")}
                className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">subtitles</span>
                  <span>Subtitles / CC</span>
                </div>
                <div className="flex items-center gap-1 text-zinc-400">
                  <span>{subtitles}</span>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </div>
              </button>

              <button
                onClick={() => setSettingsView("quality")}
                className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">high_quality</span>
                  <span>Quality</span>
                </div>
                <div className="flex items-center gap-1 text-zinc-400">
                  <span>{quality}</span>
                  <span className="material-symbols-outlined text-sm">chevron_right</span>
                </div>
              </button>
            </div>
          )}

          {settingsView === "speed" && (
            <div className="py-1 text-xs">
              <button
                onClick={() => setSettingsView("main")}
                className="w-full px-4 py-2 flex items-center gap-2 border-b border-white/10 hover:bg-white/10 text-zinc-300 font-semibold"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
                <span>Playback speed</span>
              </button>
              {PLAYBACK_SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSpeed(s);
                    setIsSettingsOpen(false);
                    setSettingsView("main");
                  }}
                  className="w-full px-4 py-2 flex items-center justify-between hover:bg-white/10 transition-colors"
                >
                  <span>{s === 1 ? "Normal" : `${s}x`}</span>
                  {speed === s && (
                    <span className="material-symbols-outlined text-sm text-red-500">check</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {settingsView === "subtitles" && (
            <div className="py-1 text-xs">
              <button
                onClick={() => setSettingsView("main")}
                className="w-full px-4 py-2 flex items-center gap-2 border-b border-white/10 hover:bg-white/10 text-zinc-300 font-semibold"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
                <span>Subtitles / CC</span>
              </button>
              {SUBTITLE_LANGS.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setSubtitles(lang);
                    setSubtitlesEnabled(lang !== "Off");
                    setIsSettingsOpen(false);
                    setSettingsView("main");
                  }}
                  className="w-full px-4 py-2 flex items-center justify-between hover:bg-white/10 transition-colors"
                >
                  <span>{lang}</span>
                  {subtitles === lang && (
                    <span className="material-symbols-outlined text-sm text-red-500">check</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {settingsView === "quality" && (
            <div className="py-1 text-xs">
              <button
                onClick={() => setSettingsView("main")}
                className="w-full px-4 py-2 flex items-center gap-2 border-b border-white/10 hover:bg-white/10 text-zinc-300 font-semibold"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
                <span>Quality</span>
              </button>
              {QUALITIES.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setQuality(q);
                    setIsSettingsOpen(false);
                    setSettingsView("main");
                  }}
                  className="w-full px-4 py-2 flex items-center justify-between hover:bg-white/10 transition-colors"
                >
                  <span>{q}</span>
                  {quality === q && (
                    <span className="material-symbols-outlined text-sm text-red-500">check</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bottom Overlay Controls Container (YouTube Style) */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black via-black/70 to-transparent p-4 flex flex-col gap-2 z-30">
        {/* Progress Bar / Scrubber (YouTube Signature Style) */}
        <div
          ref={progressRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={() => {
            if (!isDragging) {
              setHoverPosition(null);
              setHoverTime(null);
            }
          }}
          className="relative h-3 w-full flex items-center cursor-pointer group/scrubber"
        >
          {/* Base track */}
          <div className="relative h-1 group-hover/scrubber:h-1.5 w-full bg-white/30 rounded-full overflow-hidden transition-[height] duration-150">
            {/* Played track (YouTube Red) */}
            <div
              className="absolute top-0 bottom-0 left-0 bg-[#FF0000]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Scrubber Knob Circle */}
          <div
            style={{ left: `${progressPercent}%` }}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-[#FF0000] border border-white opacity-0 group-hover/scrubber:opacity-100 transition-opacity shadow-md pointer-events-none"
          />

          {/* Hover Time Tooltip */}
          {hoverPosition !== null && hoverTime !== null && (
            <div
              style={{ left: `${hoverPosition}%` }}
              className="absolute -top-7 -translate-x-1/2 bg-black/90 text-white font-mono text-[10px] px-2 py-0.5 rounded border border-white/20 pointer-events-none shadow-md"
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Controls Button Row */}
        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center gap-4">
            {/* Play / Pause */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="text-white/90 hover:text-white transition-colors"
              title={isPlaying ? "Pause" : "Play"}
            >
              <span className="material-symbols-outlined text-3xl">
                {isPlaying ? "pause" : "play_arrow"}
              </span>
            </button>

            {/* Timestamp */}
            <div className="font-mono text-sm font-medium text-white/90">
              <span>{formatTime(currentTime)}</span>
              <span className="mx-1 opacity-60">/</span>
              <span>{formatTime(durationSeconds)}</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">

            {/* Subtitles / CC */}
            <button
              onClick={() => setSubtitlesEnabled(!subtitlesEnabled)}
              className={`transition-colors ${
                subtitlesEnabled ? "text-red-500" : "text-white/80 hover:text-white"
              }`}
              title="Subtitles/closed captions"
            >
              <span className="material-symbols-outlined text-2xl">subtitles</span>
            </button>

            {/* Settings Gear Icon */}
            <button
              onClick={() => {
                setIsSettingsOpen((prev) => !prev);
                setSettingsView("main");
              }}
              className={`text-white/90 hover:text-white transition-transform ${
                isSettingsOpen ? "rotate-45" : ""
              }`}
              title="Settings"
            >
              <span className="material-symbols-outlined text-2xl">settings</span>
            </button>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white/90 hover:text-white transition-colors"
              title="Fullscreen"
            >
              <span className="material-symbols-outlined text-2xl">
                {isFullscreen ? "fullscreen_exit" : "fullscreen"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default YouTubeVideoPlayer;
