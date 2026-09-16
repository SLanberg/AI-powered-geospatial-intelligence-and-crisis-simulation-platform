import { ChatMessage } from "@/shared";

export interface ProviderCompletionOptions {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  tools?: Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }>;
}

export interface ProviderCompletionResult {
  content: string;
  toolCalls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ILLMProvider {
  readonly name: string;
  complete(options: ProviderCompletionOptions): Promise<ProviderCompletionResult>;
  stream?(options: ProviderCompletionOptions): Promise<ReadableStream<Uint8Array>>;
}
