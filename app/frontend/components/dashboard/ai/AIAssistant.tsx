"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sparkles, ShieldAlert } from "lucide-react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageItem } from "./ChatMessageItem";
import { ChatPromptSuggestions } from "./ChatPromptSuggestions";
import { ChatInputArea } from "./ChatInputArea";
import { RealTimeAnalysisPanel } from "./RealTimeAnalysisPanel";
import {
  DashboardChatMessage,
  ModelStatus,
  AIAssistantProps,
} from "./schemas";
import { MapAction } from "@/components/dashboard/data";
import type { NepalTimelineEvent } from "@/frontend/data/nepalIncidentData";
import type { Incident } from "@/shared";

const DEFAULT_GREETING: DashboardChatMessage = {
  id: "greeting",
  role: "assistant",
  content:
    "Neural City SCADA Agent online. Connected to Tallinn Central Command Center. All telemetry pipelines active. How can I assist?",
  ts: "08:47:00",
};

export interface ExtendedAIAssistantProps extends AIAssistantProps {
  onMapAction?: (action: MapAction) => void;
  activeTab?: string;
  activeNepalEvent?: NepalTimelineEvent | null;
  currentReplaySeconds?: number;
  onSeekReplay?: (seconds: number) => void;
  onSelectNepalEvent?: (event: NepalTimelineEvent) => void;
  selectedIncident?: Incident | null;
  defaultMode?: "chat" | "analysis";
  width?: number;
  onWidthChange?: (width: number) => void;
  isDragging?: boolean;
  onDraggingChange?: (isDragging: boolean) => void;
}

export function AIAssistant({
  isOpen,
  onClose,
  context,
  onClearContext,
  onMapAction,
  activeTab,
  activeNepalEvent,
  currentReplaySeconds,
  onSeekReplay,
  onSelectNepalEvent,
  selectedIncident,
  defaultMode,
  width: controlledWidth,
  onWidthChange,
  isDragging: controlledIsDragging,
  onDraggingChange,
}: ExtendedAIAssistantProps) {
  const [messages, setMessages] = useState<DashboardChatMessage[]>([DEFAULT_GREETING]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [mode, setMode] = useState<"chat" | "analysis">("chat");

  const DEFAULT_WIDTH = 446;
  const MIN_WIDTH = 446;
  const [internalWidth, setInternalWidth] = useState<number>(DEFAULT_WIDTH);
  const [internalIsDragging, setInternalIsDragging] = useState<boolean>(false);

  const width = controlledWidth !== undefined ? controlledWidth : internalWidth;
  const isDragging = controlledIsDragging !== undefined ? controlledIsDragging : internalIsDragging;

  const setWidth = (w: number) => {
    if (onWidthChange) onWidthChange(w);
    else setInternalWidth(w);
  };

  const setIsDragging = (d: boolean) => {
    if (onDraggingChange) onDraggingChange(d);
    else setInternalIsDragging(d);
  };

  // Restore saved width from localStorage if not controlled
  useEffect(() => {
    if (controlledWidth === undefined) {
      try {
        const savedWidth = localStorage.getItem("nc_copilot_drawer_width");
        if (savedWidth) {
          const parsed = parseInt(savedWidth, 10);
          if (!isNaN(parsed) && parsed >= MIN_WIDTH) {
            const maxWidth = Math.min(window.innerWidth - 40, 1400);
            setWidth(Math.min(parsed, maxWidth));
          }
        }
      } catch {}
    }
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const maxWidth = Math.min(window.innerWidth - 40, 1400);
    const newWidth = Math.max(MIN_WIDTH, Math.min(maxWidth, window.innerWidth - e.clientX));
    setWidth(newWidth);
    window.dispatchEvent(new Event("resize"));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {}
      try {
        localStorage.setItem("nc_copilot_drawer_width", width.toString());
      } catch {}
      window.dispatchEvent(new Event("resize"));
    }
  };

  const handleDoubleClickReset = () => {
    setWidth(DEFAULT_WIDTH);
    try {
      localStorage.setItem("nc_copilot_drawer_width", DEFAULT_WIDTH.toString());
    } catch {}
    setTimeout(() => window.dispatchEvent(new Event("resize")), 220);
  };

  useEffect(() => {
    if (defaultMode) {
      setMode(defaultMode);
    }
  }, [defaultMode, isOpen]);
  const [modelStatus, setModelStatus] = useState<ModelStatus>({
    status: "online",
    activeModel: "qwen2.5:latest",
    models: ["qwen2.5:latest"],
    provider: "Neural City Harness",
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message or chunk
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  // Load model health status
  useEffect(() => {
    fetch("/api/chat")
      .then((res) => res.json())
      .then((data: ModelStatus) => {
        if (data.status) {
          setModelStatus(data);
        }
      })
      .catch(() => {
        setModelStatus((prev) => ({ ...prev, status: "degraded" }));
      });
  }, []);

  const handleSendMessage = async (text: string) => {
    if (isStreaming) return;

    const userMsg: DashboardChatMessage = {
      id: `usr_${Date.now()}`,
      role: "user",
      content: text,
      ts: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsStreaming(true);

    const assistantMsgId = `ast_${Date.now()}`;
    const placeholderMsg: DashboardChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      ts: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages([...newMessages, placeholderMsg]);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          context: context || undefined,
          stream: true,
        }),
        signal: abortController.signal,
      });

      if (!res.ok) throw new Error(`HTTP error ${res.status}`);

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        const textContent =
          typeof data === "object" && data !== null && "content" in data
            ? String(data.content)
            : JSON.stringify(data);
        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantMsgId ? { ...msg, content: textContent } : msg))
        );
        return;
      }

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });

          let displayContent = accumulated;
          if (accumulated.trim().startsWith("{")) {
            try {
              const parsed = JSON.parse(accumulated.trim());
              if (parsed && typeof parsed.content === "string") {
                displayContent = parsed.content;
              }
            } catch {
              // Ignore partial JSON parsing errors while streaming
            }
          }

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, content: displayContent } : msg
            )
          );
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: "⚠️ Command failed to execute or LLM service timed out.",
                  isError: true,
                }
              : msg
          )
        );
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  };

  const handleReset = () => {
    handleStopStreaming();
    setMessages([DEFAULT_GREETING]);
    if (onClearContext) onClearContext();
  };

  if (!isOpen) return null;

  return (
    <aside
      style={{ width: `${width}px` }}
      className={`fixed top-0 right-0 z-40 max-w-[calc(100vw-32px)] h-screen bg-card/95 backdrop-blur-md border-l border-border/60 flex flex-col shadow-2xl ${
        isDragging ? "select-none" : "transition-[width] duration-150 ease-out"
      }`}
    >
      {/* Draggable Resize Handle on Left Border */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClickReset}
        title="Drag left/right to resize • Double-click to reset"
        className="absolute top-0 bottom-0 -left-2 w-4 cursor-col-resize z-50 flex items-center justify-center group touch-none select-none"
      >
        {/* Active/Hover line glow */}
        <div
          className={`absolute inset-y-0 right-2 w-[2px] transition-colors duration-150 ${
            isDragging
              ? "bg-primary shadow-[0_0_10px_rgba(59,130,246,0.9)]"
              : "bg-transparent group-hover:bg-primary/70"
          }`}
        />

        {/* Grab Handle Pill Indicator */}
        <div
          className={`relative z-10 w-1.5 h-12 rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-150 ${
            isDragging
              ? "bg-primary shadow-[0_0_10px_rgba(59,130,246,0.9)] scale-110 opacity-100"
              : "bg-muted-foreground/30 group-hover:bg-primary/90 group-hover:scale-105 group-hover:opacity-100 opacity-60"
          }`}
        >
          <span className="w-0.5 h-0.5 rounded-full bg-background" />
          <span className="w-0.5 h-0.5 rounded-full bg-background" />
          <span className="w-0.5 h-0.5 rounded-full bg-background" />
        </div>

        {/* Live Width Badge when dragging */}
        {isDragging && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-popover/95 border border-primary/50 text-primary text-[10px] font-mono px-2 py-0.5 rounded-md shadow-xl backdrop-blur pointer-events-none whitespace-nowrap animate-in fade-in">
            {Math.round(width)}px
          </div>
        )}
      </div>

      <ChatHeader
        modelStatus={modelStatus}
        onReset={handleReset}
        onClose={onClose}
        isStreaming={isStreaming}
      />

      {/* Copilot Option Switcher: Chat vs Real time analysis */}
      <div className="flex items-center px-4 py-2 border-b border-border/60 bg-muted/30 gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setMode("chat")}
          className={`flex-1 py-1.5 px-3 rounded-md font-mono text-xs flex items-center justify-center gap-1.5 transition-all ${
            mode === "chat"
              ? "bg-primary text-primary-foreground font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Copilot Chat</span>
        </button>
        <button
          type="button"
          onClick={() => setMode("analysis")}
          className={`flex-1 py-1.5 px-3 rounded-md font-mono text-xs flex items-center justify-center gap-1.5 transition-all ${
            mode === "analysis"
              ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
          <span>Real time analysis</span>
        </button>
      </div>

      {mode === "analysis" ? (
        <RealTimeAnalysisPanel
          activeTab={activeTab}
          activeNepalEvent={activeNepalEvent}
          currentReplaySeconds={currentReplaySeconds}
          onSeekReplay={onSeekReplay}
          onSelectNepalEvent={onSelectNepalEvent}
          selectedIncident={selectedIncident}
        />
      ) : (
        <>
          <ChatPromptSuggestions
            onSelectPrompt={handleSendMessage}
            disabled={isStreaming}
          />

          <div ref={scrollAreaRef} className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <ChatMessageItem key={msg.id} message={msg} />
            ))}
          </div>

          <ChatInputArea
            onSendMessage={handleSendMessage}
            onStopStreaming={handleStopStreaming}
            isStreaming={isStreaming}
            context={context}
            onClearContext={onClearContext}
          />
        </>
      )}
    </aside>
  );
}

export default AIAssistant;
