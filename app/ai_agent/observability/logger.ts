export interface LogEvent {
  level: "info" | "warn" | "error" | "debug";
  module: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

export class AgentLogger {
  log(level: LogEvent["level"], module: string, message: string, data?: Record<string, unknown>): void {
    const event: LogEvent = {
      level,
      module,
      message,
      data,
      timestamp: new Date().toISOString(),
    };

    const output = `[${event.timestamp}] [${event.level.toUpperCase()}] [${event.module}] ${event.message}`;
    if (level === "error") {
      console.error(output, data || "");
    } else if (level === "warn") {
      console.warn(output, data || "");
    } else {
      console.log(output, data ? JSON.stringify(data) : "");
    }
  }

  info(module: string, message: string, data?: Record<string, unknown>): void {
    this.log("info", module, message, data);
  }

  warn(module: string, message: string, data?: Record<string, unknown>): void {
    this.log("warn", module, message, data);
  }

  error(module: string, message: string, data?: Record<string, unknown>): void {
    this.log("error", module, message, data);
  }
}

export const agentLogger = new AgentLogger();
