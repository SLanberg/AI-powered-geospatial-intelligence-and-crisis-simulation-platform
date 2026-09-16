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

export const inspectSubstationTool = {
  name: "inspect_substation",
  description: "Query live SCADA telemetry, telemetry bus voltage, breaker status, and active alarms for an electrical substation.",
  isWriteOperation: false,
  inputSchema: InspectSubstationInputSchema,
  outputSchema: InspectSubstationOutputSchema,
  execute: async (rawInput: unknown): Promise<InspectSubstationOutput> => {
    const input: InspectSubstationInput = InspectSubstationInputSchema.parse(rawInput);
    const subId = input.substation_id.toUpperCase();

    if (subId.includes("SUB-04") || subId.includes("VANALINN")) {
      return {
        substation_id: "EE-TLN-SUB-04",
        status: "TRIPPED",
        active_alarms: ["TRANSFORMER_ISOLATION_RELAY_TRIPPED", "UNDERFREQUENCY_48.8HZ", "BUS_VOLTAGE_DROP_380V"],
        breaker_position: "OPEN_SAFETY_LOCKOUT",
        feeder_trips: ["FEEDER_VL_01", "FEEDER_VL_02", "FEEDER_VL_04"],
        frequency_hz: 48.82,
        load_mva: 0.8,
        capacity_mva: 45.0,
        oil_temp_c: 88.4,
        bus_voltage_kv: 9.8,
      };
    }

    if (subId.includes("ULE-01") || subId.includes("ULEMISTE")) {
      return {
        substation_id: "EE-TLN-ULE-01",
        status: "VOLTAGE_SURGE",
        active_alarms: ["OVERVOLTAGE_SURGE_438KV", "FEEDER_ISOLATION_SECTOR_B"],
        breaker_position: "PARTIALLY_OPEN",
        feeder_trips: ["FEEDER_ULE_B2"],
        frequency_hz: 50.12,
        load_mva: 38.2,
        capacity_mva: 60.0,
        oil_temp_c: 64.1,
        bus_voltage_kv: 112.4,
      };
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
