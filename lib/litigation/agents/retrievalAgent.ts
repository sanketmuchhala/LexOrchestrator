import type { AgentContext, AgentResult, RetrievalAgentOutput, IntakeAgentOutput } from "../types";
import { makeEvent } from "../logAgentEvent";
import { searchLegalOpinions } from "@/lib/retrieval/searchLegalOpinions";

function buildSearchQueries(ctx: AgentContext, intake: IntakeAgentOutput): string[] {
  const queries: string[] = [ctx.input.query];
  if (intake.motionType !== "general") {
    queries.push(`${intake.motionType.replace(/_/g, " ")} ${intake.jurisdiction}`);
  }
  if (intake.legalIssues.length > 0) {
    queries.push(intake.legalIssues.slice(0, 2).join(" "));
  }
  return queries;
}

export async function runLitigationRetrievalAgent(
  ctx: AgentContext,
  intake: IntakeAgentOutput
): Promise<AgentResult> {
  const start = performance.now();
  const events = [makeEvent("RetrievalAgent", "agent_started", "Searching legal authority")];

  const searchQueries = buildSearchQueries(ctx, intake);
  const seen = new Set<string>();
  const allResults = [];

  for (const query of searchQueries) {
    events.push(makeEvent("RetrievalAgent", "tool_call", query, { toolName: "searchLegalOpinions" }));

    const response = await searchLegalOpinions({
      query,
      jurisdiction: ctx.input.jurisdiction,
      court: ctx.input.court,
      limit: 5,
    });

    for (const r of response.results) {
      if (!seen.has(r.chunkId)) {
        seen.add(r.chunkId);
        allResults.push(r);
      }
    }

    events.push(
      makeEvent("RetrievalAgent", "tool_result", `${response.results.length} results`, {
        toolName: "searchLegalOpinions",
      })
    );
  }

  allResults.sort((a, b) => b.score - a.score);
  const top = allResults.slice(0, 8);

  const retrievalSummary =
    top.length > 0
      ? `Retrieved ${top.length} authority chunks. Top: "${top[0].caseName}" (score: ${top[0].score.toFixed(2)})`
      : "No legal authority retrieved. Draft will note the absence of verified citations.";

  const latencyMs = Math.round(performance.now() - start);
  events.push(makeEvent("RetrievalAgent", "agent_completed", retrievalSummary, { latencyMs }));

  const output: RetrievalAgentOutput = { retrievedAuthority: top, searchQueries, retrievalSummary };

  return {
    agentName: "RetrievalAgent",
    status: "success",
    message: retrievalSummary,
    output: output as unknown as Record<string, unknown>,
    confidence: top.length > 0 ? 0.8 : 0.3,
    events,
  };
}
