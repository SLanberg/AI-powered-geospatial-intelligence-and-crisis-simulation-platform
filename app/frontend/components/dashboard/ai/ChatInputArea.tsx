"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Square, CornerDownLeft, Loader2 } from "lucide-react";

export interface ChatInputAreaProps {
  onSendMessage: (text: string) => void;
  onStopStreaming?: () => void;
  isStreaming: boolean;
  context?: string | null;
  onClearContext?: () => void;
}

export function ChatInputArea({
  onSendMessage,
  onStopStreaming,
  isStreaming,
  context,
  onClearContext,
}: ChatInputAreaProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="p-3 border-t border-border/40 bg-background/95 backdrop-blur shrink-0">
      {context && (
        <div className="mb-2 flex items-center justify-between px-2 py-1.5 rounded bg-primary/10 border border-primary/20 text-[11px] text-primary">
          <span className="truncate max-w-[85%]">Context: {context}</span>
          {onClearContext && (
            <button
              onClick={onClearContext}
              className="text-primary hover:underline ml-2 text-[10px]"
            >
              Clear
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask Cassandra AI Agent or dispatch tactical commands..."
          rows={1}
          disabled={isStreaming}
          className="w-full resize-none rounded-md bg-card border border-border/60 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50 min-h-[38px] max-h-[120px]"
        />

        {isStreaming ? (
          <button
            type="button"
            onClick={onStopStreaming}
            className="h-[38px] px-3 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors flex items-center justify-center shrink-0"
            title="Stop generation"
          >
            <Square className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="h-[38px] px-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center shrink-0"
            title="Send command"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        )}
      </form>
    </div>
  );
}
