"use client";

import React, { useState } from "react";
import { Bot, Copy, Check, User } from "lucide-react";
import { DashboardChatMessage } from "./schemas";
import { MarkdownRenderer } from "./MarkdownRenderer";

export interface ChatMessageItemProps {
  message: DashboardChatMessage;
}

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === "assistant";

  const getDisplayContent = (content: string) => {
    if (!content) return "";
    const trimmed = content.trim();
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
    return content;
  };

  const textToRender = getDisplayContent(message.content);

  const handleCopy = () => {
    navigator.clipboard.writeText(textToRender);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        } ${message.isError ? "border-destructive/50 bg-destructive/10 text-destructive" : ""}`}
      >
        <MarkdownRenderer content={textToRender} isUser={!isAssistant} />

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
      </div>
    </div>
  );
}

