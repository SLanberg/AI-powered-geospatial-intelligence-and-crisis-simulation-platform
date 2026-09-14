import { RetryConfig } from "../types";
import { AiLogger } from "../observability/logger";

export type ErrorClassification = "retryable" | "non_retryable" | "safety_blocked";

export function classifyError(error: unknown): ErrorClassification {
  const msg = error instanceof Error ? error.message : String(error);

  if (
    msg.includes("Safety Violation") ||
    msg.includes("prompt injection") ||
    msg.includes("Guardrail")
  ) {
    return "safety_blocked";
  }

  if (
    msg.includes("401") ||
    msg.includes("403") ||
    msg.includes("400") ||
    msg.includes("Permission denied") ||
    msg.includes("does not support required capability") ||
    msg.includes("budget limit") ||
    msg.includes("Host") ||
    msg.includes("exceeds size limit") ||
    msg.includes("invalid tool arguments") ||
    msg.includes("Authentication failure")
  ) {
    return "non_retryable";
  }

  if (
    msg.includes("429") ||
    msg.includes("500") ||
    msg.includes("502") ||
    msg.includes("503") ||
    msg.includes("504") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("ECONNRESET") ||
    msg.includes("timeout") ||
    msg.includes("fetch failed") ||
    msg.includes("temporary provider failure")
  ) {
    return "retryable";
  }

  // Default to non-retryable unless network/server glitch is suspected
  return "non_retryable";
}

export interface RetryStats {
  attempts: number;
  totalDelayMs: number;
}

export async function executeWithRetry<T>(
  fn: () => Promise<T>,
  config?: RetryConfig,
  logger?: AiLogger,
  onRetry?: (attempt: number, delayMs: number, err: Error) => void
): Promise<{ result: T; stats: RetryStats }> {
  const cfg: RetryConfig = config ?? {
    enabled: true,
    max_attempts: 3,
    initial_delay_ms: 100,
    max_delay_ms: 1000,
    backoff_multiplier: 2,
    jitter: true,
  };

  if (!cfg.enabled) {
    const res = await fn();
    return { result: res, stats: { attempts: 1, totalDelayMs: 0 } };
  }

  let attempt = 0;
  let totalDelayMs = 0;

  while (attempt < cfg.max_attempts) {
    attempt++;
    try {
      const res = await fn();
      return { result: res, stats: { attempts: attempt, totalDelayMs } };
    } catch (err) {
      const classification = classifyError(err);

      if (classification !== "retryable" || attempt >= cfg.max_attempts) {
        throw err;
      }

      let delayMs = cfg.initial_delay_ms * Math.pow(cfg.backoff_multiplier, attempt - 1);
      delayMs = Math.min(delayMs, cfg.max_delay_ms);

      if (cfg.jitter) {
        // Apply ±20% jitter
        const jitterFactor = 0.8 + Math.random() * 0.4;
        delayMs = Math.round(delayMs * jitterFactor);
      }

      // Respect Retry-After header if attached to error object
      if (err && typeof err === "object" && "retryAfterSeconds" in err && typeof (err as { retryAfterSeconds: unknown }).retryAfterSeconds === "number") {
        delayMs = ((err as { retryAfterSeconds: number }).retryAfterSeconds) * 1000;
      }

      totalDelayMs += delayMs;
      logger?.warn(`Retryable error on attempt ${attempt}/${cfg.max_attempts}. Retrying in ${delayMs}ms. Error: ${err instanceof Error ? err.message : String(err)}`);

      if (onRetry && err instanceof Error) {
        onRetry(attempt, delayMs, err);
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw new Error("Retry attempts exhausted.");
}
