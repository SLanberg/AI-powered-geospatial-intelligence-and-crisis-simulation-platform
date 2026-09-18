import { NextResponse } from "next/server";
import { validateBody } from "../middlewares/validate";
import { ChatRequestSchema } from "@/shared";
import { executeAgent, streamAgent, loadAiConfig } from "@/ai_agent";

export class ChatController {
  /**
   * GET /api/chat - Health check and available models
   */
  async getStatus(): Promise<NextResponse> {
    const config = loadAiConfig();
    const ollamaUrl = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
    const defaultModel = config.model.name;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${ollamaUrl.replace(/\/$/, "")}/api/tags`, {
        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      if (res.ok) {
        const data = (await res.json()) as { models?: Array<{ name: string; model: string }> };
        const models = data.models?.map((m) => m.name) ?? [];
        const hasDefault = models.some((m) => m.startsWith(defaultModel) || m === defaultModel);
        const activeModel = hasDefault ? defaultModel : (models[0] ?? defaultModel);

        return NextResponse.json({
          status: "online",
          provider: `${config.model.provider.toUpperCase()} Harness`,
          activeModel,
          models,
          harnessVersion: config.version,
          environment: config.app.environment,
        });
      }

      return NextResponse.json({
        status: "degraded",
        provider: `${config.model.provider.toUpperCase()} Harness`,
        activeModel: defaultModel,
        models: [],
        error: `Ollama returned status ${res.status}`,
      });
    } catch {
      return NextResponse.json({
        status: "offline",
        provider: `${config.model.provider.toUpperCase()} Harness`,
        activeModel: defaultModel,
        models: [],
        error: "Ollama is not running or unreachable on " + ollamaUrl,
      });
    }
  }

  /**
   * POST /api/chat - Execute AI agent or stream tokens
   */
  async handleChat(request: Request): Promise<Response> {
    try {
      const validation = await validateBody(request, ChatRequestSchema);
      if (!validation.success) {
        return validation.response;
      }

      const { messages, model, context, temperature, stream } = validation.data;

      if (stream !== false) {
        try {
          const streamResult = await streamAgent({
            messages,
            context,
            modelOverride: model,
            temperatureOverride: temperature,
          });

          return new Response(streamResult, {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "Transfer-Encoding": "chunked",
              "X-Model": model ?? loadAiConfig().model.name,
            },
          });
        } catch (streamErr) {
          console.warn("Streaming unavailable, falling back to non-streaming execution:", streamErr);
        }
      }

      const result = await executeAgent({
        messages,
        context,
        modelOverride: model,
        temperatureOverride: temperature,
      });

      return NextResponse.json({
        content: result.content,
        model: result.model,
        stepsCount: result.stepsCount,
        executionTimeMs: result.executionTimeMs,
        warnings: result.warnings,
        mapAction: result.mapAction,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to execute AI agent.";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }
}

export const chatController = new ChatController();
