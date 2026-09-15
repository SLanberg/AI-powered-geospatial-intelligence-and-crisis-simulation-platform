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
      description: "Create a new grid incident on the Tallinn map.",
      isWriteOperation: true,
      policy: writePolicy,
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short descriptive title of the incident" },
          description: { type: "string", description: "Detailed telemetry description" },
          category: { type: "string", enum: ["Grid Failure", "Traffic Flow", "Telecom Node", "Emergency Dispatch", "Sensor Anomaly"], description: "Incident category" },
          severity: { type: "string", enum: ["critical", "warning", "info"], description: "Severity level" },
          lat: { type: "number", description: "Latitude coordinate in Tallinn (approx 59.41 - 59.46)" },
          lng: { type: "number", description: "Longitude coordinate in Tallinn (approx 24.70 - 24.82)" },
          district: { type: "string", description: "District name (Vanalinn, Ülemiste, Balti Jaam, Kristiine, Port, Mustamäe, Nõmme, Lasnamäe)" },
          nodeId: { type: "string", description: "Node hardware identifier e.g. EE-TLN-NEW-01" },
        },
        required: ["title", "severity"],
      },
      execute: async (args) => {
        const id = `INC-${new Date().getHours().toString().padStart(2, "0")}${new Date().getMinutes().toString().padStart(2, "0")}-${Math.floor(Math.random() * 89 + 10)}`;
        const timestamp = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        
        let lat = typeof args.lat === "number" ? args.lat : 59.4372;
        let lng = typeof args.lng === "number" ? args.lng : 24.7453;
        
        // District coordinate mapping fallback if specific lat/lng not supplied
        const districtStr = (args.district as string || "").toLowerCase();
        if (!args.lat || !args.lng) {
          if (districtStr.includes("vanalinn") || districtStr.includes("old town")) { lat = 59.4372; lng = 24.7453; }
          else if (districtStr.includes("ulemiste") || districtStr.includes("ülemiste")) { lat = 59.4215; lng = 24.7958; }
          else if (districtStr.includes("port") || districtStr.includes("sadam")) { lat = 59.4450; lng = 24.7680; }
          else if (districtStr.includes("balti")) { lat = 59.4402; lng = 24.7378; }
          else if (districtStr.includes("kristiine")) { lat = 59.4260; lng = 24.7240; }
          else if (districtStr.includes("mustam")) { lat = 59.3960; lng = 24.6700; }
          else if (districtStr.includes("lasnam")) { lat = 59.4380; lng = 24.8400; }
          else if (districtStr.includes("nõmme") || districtStr.includes("nomme")) { lat = 59.3800; lng = 24.6800; }
        }

        const newIncident = {
          id,
          title: (args.title as string) || "Unspecified Anomaly",
          timestamp,
          severity: (args.severity as "critical" | "warning" | "info") || "critical",
          category: (args.category as any) || "Grid Failure",
          makiIcon: args.severity === "critical" ? "lightning" : args.severity === "warning" ? "caution" : "waveform",
          lat,
          lng,
          description: (args.description as string) || "Manual telemetry anomaly added via SCADA AI command.",
          status: "active",
          nodeId: (args.nodeId as string) || `EE-TLN-AI-${Math.floor(Math.random() * 89 + 10)}`,
        };

        return {
          status: "created",
          message: `Successfully created incident ${id} at coordinates ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          incident: newIncident,
        };
      },
    });

    // highlight_incident_areas
    this.registerTool({
      name: "highlight_incident_areas",
      description: "Aggregates incidents by Tallinn city district, identifies highest concentration areas, and updates the tactical map.",
      isWriteOperation: false,
      policy: readOnlyPolicy,
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "Target city, e.g. Tallinn" },
        },
      },
      execute: async (args) => {
        return {
          status: "success",
          city: args.city || "Tallinn",
          highestConcentrationDistrict: "Vanalinn (Old Town)",
          incidentCount: 2,
          districts: [
            { name: "Vanalinn", count: 2, severity: "CRITICAL" },
            { name: "Balti Jaam", count: 1, severity: "WARNING" },
            { name: "Ülemiste", count: 1, severity: "CRITICAL" },
            { name: "Port / Sadam", count: 1, severity: "INFO" },
            { name: "Kristiine", count: 1, severity: "WARNING" },
          ],
          mapAction: "highlight_high_density",
        };
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

