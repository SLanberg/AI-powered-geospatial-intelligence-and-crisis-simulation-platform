"use client";

import React from "react";
import { X, RotateCcw, Cpu } from "lucide-react";
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
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-primary/40 shadow-xs flex items-center justify-center bg-primary/10">
            <img
              src="/cassandra-avatar.jpg"
              alt="Cassandra AI Agent"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback if image not found
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
          <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[8px] font-bold font-mono px-1 rounded shadow-xs leading-tight">
            AI
          </span>
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-xs font-semibold tracking-wide text-foreground">
              Cassandra
            </h3>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-mono">
            <Cpu className="w-3 h-3 text-primary/70" />
            <span>{modelStatus.activeModel}</span>
            {isStreaming && (
              <span className="text-primary">● processing</span>
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
