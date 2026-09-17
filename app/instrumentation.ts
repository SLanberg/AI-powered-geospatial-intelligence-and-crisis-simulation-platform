export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { startTelemetryWsServer } = await import("@/backend/ws/telemetryWsServer");
      startTelemetryWsServer();
    } catch (err) {
      console.warn("[Instrumentation] Failed to automatically boot Telemetry WebSocket server:", err);
    }
  }
}
