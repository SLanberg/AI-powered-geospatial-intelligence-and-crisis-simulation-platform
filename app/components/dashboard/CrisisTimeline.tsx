"use client";

import React, { useEffect, useState } from "react";
import { Play, Pause, RotateCcw, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TIMELINE_STEPS } from "./data";

interface CrisisTimelineProps {
  selectedTime: string;
  setSelectedTime: React.Dispatch<React.SetStateAction<string>>;
  crisisActive: boolean;
}

export function CrisisTimeline({
  selectedTime,
  setSelectedTime,
  crisisActive,
}: CrisisTimelineProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto playback ticker when play button is toggled
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setSelectedTime((prevTime: string) => {
        const currentIndex = TIMELINE_STEPS.findIndex((s) => s.time === prevTime);
        const nextIndex = (currentIndex + 1) % TIMELINE_STEPS.length;
        return TIMELINE_STEPS[nextIndex].time;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isPlaying, setSelectedTime]);


  const activeStep = TIMELINE_STEPS.find((s) => s.time === selectedTime) || TIMELINE_STEPS[2];

  return (
    <div className="bg-[#0B0F19]/90 backdrop-blur border-t border-slate-800/80 px-4 py-3 text-slate-300 flex flex-col md:flex-row items-center justify-between gap-3 font-sans">
      {/* Timeline Controls Header */}
      <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-between md:justify-start">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            className="h-7 w-7 bg-slate-900 border-slate-700/80 text-slate-300 hover:text-slate-100 hover:bg-slate-800"
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? "Pause Timeline" : "Play Timeline"}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 text-blue-400" />
            ) : (
              <Play className="w-3.5 h-3.5 text-slate-300 fill-slate-300 ml-0.5" />
            )}
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-slate-400 hover:text-slate-200"
            onClick={() => {
              setIsPlaying(false);
              setSelectedTime("08:47");
            }}
            title="Reset to 08:47 Crisis Point"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-400">TIME:</span>
          <span className="text-slate-100 font-bold text-sm bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {selectedTime}:00
          </span>
          {selectedTime === "08:47" && (
            <Badge
              variant="destructive"
              className="text-[10px] px-1.5 py-0 h-4 font-mono uppercase bg-rose-950 text-rose-300 border-rose-800 animate-pulse"
            >
              CRISIS POINT
            </Badge>
          )}
        </div>
      </div>

      {/* Scrubbing Bar */}
      <div className="w-full max-w-xl flex items-center justify-between gap-1 relative py-1">
        {/* Track Line */}
        <div className="absolute top-1/2 left-3 right-3 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />

        {TIMELINE_STEPS.map((step) => {
          const isSelected = selectedTime === step.time;
          const isCrisis = step.time === "08:47";

          return (
            <button
              key={step.time}
              onClick={() => {
                setIsPlaying(false);
                setSelectedTime(step.time);
              }}
              className="group relative z-10 flex flex-col items-center focus:outline-none"
            >
              {/* Point Node */}
              <div
                className={`w-3.5 h-3.5 rounded-full border-2 transition-all flex items-center justify-center ${
                  isSelected
                    ? isCrisis
                      ? "bg-rose-500 border-rose-300 ring-4 ring-rose-500/20 scale-125"
                      : "bg-blue-500 border-blue-300 ring-4 ring-blue-500/20 scale-125"
                    : isCrisis
                    ? "bg-rose-950 border-rose-600 group-hover:bg-rose-600"
                    : "bg-slate-900 border-slate-700 group-hover:border-slate-400"
                }`}
              />

              {/* Time Label */}
              <span
                className={`mt-1 font-mono text-[10px] transition-colors ${
                  isSelected
                    ? isCrisis
                      ? "text-rose-400 font-bold"
                      : "text-blue-300 font-bold"
                    : "text-slate-500 group-hover:text-slate-300"
                }`}
              >
                {step.time}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Step Detail Status */}
      <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800/80">
        <span className="text-slate-500">EVENT:</span>
        <span className="text-slate-200 font-sans font-medium truncate max-w-[140px]">
          {activeStep.label}
        </span>
      </div>
    </div>
  );
}
