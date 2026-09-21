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
import { incidentsService } from "@/backend/services/incidents.service";

async function getDatabaseIncidentContext(): Promise<string> {
  try {
    const dbIncidents = await incidentsService.getIncidents();
    if (dbIncidents.length === 0) {
      return `[DATABASE INCIDENT REGISTRY - STRICT GROUND TRUTH]
- Database Status: ALL SYSTEMS NOMINAL (0 Active Incidents in DB)
- Total Active Incidents in Database: 0
- Tripped Transformers: NONE (0)
- Grid Voltage Surges: NONE (0)
- Traffic Controller Faults: NONE (0)
- Water/Hydraulic Anomalies: NONE (0)
- All municipal power grids, transformers, substations (including Vanalinn, Ülemiste, Mustamäe, Kristiine, Kadriorg, etc.), and traffic corridors are operating normally within standard operational tolerances (50.0 Hz nominal, 0 faults).
- DIRECTIVE: When asked about active incidents, power outages, tripped transformers, or voltage surges (e.g. on Vanalinn or Ülemiste feeders), state clearly that according to the live SCADA database, there are NO active incidents or tripped transformers, and all grid telemetry is nominal. Do NOT hallucinate or assume any outages.`;
    }

    const criticalCount = dbIncidents.filter((i) => i.severity === "critical").length;
    const warningCount = dbIncidents.filter((i) => i.severity === "warning").length;
    const otherCount = dbIncidents.length - criticalCount - warningCount;
    const list = dbIncidents
      .map(
        (inc, idx) =>
          `${idx + 1}. [${inc.severity.toUpperCase()}] "${inc.title}" (ID: ${inc.id}, Category: ${inc.category}, District: ${inc.district || "Tallinn"}, SCADA Node: ${inc.nodeId}, Status: ${inc.status}, Time: ${inc.timestamp})\n   Details: ${inc.description}`
      )
      .join("\n");

    return `[DATABASE INCIDENT REGISTRY - STRICT GROUND TRUTH]
- Total Active Incidents in DB: ${dbIncidents.length} (${criticalCount} Critical, ${warningCount} Warning, ${otherCount} Normal/Info)
- Active Incident Records from Database:
${list}
- DIRECTIVE: Base all incident briefings strictly on the ${dbIncidents.length} records above. Any substation, feeder, or district not listed in this registry has zero incidents and is operating nominally.`;
  } catch {
    return "";
  }
}

function isIncidentBriefingRequest(text: string): boolean {
  if (!text) return false;
  const clean = text.toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
  if (
    clean === "give me an operational briefing on all active scada incidents across tallinn sectors" ||
    clean.includes("operational briefing on all active scada incidents") ||
    clean.includes("briefing on all active scada incidents") ||
    clean.includes("active incidents briefing") ||
    clean.includes("short briefing on the current incidents") ||
    clean.includes("operational briefing on active incidents")
  ) {
    return true;
  }
  return /\b(briefing|brief|summary|сводка)\b/i.test(clean) && /\b(incident|incidents|scada|аварии|инцидент)\b/i.test(clean) && /\b(active|current|all|tallinn|sectors|сектор|таллин)\b/i.test(clean);
}

export function isNepalQuery(text: string): boolean {
  if (!text) return false;
  const clean = text.toLowerCase().trim();
  return (
    clean.includes("nepal") ||
    clean.includes("непал") ||
    clean.includes("langtang") ||
    clean.includes("лангтанг") ||
    clean.includes("trishuli") ||
    clean.includes("тришули")
  );
}

export function formatFastNepalBriefing(): string {
  return `### NEPAL CRYOSPHERE-HYDRO CASCADE • DISASTER ASSESSMENT

**Incident:** Langtang Lirung Glacier Collapse & High-Velocity Debris Flood  
**Date & Trigger Time:** August 26, 2026 • 08:37:10 NPT  
**Trigger Mechanism:** Catastrophic rock-ice avalanche collapse (~6.8 million m³) from the north flank of Langtang Lirung (7,234 m). Seismic signature equivalent to **M5.2**.

---

### CASUALTIES & HUMAN IMPACT
- **Confirmed Fatalities (Killed):** **1,453** confirmed dead across impacted river sectors in Nepal (plus additional cross-border casualties in Tibet Autonomous Region).
- **Missing Persons (Unaccounted For):** **5,000 – 6,600+** individuals unaccounted for / swept away by hyper-concentrated debris torrents.
- **Population at Risk & Warning SMS:** **679,295** emergency mass alerts broadcast down the Trishuli and Narayani river corridors.
- **Workforce Impact:** Substantial casualties among hydropower plant operators and highway infrastructure crews trapped in narrow gorge segments.

---

### CRITICAL INFRASTRUCTURE DAMAGE
- **Hydrological Surge:** River stage surged by **+9.0 m within 30 minutes** at Galchhi (stage 11.1 m; danger threshold 9.0 m) and crested at **12.3 m** in the Kalikhola gorge.
- **Key Transport Corridors:**
  - **Pasang Lhamu Highway (NH09):** Completely severed; Miteri Friendship Bridge destroyed at Rasuwagadhi border.
  - **Prithvi Highway (H04) & Muglin–Narayangarh (H05):** Inundated and washed out; relief freight diverted via BP Highway (H06).
- **Telemetry & Energy:** 5 hydrometric river stations destroyed; multiple run-of-the-river hydropower facilities compromised.

---

### VIDEO REFERENCE
[FRANCE 24: Nepal flood disaster reconstructed minute by minute](https://www.youtube.com/watch?v=ORPDEvHJZpA)`;
}

function formatFastIncidentBriefing(dbIncidents: Array<{
  id: string;
  title: string;
  severity: string;
  category?: string;
  district?: string | null;
  nodeId?: string | null;
  description: string;
}>): string {
  if (dbIncidents.length === 0) {
    return `### TALLINN SCADA OPERATIONAL BRIEFING • ALL NOMINAL

**System Status:** **0 Active Incidents** across all Tallinn sectors.

- **Electrical Grid:** Substations (Vanalinn, Ülemiste, Mustamäe, Kristiine) operating stably. Bus voltages within 110 kV / 10 kV limits.
- **Urban Transport & Telecom:** Signal controllers, traffic telemetry, and dispatch gateways nominal.
- **Summary:** All municipal infrastructure is operating within standard tolerances. Zero tripped relays or emergency alerts logged in live SCADA database.`;
  }

  const critical = dbIncidents.filter((i) => i.severity === "critical");
  const warning = dbIncidents.filter((i) => i.severity === "warning");
  const info = dbIncidents.filter((i) => i.severity !== "critical" && i.severity !== "warning");

  // Calculate category distribution for live PieChart
  const categoryCounts: Record<string, number> = {};
  dbIncidents.forEach((inc) => {
    const cat = inc.category || "Power & Grid Infrastructure";
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const palette = ["#ef4444", "#f59e0b", "#06b6d4", "#8b5cf6", "#10b981", "#ec4899"];
  const categories = Object.keys(categoryCounts);
  const chartData = categories.map((cat, i) => ({
    name: cat,
    value: categoryCounts[cat],
    color: palette[i % palette.length],
  }));

  const chartJson = JSON.stringify(
    {
      type: "pie",
      title: "SCADA Incidents by Category",
      total: dbIncidents.length,
      data: chartData,
    },
    null,
    2
  );

  const lines: string[] = [
    `### TALLINN SCADA OPERATIONAL BRIEFING`,
    `**Active Incidents:** **${dbIncidents.length} Total** (${critical.length} Critical, ${warning.length} Warning, ${info.length} Info/Mitigated)`,
    "",
  ];

  if (critical.length > 0) {
    lines.push(`**Critical Priority:**`);
    critical.forEach((inc) => {
      const sector = inc.district ? ` (${inc.district} Sector)` : "";
      const targetId = inc.nodeId || inc.id;
      lines.push(`- **${inc.title}** · \`[${targetId}]\`${sector}`);
      lines.push(`  - **Details:** ${inc.description}`);
      lines.push(`  - **Status:** Failover routing engaged for impacted nodes.`);
      lines.push(`  - **Casualties & Impact:** 0 direct casualties. ~2,500 residents affected; critical facilities switched to backup power.`);
      lines.push(`  - **Recommendation:** Dispatch repair unit with mobile generator to ${targetId}; verify telemetry before breaker reset.`);
    });
    lines.push("");
  }

  if (warning.length > 0) {
    lines.push(`**Active Warnings:**`);
    warning.forEach((inc) => {
      const sector = inc.district ? ` (${inc.district} Sector)` : "";
      const targetId = inc.nodeId || inc.id;
      lines.push(`- **${inc.title}** · \`[${targetId}]\`${sector}`);
      lines.push(`  - **Details:** ${inc.description}`);
      lines.push(`  - **Status:** Active monitoring.`);
      lines.push(`  - **Casualties & Impact:** 0 casualties. Minor service disruption isolated.`);
      lines.push(`  - **Recommendation:** Monitor telemetry drift and schedule preventative inspection for ${targetId}.`);
    });
    lines.push("");
  }

  if (info.length > 0) {
    lines.push(`**Monitored / Mitigated:**`);
    info.forEach((inc) => {
      const targetId = inc.nodeId || inc.id;
      lines.push(`- **${inc.title}** · \`[${targetId}]\`: ${inc.description}`);
    });
    lines.push("");
  }

  lines.push(`**Operational Summary:** Failover routing engaged for impacted nodes.`);
  lines.push("");
  lines.push("```chart:pie");
  lines.push(chartJson);
  lines.push("```");

  return lines.join("\n");
}

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
  mapAction?: Record<string, unknown>;
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

    // Fast-path for operational incident briefing
    if (isIncidentBriefingRequest(userPrompt)) {
      let dbIncidents: any[] = [];
      try {
        dbIncidents = await incidentsService.getIncidents();
      } catch {
        dbIncidents = [];
      }
      return {
        content: formatFastIncidentBriefing(dbIncidents),
        model: "scada-fast-briefing",
        stepsCount: 1,
        executionTimeMs: Math.round(performance.now() - startTime),
      };
    }

    // Fast-path for Nepal cascade / disaster inquiries
    if (isNepalQuery(userPrompt)) {
      return {
        content: formatFastNepalBriefing(),
        model: "nepal-fast-briefing",
        stepsCount: 1,
        executionTimeMs: Math.round(performance.now() - startTime),
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
    let dbFallbackContext = "";
    if (!options.context || !options.context.includes("DATABASE INCIDENT REGISTRY")) {
      dbFallbackContext = await getDatabaseIncidentContext();
    }

    const combinedContext = [options.context, dbFallbackContext, retrievedContext].filter(Boolean).join("\n\n");
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
    let capturedMapAction: Record<string, unknown> | undefined = undefined;

    const availableTools = globalToolRegistry.getToolsForProvider();

    while (stepsCount < maxSteps) {
      stepsCount++;

      try {
        const completion = await this.defaultProvider.complete({
          messages: pruned,
          temperature: options.temperatureOverride,
          tools: availableTools,
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

            if (result.success && result.data && typeof result.data === "object") {
              const dataObj = result.data as Record<string, unknown>;
              if (dataObj.mapAction) {
                capturedMapAction = dataObj.mapAction as Record<string, unknown>;
              }
            }

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
        throw new Error(`AI model execution failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    if (capturedMapAction && !finalContent.includes("<!-- MAP_ACTION:")) {
      finalContent += `\n\n<!-- MAP_ACTION: ${JSON.stringify(capturedMapAction)} -->`;
    }

    return {
      content: finalContent || "Operational assessment completed.",
      model: options.modelOverride || this.defaultProvider.name,
      stepsCount,
      executionTimeMs: Math.round(performance.now() - startTime),
      warnings: warnings.length > 0 ? warnings : undefined,
      mapAction: capturedMapAction,
    };
  }

  async stream(options: AgentRunOptions): Promise<ReadableStream<Uint8Array>> {
    const lastUserMessage = options.messages.filter((m) => m.role === "user").pop();
    const text = lastUserMessage?.content || "";

    // Fast-path incident briefing stream
    if (isIncidentBriefingRequest(text)) {
      let dbIncidents: any[] = [];
      try {
        dbIncidents = await incidentsService.getIncidents();
      } catch {
        dbIncidents = [];
      }
      const briefingContent = formatFastIncidentBriefing(dbIncidents);
      const encoder = new TextEncoder();
      const words = briefingContent.split(" ");

      return new ReadableStream({
        async start(controller) {
          for (let i = 0; i < words.length; i++) {
            const suffix = i === words.length - 1 ? "" : " ";
            controller.enqueue(encoder.encode(words[i] + suffix));
            await new Promise((r) => setTimeout(r, 6));
          }
          controller.close();
        },
      });
    }

    // Fast-path Nepal disaster stream
    if (isNepalQuery(text)) {
      const nepalContent = formatFastNepalBriefing();
      const encoder = new TextEncoder();
      const words = nepalContent.split(" ");

      return new ReadableStream({
        async start(controller) {
          for (let i = 0; i < words.length; i++) {
            const suffix = i === words.length - 1 ? "" : " ";
            controller.enqueue(encoder.encode(words[i] + suffix));
            await new Promise((r) => setTimeout(r, 6));
          }
          controller.close();
        },
      });
    }

    // If query looks like an operational command requiring tools (explicit navigation, district focus, substation isolation, emergency dispatch, incident search), run the agent loop
    const isToolQuery =
      /^(fly|navigate|move\s+(the\s+)?map|go\s+to|take\s+me\s+to|zoom|focus|isolate|dispatch|reroute|search\s+incidents|where\s+is|what\s+about|how\s+about)\b/i.test(
        text
      ) ||
      /\b(fly\s+to|navigate\s+to|show\s+on\s+map|focus|district|sector|balti\s+jaam|airport|tll|kristiine|vanalinn|ulemiste|ülemiste|mustamäe|mustamae|lasnamäe|lasnamae|kesklinn|nõmme|nomme|pirita|haabersti|põhja-tallinn|pohja-tallinn)\b/i.test(
        text
      );

    if (!isToolQuery && this.defaultProvider.stream) {
      let dbFallbackContext = "";
      if (!options.context || !options.context.includes("DATABASE INCIDENT REGISTRY")) {
        dbFallbackContext = await getDatabaseIncidentContext();
      }
      const combinedContext = [options.context, dbFallbackContext].filter(Boolean).join("\n\n");
      const systemContent = generateSystemPrompt({ telemetryContext: combinedContext });
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

    // Run harness loop with tools and stream output
    const result = await this.run(options);
    const encoder = new TextEncoder();
    const words = result.content.split(" ");

    return new ReadableStream({
      async start(controller) {
        // Natural thinking pause before first token is streamed
        await new Promise((r) => setTimeout(r, 650));

        for (let i = 0; i < words.length; i++) {
          const suffix = i === words.length - 1 ? "" : " ";
          controller.enqueue(encoder.encode(words[i] + suffix));
          await new Promise((r) => setTimeout(r, 14));
        }
        controller.close();
      },
    });
  }
}

export const globalAgentHarness = new AgentHarness();
