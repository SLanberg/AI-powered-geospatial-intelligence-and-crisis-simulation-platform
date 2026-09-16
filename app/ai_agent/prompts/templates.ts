import { z } from "zod";

export const CrisisAssessmentVarsSchema = z.object({
  incidentId: z.string(),
  sector: z.string(),
  observedImpact: z.string(),
});
export type CrisisAssessmentVars = z.infer<typeof CrisisAssessmentVarsSchema>;

export const TrafficMitigationVarsSchema = z.object({
  blockedCorridor: z.string(),
  alternateRoutes: z.array(z.string()),
  congestionSeverity: z.string(),
});
export type TrafficMitigationVars = z.infer<typeof TrafficMitigationVarsSchema>;

export const promptTemplates = {
  crisisAssessment: (vars: CrisisAssessmentVars): string => {
    const valid = CrisisAssessmentVarsSchema.parse(vars);
    return `EMERGENCY SITUATION REPORT:
Incident: ${valid.incidentId}
Sector: ${valid.sector}
Observed Impact: ${valid.observedImpact}

Execute an immediate diagnosis:
1. Identify primary failure node and potential cascading vectors.
2. Determine if secondary substations or traffic arteries require pre-emptive isolation.
3. Formulate clear dispatch instructions for emergency crews.`;
  },

  trafficMitigation: (vars: TrafficMitigationVars): string => {
    const valid = TrafficMitigationVarsSchema.parse(vars);
    return `CORRIDOR CONGESTION MITIGATION:
Blocked Artery: ${valid.blockedCorridor}
Available Alternates: ${valid.alternateRoutes.join(", ")}
Severity: ${valid.congestionSeverity}

Formulate adaptive signal timing updates and VMS diversion notices.`;
  },
};
