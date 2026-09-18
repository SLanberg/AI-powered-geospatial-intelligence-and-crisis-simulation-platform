"use client";

import React, { useState } from "react";
import { Bot, Copy, Check, Target, AlertCircle, RotateCcw, PlusCircle } from "lucide-react";
import { DashboardChatMessage } from "./schemas";
import { MarkdownRenderer } from "./MarkdownRenderer";
import type { MapAction } from "@/components/dashboard/data";

export interface ChatMessageItemProps {
  message: DashboardChatMessage;
  onMapAction?: (action: MapAction) => void;
  isStreaming?: boolean;
  onRetry?: (messageId: string) => void;
  onNewChat?: () => void;
}

export function ChatMessageItem({
  message,
  onMapAction,
  isStreaming,
  onRetry,
  onNewChat,
}: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === "assistant";

  // Extract map action from message if present
  let attachedMapAction: MapAction | null = (message.mapAction as MapAction) || null;

  const getDisplayContent = (content: string) => {
    if (!content) return "";
    let clean = content;

    // Check for embedded MAP_ACTION comment
    const actionMatch = clean.match(/<!--\s*MAP_ACTION:\s*(\{.*?\})\s*-->/);
    if (actionMatch) {
      try {
        if (!attachedMapAction) {
          attachedMapAction = JSON.parse(actionMatch[1]);
        }
      } catch {}
      clean = clean.replace(/<!--\s*MAP_ACTION:\s*\{.*?\}\s*-->/g, "").trim();
    }

    const trimmed = clean.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed.content === "string") {
          return parsed.content;
        }
      } catch {
        // Fallthrough if not valid JSON
      }
    }
    return clean;
  };

  const textToRender = getDisplayContent(message.content);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToRender);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isThinking = isAssistant && (!textToRender || textToRender.trim().length === 0) && !message.isError;

  if (message.isError) {
    return (
      <div className="group flex gap-2.5 text-xs leading-relaxed items-start">
        <div className="w-7 h-7 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive shrink-0 mt-0.5 shadow-sm">
          <AlertCircle className="w-4 h-4" />
        </div>

        <div className="relative max-w-[90%] rounded-xl px-4 py-3.5 shadow-sm bg-destructive/10 border border-destructive/30 text-foreground flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <span className="text-destructive font-medium text-xs">
              {textToRender || "An error occurred while generating the response."}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1 border-t border-destructive/20">
            {onRetry && (
              <button
                type="button"
                onClick={() => onRetry(message.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/15 hover:bg-primary/25 border border-primary/30 text-primary text-xs font-mono font-medium transition-all shadow-xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}

            {onNewChat && (
              <button
                type="button"
                onClick={onNewChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 border border-border/60 text-muted-foreground hover:text-foreground text-xs font-mono font-medium transition-all shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New chat</span>
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground/70">
            <span>{message.ts || ""}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group flex gap-2.5 text-xs leading-relaxed transition-opacity ${
        isAssistant ? "items-start" : "items-start justify-end"
      }`}
    >
      {isAssistant && (
        <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5 shadow-sm">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div
        className={`relative max-w-[90%] rounded-xl px-4 py-3 shadow-xs transition-all ${
          isAssistant
            ? "bg-card/90 border border-border/60 text-foreground"
            : "bg-primary text-primary-foreground font-normal"
        }`}
      >
        {isThinking ? (
          <div className="flex items-center gap-1.5 py-1 px-1 h-4">
            <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce [animation-delay:-0.32s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce [animation-delay:-0.16s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" />
          </div>
        ) : (
          <MarkdownRenderer content={textToRender} isUser={!isAssistant} />
        )}

        {/* Tactical Map Focus Action Chip */}
        {attachedMapAction && onMapAction && (
          <div className="mt-2 pt-2 border-t border-border/40 flex items-center gap-2">
            <button
              type="button"
              onClick={() => attachedMapAction && onMapAction(attachedMapAction)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-500/40 hover:bg-sky-500/25 text-sky-400 hover:text-sky-300 text-[11px] font-mono font-medium transition-all shadow-xs group/btn cursor-pointer"
            >
              <Target className="w-3.5 h-3.5 text-sky-400 group-hover/btn:animate-spin" />
              <span>
                Focus Map: {attachedMapAction.title || "Target Coordinates"}
              </span>
            </button>
          </div>
        )}

        {!isThinking && (
          <div
            className={`mt-2 flex items-center justify-between gap-4 text-[10px] font-mono ${
              isAssistant ? "text-muted-foreground/70" : "text-primary-foreground/70"
            }`}
          >
            <span>{message.ts || ""}</span>

            {isAssistant && (
              <button
                onClick={handleCopy}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-foreground transition-opacity rounded hover:bg-muted/50"
                title="Copy message"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


