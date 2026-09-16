"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageItem } from "./ChatMessageItem";
import { ChatPromptSuggestions } from "./ChatPromptSuggestions";
import { ChatInputArea } from "./ChatInputArea";
import {
  DashboardChatMessage,
  ModelStatus,
  AIAssistantProps,
} from "./schemas";
import { MapAction } from "@/components/dashboard/data";

const DEFAULT_GREETING: DashboardChatMessage = {
  id: "greeting",
  role: "assistant",
  content:
    "Neural City SCADA Agent online. Connected to Tallinn Central Command Center. All telemetry pipelines active. How can I assist?",
  ts: "08:47:00",
};

export function AIAssistant({
  isOpen,
  onClose,
  context,
  onClearContext,
  onMapAction,
}: AIAssistantProps & { onMapAction?: (action: MapAction) => void }) {
  const [messages, setMessages] = useState<DashboardChatMessage[]>([DEFAULT_GREETING]);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
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

      if (res.body) {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMsgId ? { ...msg, content: accumulated } : msg
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
    <aside className="fixed top-0 right-0 z-40 w-[440px] h-screen bg-card/95 backdrop-blur-md border-l border-border/60 flex flex-col shadow-2xl transition-all duration-300">
      <ChatHeader
        modelStatus={modelStatus}
        onReset={handleReset}
        onClose={onClose}
        isStreaming={isStreaming}
      />

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
    </aside>
  );
}

export default AIAssistant;
