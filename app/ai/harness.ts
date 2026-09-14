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
import { McpManager } from "./mcp/manager";
import { CostManager } from "./cost/manager";
import { executeWithRetry } from "./utils/retry";
import { resolveModelConfig } from "./capabilities";

export class AgentHarness {
  private config: AiConfig;
  private logger: AiLogger;
  private guardrails: Guardrails;
  private memoryStore: MemoryStore;
  private ragRetriever: RagRetriever;
  private contextManager: ContextManager;
  private toolRegistry: ToolRegistry;
  private mcpManager: McpManager;
  private costManager: CostManager;

  constructor(customConfig?: AiConfig) {
    this.config = customConfig ?? loadAiConfig();
    this.logger = new AiLogger(this.config);
    this.guardrails = new Guardrails(this.config);
    this.memoryStore = new MemoryStore(this.config);
    this.ragRetriever = new RagRetriever(this.config);
    this.contextManager = new ContextManager(this.config);
    this.toolRegistry = new ToolRegistry(this.config);
    this.mcpManager = new McpManager(this.config, this.logger);
    this.costManager = new CostManager(this.config, this.logger);

    // Register configured MCP tools into unified ToolRegistry
    this.mcpManager.registerMcpTools(this.toolRegistry);
  }

  getConfig(): AiConfig {
    return this.config;
  }

  getCostManager(): CostManager {
    return this.costManager;
  }

  getToolRegistry(): ToolRegistry {
    return this.toolRegistry;
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
    const warnings: string[] = [];

    this.logger.info(`Starting agent execution requestId=${requestId}`, {
      requestId,
      model: options.modelOverride || this.config.model.name,
    });

    // Reset MCP request state
    this.mcpManager.resetRequestState();

    // 1. Guardrail Input Check
    const inputValidation = this.guardrails.validateInput(options.messages);
    if (!inputValidation.valid) {
      this.logger.warn(`Input validation failed: ${inputValidation.reason}`, { requestId });
      throw new Error(`Safety Violation: ${inputValidation.reason}`);
    }

    // 2. Resolve Model Capabilities and Check Requirements
    const resolvedConfig = resolveModelConfig(this.config, options.modelOverride, options.temperatureOverride);
    if (resolvedConfig.warnings.length > 0) {
      warnings.push(...resolvedConfig.warnings);
    }

    // 3. Prepare Context (System Prompt + Live Context + RAG + Memory)
    let systemPromptText = loadSystemPrompt(this.config);
    if (options.context && options.context.trim()) {
      systemPromptText += `\n\nLive Telemetry / Dashboard Context:\n${options.context.trim()}`;
    }

    const lastUserMessage = [...options.messages].reverse().find((m) => m.role === "user")?.content || "";

    // Retrieval RAG
    if (this.config.retrieval.enabled && lastUserMessage) {
      const docs = await this.ragRetriever.retrieveContext(lastUserMessage);
      if (docs.length > 0) {
        systemPromptText +=
          `\n\nRetrieved Knowledge Context:\n` + docs.map((d) => `- [${d.collection}] ${d.content}`).join("\n");
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

    const provider = this.getProvider(resolvedConfig.provider);
    const maxSteps = this.config.agent.max_steps;
    const maxExecTimeMs = this.config.agent.max_execution_time_seconds * 1000;
    const maxToolCallsPerRequest = Math.min(
      this.config.cost.limits.max_tool_calls_per_request || 30,
      this.config.mcp.security.max_tool_calls_per_request || 20
    );

    let stepCount = 0;
    let totalToolCallsCount = 0;
    let finalContent = "";

    // 4. Agent Execution Loop (Model -> Tools -> Model)
    while (stepCount < maxSteps) {
      if (Date.now() - startTime > maxExecTimeMs) {
        this.logger.warn(`Execution timeout exceeded max limit (${maxExecTimeMs}ms)`, { requestId });
        warnings.push(`Execution timeout reached after ${stepCount} steps.`);
        break;
      }

      stepCount++;
      this.logger.info(`Agent step ${stepCount}/${maxSteps}`, { requestId });

      // Pre-flight cost budget check for paid API providers
      this.costManager.checkBudget(resolvedConfig.provider);

      const tools =
        this.config.agent.capabilities.tool_calling && resolvedConfig.capabilities.tool_calling
          ? this.toolRegistry.getToolDefinitions()
          : undefined;

      const modelStartTime = Date.now();

      // Model call wrapped in centralized retry handler with exponential backoff
      const retryResult = await executeWithRetry(
        async () => {
          return await provider.chatComplete(messages, tools, {
            modelOverride: options.modelOverride,
            temperatureOverride: options.temperatureOverride,
          });
        },
        this.config.model.retry,
        this.logger
      );

      const response = retryResult.result;
      const modelLatencyMs = Date.now() - modelStartTime;

      // Record token usage & cost metrics
      const estimatedPromptTokens = this.contextManager.estimateTokens(messages);
      const estimatedCompletionTokens = Math.ceil((response.content ? response.content.length : 0) / 4);
      this.costManager.recordUsage(
        resolvedConfig.provider,
        resolvedConfig.modelName,
        estimatedPromptTokens,
        estimatedCompletionTokens,
        modelLatencyMs
      );

      finalContent = response.content;

      // Handle tool calls if returned by model
      if (response.toolCalls && response.toolCalls.length > 0) {
        const allowedCallsThisStep = Math.min(
          this.config.tools.execution.max_calls_per_step,
          maxToolCallsPerRequest - totalToolCallsCount
        );

        if (allowedCallsThisStep <= 0) {
          this.logger.warn(`Max total tool calls per request (${maxToolCallsPerRequest}) reached. Halting tool calls.`, { requestId });
          warnings.push(`Tool call limit of ${maxToolCallsPerRequest} reached.`);
          break;
        }

        const selectedToolCalls = response.toolCalls.slice(0, allowedCallsThisStep);
        totalToolCallsCount += selectedToolCalls.length;
        messages.push({ role: "assistant", content: response.content || "", tool_calls: response.toolCalls });

        // Execute batch using policy-based execution (parallel read-only vs sequential write)
        const batchResults = await this.toolRegistry.executeBatch(
          selectedToolCalls,
          options.userConfirmationGranted
        );

        for (const res of batchResults) {
          if (res.error) {
            messages.push({
              role: "tool",
              name: res.name,
              tool_call_id: res.id,
              content: JSON.stringify({ error: res.error }),
            });
          } else {
            messages.push({
              role: "tool",
              name: res.name,
              tool_call_id: res.id,
              content: JSON.stringify(res.result),
            });
          }
        }

        // Compress context if tool results bloated history
        messages = this.contextManager.compressContext(messages);
      } else {
        // Model completed response without tool calls
        break;
      }
    }

    // 5. Validate Output
    const outputValidation = this.guardrails.validateOutput(finalContent);
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
      toolCallsCount: totalToolCallsCount,
      executionTimeMs,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Helper for streaming chat directly when streaming is enabled
   */
  async stream(options: AgentRunOptions): Promise<ReadableStream<Uint8Array>> {
    const resolvedConfig = resolveModelConfig(this.config, options.modelOverride, options.temperatureOverride);
    const provider = this.getProvider(resolvedConfig.provider);

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
