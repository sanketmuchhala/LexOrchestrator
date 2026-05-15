import type { AgentContext, AgentResult, CitationAgentOutput, CitationSummary, DraftingAgentOutput } from "../types";
import { makeEvent } from "../logAgentEvent";
import { verifyCitationsInText } from "@/lib/citations/verifyCitationsInText";

export async function runLitigationCitationAgent(
  ctx: AgentContext,
  draft: DraftingAgentOutput
): Promise<AgentResult> {
  const start = performance.now();
  const events = [makeEvent("CitationAgent", "agent_started", "Verifying citations in draft")];

  events.push(makeEvent("CitationAgent", "tool_call", "verifyCitationsInText", { toolName: "verifyCitationsInText" }));

  const response = await verifyCitationsInText({
    text: draft.draftText,
    jurisdiction: ctx.input.jurisdiction,
    court: ctx.input.court,
    workflowRunId: ctx.workflowRunId,
  });

  events.push(
    makeEvent("CitationAgent", "tool_result", `Verified ${response.summary.total} citations`, {
      toolName: "verifyCitationsInText",
    })
  );

  const citationSummary: CitationSummary = {
    total: response.summary.total,
    pass: response.summary.pass,
    warn: response.summary.warn,
    fail: response.summary.fail,
    unknown: response.summary.unknown,
  };

  const latencyMs = Math.round(performance.now() - start);
  events.push(
    makeEvent("CitationAgent", "agent_completed", `Pass: ${citationSummary.pass}/${citationSummary.total}`, {
      latencyMs,
    })
  );

  const output: CitationAgentOutput = {
    citationReports: response.citations,
    citationSummary,
  };

  return {
    agentName: "CitationAgent",
    status: "success",
    message: `Citation check: ${citationSummary.pass} pass, ${citationSummary.warn} warn, ${citationSummary.fail} fail of ${citationSummary.total} total`,
    output: output as unknown as Record<string, unknown>,
    confidence: citationSummary.total > 0 ? citationSummary.pass / citationSummary.total : 0.5,
    events,
  };
}
