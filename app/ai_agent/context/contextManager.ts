import { ChatMessage } from "@/shared";

export class ContextManager {
  private maxTokens: number;

  constructor(maxTokens = 4096) {
    this.maxTokens = maxTokens;
  }

  /**
   * Approximate tokens based on characters (avg 4 chars per token)
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Trims message history to fit within context budget while preserving system message
   */
  pruneHistory(messages: ChatMessage[], budget = this.maxTokens - 800): ChatMessage[] {
    const systemMsg = messages.find((m) => m.role === "system");
    const nonSystem = messages.filter((m) => m.role !== "system");

    let totalTokens = systemMsg ? this.estimateTokens(systemMsg.content) : 0;
    const keptMessages: ChatMessage[] = [];

    // Traverse from newest to oldest
    for (let i = nonSystem.length - 1; i >= 0; i--) {
      const msg = nonSystem[i];
      const tokens = this.estimateTokens(msg.content);
      if (totalTokens + tokens > budget) {
        break;
      }
      totalTokens += tokens;
      keptMessages.unshift(msg);
    }

    return systemMsg ? [systemMsg, ...keptMessages] : keptMessages;
  }
}

export const globalContextManager = new ContextManager();
