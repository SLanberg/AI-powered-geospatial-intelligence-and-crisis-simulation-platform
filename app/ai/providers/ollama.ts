import { AiConfig, ChatMessage, ModelCapabilities } from "../types";
import { ModelProvider, ProviderResponse } from "./interface";
import { getModelCapabilities, resolveModelConfig } from "../capabilities";

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

  getCapabilities(modelName?: string): ModelCapabilities {
    return getModelCapabilities("ollama", modelName || this.config.model.name);
  }

  async chatComplete(
    messages: ChatMessage[],
    tools?: Array<{ name: string; description: string; parameters: Record<string, unknown> }>,
    options?: { modelOverride?: string; temperatureOverride?: number }
  ): Promise<ProviderResponse> {
    const resolved = resolveModelConfig(this.config, options?.modelOverride, options?.temperatureOverride);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.model.timeout_seconds * 1000);

    const ollamaOptions: Record<string, unknown> = {
      num_ctx: this.config.context.max_tokens || 4096,
    };

    if (resolved.temperature !== undefined) {
      ollamaOptions.temperature = resolved.temperature;
    }
    if (resolved.top_p !== undefined) {
      ollamaOptions.top_p = resolved.top_p;
    }

    const payload: Record<string, unknown> = {
      model: resolved.modelName,
      stream: false,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      options: ollamaOptions,
    };

    if (tools && tools.length > 0 && resolved.capabilities.tool_calling) {
      payload.tools = tools;
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    const resolved = resolveModelConfig(this.config, options?.modelOverride, options?.temperatureOverride);

    const ollamaOptions: Record<string, unknown> = {
      num_ctx: this.config.context.max_tokens || 4096,
    };

    if (resolved.temperature !== undefined) {
      ollamaOptions.temperature = resolved.temperature;
    }

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: resolved.modelName,
        stream: true,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
        options: ollamaOptions,
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

