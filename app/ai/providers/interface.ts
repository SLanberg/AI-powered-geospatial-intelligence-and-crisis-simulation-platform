import { AiConfig, ChatMessage } from "../types";

export interface ProviderResponse {
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
  rawResponse?: unknown;
}

export interface ModelProvider {
  name: string;
  chatComplete(
    messages: ChatMessage[],
    tools?: Array<{ name: string; description: string; parameters: Record<string, unknown> }>,
    options?: { modelOverride?: string; temperatureOverride?: number }
  ): Promise<ProviderResponse>;
  
  streamChat?(
    messages: ChatMessage[],
    options?: { modelOverride?: string; temperatureOverride?: number }
  ): Promise<ReadableStream<Uint8Array>>;
}
