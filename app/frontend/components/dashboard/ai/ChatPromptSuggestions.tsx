"use client";

import React from "react";
import { Zap, ShieldAlert, Target, Activity, FileText, ArrowUpRight, HelpCircle } from "lucide-react";

export interface ChatPromptSuggestionsProps {
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
}

const QUESTION_OPTIONS = [
  {
    icon: Zap,
    iconColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    label: "Grid Telemetry Status",
    prompt: "Provide a complete telemetry assessment of tripped transformers and substations across Tallinn.",
  },
  {
    icon: ShieldAlert,
    iconColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    label: "Hospital Feeder Check",
    prompt: "Verify power supply stability and secondary backup status for Tallinn regional hospitals.",
  },
  {
    icon: Target,
    iconColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    label: "Traffic & Transit Diversion",
    prompt: "Analyze traffic flow on Pärnu mnt and Narva mnt and formulate rerouting around Viru junction.",
  },
  {
    icon: Activity,
    iconColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    label: "Cascading Failure Analysis",
    prompt: "Identify critical infrastructure risks and cascading failure points across the city grid.",
  },
  {
    icon: FileText,
    iconColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
    label: "Generate SCADA Brief",
    prompt: "Generate an executive SCADA incident brief with recommended mitigation protocols.",
  },
];

export function ChatPromptSuggestions({ onSelectPrompt, disabled }: ChatPromptSuggestionsProps) {
  return (
    <div className="mt-3 pl-9 pr-1 flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <HelpCircle className="w-3.5 h-3.5 text-primary" />
        <span>Questions you can ask your AI agent:</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {QUESTION_OPTIONS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              disabled={disabled}
              onClick={() => onSelectPrompt(item.prompt)}
              className="group text-left p-2.5 rounded-lg bg-card/80 hover:bg-muted/80 border border-border/70 hover:border-primary/50 transition-all duration-150 flex flex-col justify-between gap-1.5 disabled:opacity-50 shadow-xs hover:shadow-md cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${item.iconColor}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors">
                    {item.label}
                  </span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2 pl-8">
                {item.prompt}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
