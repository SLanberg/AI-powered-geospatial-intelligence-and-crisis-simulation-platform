"use client";

import React, { useState } from "react";
import { Bot, Copy, Check, Terminal } from "lucide-react";
import { DashboardChatMessage } from "./schemas";

export interface ChatMessageItemProps {
  message: DashboardChatMessage;
}

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === "assistant";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`group flex gap-3 text-xs leading-relaxed transition-opacity ${
        isAssistant ? "items-start" : "items-start justify-end"
      }`}
    >
      {isAssistant && (
        <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5">
          <Bot className="w-3.5 h-3.5" />
        </div>
      )}

      <div
        className={`relative max-w-[85%] rounded-lg px-3.5 py-2.5 ${
          isAssistant
            ? "bg-card border border-border/50 text-foreground"
            : "bg-primary text-primary-foreground font-medium"
        } ${message.isError ? "border-destructive/50 bg-destructive/10 text-destructive" : ""}`}
      >
        <div className="whitespace-pre-wrap font-sans text-xs">{message.content}</div>

        <div className="mt-1.5 flex items-center justify-between gap-4 text-[10px] text-muted-foreground/70 font-mono">
          <span>{message.ts || ""}</span>

          {isAssistant && (
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 p-1 hover:text-foreground transition-opacity"
              title="Copy message"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
