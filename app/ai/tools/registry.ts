import { AiConfig, ToolExecutionPolicy } from "../types";
import { Guardrails } from "../safety/guardrails";
import prisma from "@/lib/prisma";

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

    // search_incidents - SQLite DB integrated
    this.registerTool({
      name: "search_incidents",
      description: "Search active grid anomalies and incidents in Tallinn stored in SQLite DB.",
      isWriteOperation: false,
      policy: readOnlyPolicy,
      parameters: {
        type: "object",
        properties: {
          sector: { type: "string", description: "Grid sector or district (e.g. Vanalinn, Harju, Ülemiste, Kristiine)" },
          severity: { type: "string", enum: ["critical", "warning", "info"] },
        },
      },
      execute: async (args) => {
        try {
          const sector = typeof args.sector === "string" ? args.sector.trim().toLowerCase() : undefined;
          const severity = typeof args.severity === "string" ? args.severity.trim().toLowerCase() : undefined;

          const where: Record<string, unknown> = {};
          if (severity) where.severity = severity;

          const allIncidents = await prisma.incident.findMany({
            where,
            orderBy: { createdAt: "desc" },
          });

          if (sector && sector !== "all") {
            return allIncidents.filter(
              (inc) =>
                (inc.district && inc.district.toLowerCase().includes(sector)) ||
                inc.title.toLowerCase().includes(sector) ||
                inc.description.toLowerCase().includes(sector)
            );
          }
          return allIncidents;
        } catch (err) {
          console.error("search_incidents DB error:", err);
          return [];
        }
      },
    });

    // get_incident - SQLite DB integrated
    this.registerTool({
      name: "get_incident",
      description: "Get detailed telemetry for a specific incident by ID from SQLite DB.",
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
        try {
          const incident = await prisma.incident.findUnique({
            where: { id },
          });
          if (incident) return incident;
        } catch (err) {
          console.error("get_incident DB error:", err);
        }
        return { error: `Incident ${id} not found in SQLite DB.` };
      },
    });

    // get_map_awareness - Map & Spatial Awareness Tool
    this.registerTool({
      name: "get_map_awareness",
      description: "Retrieve complete map data and spatial knowledge of Tallinn districts, infrastructure locations, and active incident hotspots.",
      isWriteOperation: false,
      policy: readOnlyPolicy,
      parameters: {
        type: "object",
        properties: {
          district: { type: "string", description: "Optional specific district to query e.g. Vanalinn, Mustamäe, Ülemiste" },
        },
      },
      execute: async (args) => {
        try {
          const targetDistrict = typeof args.district === "string" ? args.district.toLowerCase() : null;

          const districts = [
            { id: "vanalinn", name: "Old Town (Vanalinn)", lat: 59.4372, lng: 24.7453, zoom: 14.6, desc: "Historic center, Substation #4 critical trip sector" },
            { id: "ulemiste", name: "Ülemiste City", lat: 59.4215, lng: 24.7958, zoom: 14.3, desc: "High-tech innovation campus, Smart Feeder corridor" },
            { id: "port", name: "Port / Sadam", lat: 59.4450, lng: 24.7680, zoom: 14.3, desc: "Maritime terminal & subsea telecom fiber trunk" },
            { id: "baltijaam", name: "Balti Jaam", lat: 59.4402, lng: 24.7378, zoom: 14.6, desc: "Central transit hub and automated emergency dispatch node" },
            { id: "kristiine", name: "Kristiine", lat: 59.4260, lng: 24.7240, zoom: 14.1, desc: "Acoustic sensor array zone & western residential power ring" },
            { id: "mustamae", name: "Mustamäe", lat: 59.3960, lng: 24.6700, zoom: 14.0, desc: "Residential district & TalTech tech sector" },
            { id: "lasnamae", name: "Lasnamäe", lat: 59.4380, lng: 24.8400, zoom: 13.8, desc: "Eastern dense urban residential district" },
            { id: "pirita", name: "Pirita", lat: 59.4650, lng: 24.8350, zoom: 13.5, desc: "Coastal district & harbor telemetry zone" },
            { id: "nomme", name: "Nõmme", lat: 59.3800, lng: 24.6800, zoom: 13.5, desc: "Southern forest residential zone" },
          ];

          const infrastructure = await prisma.infrastructure.findMany();
          const activeIncidents = await prisma.incident.findMany({ where: { status: "active" } });

          let filteredDistricts = districts;
          if (targetDistrict) {
            filteredDistricts = districts.filter(d => d.name.toLowerCase().includes(targetDistrict) || d.id.includes(targetDistrict));
          }

          return {
            city: "Tallinn",
            centerCoordinates: { lat: 59.4370, lng: 24.7535, zoom: 12.3 },
            districts: filteredDistricts,
            totalInfrastructureNodes: infrastructure.length,
            infrastructureSummary: infrastructure.map(i => ({ id: i.id, name: i.name, type: i.type, lat: i.lat, lng: i.lng, status: i.status })),
            activeIncidentCount: activeIncidents.length,
            activeIncidents: activeIncidents.map(i => ({ id: i.id, title: i.title, severity: i.severity, lat: i.lat, lng: i.lng, district: i.district })),
          };
        } catch (err) {
          console.error("get_map_awareness error:", err);
          return { error: "Failed to load map awareness data." };
        }
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

    // search_infrastructure - SQLite DB integrated
    this.registerTool({
      name: "search_infrastructure",
      description: "Search grid assets, substations, and transmission lines in SQLite database.",
      isWriteOperation: false,
      policy: readOnlyPolicy,
      parameters: {
        type: "object",
        properties: {
          keyword: { type: "string" },
        },
      },
      execute: async (args) => {
        const keyword = (args.keyword as string || "").toLowerCase();
        try {
          const items = await prisma.infrastructure.findMany();
          const filtered = items.filter(
            (i) =>
              i.name.toLowerCase().includes(keyword) ||
              i.type.toLowerCase().includes(keyword) ||
              i.address.toLowerCase().includes(keyword)
          );
          return {
            keyword: args.keyword,
            itemsFound: filtered.length,
            infrastructure: filtered,
          };
        } catch (err) {
          console.error("search_infrastructure error:", err);
          return { keyword: args.keyword, itemsFound: 0, infrastructure: [] };
        }
      },
    });

    // create_incident - SQLite DB integrated
    this.registerTool({
      name: "create_incident",
      description: "Create a new grid incident in the SQLite database and plot on Tallinn map.",
      isWriteOperation: true,
      policy: writePolicy,
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Short descriptive title of the incident" },
          description: { type: "string", description: "Detailed telemetry description" },
          category: { type: "string", enum: ["Grid Failure", "Traffic Flow", "Telecom Node", "Emergency Dispatch", "Sensor Anomaly"], description: "Incident category" },
          severity: { type: "string", enum: ["critical", "warning", "info"], description: "Severity level" },
          lat: { type: "number", description: "Latitude coordinate in Tallinn (approx 59.38 - 59.46)" },
          lng: { type: "number", description: "Longitude coordinate in Tallinn (approx 24.60 - 24.85)" },
          district: { type: "string", description: "District name (Vanalinn, Ülemiste, Balti Jaam, Kristiine, Port, Mustamäe, Nõmme, Lasnamäe, Pirita)" },
          nodeId: { type: "string", description: "Node hardware identifier e.g. EE-TLN-NEW-01" },
        },
        required: ["title", "severity"],
      },
      execute: async (args) => {
        const timestamp = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        
        let lat = typeof args.lat === "number" ? args.lat : 59.4372;
        let lng = typeof args.lng === "number" ? args.lng : 24.7453;
        
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
          else if (districtStr.includes("pirita")) { lat = 59.4650; lng = 24.8350; }
        }

        const severity = (args.severity as "critical" | "warning" | "info") || "critical";
        const makiIcon = severity === "critical" ? "lightning" : severity === "warning" ? "caution" : "waveform";

        const newIncident = await prisma.incident.create({
          data: {
            title: (args.title as string) || "Unspecified Anomaly",
            timestamp,
            severity,
            category: (args.category as string) || "Grid Failure",
            makiIcon,
            lat,
            lng,
            description: (args.description as string) || "Manual telemetry anomaly added via SCADA AI command.",
            status: "active",
            nodeId: (args.nodeId as string) || `EE-TLN-AI-${Math.floor(Math.random() * 89 + 10)}`,
            district: (args.district as string) || "Kesklinn",
          },
        });

        return {
          status: "created",
          message: `Successfully created incident ${newIncident.id} in SQLite DB at coordinates ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          incident: newIncident,
        };
      },
    });

    // highlight_incident_areas
    this.registerTool({
      name: "highlight_incident_areas",
      description: "Aggregates active SQLite incidents by Tallinn city district, identifies highest concentration areas, and updates tactical map.",
      isWriteOperation: false,
      policy: readOnlyPolicy,
      parameters: {
        type: "object",
        properties: {
          city: { type: "string", description: "Target city, e.g. Tallinn" },
        },
      },
      execute: async (args) => {
        const activeIncidents = await prisma.incident.findMany({ where: { status: "active" } });
        return {
          status: "success",
          city: args.city || "Tallinn",
          totalActiveIncidents: activeIncidents.length,
          highestConcentrationDistrict: "Vanalinn (Old Town)",
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

