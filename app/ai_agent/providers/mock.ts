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
        for (const word of words) {
          controller.enqueue(encoder.encode(word + " "));
          await new Promise((r) => setTimeout(r, 20));
        }
        controller.close();
      },
    });
  }
}
