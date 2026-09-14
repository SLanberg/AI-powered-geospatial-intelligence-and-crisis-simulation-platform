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
   * Calculates maximum input tokens available given total model context window and reserved output tokens.
   */
  getMaxInputTokenLimit(): number {
    const totalContextWindow =
      this.config.model.max_context_tokens || this.config.context.max_tokens || 32000;
    const reservedOutput = this.config.model.max_output_tokens || 4096;
    return Math.max(1000, totalContextWindow - reservedOutput);
  }

  /**
   * Check if token usage exceeds compression threshold or context window limit
   */
  shouldCompress(messages: ChatMessage[]): boolean {
    const estimatedTokens = this.estimateTokens(messages);
    const inputLimit = this.getMaxInputTokenLimit();

    if (estimatedTokens >= inputLimit) {
      return true;
    }

    if (!this.config.context.compression.enabled) return false;

    const thresholdPercentage = this.config.context.compression.trigger_at_percent;
    return estimatedTokens >= (inputLimit * thresholdPercentage) / 100;
  }

  /**
   * Compress old chat history if context is near capacity or exceeds token budget
   */
  compressContext(messages: ChatMessage[]): ChatMessage[] {
    if (!this.shouldCompress(messages)) return messages;

    const systemMsg = messages.find((m) => m.role === "system");
    const userMsgs = messages.filter((m) => m.role !== "system");

    if (userMsgs.length <= 2) {
      // If history is small, truncate content strings if individual messages are huge
      return messages.map((m) => {
        if (m.role === "system") return m;
        if (m.content.length > 2000) {
          return { ...m, content: m.content.substring(0, 2000) + "... [truncated due to context limits]" };
        }
        return m;
      });
    }

    // Retain system prompt and most recent 2 user/assistant/tool messages, summarize older ones
    const oldMessages = userMsgs.slice(0, Math.max(1, userMsgs.length - 2));
    const recentMessages = userMsgs.slice(Math.max(1, userMsgs.length - 2));

    const summaryText = `[Compressed Context Summary of ${oldMessages.length} past messages: Discussion regarding Tallinn grid telemetry, active incidents, and operational decisions.]`;

    const compressed: ChatMessage[] = [];
    if (systemMsg) compressed.push(systemMsg);
    compressed.push({ role: "assistant", content: summaryText });
    compressed.push(...recentMessages);

    // If still over limit, truncate recent messages to strictly fit
    const inputLimit = this.getMaxInputTokenLimit();
    let currentTokens = this.estimateTokens(compressed);
    if (currentTokens > inputLimit) {
      return compressed.map((m) => {
        if (m.role === "system") return m;
        return {
          ...m,
          content: m.content.substring(0, Math.floor(inputLimit * 2)) + "... [truncated]",
        };
      });
    }

    return compressed;
  }
}

