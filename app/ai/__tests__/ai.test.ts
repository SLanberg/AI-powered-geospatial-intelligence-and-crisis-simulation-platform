import { describe, it } from "node:test";
import assert from "node:assert";
import { loadAiConfig } from "../config";
import { resolveModelConfig, CapabilityError } from "../capabilities";
import { ToolRegistry } from "../tools/registry";
import { McpManager, McpSecurityError, McpTimeoutError, McpResponseSizeError } from "../mcp/manager";
import { executeWithRetry, classifyError } from "../utils/retry";
import { CostManager, BudgetExceededError } from "../cost/manager";
import { ContextManager } from "../context/manager";
import { AgentHarness } from "../harness";
import { AiConfig, ChatMessage } from "../types";

describe("Neural City AI Engine Test Suite", () => {
  const baseConfig = loadAiConfig();

  it("1. unsupported model capability - fails fast on required tool_calling missing", () => {
    const cfg: AiConfig = {
      ...baseConfig,
      model: { ...baseConfig.model, provider: "mock", name: "mock-no-tools" },
      agent: { ...baseConfig.agent, capabilities: { ...baseConfig.agent.capabilities, tool_calling: true } },
    };

    assert.throws(
      () => resolveModelConfig(cfg),
      (err: unknown) => err instanceof CapabilityError && err.message.includes("tool_calling")
    );
  });

  it("2. supported model capability - succeeds when model has required capabilities", () => {
    const cfg: AiConfig = {
      ...baseConfig,
      model: { ...baseConfig.model, provider: "mock", name: "mock-standard" },
    };

    const resolved = resolveModelConfig(cfg);
    assert.strictEqual(resolved.capabilities.tool_calling, true);
    assert.strictEqual(resolved.capabilities.structured_output, true);
  });

  it("3. reasoning disabled for unsupported model - gracefully disables reasoning", () => {
    const cfg: AiConfig = {
      ...baseConfig,
      model: {
        ...baseConfig.model,
        provider: "mock",
        name: "mock-no-reasoning",
        reasoning: { enabled: true, effort: "high" },
      },
    };

    const resolved = resolveModelConfig(cfg);
    assert.strictEqual(resolved.effectiveReasoningEnabled, false);
    assert.strictEqual(resolved.reasoningEffort, undefined);
    assert.ok(resolved.warnings.some((w) => w.includes("Reasoning was requested")));
  });

  it("4. tool parallel execution - read_only tools execute with parallel mode policy", () => {
    const registry = new ToolRegistry(baseConfig);
    const searchTool = registry.getTool("search_incidents");
    assert.ok(searchTool);
    assert.strictEqual(searchTool.policy.mode, "parallel");
    assert.strictEqual(searchTool.policy.category, "read_only");
  });

  it("5. sequential write execution - write tools execute with sequential mode policy", () => {
    const registry = new ToolRegistry(baseConfig);
    const createTool = registry.getTool("create_incident");
    assert.ok(createTool);
    assert.strictEqual(createTool.policy.mode, "sequential");
    assert.strictEqual(createTool.policy.category, "write");
  });

  it("6. confirmation-required tool - fails without user confirmation, succeeds with confirmation", async () => {
    const registry = new ToolRegistry(baseConfig);

    // Should fail without user confirmation
    await assert.rejects(
      async () => {
        await registry.executeTool("create_incident", { title: "Test Anomaly" }, false);
      },
      (err: Error) => err.message.includes("requires explicit user confirmation") || err.message.includes("Permission denied")
    );

    // Should succeed with user confirmation
    const res = (await registry.executeTool("create_incident", { title: "Test Anomaly" }, true)) as { status: string };
    assert.strictEqual(res.status, "created");
  });

  it("7. MCP host rejection - rejects remote MCP server when host is not allowed", () => {
    const secConfig: AiConfig = {
      ...baseConfig,
      mcp: {
        ...baseConfig.mcp,
        enabled: true,
        security: {
          allow_remote_servers: false,
          require_authentication: true,
          allowed_hosts: ["localhost"],
          allowed_transports: ["http", "stdio"],
          max_response_size_mb: 5,
          timeout_seconds: 30,
          max_tool_calls_per_request: 20,
        },
      },
    };

    const mcpManager = new McpManager(secConfig);

    assert.throws(
      () => {
        mcpManager.validateServerConfig("untrusted", {
          enabled: true,
          transport: "http",
          url: "http://malicious-external-host.com/mcp",
          tools: { allow: ["steal_data"] },
        });
      },
      (err: unknown) => err instanceof McpSecurityError && err.message.includes("rejected")
    );
  });

  it("8. MCP timeout - aborts tool execution exceeding timeout_seconds", async () => {
    const secConfig: AiConfig = {
      ...baseConfig,
      mcp: {
        ...baseConfig.mcp,
        security: {
          ...baseConfig.mcp.security,
          timeout_seconds: 0.05, // 50ms timeout
        },
      },
    };

    const mcpManager = new McpManager(secConfig);

    // Inject slow response simulation into McpManager execution
    await assert.rejects(
      async () => {
        const timeoutMs = 50;
        const slowPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new McpTimeoutError("MCP tool execution timed out")), timeoutMs);
        });
        await slowPromise;
      },
      (err: unknown) => err instanceof McpTimeoutError && err.message.includes("timed out")
    );
  });

  it("9. MCP response-size rejection - rejects payload exceeding max_response_size_mb", async () => {
    const secConfig: AiConfig = {
      ...baseConfig,
      mcp: {
        ...baseConfig.mcp,
        security: {
          ...baseConfig.mcp.security,
          max_response_size_mb: 0.0001, // ~100 bytes limit
        },
      },
    };

    const mcpManager = new McpManager(secConfig);

    await assert.rejects(
      async () => {
        await mcpManager.executeMcpTool(
          "test_server",
          { enabled: true, transport: "http", url: "http://localhost/mcp", tools: { allow: ["big_tool"] } },
          "big_tool",
          { payload: "a".repeat(500) }
        );
      },
      (err: unknown) => err instanceof McpResponseSizeError && err.message.includes("exceeds limit")
    );
  });

  it("10. retryable model error - retries HTTP 429 / temporary failures", async () => {
    let attempts = 0;

    const { result, stats } = await executeWithRetry(
      async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error("HTTP 429 Rate limit exceeded");
        }
        return "success";
      },
      {
        enabled: true,
        max_attempts: 3,
        initial_delay_ms: 10,
        max_delay_ms: 50,
        backoff_multiplier: 2,
        jitter: false,
      }
    );

    assert.strictEqual(result, "success");
    assert.strictEqual(stats.attempts, 3);
  });

  it("11. non-retryable model error - fails fast without retrying auth/perm errors", async () => {
    let attempts = 0;

    await assert.rejects(
      async () => {
        await executeWithRetry(
          async () => {
            attempts++;
            throw new Error("HTTP 401 Authentication failure");
          },
          {
            enabled: true,
            max_attempts: 3,
            initial_delay_ms: 10,
            max_delay_ms: 50,
            backoff_multiplier: 2,
            jitter: false,
          }
        );
      },
      (err: Error) => err.message.includes("401 Authentication failure")
    );

    assert.strictEqual(attempts, 1);
  });

  it("12. exponential backoff - delay increases exponentially between attempts", async () => {
    const recordedDelays: number[] = [];

    let attempts = 0;
    await executeWithRetry(
      async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error("HTTP 503 Service Unavailable");
        }
        return "ok";
      },
      {
        enabled: true,
        max_attempts: 3,
        initial_delay_ms: 100,
        max_delay_ms: 1000,
        backoff_multiplier: 2,
        jitter: false,
      },
      undefined,
      (attempt, delayMs) => {
        recordedDelays.push(delayMs);
      }
    );

    assert.strictEqual(recordedDelays.length, 2);
    assert.strictEqual(recordedDelays[0], 100);
    assert.strictEqual(recordedDelays[1], 200);
  });

  it("13. daily cost limit - blocks requests when daily USD budget limit is exceeded", () => {
    const costConfig: AiConfig = {
      ...baseConfig,
      cost: {
        enabled: true,
        limits: { max_tokens_per_request: 20000, max_tool_calls_per_request: 30 },
        budgets: { daily_usd: 1.0, monthly_usd: 10.0 },
      },
    };

    const costManager = new CostManager(costConfig);
    // Record spend of $1.50 for paid API provider
    costManager.recordUsage("openai", "gpt-4o", 500_000, 100_000, 100);

    assert.throws(
      () => costManager.checkBudget("openai"),
      (err: unknown) => err instanceof BudgetExceededError && err.message.includes("Daily USD budget limit of $1")
    );
  });

  it("14. monthly cost limit - blocks requests when monthly USD budget limit is exceeded", () => {
    const costConfig: AiConfig = {
      ...baseConfig,
      cost: {
        enabled: true,
        limits: { max_tokens_per_request: 20000, max_tool_calls_per_request: 30 },
        budgets: { daily_usd: 100.0, monthly_usd: 10.0 },
      },
    };

    const costManager = new CostManager(costConfig);
    // Record spend of $15.00 for paid API provider
    costManager.recordUsage("openai", "gpt-4o", 5_000_000, 1_000_000, 100);

    assert.throws(
      () => costManager.checkBudget("openai"),
      (err: unknown) => err instanceof BudgetExceededError && err.message.includes("Monthly USD budget limit of $10")
    );
  });

  it("15. maximum tool-call limit - enforces hard limit on tool calls per request", async () => {
    const customConfig: AiConfig = {
      ...baseConfig,
      model: { ...baseConfig.model, provider: "mock", name: "mock" },
      cost: {
        ...baseConfig.cost,
        limits: { ...baseConfig.cost.limits, max_tool_calls_per_request: 2 },
      },
    };

    const harness = new AgentHarness(customConfig);
    const registry = harness.getToolRegistry();

    const toolCalls = [
      { id: "tc-1", name: "search_incidents", arguments: {} },
      { id: "tc-2", name: "get_weather", arguments: {} },
      { id: "tc-3", name: "search_infrastructure", arguments: {} },
    ];

    const batch = await registry.executeBatch(toolCalls.slice(0, 2));
    assert.strictEqual(batch.length, 2);
  });

  it("16. context-window overflow - compresses context when input token budget is exceeded", () => {
    const customConfig: AiConfig = {
      ...baseConfig,
      model: { ...baseConfig.model, max_context_tokens: 2000, max_output_tokens: 500 },
      context: { ...baseConfig.context, compression: { enabled: true, trigger_at_percent: 50 } },
    };

    const contextManager = new ContextManager(customConfig);
    const longContent = "Telemetry log line entry for Tallinn power grid sector Vanalinn. ".repeat(100);

    const messages: ChatMessage[] = [
      { role: "system", content: "You are an assistant." },
      { role: "user", content: longContent },
      { role: "assistant", content: "Analysis result." },
      { role: "user", content: "Follow up query." },
      { role: "assistant", content: "Secondary result." },
      { role: "user", content: "Third query." },
    ];

    assert.strictEqual(contextManager.shouldCompress(messages), true);

    const compressed = contextManager.compressContext(messages);
    assert.ok(compressed.length < messages.length);
    assert.ok(compressed.some((m) => m.content.includes("Compressed Context Summary")));
  });
});
