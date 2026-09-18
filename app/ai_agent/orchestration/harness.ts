import { ChatMessage, ChatResponse } from "@/shared";
import { generateSystemPrompt } from "../prompts/system";
import { ragRetriever } from "../rag/retriever";
import { globalToolRegistry } from "../tools/registry";
import { globalGuardrails } from "../safety/guardrails";
import { globalContextManager } from "../context/contextManager";
import { agentLogger } from "../observability/logger";
import { ILLMProvider } from "../providers/interface";
import { MockLLMProvider } from "../providers/mock";
import { OllamaProvider } from "../providers/ollama";
import { OpenAIProvider } from "../providers/openai";

export interface AgentRunOptions {
  messages: ChatMessage[];
  context?: string;
  modelOverride?: string;
  temperatureOverride?: number;
  maxSteps?: number;
}

export interface AgentRunResult {
  content: string;
  model: string;
  stepsCount: number;
  executionTimeMs: number;
  warnings?: string[];
}

export class AgentHarness {
  private defaultProvider: ILLMProvider;

  constructor() {
    if (process.env.OPENAI_API_KEY) {
      this.defaultProvider = new OpenAIProvider();
    } else if (process.env.USE_MOCK_LLM === "true" || process.env.NODE_ENV === "test") {
      this.defaultProvider = new MockLLMProvider();
    } else {
      this.defaultProvider = new OllamaProvider();
    }
  }

  setProvider(provider: ILLMProvider): void {
    this.defaultProvider = provider;
  }

  async run(options: AgentRunOptions): Promise<AgentRunResult> {
    const startTime = performance.now();
    const maxSteps = options.maxSteps ?? 4;
    const warnings: string[] = [];

    const lastUserMessage = options.messages.filter((m) => m.role === "user").pop();
    const userPrompt = lastUserMessage?.content || "";

    // 1. Guardrail input validation
    const guardrailCheck = globalGuardrails.checkInput(userPrompt);
    if (!guardrailCheck.allowed) {
      return {
        content: guardrailCheck.reason || "Action prevented by safety policy.",
        model: this.defaultProvider.name,
        stepsCount: 0,
        executionTimeMs: Math.round(performance.now() - startTime),
        warnings: ["Security policy triggered"],
      };
    }

    // 2. RAG Context Retrieval
    let retrievedContext = "";
    if (userPrompt.trim().length > 3) {
      try {
        const docs = await ragRetriever.retrieveContext(userPrompt, { topK: 3 });
        if (docs.length > 0) {
          retrievedContext = docs.map((d) => `[RELEVANT KNOWLEDGE - ${d.collection}]: ${d.content}`).join("\n\n");
        }
      } catch (ragErr) {
        agentLogger.warn("Harness", "RAG retrieval warning", { error: String(ragErr) });
      }
    }

    // 3. Assemble message pipeline
    const combinedContext = [options.context, retrievedContext].filter(Boolean).join("\n\n");
    const systemContent = generateSystemPrompt({
      telemetryContext: combinedContext || undefined,
    });

    const activeMessages: ChatMessage[] = [
      { role: "system", content: systemContent },
      ...options.messages.filter((m) => m.role !== "system"),
    ];

    const pruned = globalContextManager.pruneHistory(activeMessages);

    // 4. Execution loop (reasoning + tool calling)
    let stepsCount = 0;
    let finalContent = "";

    while (stepsCount < maxSteps) {
      stepsCount++;

      try {
        const completion = await this.defaultProvider.complete({
          messages: pruned,
          temperature: options.temperatureOverride,
        });

        if (completion.toolCalls && completion.toolCalls.length > 0) {
          for (const tc of completion.toolCalls) {
            agentLogger.info("Harness", `Executing tool ${tc.name}`, tc.arguments);

            // Safety check tool call
            const toolSafety = globalGuardrails.checkToolExecution(tc.name, tc.arguments);
            if (!toolSafety.allowed) {
              pruned.push({
                role: "tool",
                name: tc.name,
                tool_call_id: tc.id,
                content: JSON.stringify({ error: toolSafety.reason }),
              });
              warnings.push(`Tool ${tc.name} blocked by safety rules`);
              continue;
            }

            // Execute in Zod-typed registry
            const result = await globalToolRegistry.execute(tc.name, tc.arguments);
            pruned.push({
              role: "tool",
              name: tc.name,
              tool_call_id: tc.id,
              content: JSON.stringify(result.success ? result.data : { error: result.error }),
            });
          }
          // Continue loop to allow LLM to interpret tool results
          continue;
        }

        finalContent = completion.content;
        break;
      } catch (err) {
        agentLogger.error("Harness", "Completion error in harness loop", { error: String(err) });
        // Fallback to mock response if provider is completely offline
        if (!(this.defaultProvider instanceof MockLLMProvider)) {
          warnings.push("Primary provider unreachable, fallback provider engaged");
          const fallback = new MockLLMProvider();
          const fallbackResult = await fallback.complete({ messages: pruned });
          finalContent = fallbackResult.content;
        } else {
          finalContent = "Service currently operating in degraded telemetry mode.";
        }
        break;
      }
    }

    return {
      content: finalContent || "Operational assessment completed.",
      model: options.modelOverride || this.defaultProvider.name,
      stepsCount,
      executionTimeMs: Math.round(performance.now() - startTime),
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  async stream(options: AgentRunOptions): Promise<ReadableStream<Uint8Array>> {
    if (this.defaultProvider.stream) {
      const systemContent = generateSystemPrompt({ telemetryContext: options.context });
      const activeMessages: ChatMessage[] = [
        { role: "system", content: systemContent },
        ...options.messages.filter((m) => m.role !== "system"),
      ];
      try {
        return await this.defaultProvider.stream({
          messages: activeMessages,
          temperature: options.temperatureOverride,
        });
      } catch (streamErr) {
        agentLogger.warn("Harness", "Stream request failed on provider, falling back to run()", { error: String(streamErr) });
      }
    }

    // Fallback: run and stream result content as stream chunks
    const result = await this.run(options);
    const encoder = new TextEncoder();
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(result.content));
        controller.close();
      },
    });
  }
}

export const globalAgentHarness = new AgentHarness();
