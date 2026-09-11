import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are Neural City Grid AI, a local operations assistant for the Tallinn electrical grid command dashboard.

Known current telemetry:
- Grid status: CRITICAL, TIER-1 protocol active since 08:47
- Frequency: 49.92 Hz, nominal 50.00 Hz, deviation -0.08 Hz
- Transmission loss: 0.04%
- Active nodes: 1,420 of 1,424
- Active anomalies: 6
- Main concern: cascade propagation from the Vanalinn-Harju sector

Answer concisely and operationally. Use the known telemetry when relevant, distinguish dashboard data from assumptions, and never invent live measurements or claim that an action was executed. For safety, recommendations are advisory and should be verified by qualified grid operators. Plain text only; use short headings and numbered lists when useful.`;

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== "object") return false;
  const message = value as Record<string, unknown>;
  return (
    (message.role === "user" || message.role === "assistant") &&
    typeof message.content === "string" &&
    message.content.trim().length > 0
  );
}

export async function GET() {
  const ollamaUrl = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
  const defaultModel = process.env.OLLAMA_MODEL ?? "qwen2.5:7b";

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
        provider: "Ollama (Local)",
        activeModel,
        models,
      });
    }

    return NextResponse.json({
      status: "degraded",
      provider: "Ollama (Local)",
      activeModel: defaultModel,
      models: [],
      error: `Ollama returned status ${res.status}`,
    });
  } catch (error) {
    return NextResponse.json({
      status: "offline",
      provider: "Ollama (Local)",
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
    };
    const messages = Array.isArray(body.messages) ? body.messages.filter(isChatMessage) : [];

    if (messages.length === 0) {
      return NextResponse.json({ error: "At least one chat message is required." }, { status: 400 });
    }

    const ollamaUrl = process.env.OLLAMA_BASE_URL ?? "http://127.0.0.1:11434";
    const requestedModel = typeof body.model === "string" && body.model.trim() ? body.model.trim() : null;
    const model = requestedModel ?? process.env.OLLAMA_MODEL ?? "qwen2.5:7b";
    const shouldStream = body.stream !== false;

    let systemPrompt = SYSTEM_PROMPT;
    if (typeof body.context === "string" && body.context.trim()) {
      systemPrompt += `\n\nLive Telemetry / Dashboard Context:\n${body.context.trim()}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    let response: Response;
    try {
      response = await fetch(`${ollamaUrl.replace(/\/$/, "")}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          stream: shouldStream,
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          options: { temperature: 0.2, num_ctx: 4096 },
        }),
        signal: controller.signal,
      });
    } finally {
      if (!shouldStream) {
        clearTimeout(timeout);
      }
    }

    if (!response.ok) {
      clearTimeout(timeout);
      const details = await response.text();
      return NextResponse.json(
        { error: `Ollama returned ${response.status}. ${details || "Check that the model is installed."}` },
        { status: 502 },
      );
    }

    if (shouldStream) {
      if (!response.body) {
        clearTimeout(timeout);
        return NextResponse.json({ error: "Ollama returned no readable stream." }, { status: 502 });
      }

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      let buffer = "";

      const transformStream = new TransformStream({
        transform(chunk, streamController) {
          buffer += decoder.decode(chunk, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const parsed = JSON.parse(trimmed);
              if (parsed.message?.content) {
                streamController.enqueue(encoder.encode(parsed.message.content));
              }
            } catch {
              // Ignore partial JSON
            }
          }
        },
        flush(streamController) {
          clearTimeout(timeout);
          if (buffer.trim()) {
            try {
              const parsed = JSON.parse(buffer.trim());
              if (parsed.message?.content) {
                streamController.enqueue(encoder.encode(parsed.message.content));
              }
            } catch {
              // Ignore
            }
          }
        },
      });

      return new Response(response.body.pipeThrough(transformStream), {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
          "X-Model": model,
        },
      });
    }

    const result = (await response.json()) as { message?: { content?: string } };
    const content = result.message?.content?.trim();
    if (!content) {
      return NextResponse.json({ error: "Ollama returned an empty response." }, { status: 502 });
    }

    return NextResponse.json({ content, model });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "AbortError"
        ? "Ollama took too long to respond. Try a shorter question or a smaller model."
        : "Cannot reach Ollama. Start Ollama and confirm the selected model is installed.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}