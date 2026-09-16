import { ChatMessage } from "@/shared";
import { ILLMProvider, ProviderCompletionOptions, ProviderCompletionResult } from "./interface";

export class OpenAIProvider implements ILLMProvider {
  readonly name = "openai";
  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey = process.env.OPENAI_API_KEY || "", defaultModel = "gpt-4o") {
    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
  }

  async complete(options: ProviderCompletionOptions): Promise<ProviderCompletionResult> {
    if (!this.apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not configured.");
    }

    const payload: {
      model: string;
      messages: Array<{ role: string; content: string }>;
      temperature?: number;
      tools?: Array<{ type: "function"; function: { name: string; description: string; parameters: Record<string, unknown> } }>;
    } = {
      model: this.defaultModel,
      messages: options.messages.map((m) => ({ role: m.role, content: m.content })),
    };

    if (options.temperature !== undefined) {
      payload.temperature = options.temperature;
    }

    if (options.tools && options.tools.length > 0) {
      payload.tools = options.tools.map((t) => ({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`OpenAI API returned status ${res.status}: ${await res.text()}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
          tool_calls?: Array<{
            id: string;
            function?: { name?: string; arguments?: string };
          }>;
        };
      }>;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    };

    const choice = data.choices?.[0]?.message;
    const toolCalls = choice?.tool_calls?.map((tc) => ({
      id: tc.id,
      name: tc.function?.name || "",
      arguments: tc.function?.arguments ? JSON.parse(tc.function.arguments) : {},
    }));

    return {
      content: choice?.content || "",
      toolCalls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
      usage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  }
}
