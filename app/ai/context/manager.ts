import { AiConfig, ChatMessage } from "../types";

export class ContextManager {
  private config: AiConfig;

  constructor(config: AiConfig) {
    this.config = config;
  }

  /**
   * Estimate token count (rough heuristic: ~4 characters per token)
   */
  estimateTokens(messages: ChatMessage[]): number {
    let charCount = 0;
    for (const msg of messages) {
      charCount += msg.content ? msg.content.length : 0;
    }
    return Math.ceil(charCount / 4);
  }

  /**
   * Check if token usage exceeds compression threshold
   */
  shouldCompress(messages: ChatMessage[]): boolean {
    if (!this.config.context.compression.enabled) return false;

    const estimatedTokens = this.estimateTokens(messages);
    const maxTokens = this.config.context.max_tokens;
    const thresholdPercentage = this.config.context.compression.trigger_at_percent;

    return estimatedTokens >= (maxTokens * thresholdPercentage) / 100;
  }

  /**
   * Compress old chat history if context is near capacity
   */
  compressContext(messages: ChatMessage[]): ChatMessage[] {
    if (!this.shouldCompress(messages)) return messages;

    const systemMsg = messages.find((m) => m.role === "system");
    const userMsgs = messages.filter((m) => m.role !== "system");

    // Summarize older messages into a single user/assistant summary message
    const oldMessages = userMsgs.slice(0, Math.max(1, userMsgs.length - 4));
    const recentMessages = userMsgs.slice(Math.max(1, userMsgs.length - 4));

    const summaryText = `[Compressed Context Summary of ${oldMessages.length} past messages: Discussion regarding Tallinn grid telemetry, active incidents, and operational decisions.]`;

    const compressed: ChatMessage[] = [];
    if (systemMsg) compressed.push(systemMsg);
    compressed.push({ role: "assistant", content: summaryText });
    compressed.push(...recentMessages);

    return compressed;
  }
}
