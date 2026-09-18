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
import { TALLINN_EMERGENCY_SERVICES } from "../emergencyServicesData";
import { TALLINN_TRANSPORT_HUBS } from "../transportHubsData";
import { DISTRICT_CENTERS } from "../districtBoundaries";

export function resolveClientMapAction(text: string): MapAction | null {
  const clean = text.trim().toLowerCase();

  // 1. Direct coordinates pattern: "59.4132, 24.8326"
  const coordMatch = clean.match(/^([-+]?\d{1,2}\.\d+)[,\s]+([-+]?\d{1,3}\.\d+)$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (!isNaN(lat) && !isNaN(lng)) {
      return {
        type: "fly_to",
        center: { lat, lng, zoom: 16 },
        title: `Coordinates (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      };
    }
  }

  // Check for explicit navigation intent (do NOT trigger on general informational questions or unrelated topics)
  const navIntentRegex =
    /^(fly(\s+me)?\s+to|navigate(\s+to|\s+the\s+map\s+to)?|move(\s+the)?\s+map\s+to|take\s+me\s+to|go\s+to|center\s+on|zoom\s+(in\s+on|to)|focus(\s+on|\s+map\s+on)?|where\s+is\s+the|where\s+is)\b/i;
  const onMapIntentRegex =
    /\b(show|locate|pinpoint|display|find)\b.*\b(on\s+(the\s+)?map|on\s+gis|where\s+(it|this)\s+is)\b/i;

  const hasNavIntent = navIntentRegex.test(clean) || onMapIntentRegex.test(clean);
  if (!hasNavIntent) {
    return null;
  }

  // Strip command prefix to isolate the place name
  const stripped = clean
    .replace(
      /^(fly(\s+me)?\s+to|navigate(\s+to|\s+the\s+map\s+to)?|move(\s+the)?\s+map\s+to|take\s+me\s+to|go\s+to|center\s+on|zoom\s+(in\s+on|to)|focus(\s+on|\s+map\s+on)?|where\s+is\s+the|where\s+is)\s+/i,
      ""
    )
    .replace(/\s+(on\s+(the\s+)?map|on\s+gis|where\s+(it|this)\s+is)$/i, "")
    .trim();

  // 2. High-priority Transport Hubs & Airport alias matching (e.g. "TLL", "airport", "lennujaam", "balti jaam")
  const isAirportQuery =
    /\b(tll|airport|tallinn airport|lennart meri|lennujaam|lennujaama|tallinna lennujaam)\b/i.test(stripped);
  if (isAirportQuery) {
    const airport = TALLINN_TRANSPORT_HUBS.find((h) => h.id === "hub-tll-airport");
    if (airport) {
      return {
        type: "fly_to",
        center: { lat: airport.lat, lng: airport.lng, zoom: 16 },
        title: "Tallinn Lennart Meri Airport (TLL)",
        address: airport.address,
        targetDistrictId: airport.district,
      };
    }
  }

  for (const hub of TALLINN_TRANSPORT_HUBS) {
    const hubName = hub.name.toLowerCase();
    const hubShort = hub.shortName.toLowerCase();
    const hubEn = (hub.nameEn || "").toLowerCase();
    const hubAddr = (hub.address || "").toLowerCase();

    if (
      stripped.includes(hubShort) ||
      stripped.includes(hubName) ||
      (hubEn && stripped.includes(hubEn)) ||
      (stripped.length > 4 && (hubName + " " + hubAddr).includes(stripped))
    ) {
      return {
        type: "fly_to",
        center: { lat: hub.lat, lng: hub.lng, zoom: 16 },
        title: hub.name,
        address: hub.address,
        targetDistrictId: hub.district,
      };
    }
  }

  // 3. Official Emergency GIS Services (Hospitals, rescue stations, gas stations)
  const searchTerms = stripped
    .split(/\s+/)
    .filter((w) => w.length > 2);

  let bestFacility: (typeof TALLINN_EMERGENCY_SERVICES)[0] | null = null;
  let maxScore = 0;

  for (const fac of TALLINN_EMERGENCY_SERVICES) {
    const facName = fac.name.toLowerCase();
    const facAddr = (fac.address || "").toLowerCase();

    if (facName.includes(stripped) || (stripped.length > 5 && (facName + " " + facAddr).includes(stripped))) {
      return {
        type: "fly_to",
        center: { lat: fac.lat, lng: fac.lng, zoom: 16 },
        title: fac.name,
        address: fac.address,
        targetDistrictId: fac.district,
      };
    }

    let score = 0;
    for (const term of searchTerms) {
      if (facName.includes(term)) score += 3;
      if (facAddr.includes(term)) score += 2;
    }
    if (score > maxScore) {
      maxScore = score;
      bestFacility = fac;
    }
  }

  if (bestFacility && maxScore >= 4) {
    return {
      type: "fly_to",
      center: { lat: bestFacility.lat, lng: bestFacility.lng, zoom: 16 },
      title: bestFacility.name,
      address: bestFacility.address,
      targetDistrictId: bestFacility.district,
    };
  }

  // 4. District centers
  for (const [key, center] of Object.entries(DISTRICT_CENTERS)) {
    const normKey = key.replace(/-/g, " ");
    const keyRegex = new RegExp(`\\b${normKey}\\b`, "i");
    const nameRegex = new RegExp(`\\b${center.name.toLowerCase().replace(/[\/\-_]/g, "\\s*")}\\b`, "i");

    const districtTerms = center.name
      .toLowerCase()
      .split(/[\s/]+/)
      .filter((w) => w.length > 3 && w !== "district" && w !== "sector");

    const matchesToken = districtTerms.some((term) => new RegExp(`\\b${term}\\b`, "i").test(stripped));

    if (keyRegex.test(stripped) || nameRegex.test(stripped) || matchesToken) {
      return {
        type: "focus_district",
        targetDistrictId: key,
        center: { lat: center.lat, lng: center.lng, zoom: 13.5 },
        title: `District Sector: ${center.name}`,
      };
    }
  }

  return null;
}

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

    // Direct client-side spatial resolution for instant zero-latency map flights
    let clientAction = resolveClientMapAction(text);
    if (!clientAction) {
      const lower = text.trim().toLowerCase();
      // If user specifically said "fly there", "take me there", "move map there", "show it on map"
      if (/^(fly|navigate|move\s+(the\s+)?map|take\s+me)\s+(there|to\s+it)\b/i.test(lower) || /^(show|locate)\s+(it|this)\s+on\s+(the\s+)?map\b/i.test(lower)) {
        for (let i = messages.length - 1; i >= 0; i--) {
          const pastAction = resolveClientMapAction(messages[i].content);
          if (pastAction) {
            clientAction = pastAction;
            break;
          }
        }
      }
    }

    if (clientAction && onMapAction) {
      onMapAction(clientAction);
    }

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
      mapAction: clientAction || undefined,
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

      if (!res.ok) {
        let errDetail = "Failed to communicate with AI model.";
        try {
          const errData = await res.json();
          if (errData?.error) errDetail = errData.error;
        } catch {}
        throw new Error(errDetail);
      }

      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const data = await res.json();
        if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
          throw new Error(data.error);
        }
        const textContent =
          typeof data === "object" && data !== null && "content" in data
            ? String(data.content)
            : JSON.stringify(data);
        const mapAct = data.mapAction || clientAction;
        if (mapAct && onMapAction) {
          onMapAction(mapAct);
        }
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: textContent, mapAction: mapAct }
              : msg
          )
        );
        return;
      }

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";
        let triggeredAction = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });

          let displayContent = accumulated;
          let activeMapAction = clientAction;

          // Check for embedded MAP_ACTION comment in stream
          const actionMatch = accumulated.match(/<!--\s*MAP_ACTION:\s*(\{.*?\})\s*-->/);
          if (actionMatch) {
            try {
              const parsed = JSON.parse(actionMatch[1]);
              activeMapAction = parsed;
              if (!triggeredAction && onMapAction) {
                onMapAction(parsed);
                triggeredAction = true;
              }
            } catch {}
          }

          if (accumulated.trim().startsWith("{")) {
            try {
              const parsed = JSON.parse(accumulated.trim());
              if (parsed && typeof parsed.error === "string") {
                throw new Error(parsed.error);
              }
              if (parsed && typeof parsed.content === "string") {
                displayContent = parsed.content;
                if (parsed.mapAction) {
                  activeMapAction = parsed.mapAction;
                  if (!triggeredAction && onMapAction) {
                    onMapAction(parsed.mapAction);
                    triggeredAction = true;
                  }
                }
              }
            } catch (jsonErr) {
              if (jsonErr instanceof Error && jsonErr.message && !jsonErr.message.includes("JSON")) {
                throw jsonErr;
              }
            }
          }

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId
                ? { ...msg, content: displayContent, mapAction: activeMapAction || msg.mapAction }
                : msg
            )
          );
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        const errorMsg = (err as Error).message || "An error occurred while generating the response.";
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: errorMsg,
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

  const handleRetry = (failedMsgId?: string) => {
    if (isStreaming) return;

    let userPromptToRetry = "";
    if (failedMsgId) {
      const idx = messages.findIndex((m) => m.id === failedMsgId);
      if (idx > 0) {
        for (let i = idx - 1; i >= 0; i--) {
          if (messages[i].role === "user") {
            userPromptToRetry = messages[i].content;
            setMessages(messages.slice(0, i));
            break;
          }
        }
      }
    }

    if (!userPromptToRetry) {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "user") {
          userPromptToRetry = messages[i].content;
          setMessages(messages.slice(0, i));
          break;
        }
      }
    }

    if (userPromptToRetry) {
      handleSendMessage(userPromptToRetry);
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
        {/* Active/Hover line */}
        <div
          className={`absolute inset-y-0 right-2 w-[2px] transition-colors duration-150 ${
            isDragging
              ? "bg-primary"
              : "bg-transparent group-hover:bg-primary/70"
          }`}
        />

        {/* Grab Handle Pill Indicator */}
        <div
          className={`relative z-10 w-1.5 h-12 rounded-full flex flex-col items-center justify-center gap-1 transition-all duration-150 ${
            isDragging
              ? "bg-primary scale-110 opacity-100 shadow-md"
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
          <div ref={scrollAreaRef} className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <React.Fragment key={msg.id}>
                <ChatMessageItem
                  message={msg}
                  onMapAction={onMapAction}
                  isStreaming={isStreaming && index === messages.length - 1}
                  onRetry={handleRetry}
                  onNewChat={handleReset}
                />
                {index === 0 && messages.length === 1 && !isStreaming && (
                  <ChatPromptSuggestions
                    onSelectPrompt={handleSendMessage}
                    disabled={isStreaming}
                  />
                )}
              </React.Fragment>
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
