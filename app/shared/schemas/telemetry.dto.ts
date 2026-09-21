import { z } from "zod";

/**
 * Vessel Category Schema
 */
export const VesselCategorySchema = z.enum(["yacht", "cargo", "tanker", "passenger", "other"]);
export type VesselCategory = z.infer<typeof VesselCategorySchema>;

/**
 * Vessel AIS Data DTO Schema
 */
export const VesselDataSchema = z.object({
  mmsi: z.number().int().positive(),
  name: z.string(),
  shipType: z.number().int(),
  shipCategory: VesselCategorySchema,
  lat: z.number(),
  lng: z.number(),
  sog: z.number().nonnegative(), // speed over ground (knots)
  cog: z.number().min(0).max(360), // course over ground (degrees)
  heading: z.number().min(0).max(512), // true heading (0-360 or 511 if unavailable)
  navStatus: z.number().int(),
  destination: z.string(),
  callSign: z.string(),
  timestamp: z.number(),
});
export type VesselData = z.infer<typeof VesselDataSchema>;

/**
 * Vessel Telemetry Response Schema
 */
export const VesselResponseSchema = z.object({
  status: z.string(),
  count: z.number().nonnegative(),
  vessels: z.array(VesselDataSchema),
  simulated: z.boolean().optional(),
});
export type VesselResponse = z.infer<typeof VesselResponseSchema>;

/**
 * Flight Telemetry Data DTO Schema
 */
export const FlightDataSchema = z.object({
  id: z.string(),
  callsign: z.string(),
  origin: z.string(),
  destination: z.string(),
  lat: z.number(),
  lng: z.number(),
  altitude: z.number(),
  velocity: z.number(),
  heading: z.number(),
  verticalRate: z.number(),
  onGround: z.boolean(),
  squawk: z.string().nullable().optional(),
  lastContact: z.number(),
});
export type FlightData = z.infer<typeof FlightDataSchema>;

export const FlightResponseSchema = z.object({
  status: z.string(),
  count: z.number().nonnegative(),
  flights: z.array(FlightDataSchema),
  simulated: z.boolean().optional(),
});
export type FlightResponse = z.infer<typeof FlightResponseSchema>;

/**
 * Emergency Infrastructure DTO Schema
 */
export const InfrastructureTypeSchema = z.enum([
  "SHELTER",
  "PHARMACY",
  "WATER_POINT",
  "BASE_STATION",
  "SUBSTATION",
  "HOSPITAL",
  "FIRE_STATION",
  "POLICE",
]);
export type InfrastructureType = z.infer<typeof InfrastructureTypeSchema>;

export const InfrastructureSchema = z.object({
  id: z.string(),
  type: InfrastructureTypeSchema.or(z.string()),
  name: z.string(),
  address: z.string(),
  lat: z.number(),
  lng: z.number(),
  districtId: z.string(),
  status: z.enum(["OPERATIONAL", "OFFLINE", "DEGRADED"]).default("OPERATIONAL"),
  notes: z.string().nullable().optional(),
});
export type Infrastructure = z.infer<typeof InfrastructureSchema>;

export const InfrastructureResponseSchema = z.object({
  status: z.string(),
  count: z.number().nonnegative(),
  data: z.array(InfrastructureSchema),
});
export type InfrastructureResponse = z.infer<typeof InfrastructureResponseSchema>;

/**
 * Real-Time Tallinn Public Transport DTO Schema
 */
export const PublicTransportTypeSchema = z.enum(["bus", "trolleybus", "tram", "night_bus"]);
export type PublicTransportType = z.infer<typeof PublicTransportTypeSchema>;

export const PublicTransportDataSchema = z.object({
  id: z.string(),
  type: PublicTransportTypeSchema,
  route: z.string(),
  tripId: z.string(),
  lat: z.number(),
  lon: z.number(),
  lng: z.number(),
  bearing: z.number(),
  speed: z.number(),
  timestamp: z.string(),
  destination: z.string(),
  lowFloor: z.boolean(),
  source: z.literal("tallinn_transport"),
});
export type PublicTransportData = z.infer<typeof PublicTransportDataSchema>;

export const PublicTransportResponseSchema = z.object({
  status: z.string(),
  count: z.number().nonnegative(),
  mode: z.enum(["realtime", "simulation"]),
  vehicles: z.array(PublicTransportDataSchema),
  updatedAt: z.string(),
});
export type PublicTransportResponse = z.infer<typeof PublicTransportResponseSchema>;

