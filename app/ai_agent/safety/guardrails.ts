import { z } from "zod";

export const GuardrailCheckResultSchema = z.object({
  allowed: z.boolean(),
  reason: z.string().optional(),
  sanitizedContent: z.string().optional(),
});
export type GuardrailCheckResult = z.infer<typeof GuardrailCheckResultSchema>;

export class Guardrails {
  private blockedPatterns = [
    /ignore all previous instructions/i,
    /disregard system directives/i,
    /drop database/i,
    /delete from incidents/i,
  ];

  /**
   * Check user prompt for jailbreak attempts or harmful commands
   */
  checkInput(text: string): GuardrailCheckResult {
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(text)) {
        return {
          allowed: false,
          reason: "Security Guardrail Alert: Potential prompt injection or unauthorized instruction detected.",
        };
      }
    }
    return { allowed: true };
  }

  /**
   * Enforce critical infrastructure safety before tool execution
   */
  checkToolExecution(toolName: string, args: Record<string, unknown>): GuardrailCheckResult {
    if (toolName === "isolate_grid_sector") {
      const sector = String(args.sector || "").toLowerCase();
      if (sector.includes("hospital") || sector.includes("haigla") || sector.includes("emergency-core")) {
        return {
          allowed: false,
          reason: "Safety Violation: Direct isolation of hospital/critical care sector is strictly forbidden.",
        };
      }
    }
    return { allowed: true };
  }
}

export const globalGuardrails = new Guardrails();
