import { AiConfig, McpServerConfig, ToolExecutionPolicy } from "../types";
import { ToolRegistry, ToolDefinition } from "../tools/registry";
import { AiLogger } from "../observability/logger";

export class McpSecurityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "McpSecurityError";
  }
}

export class McpTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "McpTimeoutError";
  }
}

export class McpResponseSizeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "McpResponseSizeError";
  }
}

export class McpManager {
  private config: AiConfig;
  private logger: AiLogger;
  private mcpToolCallsThisRequest = 0;

  constructor(config: AiConfig, logger?: AiLogger) {
    this.config = config;
    this.logger = logger ?? new AiLogger(config);
  }

  resetRequestState() {
    this.mcpToolCallsThisRequest = 0;
  }

  /**
   * Validates security requirements for an MCP server definition.
   */
  validateServerConfig(serverName: string, serverCfg: McpServerConfig) {
    const sec = this.config.mcp.security;

    // 1. Allowed transport check
    if (sec.allowed_transports && !sec.allowed_transports.includes(serverCfg.transport)) {
      throw new McpSecurityError(
        `MCP Server '${serverName}' transport '${serverCfg.transport}' is not allowed by configuration.`
      );
    }

    // 2. Remote server / Host allowlist check
    if (serverCfg.transport === "http" || serverCfg.transport === "websocket" || serverCfg.url) {
      if (!serverCfg.url) {
        throw new McpSecurityError(`MCP Server '${serverName}' requires a valid URL for transport '${serverCfg.transport}'.`);
      }

      let host = "";
      try {
        const parsedUrl = new URL(serverCfg.url);
        host = parsedUrl.hostname;
      } catch {
        throw new McpSecurityError(`MCP Server '${serverName}' has malformed URL '${serverCfg.url}'.`);
      }

      const isLocalhost = host === "localhost" || host === "127.0.0.1" || host === "::1";
      const isAllowedHost = sec.allowed_hosts ? sec.allowed_hosts.includes(host) : false;

      if (!sec.allow_remote_servers && !isLocalhost && !isAllowedHost) {
        throw new McpSecurityError(
          `MCP Server '${serverName}' host '${host}' is rejected. Remote servers are disabled and host is not in allowed_hosts.`
        );
      }
    }
  }

  /**
   * Adapts and registers configured MCP tools into the central ToolRegistry
   */
  registerMcpTools(toolRegistry: ToolRegistry) {
    if (!this.config.mcp.enabled) return;

    for (const [serverName, serverCfg] of Object.entries(this.config.mcp.servers)) {
      if (!serverCfg.enabled) continue;

      this.validateServerConfig(serverName, serverCfg);

      for (const toolName of serverCfg.tools.allow) {
        const policy: ToolExecutionPolicy = {
          mode: "parallel",
          requires_confirmation: false,
          idempotent: true,
          category: "read_only",
        };

        const mcpToolDef: ToolDefinition = {
          name: toolName,
          description: `[MCP Server: ${serverName}] Tool ${toolName}`,
          isWriteOperation: false,
          policy,
          parameters: {
            type: "object",
            properties: {
              query: { type: "string" },
            },
          },
          execute: async (args: Record<string, unknown>) => {
            return this.executeMcpTool(serverName, serverCfg, toolName, args);
          },
        };

        toolRegistry.registerTool(mcpToolDef);
      }
    }
  }

  /**
   * Executes an MCP tool call with security boundaries:
   * - Max tool calls per request enforcement
   * - Execution timeout
   * - Response size validation
   */
  async executeMcpTool(
    serverName: string,
    serverCfg: McpServerConfig,
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    const sec = this.config.mcp.security;

    // Check max tool calls per request limit
    this.mcpToolCallsThisRequest++;
    if (this.mcpToolCallsThisRequest > sec.max_tool_calls_per_request) {
      throw new McpSecurityError(
        `MCP tool call limit (${sec.max_tool_calls_per_request}) exceeded for this request.`
      );
    }

    const timeoutMs = (sec.timeout_seconds || 30) * 1000;
    const maxSizeBytes = (sec.max_response_size_mb || 5) * 1024 * 1024;

    const executePromise = (async () => {
      // Simulated MCP execution payload response
      const responseObj = {
        server: serverName,
        tool: toolName,
        args,
        status: "success",
        data: `MCP execution output from ${serverName} for tool ${toolName}`,
      };

      const responseString = JSON.stringify(responseObj);
      const byteSize = Buffer.byteLength(responseString, "utf-8");

      if (byteSize > maxSizeBytes) {
        throw new McpResponseSizeError(
          `MCP tool response size (${(byteSize / (1024 * 1024)).toFixed(2)}MB) exceeds limit of ${sec.max_response_size_mb}MB.`
        );
      }

      return responseObj;
    })();

    let timer: NodeJS.Timeout | null = null;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new McpTimeoutError(`MCP tool '${toolName}' execution timed out after ${sec.timeout_seconds}s.`));
      }, timeoutMs);
    });

    try {
      return await Promise.race([executePromise, timeoutPromise]);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
}
