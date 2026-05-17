import { logAgentEvent, makeEvent } from "@/lib/litigation/logAgentEvent";

// Helper for wrapping an agent step with automatic latency recording.
// The wrapped function receives start time so it can still record its own events.
// Only use this for orchestrator-level wrappers -- individual agents track their own timing.
export async function timedAgentStep<T>(
  agentName: string,
  workflowRunId: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const latencyMs = Math.round(performance.now() - start);
    await logAgentEvent(
      workflowRunId,
      makeEvent(agentName, "agent_completed", `${agentName} completed`, { latencyMs })
    );
    return result;
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    const message = err instanceof Error ? err.message : String(err);
    await logAgentEvent(
      workflowRunId,
      makeEvent(agentName, "run_failed", message, {
        latencyMs,
        metadata: { errorCode: "AGENT_EXCEPTION" },
      })
    );
    throw err;
  }
}
