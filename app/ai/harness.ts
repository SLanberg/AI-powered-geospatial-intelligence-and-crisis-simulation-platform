import { loadAiConfig, loadSystemPrompt } from "./config";
import { AiConfig, AgentRunOptions, AgentRunResult, ChatMessage } from "./types";
import { ModelProvider } from "./providers/interface";
import { OpenAiProvider } from "./providers/openai";
import { OllamaProvider } from "./providers/ollama";
import { MockProvider } from "./providers/mock";
import { Guardrails } from "./safety/guardrails";
import { AiLogger } from "./observability/logger";
import { MemoryStore } from "./memory/store";
import { RagRetriever } from "./retrieval/rag";
import { ContextManager } from "./context/manager";
import { ToolRegistry } from "./tools/registry";

export class AgentHarness {
  private config: AiConfig;
  private logger: AiLogger;
  private guardrails: Guardrails;
  private memoryStore: MemoryStore;
  private ragRetriever: RagRetriever;
  private contextManager: ContextManager;
  private toolRegistry: ToolRegistry;

  constructor(customConfig?: AiConfig) {
    this.config = customConfig ?? loadAiConfig();
    this.logger = new AiLogger(this.config);
    this.guardrails = new Guardrails(this.config);
    this.memoryStore = new MemoryStore(this.config);
    this.ragRetriever = new RagRetriever(this.config);
    this.contextManager = new ContextManager(this.config);
    this.toolRegistry = new ToolRegistry(this.config);
  }

  getConfig(): AiConfig {
    return this.config;
  }

  private getProvider(providerName?: string): ModelProvider {
    const p = providerName || this.config.model.provider;
    switch (p.toLowerCase()) {
      case "openai":
        return new OpenAiProvider(this.config);
      case "ollama":
        return new OllamaProvider(this.config);
      case "mock":
        return new MockProvider(this.config);
      default:
        this.logger.warn(`Unknown provider '${p}', falling back to Ollama.`);
        return new OllamaProvider(this.config);
    }
  }

  /**
   * Main entry point to run an agent workflow.
   */
  async run(options: AgentRunOptions): Promise<AgentRunResult> {
    const startTime = Date.now();
    const requestId = `req_${Math.random().toString(36).substring(2, 9)}`;

    this.logger.info(`Starting agent execution requestId=${requestId}`, {
      requestId,
      model: options.modelOverride || this.config.model.name,
    });

    // 1. Guardrail Input Check
    const inputValidation = this.guardrails.validateInput(options.messages);
    if (!inputValidation.valid) {
      this.logger.warn(`Input validation failed: ${inputValidation.reason}`, { requestId });
      throw new Error(`Safety Violation: ${inputValidation.reason}`);
    }

    // 2. Prepare Context (System Prompt + Live Context + RAG + Memory)
    let systemPromptText = loadSystemPrompt(this.config);
    if (options.context && options.context.trim()) {
      systemPromptText += `\n\nLive Telemetry / Dashboard Context:\n${options.context.trim()}`;
    }

    const lastUserMessage = [...options.messages].reverse().find((m) => m.role === "user")?.content || "";

    // Retrieval RAG
    if (this.config.retrieval.enabled && lastUserMessage) {
      const docs = await this.ragRetriever.retrieveContext(lastUserMessage);
      if (docs.length > 0) {
        systemPromptText += `\n\nRetrieved Knowledge Context:\n` + docs.map((d) => `- [${d.collection}] ${d.content}`).join("\n");
      }
    }

    // Memory Store
    if (this.config.memory.enabled && lastUserMessage) {
      const memoryItems = await this.memoryStore.getLongTermContext(lastUserMessage);
      if (memoryItems.length > 0) {
        systemPromptText += `\n\nSemantic Memory:\n` + memoryItems.join("\n");
      }
    }

    // Combine system prompt with conversation history
    let messages: ChatMessage[] = [
      { role: "system", content: systemPromptText },
      ...this.memoryStore.trimConversation(options.messages),
    ];

    // Context compression if near token limits
    messages = this.contextManager.compressContext(messages);

    const provider = this.getProvider();
    const maxSteps = this.config.agent.max_steps;
    const maxExecTimeMs = this.config.agent.max_execution_time_seconds * 1000;

    let stepCount = 0;
    let toolCallCount = 0;
    let finalContent = "";

    // 3. Agent Execution Loop (Model -> Tools -> Model)
    while (stepCount < maxSteps) {
      if (Date.now() - startTime > maxExecTimeMs) {
        this.logger.warn(`Execution timeout exceeded max limit (${maxExecTimeMs}ms)`, { requestId });
        break;
      }

      stepCount++;
      this.logger.info(`Agent step ${stepCount}/${maxSteps}`, { requestId });

      const tools = this.config.agent.capabilities.tool_calling ? this.toolRegistry.getToolDefinitions() : undefined;

      const response = await provider.chatComplete(messages, tools, {
        modelOverride: options.modelOverride,
        temperatureOverride: options.temperatureOverride,
      });

      finalContent = response.content;

      // Handle tool calls if returned by model
      if (response.toolCalls && response.toolCalls.length > 0) {
        toolCallCount += response.toolCalls.length;
        messages.push({ role: "assistant", content: response.content || "", tool_calls: response.toolCalls });

        for (const tc of response.toolCalls.slice(0, this.config.tools.execution.max_calls_per_step)) {
          this.logger.info(`Executing tool '${tc.name}'`, { requestId, toolCalls: [tc.name] });
          try {
            const toolResult = await this.toolRegistry.executeTool(tc.name, tc.arguments, options.userConfirmationGranted);
            messages.push({
              role: "tool",
              name: tc.name,
              tool_call_id: tc.id,
              content: JSON.stringify(toolResult),
            });
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : String(err);
            messages.push({
              role: "tool",
              name: tc.name,
              tool_call_id: tc.id,
              content: JSON.stringify({ error: errorMsg }),
            });
          }
        }
      } else {
        // No tool calls requested, model completed its response
        break;
      }
    }

    // 4. Validate Output
    const outputValidation = this.guardrails.validateOutput(finalContent);
    const warnings: string[] = [];
    if (!outputValidation.valid && outputValidation.reason) {
      warnings.push(outputValidation.reason);
    }

    const executionTimeMs = Date.now() - startTime;
    this.logger.info(`Finished agent execution requestId=${requestId} in ${executionTimeMs}ms`, {
      requestId,
      latencyMs: executionTimeMs,
    });

    return {
      content: finalContent,
      model: options.modelOverride || this.config.model.name,
      stepsCount: stepCount,
      toolCallsCount: toolCallCount,
      executionTimeMs,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Helper for streaming chat directly when streaming is enabled
   */
  async stream(options: AgentRunOptions): Promise<ReadableStream<Uint8Array>> {
    const provider = this.getProvider();
    if (!provider.streamChat) {
      throw new Error(`Provider '${provider.name}' does not support streaming.`);
    }

    let systemPromptText = loadSystemPrompt(this.config);
    if (options.context && options.context.trim()) {
      systemPromptText += `\n\nLive Telemetry / Dashboard Context:\n${options.context.trim()}`;
    }

    const messages: ChatMessage[] = [
      { role: "system", content: systemPromptText },
      ...options.messages,
    ];

    return provider.streamChat(messages, {
      modelOverride: options.modelOverride,
      temperatureOverride: options.temperatureOverride,
    });
  }
}
