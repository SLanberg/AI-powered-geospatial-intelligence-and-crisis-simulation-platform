import { z } from "zod";
import { ChatRoleSchema } from "@/shared";

export const DashboardChatMessageSchema = z.object({
  id: z.string(),
  role: ChatRoleSchema,
  content: z.string(),
  ts: z.string().optional(),
  isError: z.boolean().optional(),
  model: z.string().optional(),
  mapAction: z.any().optional(),
});
export type DashboardChatMessage = z.infer<typeof DashboardChatMessageSchema>;

export const ModelStatusSchema = z.object({
  status: z.enum(["checking", "online", "offline", "degraded"]),
  activeModel: z.string(),
  models: z.array(z.string()),
  provider: z.string(),
  error: z.string().optional(),
});
export type ModelStatus = z.infer<typeof ModelStatusSchema>;

export const SlashCommandSchema = z.object({
  cmd: z.string(),
  desc: z.string(),
  insertText: z.string(),
});
export type SlashCommand = z.infer<typeof SlashCommandSchema>;

export const AIAssistantPropsSchema = z.object({
  isOpen: z.boolean(),
  onClose: z.function(),
  context: z.string().nullable().optional(),
  onClearContext: z.function().optional(),
  onMapAction: z.function().optional(),
});
export type AIAssistantProps = z.infer<typeof AIAssistantPropsSchema>;
