"use client";

import { useState, useCallback } from "react";
import { ChatMessage, ChatRequestSchema } from "@/shared";

export interface UseAiAgentResult {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  sendMessage: (content: string, context?: string) => Promise<void>;
  clearMessages: () => void;
}

export function useAiAgent(initialMessages?: ChatMessage[]): UseAiAgentResult {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || []);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const sendMessage = useCallback(
    async (content: string, context?: string) => {
      if (!content.trim() || isStreaming) return;

      const userMessage: ChatMessage = { role: "user", content: content.trim() };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsStreaming(true);
      setError(null);

      // Create placeholder assistant response
      const assistantMessage: ChatMessage = { role: "assistant", content: "" };
      setMessages([...updatedMessages, assistantMessage]);

      try {
        const payload = ChatRequestSchema.parse({
          messages: updatedMessages,
          context,
          stream: true,
        });

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          throw new Error(`Chat API responded with status ${res.status}`);
        }

        if (res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let accumulated = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            accumulated += chunk;

            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (last && last.role === "assistant") {
                copy[copy.length - 1] = { ...last, content: accumulated };
              }
              return copy;
            });
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "AI agent execution error";
        setError(message);
        setMessages((prev) => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          if (last && last.role === "assistant" && !last.content) {
            copy[copy.length - 1] = {
              ...last,
              content: `⚠️ Error executing command: ${message}`,
            };
          }
          return copy;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming]
  );

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearMessages,
  };
}
