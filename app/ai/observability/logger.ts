import { AiConfig } from "../types";

export interface LogContext {
  requestId?: string;
  model?: string;
  latencyMs?: number;
  tokens?: { prompt: number; completion: number; total: number };
  toolCalls?: string[];
  retrievalHits?: number;
  error?: string;
  [key: string]: unknown;
}

export class AiLogger {
  private config: AiConfig;

  constructor(config: AiConfig) {
    this.config = config;
  }

  private redact(text: string): string {
    if (!this.config.observability.logging.redact_secrets) return text;
    // Redact common secret patterns (API keys, passwords, bearer tokens)
    let cleaned = text.replace(/(sk-[a-zA-Z0-9]{20,})/g, "sk-***REDACTED***");
    cleaned = cleaned.replace(/(Bearer\s+[a-zA-Z0-9._-]+)/gi, "Bearer ***REDACTED***");
    cleaned = cleaned.replace(/("?(?:api_key|apiKey|password)"?\s*:\s*)"[^"]+"/gi, '$1"***REDACTED***"');
    return cleaned;
  }

  info(message: string, context?: LogContext) {
    if (!this.config.observability.enabled) return;
    const timestamp = new Date().toISOString();
    const redactedMsg = this.redact(message);
    const sanitizedCtx = context ? JSON.parse(this.redact(JSON.stringify(context))) : undefined;

    console.log(`[AI-LOG][INFO][${timestamp}] ${redactedMsg}`, sanitizedCtx ? sanitizedCtx : "");
  }

  warn(message: string, context?: LogContext) {
    if (!this.config.observability.enabled) return;
    const timestamp = new Date().toISOString();
    console.warn(`[AI-LOG][WARN][${timestamp}] ${this.redact(message)}`, context ?? "");
  }

  error(message: string, error?: unknown, context?: LogContext) {
    if (!this.config.observability.enabled) return;
    const timestamp = new Date().toISOString();
    const errDetails = error instanceof Error ? error.stack || error.message : String(error);
    console.error(`[AI-LOG][ERROR][${timestamp}] ${this.redact(message)} Details: ${this.redact(errDetails)}`, context ?? "");
  }

  recordMetric(metricName: string, value: number, tags?: Record<string, string>) {
    if (!this.config.observability.enabled || !this.config.observability.metrics.enabled) return;
    if (this.config.observability.metrics.collect.includes(metricName)) {
      console.log(`[AI-METRIC] ${metricName} = ${value}`, tags ?? "");
    }
  }
}
