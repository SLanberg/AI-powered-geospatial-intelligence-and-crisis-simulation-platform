import { z } from "zod";

/**
 * Chat Message Role Schema
 */
export const ChatRoleSchema = z.enum(["user", "assistant", "system", "tool"]);
export type ChatRole = z.infer<typeof ChatRoleSchema>;

/**
 * Chat Message Schema
 */
export const ChatMessageSchema = z.object({
  role: ChatRoleSchema,
  content: z.string().default(""),
  name: z.string().optional(),
  tool_call_id: z.string().optional(),
});
export type ChatMessage = z.infer<typeof ChatMessageSchema>;

/**
 * Chat Execution Request Payload Schema
 */
export const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1, "At least one chat message is required"),
  model: z.string().optional(),
  context: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  stream: z.boolean().default(true),
});
export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/**
 * Non-streaming Chat Execution Response Schema
 */
export const ChatResponseSchema = z.object({
  content: z.string(),
  model: z.string(),
  stepsCount: z.number().nonnegative(),
  executionTimeMs: z.number().nonnegative(),
  warnings: z.array(z.string()).optional(),
  mapAction: z.record(z.string(), z.unknown()).optional(),
});
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

/**
 * Chat Health / Model Status Response Schema
 */
export const ChatHealthStatusSchema = z.object({
  status: z.enum(["online", "degraded", "offline"]),
  provider: z.string(),
  activeModel: z.string(),
  models: z.array(z.string()),
  harnessVersion: z.string().optional(),
  environment: z.string().optional(),
  error: z.string().optional(),
});
export type ChatHealthStatus = z.infer<typeof ChatHealthStatusSchema>;
