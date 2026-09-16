import {
  DispatchEmergencyUnitInputSchema,
  DispatchEmergencyUnitOutputSchema,
  DispatchEmergencyUnitInput,
  DispatchEmergencyUnitOutput,
} from "@/shared";

export const dispatchEmergencyUnitTool = {
  name: "dispatch_emergency_unit",
  description: "Dispatch emergency response crews (Päästeamet, Kiirabi, Politsei, or Grid Repair) to an incident location.",
  isWriteOperation: true,
  inputSchema: DispatchEmergencyUnitInputSchema,
  outputSchema: DispatchEmergencyUnitOutputSchema,
  execute: async (rawInput: unknown): Promise<DispatchEmergencyUnitOutput> => {
    const input: DispatchEmergencyUnitInput = DispatchEmergencyUnitInputSchema.parse(rawInput);
    const randomCallsignNum = Math.floor(Math.random() * 80 + 10);
    const callsignPrefix =
      input.unit_type === "AMBULANCE"
        ? "KIIRABI-TLN"
        : input.unit_type === "FIRE_ENGINE"
        ? "PÄÄSTE-KOMP"
        : input.unit_type === "POLICE_PATROL"
        ? "PATRULL"
        : "ELEKTRILEVI-CREW";

    return {
      success: true,
      dispatch_id: `DISP-${Date.now().toString().slice(-6)}`,
      unit_callsign: `${callsignPrefix}-${randomCallsignNum}`,
      unit_type: input.unit_type,
      destination: input.destination_district,
      estimated_arrival_minutes: input.priority === "CODE_3_URGENT" ? 4 : 8,
      status: "EN_ROUTE",
    };
  },
};
