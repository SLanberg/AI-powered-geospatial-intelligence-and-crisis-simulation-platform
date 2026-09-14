import { AiConfig, ModelCapabilities } from "./types";

export class CapabilityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CapabilityError";
  }
}

/**
 * Resolves capability flags and supported parameters for a given provider and model name.
 */
export function getModelCapabilities(provider: string, modelName: string): ModelCapabilities {
  const p = provider.toLowerCase();
  const m = modelName.toLowerCase();

  if (p === "openai") {
    if (m.startsWith("o1") || m.startsWith("o3")) {
      return {
        tool_calling: true,
        structured_output: true,
        reasoning: true,
        streaming: true,
        vision: false,
        embeddings: false,
        supported_params: ["reasoning.effort", "max_output_tokens", "tools", "response_format"],
      };
    }

    // gpt-4o, gpt-4o-mini, gpt-4, gpt-3.5-turbo etc.
    return {
      tool_calling: true,
      structured_output: true,
      reasoning: false,
      streaming: true,
      vision: m.includes("4o") || m.includes("vision"),
      embeddings: false,
      supported_params: ["temperature", "top_p", "max_output_tokens", "tools", "response_format"],
    };
  }

  if (p === "ollama") {
    const isReasoning = m.includes("deepseek-r1") || m.includes("qwq") || m.includes("reasoning");
    return {
      tool_calling: !isReasoning || m.includes("qwen"),
      structured_output: true,
      reasoning: isReasoning,
      streaming: true,
      vision: m.includes("llava") || m.includes("vision"),
      embeddings: m.includes("embed"),
      supported_params: isReasoning
        ? ["reasoning.effort", "temperature", "max_output_tokens", "tools"]
        : ["temperature", "top_p", "max_output_tokens", "tools"],
    };
  }

  if (p === "mock") {
    if (m.includes("no-tools")) {
      return {
        tool_calling: false,
        structured_output: true,
        reasoning: false,
        streaming: true,
        vision: false,
        embeddings: false,
        supported_params: ["temperature", "top_p", "max_output_tokens"],
      };
    }
    if (m.includes("no-json")) {
      return {
        tool_calling: true,
        structured_output: false,
        reasoning: false,
        streaming: true,
        vision: false,
        embeddings: false,
        supported_params: ["temperature", "top_p", "max_output_tokens", "tools"],
      };
    }
    if (m.includes("no-reasoning")) {
      return {
        tool_calling: true,
        structured_output: true,
        reasoning: false,
        streaming: true,
        vision: false,
        embeddings: false,
        supported_params: ["temperature", "top_p", "max_output_tokens", "tools"],
      };
    }
    // Default mock capabilities
    return {
      tool_calling: true,
      structured_output: true,
      reasoning: true,
      streaming: true,
      vision: true,
      embeddings: true,
      supported_params: ["reasoning.effort", "temperature", "top_p", "max_output_tokens", "tools", "response_format"],
    };
  }

  // Fallback defaults for unknown models
  return {
    tool_calling: true,
    structured_output: true,
    reasoning: false,
    streaming: true,
    vision: false,
    embeddings: false,
    supported_params: ["temperature", "top_p", "max_output_tokens", "tools"],
  };
}

export interface ResolvedModelRequest {
  provider: string;
  modelName: string;
  capabilities: ModelCapabilities;
  temperature?: number;
  top_p?: number;
  max_output_tokens: number;
  reasoningEffort?: "low" | "medium" | "high";
  effectiveReasoningEnabled: boolean;
  warnings: string[];
}

/**
 * Resolves model parameters against declared capabilities, enforcing fail-fast rules
 * and graceful feature disabling.
 */
export function resolveModelConfig(
  config: AiConfig,
  modelOverride?: string,
  temperatureOverride?: number
): ResolvedModelRequest {
  const provider = config.model.provider;
  const modelName = modelOverride || config.model.name;
  const capabilities = getModelCapabilities(provider, modelName);
  const warnings: string[] = [];

  // Fail fast check for required tool calling
  if (config.agent.capabilities.tool_calling && !capabilities.tool_calling) {
    throw new CapabilityError(
      `Model '${modelName}' under provider '${provider}' does not support required capability 'tool_calling'.`
    );
  }

  // Fail fast check for required structured output
  if (config.agent.output.format === "json" && !capabilities.structured_output) {
    throw new CapabilityError(
      `Model '${modelName}' under provider '${provider}' does not support required capability 'structured_output'.`
    );
  }

  // Gracefully handle reasoning capability mismatch
  let effectiveReasoningEnabled = config.model.reasoning.enabled;
  let reasoningEffort: ("low" | "medium" | "high") | undefined = undefined;

  if (effectiveReasoningEnabled) {
    if (capabilities.reasoning && capabilities.supported_params.includes("reasoning.effort")) {
      reasoningEffort = config.model.reasoning.effort;
    } else {
      effectiveReasoningEnabled = false;
      warnings.push(`Reasoning was requested, but model '${modelName}' does not support reasoning. Feature disabled gracefully.`);
    }
  }

  const temperature = capabilities.supported_params.includes("temperature")
    ? (temperatureOverride ?? config.model.temperature)
    : undefined;

  const top_p = capabilities.supported_params.includes("top_p")
    ? config.model.top_p
    : undefined;

  return {
    provider,
    modelName,
    capabilities,
    temperature,
    top_p,
    max_output_tokens: config.model.max_output_tokens,
    reasoningEffort,
    effectiveReasoningEnabled,
    warnings,
  };
}
