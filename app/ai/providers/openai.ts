import { AiConfig, ChatMessage, ModelCapabilities } from "../types";
import { ModelProvider, ProviderResponse } from "./interface";
import { getModelCapabilities, resolveModelConfig } from "../capabilities";

export class OpenAiProvider implements ModelProvider {
  name = "openai";
  private config: AiConfig;

  constructor(config: AiConfig) {
    this.config = config;
  }

  getCapabilities(modelName?: string): ModelCapabilities {
    return getModelCapabilities("openai", modelName || this.config.model.name);
  }

  async chatComplete(
    messages: ChatMessage[],
    tools?: Array<{ name: string; description: string; parameters: Record<string, unknown> }>,
    options?: { modelOverride?: string; temperatureOverride?: number }
  ): Promise<ProviderResponse> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is missing.");
    }

    const resolved = resolveModelConfig(this.config, options?.modelOverride, options?.temperatureOverride);

    const payload: Record<string, unknown> = {
      model: resolved.modelName,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        name: m.name,
      })),
      max_tokens: resolved.max_output_tokens,
    };

    if (resolved.temperature !== undefined) {
      payload.temperature = resolved.temperature;
    }
    if (resolved.top_p !== undefined) {
      payload.top_p = resolved.top_p;
    }
    if (resolved.reasoningEffort !== undefined) {
      payload.reasoning_effort = resolved.reasoningEffort;
    }

    if (tools && tools.length > 0 && resolved.capabilities.tool_calling) {
      payload.tools = tools.map((t) => ({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.model.timeout_seconds * 1000);

    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`OpenAI API returned HTTP ${res.status}: ${errorText}`);
      }

      const data = (await res.json()) as {
        choices?: Array<{
          message?: {
            content?: string;
            tool_calls?: Array<{
              id: string;
              function: { name: string; arguments: string };
            }>;
          };
        }>;
      };

      const choice = data.choices?.[0]?.message;
      const content = choice?.content ?? "";

      const toolCalls = choice?.tool_calls?.map((tc) => {
        let parsedArgs = {};
        try {
          parsedArgs = JSON.parse(tc.function.arguments);
        } catch {
          // ignore
        }
        return {
          id: tc.id,
          name: tc.function.name,
          arguments: parsedArgs as Record<string, unknown>,
        };
      });

      return {
        content,
        toolCalls,
        rawResponse: data,
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}

