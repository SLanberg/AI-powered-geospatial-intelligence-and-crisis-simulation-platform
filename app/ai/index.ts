/**
 * Neural City AI Engine Entrypoint
 *
 * Dedicated AI module containing logic, agent harness, configuration management,
 * safety guardrails, context prioritization, memory, retrieval, and observability.
 */

export * from "./types";
export * from "./config";
export * from "./harness";
export * from "./safety/guardrails";
export * from "./observability/logger";
export * from "./tools/registry";
export * from "./memory/store";
export * from "./retrieval/rag";
export * from "./context/manager";
export * from "./providers/interface";
export * from "./providers/openai";
export * from "./providers/ollama";
export * from "./providers/mock";

import { AgentHarness } from "./harness";
import { loadAiConfig } from "./config";
import { AgentRunOptions, AgentRunResult } from "./types";

/**
 * Global singleton agent harness instance
 */
let defaultHarness: AgentHarness | null = null;

export function getAiHarness(): AgentHarness {
  if (!defaultHarness) {
    defaultHarness = new AgentHarness();
  }
  return defaultHarness;
}

/**
 * Primary helper function to run the AI Agent
 */
export async function executeAgent(options: AgentRunOptions): Promise<AgentRunResult> {
  const harness = getAiHarness();
  return harness.run(options);
}

/**
 * Stream helper for streaming model responses
 */
export async function streamAgent(options: AgentRunOptions): Promise<ReadableStream<Uint8Array>> {
  const harness = getAiHarness();
  return harness.stream(options);
}
