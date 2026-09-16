import { ILLMProvider, ProviderCompletionOptions, ProviderCompletionResult } from "./interface";

export class MockLLMProvider implements ILLMProvider {
  readonly name = "mock";

  async complete(options: ProviderCompletionOptions): Promise<ProviderCompletionResult> {
    const lastMessage = options.messages[options.messages.length - 1];
    const text = lastMessage?.content?.toLowerCase() || "";

    if (text.includes("search") || text.includes("incident") || text.includes("outage")) {
      return {
        content: "Searching Tallinn SCADA incidents for active telemetry anomalies...",
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

    if (text.includes("isolate") || text.includes("substation")) {
      return {
        content: "Inspecting substation EE-TLN-SUB-04 telemetry before recommending grid action.",
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

    return {
      content: `[NEURAL CITY AI - MOCK MODE] Received operational command: "${lastMessage?.content}". All grid telemetry channels operational. Standard operating procedures active.`,
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
