import { AiConfig, ChatMessage, ModelCapabilities } from "../types";
import { ModelProvider, ProviderResponse } from "./interface";
import { getModelCapabilities } from "../capabilities";

export class MockProvider implements ModelProvider {
  name = "mock";

  constructor(private config: AiConfig) {}

  getCapabilities(modelName?: string): ModelCapabilities {
    return getModelCapabilities("mock", modelName || this.config.model.name);
  }

  async chatComplete(messages: ChatMessage[]): Promise<ProviderResponse> {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

    if (lastUserMsg.toLowerCase().includes("incident")) {
      return {
        content: "I checked the system tools. Incident INC-101 is currently active with CRITICAL severity.",
      };
    }

    return {
      content: `[Mock AI Response]: Operating under ${this.config.app.name} (${this.config.model.name}). System telemetry nominal.`,
    };
  }
}

