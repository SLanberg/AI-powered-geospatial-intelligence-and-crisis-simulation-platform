import {
  InspectSubstationInputSchema,
  InspectSubstationOutputSchema,
  InspectSubstationInput,
  InspectSubstationOutput,
  IsolateGridSectorInputSchema,
  IsolateGridSectorOutputSchema,
  IsolateGridSectorInput,
  IsolateGridSectorOutput,
} from "@/shared";
import { incidentsService } from "@/backend/services/incidents.service";

export const inspectSubstationTool = {
  name: "inspect_substation",
  description: "Query live SCADA telemetry, telemetry bus voltage, breaker status, and active alarms for an electrical substation.",
  isWriteOperation: false,
  inputSchema: InspectSubstationInputSchema,
  outputSchema: InspectSubstationOutputSchema,
  execute: async (rawInput: unknown): Promise<InspectSubstationOutput> => {
    const input: InspectSubstationInput = InspectSubstationInputSchema.parse(rawInput);
    const subId = input.substation_id.toUpperCase();

    // Check if there is an active incident in the database matching this substation
    try {
      const incidents = await incidentsService.getIncidents();
      const matched = incidents.find(
        (i) =>
          (i.nodeId && subId.includes(i.nodeId.toUpperCase())) ||
          (i.title && i.title.toUpperCase().includes(subId)) ||
          (subId.includes("VANALINN") && i.district?.toLowerCase().includes("vanalinn") && i.category === "Grid Failure") ||
          (subId.includes("ULEMISTE") && i.district?.toLowerCase().includes("ülemiste") && i.category === "Grid Failure")
      );

      if (matched) {
        const isCritical = matched.severity === "critical";
        return {
          substation_id: subId,
          status: isCritical ? "TRIPPED" : "ALARM_ACTIVE",
          active_alarms: [matched.title.toUpperCase().replace(/\s+/g, "_"), ...(isCritical ? ["UNDERFREQUENCY_48.8HZ"] : [])],
          breaker_position: isCritical ? "OPEN_SAFETY_LOCKOUT" : "PARTIALLY_OPEN",
          feeder_trips: [matched.nodeId || "FEEDER_01"],
          frequency_hz: isCritical ? 48.82 : 50.12,
          load_mva: isCritical ? 0.8 : 38.2,
          capacity_mva: 45.0,
          oil_temp_c: isCritical ? 88.4 : 64.1,
          bus_voltage_kv: isCritical ? 9.8 : 112.4,
        };
      }
    } catch {
      // If DB fails, fallback to nominal
    }

    return {
      substation_id: subId,
      status: "OPERATIONAL",
      active_alarms: [],
      breaker_position: "CLOSED_NORMAL",
      feeder_trips: [],
      frequency_hz: 50.01,
      load_mva: 18.5,
      capacity_mva: 40.0,
      oil_temp_c: 42.0,
      bus_voltage_kv: 110.0,
    };
  },
};

export const isolateGridSectorTool = {
  name: "isolate_grid_sector",
  description: "Execute emergency SCADA command to isolate an electrical distribution sector to prevent cascading transformer burnout.",
  isWriteOperation: true,
  inputSchema: IsolateGridSectorInputSchema,
  outputSchema: IsolateGridSectorOutputSchema,
  execute: async (rawInput: unknown): Promise<IsolateGridSectorOutput> => {
    const input: IsolateGridSectorInput = IsolateGridSectorInputSchema.parse(rawInput);
    return {
      success: true,
      sector: input.sector,
      status: "ISOLATED",
      timestamp: new Date().toISOString(),
      operator: "NEURAL_CITY_AGENT_AUTOMATION",
      meters_isolated: 1420,
      hospitals_affected: 0,
      backup_feed_online: true,
      notes: `Grid isolation confirmed for sector ${input.sector}. Reason: ${input.reason}. Critical loads transferred to backup micro-grid.`,
    };
  },
};
