import { z } from "zod";
import { searchIncidentsTool, createIncidentTool } from "./definitions/incidentTools";
import { inspectSubstationTool, isolateGridSectorTool } from "./definitions/gridTools";
import { queryTrafficFlowTool, rerouteTrafficTool } from "./definitions/trafficTools";
import { dispatchEmergencyUnitTool } from "./definitions/dispatchTools";
import { queryVesselsTool, queryFlightsTool } from "./definitions/maritimeTools";

export interface ITool<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  isWriteOperation: boolean;
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  execute: (input: TInput) => Promise<TOutput>;
}

export interface ToolCallResult {
  tool: string;
  success: boolean;
  data?: unknown;
  error?: string;
  executionTimeMs: number;
}

export class ToolRegistry {
  private tools: Map<string, ITool<unknown, unknown>> = new Map();

  constructor() {
    this.registerDefaultTools();
  }

  registerTool<TInput, TOutput>(tool: ITool<TInput, TOutput>): void {
    this.tools.set(tool.name, tool as unknown as ITool<unknown, unknown>);
  }

  private registerDefaultTools(): void {
    this.registerTool(searchIncidentsTool);
    this.registerTool(createIncidentTool);
    this.registerTool(inspectSubstationTool);
    this.registerTool(isolateGridSectorTool);
    this.registerTool(queryTrafficFlowTool);
    this.registerTool(rerouteTrafficTool);
    this.registerTool(dispatchEmergencyUnitTool);
    this.registerTool(queryVesselsTool);
    this.registerTool(queryFlightsTool);
  }

  hasTool(name: string): boolean {
    return this.tools.has(name);
  }

  getTool(name: string): ITool<unknown, unknown> | undefined {
    return this.tools.get(name);
  }

  listTools(): Array<{ name: string; description: string; isWriteOperation: boolean }> {
    return Array.from(this.tools.values()).map((t) => ({
      name: t.name,
      description: t.description,
      isWriteOperation: t.isWriteOperation,
    }));
  }

  /**
   * Execute a tool with runtime Zod input validation and output parsing
   */
  async execute(name: string, rawArgs: unknown): Promise<ToolCallResult> {
    const startTime = performance.now();
    const tool = this.tools.get(name);

    if (!tool) {
      return {
        tool: name,
        success: false,
        error: `Tool "${name}" is not registered in AI Tool Registry.`,
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    try {
      // 1. Strict Zod Input Validation
      const parsedArgs = tool.inputSchema.parse(rawArgs);

      // 2. Execute Tool Logic
      const rawOutput = await tool.execute(parsedArgs);

      // 3. Strict Zod Output Validation
      const parsedOutput = tool.outputSchema.parse(rawOutput);

      return {
        tool: name,
        success: true,
        data: parsedOutput,
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    } catch (err) {
      const errorMessage =
        err instanceof z.ZodError
          ? `Parameter validation failed: ${err.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`
          : err instanceof Error
          ? err.message
          : "Unknown error during tool execution";

      return {
        tool: name,
        success: false,
        error: errorMessage,
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }
  }
}

export const globalToolRegistry = new ToolRegistry();
