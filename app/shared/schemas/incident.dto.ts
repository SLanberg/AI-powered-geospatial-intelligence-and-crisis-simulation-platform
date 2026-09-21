import { z } from "zod";
import { SeveritySchema } from "./common.dto";

/**
 * Incident Category Enum Schema
 */
export const IncidentCategorySchema = z.enum([
  "Grid Failure",
  "Traffic Flow",
  "Telecom Node",
  "Emergency Dispatch",
  "Sensor Anomaly",
  "Cyber Security",
  "Water Infrastructure",
]);
export type IncidentCategory = z.infer<typeof IncidentCategorySchema>;

/**
 * Incident Maki Icon Schema
 */
export const MakiIconNameSchema = z.enum([
  "lightning",
  "caution",
  "traffic-light",
  "emergency-phone",
  "communications-tower",
  "waveform",
  "fire-station",
  "hospital",
  "police",
  "water",
  "car",
  "bus",
  "rail",
  "hazard",
  "alert",
  "drone",
  "uav",
  "default",
]);
export type MakiIconName = z.infer<typeof MakiIconNameSchema>;

/**
 * Core Incident Domain Entity Schema
 */
export const IncidentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, "Title cannot be empty"),
  timestamp: z.string().min(1),
  severity: SeveritySchema,
  category: z.string().min(1),
  makiIcon: z.string().default("caution"),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  description: z.string().min(1),
  status: z.enum(["active", "investigating", "mitigated", "resolved"]).default("active"),
  nodeId: z.string().min(1),
  district: z.string().nullable().optional(),
  createdAt: z.date().or(z.string()).optional(),
  updatedAt: z.date().or(z.string()).optional(),
});
export type Incident = z.infer<typeof IncidentSchema>;

/**
 * Incident Creation Request Payload Schema
 */
export const CreateIncidentPayloadSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  severity: SeveritySchema.default("critical"),
  category: z.string().default("Grid Failure"),
  lat: z.number().min(-90).max(90).default(59.4372),
  lng: z.number().min(-180).max(180).default(24.7453),
  description: z.string().min(5, "Description must be at least 5 characters"),
  status: z.enum(["active", "investigating", "mitigated", "resolved"]).default("active"),
  district: z.string().nullable().optional(),
  nodeId: z.string().optional(),
  makiIcon: z.string().optional(),
  timestamp: z.string().optional(),
});
export type CreateIncidentPayload = z.infer<typeof CreateIncidentPayloadSchema>;
export type CreateIncidentInputPayload = z.input<typeof CreateIncidentPayloadSchema>;

/**
 * Incident Update Request Payload Schema
 */
export const UpdateIncidentPayloadSchema = CreateIncidentPayloadSchema.partial().extend({
  id: z.string().min(1),
});
export type UpdateIncidentPayload = z.infer<typeof UpdateIncidentPayloadSchema>;

/**
 * Incident Query Filter Schema
 */
export const IncidentFilterSchema = z.object({
  severity: SeveritySchema.optional(),
  category: z.string().optional(),
  district: z.string().optional(),
  status: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});
export type IncidentFilter = z.infer<typeof IncidentFilterSchema>;
export type IncidentFilterInput = z.input<typeof IncidentFilterSchema>;

/**
 * Incident List Response DTO Schema
 */
export const IncidentListResponseSchema = z.object({
  status: z.literal("success"),
  count: z.number().nonnegative(),
  incidents: z.array(IncidentSchema),
});
export type IncidentListResponse = z.infer<typeof IncidentListResponseSchema>;

/**
 * Map Action DTO Schema
 */
export const MapActionSchema = z.object({
  type: z.enum(["highlight_district", "fly_to_node", "focus_incident", "reset"]),
  district: z.string().optional(),
  nodeId: z.string().optional(),
  incidentId: z.string().optional(),
  coordinates: z.tuple([z.number(), z.number()]).optional(),
  label: z.string().optional(),
});
export type MapAction = z.infer<typeof MapActionSchema>;
