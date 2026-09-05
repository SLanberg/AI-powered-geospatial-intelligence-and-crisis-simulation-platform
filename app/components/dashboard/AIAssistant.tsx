"use client";

import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, Bot, CornerDownLeft, Loader2 } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts?: string;
}

const INITIAL_CHAT: ChatMessage[] = [
  {
    id: "i1",
    role: "assistant",
    content:
      "Neural City Grid AI online. I have full situational awareness of the Tallinn electrical grid. Ask me about grid status, active incidents, anomaly clusters, frequency deviations, or request a threat assessment.",
    ts: "08:47:00",
  },
];

const AI_RESPONSES: Record<string, string> = {
  status:
    "**Grid Status: CRITICAL**\n\nFrequency: 49.92 Hz (−0.08 Hz deviation)\nTransmission Loss: 0.04%\nActive Nodes: 1,420 / 1,424\nTIER-1 protocol engaged since 08:47.\n\nRecommend immediate load rebalancing across Kristiine and Mustamäe districts.",
  frequency:
    "**Frequency Deviation Detected**\n\nCurrent: 49.92 Hz — nominal is 50.00 Hz.\nDelta: −0.08 Hz (threshold: −0.05 Hz)\n\nRoot cause: cascade failure initiated at Vanalinn substation nodes at 08:47. Backup oscillators partially compensating. Manual intervention advised.",
  incident:
    "**6 Active Anomalies**\n\n• TLN-2847 — CRITICAL — Harju sector transformer surge\n• TLN-0391 — HIGH — Kristiine load spike +340%\n• TLN-1203 — HIGH — Mustamäe relay fault\n• TLN-0088 — MEDIUM — Pirita feeder voltage drop\n• TLN-2201 — LOW — Lasnamäe scheduled maintenance overlap\n• TLN-3301 — LOW — Põhja-Tallinn telemetry lag\n\nEmergency teams dispatched to Harju and Kristiine.",
  cluster:
    "**3 Anomaly Clusters Identified**\n\nCluster A (HIGH): 4 incidents within 0.8 km radius — transformer overload cascade in central Tallinn. Load redistribution critical.\n\nCluster B (MEDIUM): 2 incidents in northern corridor — relay desynchronization pattern.\n\nCluster C (LOW): 2 incidents — peripheral sensor anomalies, likely false positives.",
  threat:
    "**Threat Assessment**\n\nRisk Level: TIER-1 (Critical)\nEstimated grid stability: 6.2 minutes without intervention\n\nPrimary vector: Vanalinn–Harju cascade propagation\nSecondary risk: Mustamäe islanding if feeder TLN-1203 fails\n\nRecommended actions:\n1. Activate emergency backup at Ülemiste substation\n2. Shed non-critical load in Lasnamäe (est. 12 MW)\n3. Isolate TLN-2847 feeder\n4. Alert Estonian TSO (Elering) SCADA team",
  help: "Available queries:\n**status** — overall grid health\n**frequency** — freq deviation details\n**incident** — all active anomalies\n**cluster** — anomaly cluster analysis\n**threat** — threat assessment & recommendations",
  default:
    "Analyzing Tallinn grid telemetry... Based on current data patterns, I recommend activating backup nodes in Kristiine to compensate for load imbalance. Failover protocol is active. Elering SCADA has been notified.",
};

function getReply(input: string): string {
  const lower = input.toLowerCase();
  for (const key of Object.keys(AI_RESPONSES)) {
    if (lower.includes(key)) return AI_RESPONSES[key];
  }
  return AI_RESPONSES.default;
}

function now() {
  return new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

// Renders bold **text** in message content
function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="text-slate-200 font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  context?: string | null;
  onClearContext?: () => void;
}

export function AIAssistant({ isOpen, onClose, context, onClearContext }: AIAssistantProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(INITIAL_CHAT);
  const [chatInput, setChatInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const idCounterRef = useRef(1);

  useEffect(() => {
    if (!context || !isOpen) return;

    const prompt = `Analyze the live telemetry feed context and recommend the next action plan.\n\nContext:\n${context}`;
    setChatInput(prompt);
  }, [context, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 50);
    }
  }, [chatMessages, isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const sendMessage = () => {
    if (!chatInput.trim() || isTyping) return;
    const userMsg: ChatMessage = {
      id: `u-${idCounterRef.current++}`,
      role: "user",
      content: chatInput.trim(),
      ts: now(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput("");
    setIsTyping(true);
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `a-${idCounterRef.current++}`,
          role: "assistant",
          content: getReply(userMsg.content),
          ts: now(),
        },
      ]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <>
      {/* Full-height side panel from right */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-[420px] max-w-[calc(100vw-1rem)] flex flex-col bg-card border-l border-border shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <div className="flex items-center">
                <span className="text-sm font-semibold text-card-foreground font-sans tracking-wide">
                  AI Assistant
                </span>
              </div>
              <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                Neural City · Tallinn SCADA Integration
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-card-foreground hover:bg-muted transition-all rounded-md p-1.5"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {context && (
          <div className="border-b border-primary/20 bg-primary/5 px-5 py-2.5 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.18em] text-primary">
                  <Sparkles className="h-3 w-3" />
                  Feed context loaded
                </div>
                <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {context.split("\n").slice(0, 2).join(" · ")}
                </div>
              </div>

              {onClearContext && (
                <button
                  type="button"
                  onClick={onClearContext}
                  className="text-[10px] font-mono text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick prompts bar */}
        <div className="flex items-center gap-2 px-5 py-2.5 border-b border-border bg-muted/40 shrink-0 flex-wrap">
          <span className="text-[10px] font-mono text-muted-foreground mr-1">Quick:</span>
          {["status", "frequency", "incident", "cluster", "threat", "help"].map((p) => (
            <button
              key={p}
              onClick={() => {
                setChatInput(p);
                inputRef.current?.focus();
              }}
              className="text-[10px] font-mono px-2 py-0.5 rounded border border-border text-muted-foreground hover:text-primary hover:border-primary/60 hover:bg-primary/10 transition-all"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {chatMessages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {/* Avatar */}
              <div className="shrink-0 mt-0.5">
                {msg.role === "assistant" ? (
                  <div className="h-6 w-6 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-primary" />
                  </div>
                ) : (
                  <div className="h-6 w-6 rounded-md bg-muted border border-border flex items-center justify-center">
                    <Bot className="w-3 h-3 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Bubble */}
              <div className={`flex flex-col gap-1 max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`px-3.5 py-2.5 rounded-xl text-[12.5px] leading-relaxed whitespace-pre-line ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted border border-border text-foreground rounded-tl-sm"
                  }`}
                >
                  <MessageContent content={msg.content} />
                </div>
                {msg.ts && (
                  <span className="text-[9px] font-mono text-muted-foreground/70 px-1">{msg.ts}</span>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                <Loader2 className="w-3 h-3 text-primary animate-spin" />
              </div>
              <div className="bg-muted border border-border px-3.5 py-2.5 rounded-xl rounded-tl-sm">
                <div className="flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-border bg-card shrink-0">
          <div className="flex items-center gap-3 bg-muted/60 border border-border rounded-xl px-4 py-2.5 focus-within:border-primary/50 transition-all">
            <input
              ref={inputRef}
              id="ai-assistant-input"
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about grid status, incidents, frequency..."
              className="flex-1 bg-transparent text-[12.5px] text-foreground placeholder-muted-foreground outline-none font-mono"
            />
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:flex items-center gap-1 text-[9px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5">
                <CornerDownLeft className="w-2.5 h-2.5" />
                Enter
              </span>
              <button
                id="ai-assistant-send"
                onClick={sendMessage}
                disabled={!chatInput.trim() || isTyping}
                className="text-muted-foreground hover:text-primary disabled:opacity-40 transition-colors p-0.5"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
