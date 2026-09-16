"use server";

import { executeAgent } from "@/ai_agent";
import { ChatRequestSchema, ChatResponse, ChatResponseSchema } from "@/shared";

export interface ServerActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Execute AI Agent prompt with strict Zod validation
 */
export async function executeChatAction(
  rawRequest: unknown
): Promise<ServerActionResult<ChatResponse>> {
  try {
    const validatedRequest = ChatRequestSchema.parse(rawRequest);
    const result = await executeAgent({
      messages: validatedRequest.messages,
      context: validatedRequest.context,
      modelOverride: validatedRequest.model,
      temperatureOverride: validatedRequest.temperature,
    });

    const parsedResponse = ChatResponseSchema.parse({
      content: result.content,
      model: result.model,
      stepsCount: result.stepsCount,
      executionTimeMs: result.executionTimeMs,
      warnings: result.warnings,
    });

    return { success: true, data: parsedResponse };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to execute chat";
    return { success: false, error: message };
  }
}
