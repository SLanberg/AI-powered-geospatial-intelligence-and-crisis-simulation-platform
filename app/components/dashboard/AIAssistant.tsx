"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  Send,
  X,
  Bot,
  CornerDownLeft,
  Loader2,
  Square,
  RotateCcw,
  Cpu,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts?: string;
  isError?: boolean;
  model?: string;
}

interface ModelStatus {
  status: "checking" | "online" | "offline" | "degraded";
  activeModel: string;
  models: string[];
  provider: string;
  error?: string;
}

const INITIAL_CHAT: ChatMessage[] = [
  {
    id: "i1",
    role: "assistant",
    content:
      "Neural City Grid AI online (powered by local Ollama model). I have real-time situational awareness of the Tallinn electrical grid.\n\nAsk me about grid status, active incident cascades, load rebalancing, frequency deviations, or request a threat assessment.",
    ts: "08:47:00",
  },
];

function now() {
  return new Date().toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
      return (
        <strong key={i} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      return (
        <code
          key={i}
          className="px-1 py-0.5 rounded bg-background/60 border border-border font-mono text-[11px] text-primary"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function MessageContent({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-1 text-[12.5px] leading-relaxed">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lineIdx} className="h-1.5" />;
        }

        if (trimmed.startsWith("### ")) {
          return (
            <div key={lineIdx} className="font-bold text-foreground pt-1 text-[13px]">
              {renderInline(trimmed.slice(4))}
            </div>
          );
        }
        if (trimmed.startsWith("## ")) {
          return (
            <div key={lineIdx} className="font-bold text-foreground pt-1.5 text-[13.5px]">
              {renderInline(trimmed.slice(3))}
            </div>
          );
        }

        const bulletMatch = trimmed.match(/^([•\-\*])\s+(.+)$/);
        if (bulletMatch) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1">
              <span className="text-primary select-none mt-0.5 font-bold">•</span>
              <span className="flex-1">{renderInline(bulletMatch[2])}</span>
            </div>
          );
        }

        const numberedMatch = trimmed.match(/^(\d+[\.\)])\s+(.+)$/);
        if (numberedMatch) {
          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1">
              <span className="text-primary font-mono text-[11px] select-none mt-0.5 font-semibold">
                {numberedMatch[1]}
              </span>
              <span className="flex-1">{renderInline(numberedMatch[2])}</span>
            </div>
          );
        }

        return <div key={lineIdx}>{renderInline(line)}</div>;
      })}
    </div>
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [modelStatus, setModelStatus] = useState<ModelStatus>({
    status: "checking",
    activeModel: "qwen2.5:7b",
    models: [],
    provider: "Ollama (Local)",
  });
  const [selectedModel, setSelectedModel] = useState<string>("qwen2.5:7b");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const idCounterRef = useRef(2);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check local model availability on mount or when assistant opens
  const checkModelStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/chat", { method: "GET" });
      if (res.ok) {
        const data = (await res.json()) as ModelStatus;
        setModelStatus(data);
        if (data.activeModel) {
          setSelectedModel(data.activeModel);
        }
      } else {
        setModelStatus((prev) => ({
          ...prev,
          status: "offline",
          error: "Ollama service responded with error",
        }));
      }
    } catch {
      setModelStatus((prev) => ({
        ...prev,
        status: "offline",
        error: "Cannot connect to local Ollama service",
      }));
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      checkModelStatus();
    }
  }, [isOpen, checkModelStatus]);

  // Handle incoming live feed context
  useEffect(() => {
    if (!context || !isOpen) return;

    const prompt = `Analyze the live telemetry feed context and recommend the next action plan.\n\nContext:\n${context}`;
    setChatInput(prompt);
  }, [context, isOpen]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: isStreaming ? "auto" : "smooth" });
    }
  }, [chatMessages, isOpen, isStreaming]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  const handleClear = () => {
    handleStop();
    setChatMessages(INITIAL_CHAT);
    if (onClearContext) onClearContext();
  };

  const sendMessage = async (overridePrompt?: string) => {
    const textToSend = (overridePrompt ?? chatInput).trim();
    if (!textToSend || isStreaming) return;

    const userMsgId = `u-${idCounterRef.current++}`;
    const assistantMsgId = `a-${idCounterRef.current++}`;

    const userMsg: ChatMessage = {
      id: userMsgId,
      role: "user",
      content: textToSend,
      ts: now(),
    };

    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    if (!overridePrompt) {
      setChatInput("");
    }
    setIsStreaming(true);

    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      ts: now(),
      model: selectedModel,
    };
    setChatMessages([...newMessages, assistantMsg]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Build conversation payload for local model
      const historyPayload = newMessages
        .filter((m) => !m.isError)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyPayload,
          model: selectedModel,
          context: context || undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        let errMessage = `Error ${res.status}: Failed to reach local AI model.`;
        try {
          const errData = (await res.json()) as { error?: string };
          if (errData.error) errMessage = errData.error;
        } catch {
          // ignore
        }
        throw new Error(errMessage);
      }

      const contentType = res.headers.get("content-type") || "";

      // Stream text response
      if (res.body && (contentType.includes("text/plain") || !contentType.includes("application/json"))) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;

          setChatMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, content: accumulated } : msg
            )
          );
        }
      } else {
        // Fallback non-streaming JSON
        const data = (await res.json()) as { content?: string; model?: string };
        const reply = data.content || "No response received from local AI model.";
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: reply, model: data.model ?? selectedModel }
              : msg
          )
        );
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId && !msg.content
              ? { ...msg, content: "Generation stopped by user." }
              : msg
          )
        );
      } else {
        const message = err instanceof Error ? err.message : "Error generating AI response";
        setChatMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? {
                  ...msg,
                  content: `⚠️ ${message}\n\nMake sure Ollama is running locally with \`ollama run ${selectedModel}\`.`,
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

  const handleQuickPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <>
      {/* Full-height side panel from right */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-[440px] max-w-[calc(100vw-1rem)] flex flex-col bg-card border-l border-border shadow-2xl transition-transform duration-300 ease-in-out ${
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
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-card-foreground font-sans tracking-wide">
                  AI Assistant
                </span>

                {/* Local Model Status Pill */}
                {modelStatus.status === "online" ? (
                  <div
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                    title={`Connected to Ollama local instance (${modelStatus.activeModel})`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Local · {selectedModel}</span>
                  </div>
                ) : modelStatus.status === "checking" ? (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    <span>Detecting local AI</span>
                  </div>
                ) : (
                  <button
                    onClick={checkModelStatus}
                    className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all"
                    title="Ollama is offline. Click to recheck."
                  >
                    <AlertTriangle className="w-2.5 h-2.5" />
                    <span>Ollama Offline · Recheck</span>
                  </button>
                )}
              </div>

              <div className="text-[10px] font-mono text-muted-foreground mt-0.5 flex items-center gap-1.5">
                <span>Tallinn SCADA Operations</span>
                {modelStatus.models.length > 1 && (
                  <>
                    <span>·</span>
                    <select
                      value={selectedModel}
                      onChange={(e) => setSelectedModel(e.target.value)}
                      className="bg-muted border border-border rounded px-1 py-0 text-[10px] font-mono text-foreground focus:outline-none"
                    >
                      {modelStatus.models.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleClear}
              className="text-muted-foreground hover:text-card-foreground hover:bg-muted transition-all rounded-md p-1.5"
              title="Reset conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-card-foreground hover:bg-muted transition-all rounded-md p-1.5"
              title="Close (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Context Banner */}
        {context && (
          <div className="border-b border-primary/20 bg-primary/5 px-5 py-2.5 shrink-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[9px] font-mono uppercase tracking-[0.18em] text-primary">
                  <Sparkles className="h-3 w-3" />
                  Telemetry Feed Context Attached
                </div>
                <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground font-mono line-clamp-2">
                  {context.split("\n").slice(0, 2).join(" · ")}
                </div>
              </div>

              {onClearContext && (
                <button
                  type="button"
                  onClick={onClearContext}
                  className="text-[10px] font-mono text-muted-foreground hover:text-foreground underline underline-offset-2"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick prompts bar */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-border bg-muted/40 shrink-0 flex-wrap">
          <span className="text-[10px] font-mono text-muted-foreground mr-1">Quick:</span>
          {["status", "frequency", "incident", "cluster", "threat", "help"].map((p) => (
            <button
              key={p}
              disabled={isStreaming}
              onClick={() => handleQuickPrompt(p)}
              className="text-[10px] font-mono px-2 py-0.5 rounded border border-border text-muted-foreground hover:text-primary hover:border-primary/60 hover:bg-primary/10 transition-all disabled:opacity-40"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {chatMessages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {/* Avatar */}
              <div className="shrink-0 mt-0.5">
                {msg.role === "assistant" ? (
                  <div
                    className={`h-6 w-6 rounded-md flex items-center justify-center ${
                      msg.isError
                        ? "bg-rose-500/15 border border-rose-500/30 text-rose-400"
                        : "bg-primary/15 border border-primary/30 text-primary"
                    }`}
                  >
                    {msg.isError ? <AlertTriangle className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
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
                  className={`px-3.5 py-2.5 rounded-xl ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : msg.isError
                      ? "bg-rose-500/10 border border-rose-500/30 text-rose-200 rounded-tl-sm"
                      : "bg-muted border border-border text-foreground rounded-tl-sm"
                  }`}
                >
                  {msg.content ? (
                    <MessageContent content={msg.content} />
                  ) : (
                    <div className="flex items-center gap-1.5 py-1 text-muted-foreground text-xs font-mono">
                      <Loader2 className="w-3 h-3 animate-spin text-primary" />
                      <span>Thinking with {selectedModel}...</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 px-1 text-[9px] font-mono text-muted-foreground/70">
                  {msg.role === "assistant" && !msg.isError && (
                    <span className="flex items-center gap-1 text-[8.5px] text-muted-foreground/60">
                      <Cpu className="w-2.5 h-2.5" />
                      {msg.model || selectedModel}
                    </span>
                  )}
                  {msg.ts && <span>{msg.ts}</span>}
                  {msg.isError && (
                    <button
                      onClick={() => sendMessage(chatMessages[chatMessages.length - 2]?.content)}
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Retry
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

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
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={
                modelStatus.status === "online"
                  ? `Ask ${selectedModel} about grid status, anomalies...`
                  : "Type a prompt for local AI..."
              }
              className="flex-1 bg-transparent text-[12.5px] text-foreground placeholder-muted-foreground outline-none font-mono"
            />
            <div className="flex items-center gap-2 shrink-0">
              <span className="hidden sm:flex items-center gap-1 text-[9px] font-mono text-muted-foreground border border-border rounded px-1.5 py-0.5">
                <CornerDownLeft className="w-2.5 h-2.5" />
                Enter
              </span>

              {isStreaming ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/40 p-1.5 rounded-lg transition-all"
                  title="Stop generating"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button
                  id="ai-assistant-send"
                  type="button"
                  onClick={() => sendMessage()}
                  disabled={!chatInput.trim()}
                  className="text-muted-foreground hover:text-primary disabled:opacity-40 transition-colors p-1 rounded-md"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-[9px] font-mono text-muted-foreground/60 px-1">
            <span>Model: {selectedModel} (Ollama Local)</span>
            <span>Zero cloud telemetry egress</span>
          </div>
        </div>
      </div>
    </>
  );
}
