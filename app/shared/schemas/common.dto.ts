import { z } from "zod";

/**
 * Common Geographic Coordinate Schema
 */
export const GeoCoordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});
export type GeoCoordinates = z.infer<typeof GeoCoordinatesSchema>;

/**
 * Severity Level Enum Schema
 */
export const SeveritySchema = z.enum(["critical", "warning", "info", "low"]);
export type Severity = z.infer<typeof SeveritySchema>;

/**
 * Common Operational Status Schema
 */
export const OperationalStatusSchema = z.enum([
  "active",
  "investigating",
  "mitigated",
  "resolved",
  "operational",
  "degraded",
  "offline",
]);
export type OperationalStatus = z.infer<typeof OperationalStatusSchema>;

/**
 * Standard API Error Response Schema
 */
export const ApiErrorResponseSchema = z.object({
  status: z.literal("error"),
  error: z.string(),
  code: z.string().optional(),
  details: z.array(z.string()).optional(),
  timestamp: z.string().default(() => new Date().toISOString()),
});
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
