import { NextResponse } from "next/server";
import { executeAgent, streamAgent, loadAiConfig, ChatMessage } from "@/ai";

export const runtime = "nodejs";

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  return (
    (message.role === "user" || message.role === "assistant" || message.role === "system") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0
  );
}

export async function GET() {
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      messages?: unknown;
      model?: unknown;
      stream?: unknown;
      context?: unknown;
      temperature?: unknown;
    };

    const messages = Array.isArray(body.messages) ? body.messages.filter(isChatMessage) : [];

    if (messages.length === 0) {
      return NextResponse.json({ error: "At least one chat message is required." }, { status: 400 });
    }

    const requestedModel = typeof body.model === "string" && body.model.trim() ? body.model.trim() : undefined;
    const context = typeof body.context === "string" && body.context.trim() ? body.context.trim() : undefined;
    const temperature = typeof body.temperature === "number" ? body.temperature : undefined;
    const shouldStream = body.stream !== false;

    if (shouldStream) {
      try {
        const stream = await streamAgent({
          messages,
          context,
          modelOverride: requestedModel,
          temperatureOverride: temperature,
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Transfer-Encoding": "chunked",
            "X-Model": requestedModel ?? loadAiConfig().model.name,
          },
        });
      } catch (streamErr) {
        console.warn("Streaming unsupported or failed, falling back to execution:", streamErr);
      }
    }

    const result = await executeAgent({
      messages,
      context,
      modelOverride: requestedModel,
      temperatureOverride: temperature,
    });

    return NextResponse.json({
      content: result.content,
      model: result.model,
      stepsCount: result.stepsCount,
      executionTimeMs: result.executionTimeMs,
      warnings: result.warnings,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to execute AI agent harness.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}