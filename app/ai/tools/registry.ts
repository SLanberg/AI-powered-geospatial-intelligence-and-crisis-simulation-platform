import { AiConfig, ToolExecutionPolicy } from "../types";
import { Guardrails } from "../safety/guardrails";

export interface ToolDefinition {
  name: string;
  description: string;
  isWriteOperation: boolean;
  parameters: Record<string, unknown>;
  policy: ToolExecutionPolicy;
  execute: (args: Record<string, unknown>) => Promise<unknown>;
}

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition>();
  private guardrails: Guardrails;

  constructor(config: AiConfig) {
    this.guardrails = new Guardrails(config);
    this.registerDefaultTools();
  }

  private registerDefaultTools() {
    const readOnlyPolicy: ToolExecutionPolicy = {
      mode: "parallel",
      requires_confirmation: false,
      idempotent: true,
      category: "read_only",
    };

    const writePolicy: ToolExecutionPolicy = {
      mode: "sequential",
      requires_confirmation: true,
      idempotent: false,
      category: "write",
    };

    // search_incidents
    this.registerTool({
      name: "search_incidents",
      description: "Search active grid anomalies and incidents in Tallinn.",
      isWriteOperation: false,
      policy: readOnlyPolicy,
      parameters: {
        type: "object",
        properties: {
          sector: { type: "string", description: "Grid sector (e.g. Vanalinn, Harju)" },
          severity: { type: "string", enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW"] },
        },
      },
      execute: async (args) => {
        const sector = (args.sector as string) || "All";
        return [
          { id: "INC-101", sector: sector, title: "Cascade frequency drop", severity: "CRITICAL", status: "ACTIVE" },
          { id: "INC-102", sector: "Vanalinn-Harju", title: "Transformer 4B thermal warning", severity: "HIGH", status: "ACTIVE" },
        ];
      },
    });

    // get_incident
    this.registerTool({
      name: "get_incident",
      description: "Get detailed telemetry for a specific incident by ID.",
      isWriteOperation: false,
      policy: readOnlyPolicy,
      parameters: {
        type: "object",
        properties: {
          incidentId: { type: "string" },
        },
        required: ["incidentId"],
      },
      execute: async (args) => {
        const id = args.incidentId as string;
        return {
          id,
          title: "Thermal Exceedance on Substation 4B",
          sector: "Vanalinn",
          voltage: "110kV",
          temperature_celsius: 87.4,
          threshold_celsius: 80.0,
          recommendation: "Shift 3.2MW load to Harju secondary loop.",
        };
      },
    });

    // query_gis
    this.registerTool({
      name: "query_gis",
      description: "Query geographic grid infrastructure features.",
      isWriteOperation: false,
      policy: readOnlyPolicy,
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
        },
      },
      execute: async (args) => {
        return {
          query: args.query,
          featuresFound: 4,
          bbox: [24.74, 59.43, 24.76, 59.44],
          nodes: ["Node-1420", "Node-1421", "Node-1422", "Node-1423"],
        };
      },
    });

    // get_weather
    this.registerTool({
      name: "get_weather",
      description: "Get current environmental conditions affecting transmission lines.",
      isWriteOperation: false,
      policy: readOnlyPolicy,
      parameters: {
        type: "object",
        properties: {
          location: { type: "string" },
        },
      },
      execute: async (args) => {
        return {
          location: args.location || "Tallinn",
          temp_celsius: -2,
          wind_speed_m_s: 14.2,
          ice_accumulation_mm: 1.5,
          alert: "High wind warning on overhead coastal lines.",
        };
      },
    });

    // search_infrastructure
    this.registerTool({
      name: "search_infrastructure",
      description: "Search grid assets, substations, and transmission lines.",
      isWriteOperation: false,
      policy: readOnlyPolicy,
      parameters: {
        type: "object",
        properties: {
          keyword: { type: "string" },
        },
      },
      execute: async (args) => {
        return {
          keyword: args.keyword,
          substations: ["Substation Vanalinn-1", "Substation Harju-2"],
          activeLines: 1420,
        };
      },
    });

    // create_incident
    this.registerTool({
      name: "create_incident",
      description: "Create a new grid anomaly report.",
      isWriteOperation: true,
      policy: writePolicy,
      parameters: {
        type: "object",
        properties: {
          title: { type: "string" },
          sector: { type: "string" },
        },
        required: ["title"],
      },
      execute: async (args) => {
        return { status: "created", id: "INC-999", title: args.title };
      },
    });
  }

  registerTool(tool: ToolDefinition) {
    this.tools.set(tool.name, tool);
  }

  getTool(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getToolDefinitions() {
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
      policy: t.policy,
    }));
  }

  async executeTool(name: string, args: Record<string, unknown>, userConfirmed = false): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool '${name}' is not registered.`);
    }

    const isWriteOrConfirmationRequired = tool.isWriteOperation || tool.policy.requires_confirmation;
    const check = this.guardrails.canExecuteTool(name, isWriteOrConfirmationRequired, userConfirmed);
    if (!check.valid) {
      throw new Error(`Permission denied for tool '${name}': ${check.reason}`);
    }

    return await tool.execute(args);
  }

  /**
   * Executes a batch of tool calls respecting execution policies.
   * Read-only tools with policy mode "parallel" execute concurrently via Promise.all.
   * Sequential/Write tools execute sequentially one by one.
   */
  async executeBatch(
    toolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }>,
    userConfirmed = false
  ): Promise<Array<{ id: string; name: string; result?: unknown; error?: string }>> {
    const results: Array<{ id: string; name: string; result?: unknown; error?: string }> = [];

    let currentParallelGroup: typeof toolCalls = [];

    const flushParallelGroup = async () => {
      if (currentParallelGroup.length === 0) return;
      const promises = currentParallelGroup.map(async (tc) => {
        try {
          const res = await this.executeTool(tc.name, tc.arguments, userConfirmed);
          return { id: tc.id, name: tc.name, result: res };
        } catch (err) {
          return { id: tc.id, name: tc.name, error: err instanceof Error ? err.message : String(err) };
        }
      });
      const groupResults = await Promise.all(promises);
      results.push(...groupResults);
      currentParallelGroup = [];
    };

    for (const tc of toolCalls) {
      const tool = this.tools.get(tc.name);
      const isParallel = tool ? tool.policy.mode === "parallel" : false;

      if (isParallel) {
        currentParallelGroup.push(tc);
      } else {
        // Flush any pending parallel calls first to maintain execution order
        await flushParallelGroup();
        // Execute sequential tool synchronously
        try {
          const res = await this.executeTool(tc.name, tc.arguments, userConfirmed);
          results.push({ id: tc.id, name: tc.name, result: res });
        } catch (err) {
          results.push({ id: tc.id, name: tc.name, error: err instanceof Error ? err.message : String(err) });
        }
      }
    }

    await flushParallelGroup();
    return results;
  }
}

