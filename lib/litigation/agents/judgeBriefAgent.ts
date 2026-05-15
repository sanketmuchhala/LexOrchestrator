import type { AgentContext, AgentResult, JudgeBriefAgentOutput, JudgeProfileData } from "../types";
import { makeEvent } from "../logAgentEvent";
import { getJudgeProfileByJudgeId, getJudgeByName } from "@/lib/db/supabaseServer";

const NO_PROFILE_OUTPUT: JudgeBriefAgentOutput = {
  judgeSummary: "No cached judge profile available. No judge-specific guidance can be provided for this workflow run.",
  styleNotes: [],
  argumentGuidance: [],
  sourceOpinionCount: 0,
};

async function resolveJudgeProfile(ctx: AgentContext): Promise<JudgeProfileData | null> {
  if (ctx.judgeProfile) return ctx.judgeProfile;

  if (ctx.input.judgeId) {
    return getJudgeProfileByJudgeId(ctx.input.judgeId);
  }

  if (ctx.input.judgeName) {
    const judge = await getJudgeByName(ctx.input.judgeName);
    if (judge) {
      return getJudgeProfileByJudgeId(judge.id);
    }
  }

  return null;
}

export async function runLitigationJudgeBriefAgent(ctx: AgentContext): Promise<AgentResult> {
  const start = performance.now();
  const events = [makeEvent("JudgeBriefAgent", "agent_started", "Looking up judge profile")];

  const profile = await resolveJudgeProfile(ctx);

  let output: JudgeBriefAgentOutput;

  if (!profile) {
    output = NO_PROFILE_OUTPUT;
  } else {
    const styleNotes = profile.styleNotes
      ? profile.styleNotes.split("\n").filter(Boolean)
      : ["No style notes available."];
    const argumentGuidance = profile.argumentGuidance
      ? profile.argumentGuidance.split("\n").filter(Boolean)
      : ["No argument guidance available."];

    output = {
      judgeSummary: `Judge ${profile.judgeName}${profile.court ? ` (${profile.court})` : ""}. Based on ${profile.sourceOpinionCount} source opinion(s).`,
      styleNotes,
      argumentGuidance,
      sourceOpinionCount: profile.sourceOpinionCount,
    };
  }

  const latencyMs = Math.round(performance.now() - start);
  events.push(makeEvent("JudgeBriefAgent", "agent_completed", output.judgeSummary.slice(0, 80), { latencyMs }));

  return {
    agentName: "JudgeBriefAgent",
    status: "success",
    message: output.judgeSummary,
    output: output as unknown as Record<string, unknown>,
    confidence: profile ? 0.8 : 0.1,
    events,
  };
}
