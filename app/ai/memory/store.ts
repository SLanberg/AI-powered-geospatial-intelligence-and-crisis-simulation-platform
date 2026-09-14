import { AiConfig, ChatMessage } from "../types";

export class MemoryStore {
  private config: AiConfig;

  constructor(config: AiConfig) {
    this.config = config;
  }

  /**
   * Trims conversation messages to fit memory.conversation.max_messages & token caps
   */
  trimConversation(messages: ChatMessage[]): ChatMessage[] {
    if (!this.config.memory.enabled || !this.config.memory.conversation.enabled) {
      return messages;
    }

    const maxMessages = this.config.memory.conversation.max_messages;
    if (messages.length > maxMessages) {
      // Retain system messages (if any) and slice the most recent N messages
      const systemMsgs = messages.filter((m) => m.role === "system");
      const nonSystemMsgs = messages.filter((m) => m.role !== "system");
      const recent = nonSystemMsgs.slice(-maxMessages);
      return [...systemMsgs, ...recent];
    }

    return messages;
  }

  /**
   * Stub for retrieving long-term semantic memory entries
   */
  async getLongTermContext(query: string): Promise<string[]> {
    if (!this.config.memory.enabled || !this.config.memory.long_term.enabled) {
      return [];
    }

    // In a full implementation, query vector_db collection `agent_memory`
    return [`[Memory] User previously requested focus on Tallinn grid sector Vanalinn.`];
  }
}
