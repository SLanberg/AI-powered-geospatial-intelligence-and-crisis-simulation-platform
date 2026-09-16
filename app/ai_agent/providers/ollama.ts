import { ChatMessage } from "@/shared";
import { ILLMProvider, ProviderCompletionOptions, ProviderCompletionResult } from "./interface";

export class OllamaProvider implements ILLMProvider {
  readonly name = "ollama";
  private defaultModel: string;

  constructor(defaultModel = "qwen2.5:latest") {
    this.defaultModel = defaultModel;
  }

  private get baseUrl(): string {
    const url = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
    return url.replace(/\/$/, "");
  }

  async complete(options: ProviderCompletionOptions): Promise<ProviderCompletionResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const payload: {
      model: string;
      stream: boolean;
      messages: Array<{ role: string; content: string }>;
      options?: { temperature?: number };
      tools?: ProviderCompletionOptions["tools"];
    } = {
      model: this.defaultModel,
      stream: false,
      messages: options.messages.map((m) => ({ role: m.role, content: m.content })),
    };

    if (options.temperature !== undefined) {
      payload.options = { temperature: options.temperature };
    }

    if (options.tools && options.tools.length > 0) {
      payload.tools = options.tools;
    }

    try {
      const res = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (!res.ok) {
        throw new Error(`Ollama chat API returned status ${res.status}`);
      }

      const data = (await res.json()) as {
        message?: {
          content?: string;
          tool_calls?: Array<{
            function?: { name?: string; arguments?: Record<string, unknown> };
          }>;
        };
        prompt_eval_count?: number;
        eval_count?: number;
      };

      const toolCalls = data.message?.tool_calls
        ?.filter((tc) => tc.function?.name)
        .map((tc, idx) => ({
          id: `call_${Date.now()}_${idx}`,
          name: tc.function!.name!,
          arguments: tc.function!.arguments || {},
        }));

      return {
        content: data.message?.content || "",
        toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
        usage: {
          promptTokens: data.prompt_eval_count || 0,
          completionTokens: data.eval_count || 0,
          totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
        },
      };
    } catch (err) {
      throw new Error(`Ollama completion failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  async stream(options: ProviderCompletionOptions): Promise<ReadableStream<Uint8Array>> {
    const payload = {
      model: this.defaultModel,
      stream: true,
      messages: options.messages.map((m) => ({ role: m.role, content: m.content })),
      options: options.temperature !== undefined ? { temperature: options.temperature } : undefined,
    };

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok || !res.body) {
      throw new Error(`Ollama stream request failed with status ${res.status}`);
    }

    const reader = res.body.getReader();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    return new ReadableStream({
      async pull(controller) {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }

        const chunkText = decoder.decode(value);
        const lines = chunkText.split("\n").filter((l) => l.trim().length > 0);

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line) as { message?: { content?: string } };
            if (parsed.message?.content) {
              controller.enqueue(encoder.encode(parsed.message.content));
            }
          } catch {
            // Partial JSON ignored
          }
        }
      },
    });
  }
}
