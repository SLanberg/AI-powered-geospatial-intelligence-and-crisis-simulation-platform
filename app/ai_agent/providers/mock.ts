import { ILLMProvider, ProviderCompletionOptions, ProviderCompletionResult } from "./interface";
import { incidentsService } from "@/backend/services/incidents.service";

export class MockLLMProvider implements ILLMProvider {
  readonly name = "mock";

  async complete(options: ProviderCompletionOptions): Promise<ProviderCompletionResult> {
    const lastMessage = options.messages[options.messages.length - 1];
    const text = lastMessage?.content?.toLowerCase() || "";

    // Query actual database incidents
    let dbIncidents: Array<{
      id: string;
      title: string;
      severity: string;
      category: string;
      status: string;
      district?: string | null;
      nodeId?: string | null;
      description: string;
      timestamp?: string;
    }> = [];
    try {
      dbIncidents = await incidentsService.getIncidents();
    } catch {
      dbIncidents = [];
    }

    if (
      text.includes("name yourself") ||
      text.includes("who are you") ||
      text.includes("what is your name") ||
      text.includes("introduce yourself") ||
      text.includes("кто ты") ||
      text.includes("представься")
    ) {
      return {
        content: "I am **Cassandra**, the autonomous command and control assistant for the Tallinn Municipal Crisis & SCADA Operations Center and the Multi-Hazard Disaster Replay & Simulation Engine. I monitor real-time electrical grid telemetry, municipal traffic corridors, emergency facilities, and hydrodynamic disaster simulations.",
        usage: { promptTokens: 25, completionTokens: 45, totalTokens: 70 },
      };
    }

    if (text.includes("hear me") || text.includes("hello") || text.includes("hi") || text.includes("status")) {
      return {
        content: "Loud and clear. Cassandra SCADA Agent is online and monitoring Tallinn Central Command Center telemetry. Power grids, transport corridors, and emergency services are operating within normal parameters. How can I assist you with city operations?",
        usage: { promptTokens: 25, completionTokens: 45, totalTokens: 70 },
      };
    }

    if (
      text.includes("nepal") ||
      text.includes("непал") ||
      text.includes("langtang") ||
      text.includes("лангтанг") ||
      text.includes("trishuli") ||
      text.includes("тришули") ||
      text.includes("cascade") ||
      text.includes("каскад") ||
      text.includes("replay") ||
      text.includes("реплей") ||
      text.includes("rasuwagadhi") ||
      text.includes("syabrubesi") ||
      text.includes("betrawati") ||
      text.includes("galchhi") ||
      text.includes("devghat") ||
      text.includes("muglin")
    ) {
      return {
        content: `### NEPAL CRYOSPHERE-HYDRO CASCADE • DISASTER ASSESSMENT

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
[FRANCE 24: Nepal flood disaster reconstructed minute by minute](https://www.youtube.com/watch?v=ORPDEvHJZpA)`,
        usage: { promptTokens: 50, completionTokens: 180, totalTokens: 230 },
      };
    }

    // 2. SCADA Grid, Substation, Transformer & Incident Queries
    if (
      text.includes("transformer") ||
      text.includes("surge") ||
      text.includes("feeder") ||
      text.includes("vanalinn") ||
      text.includes("ülemiste") ||
      text.includes("ulemiste") ||
      text.includes("substation") ||
      text.includes("grid") ||
      text.includes("incident") ||
      text.includes("outage") ||
      text.includes("briefing") ||
      text.includes("brief") ||
      text.includes("anomaly") ||
      text.includes("anomalies") ||
      text.includes("инцидент") ||
      text.includes("авария") ||
      text.includes("отключение") ||
      text.includes("трансформатор") ||
      text.includes("сводка") ||
      text.includes("alerts")
    ) {
      if (dbIncidents.length === 0) {
        return {
          content: `### ⚡ TALLINN SCADA OPERATIONAL PICTURE • TELEMETRY & GRID STATUS

**Database Incident Registry:** 🟢 **ALL SYSTEMS NOMINAL (0 Active Incidents in DB)**

- **Active Incidents:** 0 recorded in database.
- **Electrical Substations & Transformers:** All substations (including Vanalinn #4 Substation and Ülemiste Smart Feeders) are operating within nominal parameters.
- **Telemetry Voltage & Frequency:** Stable 50.0 Hz frequency, normal bus voltages (110 kV / 10 kV), zero tripped circuit breakers.
- **District Impact:** 0 households experiencing outages. Kristiine, Kesklinn, and Ülemiste corridors are fully supplied.

All telemetry pipelines report normal operations. No isolation or emergency intervention is required.`,
          usage: { promptTokens: 40, completionTokens: 90, totalTokens: 130 },
        };
      }

      const critical = dbIncidents.filter((i) => i.severity === "critical");
      const warning = dbIncidents.filter((i) => i.severity === "warning");
      const listText = dbIncidents
        .map(
          (inc, idx) =>
            `${idx + 1}. **[${inc.severity.toUpperCase()}] ${inc.title}** \`[${inc.nodeId || inc.id}]\`\n   - **District:** ${inc.district || "Tallinn"} • **Category:** ${inc.category}\n   - **Status:** ${inc.status}\n   - **Details:** ${inc.description}`
        )
        .join("\n\n");

      return {
        content: `### 🚨 TALLINN SCADA OPERATIONAL PICTURE • INCIDENT BRIEFING

**System Status:** **${dbIncidents.length} Active SCADA Incidents in Database** (${critical.length} Critical, ${warning.length} Warning)

---

${listText}

---

**Summary:** Response units are monitoring active nodes. Would you like to inspect a specific substation or locate an incident on the GIS map?`,
        usage: { promptTokens: 60, completionTokens: 180, totalTokens: 240 },
      };
    }

    // 3. Operational Picture Overview
    if (
      text.includes("operational picture") ||
      text.includes("оперативная обстановка") ||
      text.includes("оперативная картина") ||
      text.includes("command center") ||
      text.includes("c2 map")
    ) {
      return {
        content: `**TALLINN MUNICIPAL OPERATIONAL PICTURE (C2 COMMAND MAP)**

The **Operational Picture** provides the real-time situational awareness layer for Tallinn City Command:
- **Electrical & SCADA Grid:** Live telemetry across substations, transmission lines, and transformers. Currently **${dbIncidents.length} active incidents** in database.
- **Urban Transport Corridors:** Live tracking of bus fleets, emergency response vehicles, and junction signal controllers.
- **Maritime & Aerial Traffic:** Live AIS vessel positioning across Tallinn Bay and ADS-B flight vectors in Tallinn TMA airspace.
- **Emergency GIS Infrastructure:** Hospital trauma centers, rescue stations, police precincts, and critical shelter facilities.
- **Active SCADA Incidents:** Real-time logging of verified grid surges, traffic freezes, water telemetry anomalies, and substation thermal alerts.

*To inspect an incident or navigate to any sector, ask me to fly to the coordinates or request an incident briefing.*`,
        usage: { promptTokens: 40, completionTokens: 140, totalTokens: 180 },
      };
    }

    const hasNavIntent =
      /^(fly(\s+me)?\s+to|navigate(\s+to|\s+the\s+map\s+to)?|move(\s+the)?\s+map\s+to|take\s+me\s+to|go\s+to|center\s+on|zoom\s+(in\s+on|to)|focus(\s+on|\s+map\s+on)?|where\s+is\s+the|where\s+is)\b/i.test(
        text
      ) || /\b(show|locate|pinpoint|find)\b.*\b(on\s+(the\s+)?map|on\s+gis|where\s+(it|this)\s+is)\b/i.test(text);

    if (hasNavIntent) {
      let query =
        lastMessage?.content
          ?.replace(
            /^(fly(\s+me)?\s+to|navigate(\s+to|\s+the\s+map\s+to)?|move(\s+the)?\s+map\s+to|take\s+me\s+to|go\s+to|center\s+on|zoom\s+(in\s+on|to)|focus(\s+on|\s+map\s+on)?|where\s+is\s+the|where\s+is)\s+/i,
            ""
          )
          .replace(/\s+(on\s+(the\s+)?map|on\s+gis|where\s+(it|this)\s+is)$/i, "")
          .trim() || lastMessage?.content || "Tallinn Central";

      if (text.includes("airport") || text.includes("tll") || text.includes("lennujaam")) {
        query = "Tallinn Lennart Meri Airport (TLL)";
      }

      return {
        content: `Initiating tactical GIS camera flight and viewport telemetry lock on "${query}". Locking onto GPS coordinates and updating situational overlay...`,
        toolCalls: [
          {
            id: `call_${Date.now()}`,
            name: "navigate_map",
            arguments: { query },
          },
        ],
        usage: { promptTokens: 30, completionTokens: 30, totalTokens: 60 },
      };
    }

    if (text.includes("search") || text.includes("incident") || text.includes("outage") || text.includes("report")) {
      return {
        content: "Searching Tallinn SCADA incidents for active telemetry anomalies and reported sector outages...",
        toolCalls: [
          {
            id: `call_${Date.now()}`,
            name: "search_incidents",
            arguments: { sector: "Vanalinn" },
          },
        ],
        usage: { promptTokens: 35, completionTokens: 25, totalTokens: 60 },
      };
    }

    if (text.includes("isolate") || text.includes("substation") || text.includes("grid")) {
      return {
        content: "Inspecting substation EE-TLN-SUB-04 telemetry before recommending grid isolation procedures.",
        toolCalls: [
          {
            id: `call_${Date.now()}`,
            name: "inspect_substation",
            arguments: { substation_id: "EE-TLN-SUB-04" },
          },
        ],
        usage: { promptTokens: 40, completionTokens: 30, totalTokens: 70 },
      };
    }

    if (text.includes("traffic") || text.includes("reroute") || text.includes("bus") || text.includes("road")) {
      return {
        content: "Analyzing Tallinn urban traffic corridors. Current flow rate across major arterial intersections is nominal at 94% capacity.",
        usage: { promptTokens: 30, completionTokens: 35, totalTokens: 65 },
      };
    }

    return {
      content: `Cassandra AI online. Processed operational query: "${lastMessage?.content}". All grid telemetry channels operational. Standard SCADA operating procedures active. How else can I assist?`,
      usage: { promptTokens: 25, completionTokens: 35, totalTokens: 60 },
    };
  }

  async stream(options: ProviderCompletionOptions): Promise<ReadableStream<Uint8Array>> {
    const encoder = new TextEncoder();
    const result = await this.complete(options);
    const words = result.content.split(" ");

    return new ReadableStream({
      async start(controller) {
        // Natural thinking pause before first token is streamed
        await new Promise((r) => setTimeout(r, 650));

        for (const word of words) {
          controller.enqueue(encoder.encode(word + " "));
          await new Promise((r) => setTimeout(r, 20));
        }
        controller.close();
      },
    });
  }
}
