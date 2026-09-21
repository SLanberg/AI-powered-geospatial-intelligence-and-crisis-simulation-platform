"use client";

import React, { useState } from "react";
import { Copy, Check, Target, AlertCircle, RotateCcw, PlusCircle } from "lucide-react";
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

export const ChatMessageItem = React.memo(function ChatMessageItem({
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

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToRender);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = textToRender;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy message:", err);
    }
  };

  const isThinking =
    Boolean(isStreaming) &&
    isAssistant &&
    (!textToRender || textToRender.trim().length === 0) &&
    !attachedMapAction &&
    !message.isError;

  if (message.isError) {
    return (
      <div className="group flex gap-2.5 text-xs leading-relaxed items-start animate-fadeIn">
        <div className="w-7 h-7 rounded-lg bg-destructive/15 border border-destructive/30 flex items-center justify-center text-destructive shrink-0 mt-0.5 shadow-sm">
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
        <div className="relative shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-primary/40 bg-primary/10 flex items-center justify-center shadow-xs">
            <img
              src="/cassandra-avatar.jpg"
              alt="Cassandra AI Agent"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
          <span className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[8px] font-bold font-mono px-1 rounded shadow-xs leading-tight">
            AI
          </span>
        </div>
      )}

      <div
        className={`relative max-w-[90%] rounded-xl px-4 py-3 shadow-sm transition-all select-text ${
          isAssistant
            ? "chat-assistant-bubble bg-card border border-border text-foreground hover:border-primary/40"
            : "chat-user-bubble bg-primary text-primary-foreground font-normal rounded-tr-xs"
        }`}
      >
        {isAssistant && (
          <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-border/40 text-[11px] font-mono">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-foreground tracking-tight">Cassandra</span>
            </div>
            <span className="text-[10px] text-muted-foreground/60">{message.ts || ""}</span>
          </div>
        )}
        {isThinking ? (
          <div className="flex items-center gap-1.5 py-1 px-1 h-4">
            <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce [animation-delay:-0.32s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce [animation-delay:-0.16s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-foreground/60 animate-bounce" />
          </div>
        ) : (
          <MarkdownRenderer content={textToRender} isUser={!isAssistant} onMapAction={onMapAction} />
        )}

        {/* Tactical Map Focus Action Chip */}
        {attachedMapAction && onMapAction && (
          <div className={`${textToRender ? "mt-2 pt-2 border-t border-border/40" : ""} flex items-center gap-2`}>
            <button
              type="button"
              onClick={() => attachedMapAction && onMapAction(attachedMapAction)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/15 border border-primary/35 hover:bg-primary/25 text-primary text-[11px] font-mono font-medium transition-all shadow-xs group/btn cursor-pointer"
            >
              <Target className="w-3.5 h-3.5 text-primary group-hover/btn:animate-spin" />
              <span>
                {attachedMapAction.type === "focus_district" ? "Focus District: " : "Focus Map: "}
                {attachedMapAction.title
                  ? attachedMapAction.title.replace(/^District Sector:\s*/i, "").replace(/^Station:\s*/i, "")
                  : "Target Coordinates"}
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

            <button
              type="button"
              onClick={handleCopy}
              className={`opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 transition-all rounded cursor-pointer ${
                isAssistant
                  ? "hover:text-foreground hover:bg-muted/60 text-muted-foreground/80"
                  : "hover:text-primary-foreground hover:bg-white/20 text-primary-foreground/80"
              }`}
              title={copied ? "Copied to clipboard!" : "Copy message"}
              aria-label="Copy message"
            >
              {copied ? (
                <Check className={`w-3.5 h-3.5 ${isAssistant ? "text-emerald-500 dark:text-emerald-400" : "text-emerald-200"}`} />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  if (prevProps.isStreaming !== nextProps.isStreaming) return false;
  if (prevProps.message.id !== nextProps.message.id) return false;
  if (prevProps.message.content !== nextProps.message.content) return false;
  if (prevProps.message.isError !== nextProps.message.isError) return false;
  if (prevProps.message.mapAction !== nextProps.message.mapAction) {
    if (JSON.stringify(prevProps.message.mapAction) !== JSON.stringify(nextProps.message.mapAction)) {
      return false;
    }
  }
  return true;
});


