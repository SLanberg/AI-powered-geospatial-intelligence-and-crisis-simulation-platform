"use client";

import React from "react";
import { Zap, ShieldAlert, Target } from "lucide-react";

export interface ChatPromptSuggestionsProps {
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
}

const QUICK_PROMPTS = [
  {
    icon: Zap,
    label: "Grid Anomaly Status",
    text: "Provide a complete telemetry assessment of tripped transformers and substations across Tallinn.",
  },
  {
    icon: ShieldAlert,
    label: "Hospital Feeder Check",
    text: "Verify power supply stability and secondary backup status for Tallinn regional hospitals.",
  },
  {
    icon: Target,
    label: "Traffic Diversion",
    text: "Analyze traffic flow on Pärnu mnt and Narva mnt and formulate rerouting around Viru junction.",
  },
];

export function ChatPromptSuggestions({ onSelectPrompt, disabled }: ChatPromptSuggestionsProps) {
  return (
    <div className="flex flex-col gap-1.5 p-3 bg-muted/20 border-b border-border/30">
      <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
        Suggested Operations
      </span>
      <div className="flex flex-wrap gap-1.5">
        {QUICK_PROMPTS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              disabled={disabled}
              onClick={() => onSelectPrompt(item.text)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-card hover:bg-muted/80 border border-border/50 text-[11px] text-foreground transition-all disabled:opacity-50"
            >
              <Icon className="w-3 h-3 text-primary" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
