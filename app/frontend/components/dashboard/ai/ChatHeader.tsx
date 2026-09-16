"use client";

import React from "react";
import { Sparkles, X, RotateCcw, Cpu } from "lucide-react";
import { ModelStatus } from "./schemas";

export interface ChatHeaderProps {
  modelStatus: ModelStatus;
  onReset: () => void;
  onClose: () => void;
  isStreaming: boolean;
}

export function ChatHeader({ modelStatus, onReset, onClose, isStreaming }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-background/95 backdrop-blur shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="relative">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div
            className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-background ${
              modelStatus.status === "online"
                ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                : modelStatus.status === "degraded"
                ? "bg-amber-500"
                : "bg-destructive"
            }`}
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Neural City Copilot
            </h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground border border-border/40 font-mono">
              AI System
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
            <Cpu className="w-3 h-3" />
            <span>{modelStatus.activeModel}</span>
            {isStreaming && (
              <span className="text-primary animate-pulse">● processing</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onReset}
          title="Reset conversation"
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
