import { insertLitigationAgentEvent } from "@/lib/db/supabaseServer";
import type { AgentEventRecord, AgentEventType } from "./types";

export async function logAgentEvent(
  workflowRunId: string,
  event: AgentEventRecord
): Promise<void> {
  await insertLitigationAgentEvent({
    workflowRunId,
    agentName: event.agentName,
    eventType: event.eventType,
    eventStatus: event.eventStatus,
    message: event.message,
    toolName: event.toolName,
    toolInput: event.toolInput,
    toolOutput: event.toolOutput,
    latencyMs: event.latencyMs,
    metadata: event.metadata,
  });
}

export function makeEvent(
  agentName: string,
  eventType: AgentEventType,
  message?: string,
  extras?: Partial<Omit<AgentEventRecord, "agentName" | "eventType" | "message">>
): AgentEventRecord {
  return { agentName, eventType, message, ...extras };
}
