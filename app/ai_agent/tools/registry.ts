import { z } from "zod";
import {
  searchIncidentsTool,
  createIncidentTool,
  updateIncidentTool,
  deleteIncidentTool,
} from "./definitions/incidentTools";
import { inspectSubstationTool, isolateGridSectorTool } from "./definitions/gridTools";
import { queryTrafficFlowTool, rerouteTrafficTool } from "./definitions/trafficTools";
import { dispatchEmergencyUnitTool } from "./definitions/dispatchTools";
import { queryVesselsTool, queryFlightsTool } from "./definitions/maritimeTools";
import { navigateMapTool, focusDistrictTool } from "./definitions/mapTools";

export interface ITool<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  isWriteOperation: boolean;
  inputSchema: z.ZodType<TInput>;
  outputSchema: z.ZodType<TOutput>;
  execute: (input: TInput) => Promise<TOutput>;
  parameters?: Record<string, unknown>;
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
    this.registerTool(updateIncidentTool);
    this.registerTool(deleteIncidentTool);
    this.registerTool(inspectSubstationTool);
    this.registerTool(isolateGridSectorTool);
    this.registerTool(queryTrafficFlowTool);
    this.registerTool(rerouteTrafficTool);
    this.registerTool(dispatchEmergencyUnitTool);
    this.registerTool(queryVesselsTool);
    this.registerTool(queryFlightsTool);
    this.registerTool(navigateMapTool);
    this.registerTool(focusDistrictTool);
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

  getToolsForProvider(): Array<{ name: string; description: string; parameters: Record<string, unknown> }> {
    return [
      {
        name: "navigate_map",
        description:
          "Fly the tactical map camera and focus the GIS viewport onto a specific location, address, gas station, emergency service, or district in Tallinn (e.g. 'Olerex AS Linnu tee tankla', 'Balti jaam', 'Kristiine').",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description:
                "Name of the location, facility, gas station, address, substation, or coordinates in Tallinn (e.g., 'Olerex AS Linnu tee tankla', 'Balti jaam', 'Kristiine', '59.4128, 24.7092')",
            },
            lat: { type: "number", description: "Direct latitude if known" },
            lng: { type: "number", description: "Direct longitude if known" },
            zoom: { type: "number", description: "Map zoom level (14-17 for POIs, 12-13 for districts)" },
            district: { type: "string", description: "District sector if known" },
            title: { type: "string", description: "Custom title for map banner" },
          },
          required: ["query"],
        },
      },
      {
        name: "focus_district",
        description: "Highlight a Tallinn district sector and position the map camera over its territory.",
        parameters: {
          type: "object",
          properties: {
            district: {
              type: "string",
              description:
                "District name in Tallinn (e.g. 'kristiine', 'vanalinn', 'ulemiste', 'mustamae', 'lasnamae', 'kesklinn', 'nomme', 'pirita', 'haabersti', 'pohja-tallinn')",
            },
            highlightIncidents: { type: "boolean", description: "Whether to highlight active incident hotspots" },
          },
          required: ["district"],
        },
      },
      {
        name: "search_incidents",
        description: "Search active grid anomalies, power outages, and incidents in Tallinn stored in SQLite DB.",
        parameters: {
          type: "object",
          properties: {
            severity: { type: "string", enum: ["critical", "warning", "info"] },
            sector: { type: "string", description: "District or sector name" },
            limit: { type: "number" },
          },
        },
      },
      {
        name: "create_incident",
        description: "Register a new grid anomaly, power outage, or infrastructure incident into Tallinn database.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Incident summary title" },
            category: { type: "string", description: "Category (e.g. Grid Failure, Traffic Flow, Cyber Security)" },
            severity: { type: "string", enum: ["critical", "warning", "info"] },
            district: { type: "string", description: "City district" },
            description: { type: "string", description: "Detailed description" },
            lat: { type: "number", description: "Latitude coordinate" },
            lng: { type: "number", description: "Longitude coordinate" },
          },
          required: ["title", "category", "severity", "district", "description"],
        },
      },
      {
        name: "update_incident",
        description: "Update details, severity, or operational status of an existing incident in the database.",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Incident ID to update" },
            title: { type: "string", description: "Updated title" },
            category: { type: "string", description: "Updated category" },
            severity: { type: "string", enum: ["critical", "warning", "info"] },
            status: { type: "string", enum: ["active", "investigating", "mitigated", "resolved"] },
            district: { type: "string", description: "Updated district" },
            description: { type: "string", description: "Updated description" },
            lat: { type: "number", description: "Updated latitude" },
            lng: { type: "number", description: "Updated longitude" },
          },
          required: ["id"],
        },
      },
      {
        name: "delete_incident",
        description: "Decommission and permanently remove an incident from the database.",
        parameters: {
          type: "object",
          properties: {
            id: { type: "string", description: "Incident ID to decommission" },
          },
          required: ["id"],
        },
      },
      {
        name: "inspect_substation",
        description: "Inspect electrical substation telemetry, frequency, load MW, and transformer status.",
        parameters: {
          type: "object",
          properties: {
            substation_id: { type: "string", description: "Substation ID (e.g., 'EE-TLN-SUB-04')" },
          },
          required: ["substation_id"],
        },
      },
      {
        name: "query_traffic_flow",
        description: "Query real-time vehicular traffic density and flow metrics along Tallinn corridors.",
        parameters: {
          type: "object",
          properties: {
            corridor_id: { type: "string" },
            district: { type: "string" },
          },
        },
      },
      {
        name: "reroute_traffic",
        description: "Initiate dynamic corridor rerouting to relieve congestion or clear emergency lanes.",
        parameters: {
          type: "object",
          properties: {
            corridor_id: { type: "string" },
            detour_route: { type: "string" },
            priority_mode: { type: "string", enum: ["EMERGENCY_ONLY", "BALANCED", "PUBLIC_TRANSIT"] },
            reason: { type: "string" },
          },
          required: ["corridor_id", "detour_route", "priority_mode", "reason"],
        },
      },
      {
        name: "dispatch_emergency_unit",
        description: "Dispatch civil defense, rescue, ambulance, or police units to a critical incident.",
        parameters: {
          type: "object",
          properties: {
            incident_id: { type: "string" },
            service_type: { type: "string", enum: ["RESCUE", "AMBULANCE", "POLICE"] },
            priority: { type: "string", enum: ["CODE_RED", "CODE_YELLOW", "CODE_GREEN"] },
            station_origin: { type: "string" },
            notes: { type: "string" },
          },
          required: ["incident_id", "service_type", "priority"],
        },
      },
      {
        name: "query_vessels",
        description: "Query maritime traffic and AIS vessel telemetry across Tallinn Bay.",
        parameters: {
          type: "object",
          properties: {
            status: { type: "string" },
            min_speed: { type: "number" },
            max_speed: { type: "number" },
            limit: { type: "number" },
          },
        },
      },
      {
        name: "query_flights",
        description: "Query airborne flight telemetry in Tallinn TMA.",
        parameters: {
          type: "object",
          properties: {
            min_altitude: { type: "number" },
            max_altitude: { type: "number" },
            limit: { type: "number" },
          },
        },
      },
    ];
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
