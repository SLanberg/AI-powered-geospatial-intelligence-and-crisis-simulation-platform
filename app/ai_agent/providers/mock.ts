import { ILLMProvider, ProviderCompletionOptions, ProviderCompletionResult } from "./interface";

export class MockLLMProvider implements ILLMProvider {
  readonly name = "mock";

  async complete(options: ProviderCompletionOptions): Promise<ProviderCompletionResult> {
    const lastMessage = options.messages[options.messages.length - 1];
    const text = lastMessage?.content?.toLowerCase() || "";

    if (text.includes("hear me") || text.includes("hello") || text.includes("hi") || text.includes("status")) {
      return {
        content: "Loud and clear. Neural City SCADA Agent is online and monitoring Tallinn Central Command Center telemetry. Power grids, transport corridors, and emergency services are operating within normal parameters. How can I assist you with city operations?",
        usage: { promptTokens: 25, completionTokens: 45, totalTokens: 70 },
      };
    }

    if (text.includes("nepal") || text.includes("langtang") || text.includes("trishuli") || text.includes("cascade replay")) {
      return {
        content: `**NEPAL CASCADE REPLAY • LANGTANG - TRISHULI CORRIDOR**

**Operational Incident Summary:**
- **Trigger Event (08:37:10 NPT):** Massive 6.8M m³ rock-ice avalanche collapse on the north flank of Langtang Lirung (7,234m). Seismic energy equivalent to M5.2.
- **Corridor Hydrodynamics:** Catastrophic debris flow and hyper-concentrated sediment wave raced through the upper Trishuli Gorge.
- **Downstream Pulse Propagation:**
  - **Rasuwagadhi Border Post (~08:44 NPT):** Flow arrival 6–7 min post-trigger; gauge compromised.
  - **Syabrubesi (09:00 - 09:25 NPT):** Water stage peaked at +6.2m; cable bridges severed.
  - **Betrawati & Galchhi (10:00 - 10:28 NPT):** +9m flood crest over 30 min at Galchhi gauge.
  - **Muglin & Devghat Confluence (13:00 - 16:00 NPT):** Peak attenuated to 6.57m at Narayani junction.
- **Civil Defense Warning:** 679,295 emergency mass SMS alerts dispatched to downstream populations along the NH09 / H04 / H05 highway corridors.`,
        usage: { promptTokens: 45, completionTokens: 90, totalTokens: 135 },
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
      content: `Neural City AI online. Processed operational query: "${lastMessage?.content}". All grid telemetry channels operational. Standard SCADA operating procedures active. How else can I assist?`,
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
