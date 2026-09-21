"use client";

import {
  Zap,
  ShieldAlert,
  Target,
  Activity,
  FileText,
  ArrowUpRight,
  HelpCircle,
  Waves,
  Radio,
  Navigation,
} from "lucide-react";

export interface ChatPromptSuggestionsProps {
  onSelectPrompt: (promptText: string) => void;
  disabled?: boolean;
  activeTab?: string;
}

const OP_PICTURE_OPTIONS = [
  {
    icon: FileText,
    iconColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    label: "Active Incidents Briefing",
    prompt: "Give me an operational briefing on all active SCADA incidents across Tallinn sectors.",
  },
  {
    icon: Zap,
    iconColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    label: "Grid & Substation Telemetry",
    prompt: "Assess electrical grid telemetry and substation status on Vanalinn and Ülemiste feeders.",
  },
  {
    icon: Target,
    iconColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    label: "Traffic & Transit Corridors",
    prompt: "Analyze traffic flow on Pärnu mnt and Narva mnt and check for congestion.",
  },
  {
    icon: Activity,
    iconColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    label: "Operational Picture Status",
    prompt: "What is the current operational picture status of Tallinn municipal infrastructure?",
  },
];

const REPLAY_OPTIONS = [
  {
    icon: Waves,
    iconColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    label: "Nepal Disaster Briefing",
    prompt: "what happened in Nepal?",
  },
  {
    icon: Radio,
    iconColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    label: "Downstream Alert Status",
    prompt: "Review mass emergency SMS warning dispatches and population evacuation in downstream valleys.",
  },
  {
    icon: Navigation,
    iconColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
    label: "Highway Inundation & Diversions",
    prompt: "Analyze road damage on Prithvi Highway (H04) and alternate routing via BP Highway (H06).",
  },
  {
    icon: Activity,
    iconColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    label: "Hydrometric Gauge Readings",
    prompt: "Analyze river crest levels at Rasuwagadhi, Betrawati, Galchhi, and Devghat stations.",
  },
];

export function ChatPromptSuggestions({
  onSelectPrompt,
  disabled,
  activeTab,
}: ChatPromptSuggestionsProps) {
  const options = activeTab === "nepal" ? REPLAY_OPTIONS : OP_PICTURE_OPTIONS;

  return (
    <div className="mt-3 pl-9 pr-1 flex flex-col gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <HelpCircle className="w-3.5 h-3.5 text-primary" />
        <span>
          {activeTab === "nepal"
            ? "Replay simulation inquiries:"
            : "Operational Picture inquiries:"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {options.map((item, idx) => {
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
                  <div
                    className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${item.iconColor}`}
                  >
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
