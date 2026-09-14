import { AiConfig, ChatMessage } from "../types";
import { ModelProvider, ProviderResponse } from "./interface";

export class OllamaProvider implements ModelProvider {
  name = "ollama";
  private config: AiConfig;

  constructor(config: AiConfig) {
    this.config = config;
  }

  private get baseUrl(): string {
    const url = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
    return url.replace(/\/$/, "");
  }

  async chatComplete(
    messages: ChatMessage[],
    tools?: Array<{ name: string; description: string; parameters: Record<string, unknown> }>,
    options?: { modelOverride?: string; temperatureOverride?: number }
  ): Promise<ProviderResponse> {
    const model = options?.modelOverride || this.config.model.name;
    const temperature = options?.temperatureOverride ?? this.config.model.temperature;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.model.timeout_seconds * 1000);

    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          stream: false,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
          options: {
            temperature,
            num_ctx: this.config.context.max_tokens || 4096,
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const details = await res.text();
        throw new Error(`Ollama returned status ${res.status}: ${details}`);
      }

      const data = (await res.json()) as { message?: { content?: string } };
      return {
        content: data.message?.content ?? "",
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async streamChat(
    messages: ChatMessage[],
    options?: { modelOverride?: string; temperatureOverride?: number }
  ): Promise<ReadableStream<Uint8Array>> {
    const model = options?.modelOverride || this.config.model.name;
    const temperature = options?.temperatureOverride ?? this.config.model.temperature;

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: true,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        options: {
          temperature,
          num_ctx: this.config.context.max_tokens || 4096,
        },
      }),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Ollama stream request failed with status ${res.status}`);
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let buffer = "";

    return res.body.pipeThrough(
      new TransformStream({
        transform(chunk, controller) {
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const parsed = JSON.parse(trimmed);
              if (parsed.message?.content) {
                controller.enqueue(encoder.encode(parsed.message.content));
              }
            } catch {
              // ignore partial line
            }
          }
        },
        flush(controller) {
          if (buffer.trim()) {
            try {
              const parsed = JSON.parse(buffer.trim());
              if (parsed.message?.content) {
                controller.enqueue(encoder.encode(parsed.message.content));
              }
            } catch {
              // ignore
            }
          }
        },
      })
    );
  }
}
