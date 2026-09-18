/**
 * AI Agent Subsystem Entrypoint
 */

import { globalAgentHarness, AgentRunOptions, AgentRunResult } from "./orchestration/harness";

export * from "./prompts/system";
export * from "./prompts/templates";
export * from "./vector_db/similarity";
export * from "./vector_db/store";
export * from "./rag/embeddings";
export * from "./rag/retriever";
export * from "./tools/registry";
export * from "./providers/interface";
export * from "./providers/mock";
export * from "./providers/ollama";
export * from "./providers/openai";
export * from "./safety/guardrails";
export * from "./memory/memoryStore";
export * from "./context/contextManager";
export * from "./observability/logger";
export * from "./orchestration/harness";

export function getAiHarness() {
  return globalAgentHarness;
}

export async function executeAgent(options: AgentRunOptions): Promise<AgentRunResult> {
  return globalAgentHarness.run(options);
}

export async function streamAgent(options: AgentRunOptions): Promise<ReadableStream<Uint8Array>> {
  return globalAgentHarness.stream(options);
}

export function loadAiConfig() {
  return {
    version: "2.0.0",
    app: { environment: process.env.NODE_ENV || "development" },
    model: {
      name: process.env.AI_MODEL || "qwen2.5:7b",
      provider: process.env.OPENAI_API_KEY ? "openai" : "ollama",
    },
  };
}
