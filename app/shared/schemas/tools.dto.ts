import { z } from "zod";
import { SeveritySchema } from "./common.dto";

/**
 * Tool Execution Policy Schema
 */
export const ToolExecutionPolicySchema = z.object({
  mode: z.enum(["parallel", "sequential"]),
  requires_confirmation: z.boolean(),
  idempotent: z.boolean(),
  category: z.enum(["read_only", "write", "critical_system"]),
});
export type ToolExecutionPolicy = z.infer<typeof ToolExecutionPolicySchema>;

/**
 * Tool 1: search_incidents Schemas
 */
export const SearchIncidentsInputSchema = z.object({
  sector: z.string().optional().describe("Grid sector or district (e.g. Vanalinn, Harju, Ülemiste, Kristiine)"),
  severity: SeveritySchema.optional().describe("Incident severity level"),
});
export type SearchIncidentsInput = z.infer<typeof SearchIncidentsInputSchema>;

export const SearchIncidentsOutputSchema = z.object({
  count: z.number(),
  incidents: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      severity: z.string(),
      category: z.string(),
      status: z.string(),
      district: z.string().nullable().optional(),
      nodeId: z.string(),
      description: z.string(),
      timestamp: z.string(),
    })
  ),
});
export type SearchIncidentsOutput = z.infer<typeof SearchIncidentsOutputSchema>;

/**
 * Tool 2: create_incident Schemas
 */
export const CreateIncidentInputSchema = z.object({
  title: z.string().min(3).describe("Incident summary"),
  category: z.string().describe("Incident category (e.g. Grid Failure, Traffic Flow, Cyber Security)"),
  severity: SeveritySchema.describe("Severity rating"),
  district: z.string().describe("City district"),
  description: z.string().describe("Detailed situational description"),
  lat: z.number().optional().describe("Latitude coordinate"),
  lng: z.number().optional().describe("Longitude coordinate"),
});
export type CreateIncidentInput = z.infer<typeof CreateIncidentInputSchema>;

export const CreateIncidentOutputSchema = z.object({
  success: z.boolean(),
  incidentId: z.string(),
  message: z.string(),
});
export type CreateIncidentOutput = z.infer<typeof CreateIncidentOutputSchema>;

/**
 * Tool: update_incident Schemas
 */
export const UpdateIncidentInputSchema = z.object({
  id: z.string().describe("Unique identifier of the incident to update"),
  title: z.string().min(2).optional().describe("Updated incident title"),
  category: z.string().optional().describe("Updated incident category"),
  severity: SeveritySchema.optional().describe("Updated severity level"),
  status: z.enum(["active", "investigating", "mitigated", "resolved"]).optional().describe("Updated status"),
  district: z.string().optional().describe("Updated district or sector"),
  description: z.string().optional().describe("Updated detailed description"),
  lat: z.number().optional().describe("Updated latitude"),
  lng: z.number().optional().describe("Updated longitude"),
});
export type UpdateIncidentInput = z.infer<typeof UpdateIncidentInputSchema>;

export const UpdateIncidentOutputSchema = z.object({
  success: z.boolean(),
  incidentId: z.string(),
  message: z.string(),
});
export type UpdateIncidentOutput = z.infer<typeof UpdateIncidentOutputSchema>;

/**
 * Tool: delete_incident Schemas
 */
export const DeleteIncidentInputSchema = z.object({
  id: z.string().describe("Unique identifier of the incident to decommission/delete"),
});
export type DeleteIncidentInput = z.infer<typeof DeleteIncidentInputSchema>;

export const DeleteIncidentOutputSchema = z.object({
  success: z.boolean(),
  incidentId: z.string(),
  message: z.string(),
});
export type DeleteIncidentOutput = z.infer<typeof DeleteIncidentOutputSchema>;

/**
 * Tool 3: inspect_substation Schemas
 */
export const InspectSubstationInputSchema = z.object({
  substation_id: z.string().describe("Substation identifier (e.g., EE-TLN-SUB-04, EE-TLN-ULE-01)"),
});
export type InspectSubstationInput = z.infer<typeof InspectSubstationInputSchema>;

export const InspectSubstationOutputSchema = z.object({
  substation_id: z.string(),
  status: z.string(),
  active_alarms: z.array(z.string()),
  breaker_position: z.string(),
  feeder_trips: z.array(z.string()),
  frequency_hz: z.number(),
  load_mva: z.number(),
  capacity_mva: z.number(),
  oil_temp_c: z.number(),
  bus_voltage_kv: z.number(),
});
export type InspectSubstationOutput = z.infer<typeof InspectSubstationOutputSchema>;

/**
 * Tool 4: isolate_grid_sector Schemas
 */
export const IsolateGridSectorInputSchema = z.object({
  sector: z.string().describe("Sector to disconnect (e.g., Vanalinn-North, Ulemiste-B)"),
  reason: z.string().describe("Operational justification for emergency disconnect"),
});
export type IsolateGridSectorInput = z.infer<typeof IsolateGridSectorInputSchema>;

export const IsolateGridSectorOutputSchema = z.object({
  success: z.boolean(),
  sector: z.string(),
  status: z.literal("ISOLATED"),
  timestamp: z.string(),
  operator: z.string(),
  meters_isolated: z.number(),
  hospitals_affected: z.number(),
  backup_feed_online: z.boolean(),
  notes: z.string(),
});
export type IsolateGridSectorOutput = z.infer<typeof IsolateGridSectorOutputSchema>;

/**
 * Tool 5: query_traffic_flow Schemas
 */
export const QueryTrafficFlowInputSchema = z.object({
  corridor: z.string().describe("Street or corridor (e.g., Liivalaia, Narva mnt, Pärnu mnt, Tartu mnt)"),
});
export type QueryTrafficFlowInput = z.infer<typeof QueryTrafficFlowInputSchema>;

export const QueryTrafficFlowOutputSchema = z.object({
  corridor: z.string(),
  congestion_level: z.string(),
  flow_speed_kmh: z.number(),
  free_flow_speed_kmh: z.number(),
  delay_minutes: z.number(),
  cameras_online: z.number(),
  cameras_total: z.number(),
  flow_index: z.number(),
  signal_mode: z.string(),
  notes: z.string(),
});
export type QueryTrafficFlowOutput = z.infer<typeof QueryTrafficFlowOutputSchema>;

/**
 * Tool 6: reroute_traffic Schemas
 */
export const RerouteTrafficInputSchema = z.object({
  origin_corridor: z.string().describe("Congested or blocked corridor"),
  target_corridors: z.array(z.string()).describe("Alternative corridors for diversion"),
  reason: z.string().describe("Traffic management reason"),
});
export type RerouteTrafficInput = z.infer<typeof RerouteTrafficInputSchema>;

export const RerouteTrafficOutputSchema = z.object({
  success: z.boolean(),
  diverted_from: z.string(),
  rerouted_to: z.array(z.string()),
  vms_signs_updated: z.number(),
  traffic_signal_cycle_adjusted: z.boolean(),
  estimated_delay_reduction_minutes: z.number(),
});
export type RerouteTrafficOutput = z.infer<typeof RerouteTrafficOutputSchema>;

/**
 * Tool 7: dispatch_emergency_unit Schemas
 */
export const DispatchEmergencyUnitInputSchema = z.object({
  unit_type: z.enum(["AMBULANCE", "FIRE_ENGINE", "POLICE_PATROL", "GRID_REPAIR_CREW"]).describe("Type of response unit"),
  destination_district: z.string().describe("Target district or address"),
  priority: z.enum(["CODE_3_URGENT", "CODE_2_PRIORITY", "CODE_1_ROUTINE"]).describe("Response priority code"),
  incident_id: z.string().optional().describe("Associated incident ID"),
});
export type DispatchEmergencyUnitInput = z.infer<typeof DispatchEmergencyUnitInputSchema>;

export const DispatchEmergencyUnitOutputSchema = z.object({
  success: z.boolean(),
  dispatch_id: z.string(),
  unit_callsign: z.string(),
  unit_type: z.string(),
  destination: z.string(),
  estimated_arrival_minutes: z.number(),
  status: z.literal("EN_ROUTE"),
});
export type DispatchEmergencyUnitOutput = z.infer<typeof DispatchEmergencyUnitOutputSchema>;

/**
 * Tool 8: query_vessels Schemas
 */
export const QueryVesselsInputSchema = z.object({
  category: z.enum(["all", "cargo", "tanker", "passenger", "yacht", "other"]).optional().describe("Ship category filter"),
  limit: z.number().min(1).max(50).default(10).describe("Maximum number of vessels to return"),
});
export type QueryVesselsInput = z.infer<typeof QueryVesselsInputSchema>;

export const QueryVesselsOutputSchema = z.object({
  count: z.number(),
  vessels: z.array(
    z.object({
      mmsi: z.number(),
      name: z.string(),
      category: z.string(),
      speed_knots: z.number(),
      destination: z.string(),
      lat: z.number(),
      lng: z.number(),
    })
  ),
});
export type QueryVesselsOutput = z.infer<typeof QueryVesselsOutputSchema>;

/**
 * Tool 9: query_flights Schemas
 */
export const QueryFlightsInputSchema = z.object({
  limit: z.number().min(1).max(50).default(10).describe("Maximum number of flights to return"),
});
export type QueryFlightsInput = z.infer<typeof QueryFlightsInputSchema>;

export const QueryFlightsOutputSchema = z.object({
  count: z.number(),
  flights: z.array(
    z.object({
      callsign: z.string(),
      origin: z.string(),
      destination: z.string(),
      altitude: z.number(),
      velocity: z.number(),
      lat: z.number(),
      lng: z.number(),
    })
  ),
});
export type QueryFlightsOutput = z.infer<typeof QueryFlightsOutputSchema>;
