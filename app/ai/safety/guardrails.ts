import { AiConfig, ChatMessage } from "../types";

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

export class Guardrails {
  private config: AiConfig;

  constructor(config: AiConfig) {
    this.config = config;
  }

  /**
   * Validate user input messages against max length and prompt injection patterns
   */
  validateInput(messages: ChatMessage[]): ValidationResult {
    if (!this.config.safety.enabled || !this.config.safety.input.validation) {
      return { valid: true };
    }

    const maxLength = this.config.safety.input.max_length;
    let totalLength = 0;

    for (const msg of messages) {
      if (typeof msg.content === "string") {
        totalLength += msg.content.length;
      }
    }

    if (totalLength > maxLength) {
      return {
        valid: false,
        reason: `Input total character length (${totalLength}) exceeds safety limit of ${maxLength}`,
      };
    }

    if (this.config.safety.prompt_injection.detection) {
      const injectionPatterns = [
        /ignore previous instructions/i,
        /disregard system prompt/i,
        /bypass safety filters/i,
        /you are now unrestricted DAN/i,
      ];

      for (const msg of messages) {
        if (msg.role === "user") {
          for (const pattern of injectionPatterns) {
            if (pattern.test(msg.content)) {
              return {
                valid: false,
                reason: "Potential prompt injection attempt detected.",
              };
            }
          }
        }
      }
    }

    return { valid: true };
  }

  /**
   * Check if a tool operation requires confirmation or violates write permission settings
   */
  canExecuteTool(toolName: string, isWriteOperation: boolean, userConfirmed = false): ValidationResult {
    const toolsCfg = this.config.tools;

    if (!toolsCfg.execution.enabled) {
      return { valid: false, reason: "Tool execution is disabled in AI config." };
    }

    // Check allowlist
    if (!toolsCfg.enabled.includes(toolName)) {
      return { valid: false, reason: `Tool '${toolName}' is not in the allowed tools list.` };
    }

    // Check permissions
    const permission = toolsCfg.permissions[toolName];
    if (permission && !permission.enabled) {
      return { valid: false, reason: `Tool '${toolName}' is explicitly disabled in permissions.` };
    }

    if (isWriteOperation) {
      if (!toolsCfg.write_operations.enabled) {
        return { valid: false, reason: `Write operations are disabled.` };
      }
      if (toolsCfg.write_operations.require_confirmation && !userConfirmed) {
        return { valid: false, reason: `Write operation '${toolName}' requires explicit user confirmation.` };
      }
    }

    return { valid: true };
  }

  /**
   * Validate model output against configured json schema or constraints
   */
  validateOutput(outputContent: string): ValidationResult {
    if (!this.config.safety.enabled || !this.config.safety.output.validation) {
      return { valid: true };
    }

    if (this.config.agent.output.format === "json") {
      try {
        JSON.parse(outputContent);
      } catch {
        return { valid: false, reason: "Output format expected JSON, but output is not valid JSON." };
      }
    }

    return { valid: true };
  }
}
