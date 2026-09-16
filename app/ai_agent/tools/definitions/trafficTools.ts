import {
  QueryTrafficFlowInputSchema,
  QueryTrafficFlowOutputSchema,
  QueryTrafficFlowInput,
  QueryTrafficFlowOutput,
  RerouteTrafficInputSchema,
  RerouteTrafficOutputSchema,
  RerouteTrafficInput,
  RerouteTrafficOutput,
} from "@/shared";

export const queryTrafficFlowTool = {
  name: "query_traffic_flow",
  description: "Query real-time vehicle flow metrics, congestion levels, and camera status for Tallinn traffic corridors.",
  isWriteOperation: false,
  inputSchema: QueryTrafficFlowInputSchema,
  outputSchema: QueryTrafficFlowOutputSchema,
  execute: async (rawInput: unknown): Promise<QueryTrafficFlowOutput> => {
    const input: QueryTrafficFlowInput = QueryTrafficFlowInputSchema.parse(rawInput);
    const corridor = input.corridor.toLowerCase();

    if (corridor.includes("viru") || corridor.includes("narva")) {
      return {
        corridor: input.corridor,
        congestion_level: "CRITICAL",
        flow_speed_kmh: 8.2,
        free_flow_speed_kmh: 45.0,
        delay_minutes: 18.4,
        cameras_online: 14,
        cameras_total: 16,
        flow_index: 0.18,
        signal_mode: "AMBER_PULSE_FAILSAFE",
        notes: "Signal controller offline at Viru junction. Queues extending to Kaubamaja and Hobujaama.",
      };
    }

    if (corridor.includes("liivalaia") || corridor.includes("parnu")) {
      return {
        corridor: input.corridor,
        congestion_level: "HEAVY",
        flow_speed_kmh: 22.5,
        free_flow_speed_kmh: 50.0,
        delay_minutes: 9.1,
        cameras_online: 22,
        cameras_total: 22,
        flow_index: 0.45,
        signal_mode: "ADAPTIVE_GREEN_WAVE",
        notes: "Moderate spillover congestion from central core.",
      };
    }

    return {
      corridor: input.corridor,
      congestion_level: "NORMAL",
      flow_speed_kmh: 44.0,
      free_flow_speed_kmh: 50.0,
      delay_minutes: 1.2,
      cameras_online: 8,
      cameras_total: 8,
      flow_index: 0.88,
      signal_mode: "SCHEDULED_AUTOMATION",
      notes: "Traffic flowing freely.",
    };
  },
};

export const rerouteTrafficTool = {
  name: "reroute_traffic",
  description: "Update Variable Message Signs (VMS) and adjust traffic signal timing to divert vehicles around congestion.",
  isWriteOperation: true,
  inputSchema: RerouteTrafficInputSchema,
  outputSchema: RerouteTrafficOutputSchema,
  execute: async (rawInput: unknown): Promise<RerouteTrafficOutput> => {
    const input: RerouteTrafficInput = RerouteTrafficInputSchema.parse(rawInput);
    return {
      success: true,
      diverted_from: input.origin_corridor,
      rerouted_to: input.target_corridors,
      vms_signs_updated: 6,
      traffic_signal_cycle_adjusted: true,
      estimated_delay_reduction_minutes: 12.0,
    };
  },
};
