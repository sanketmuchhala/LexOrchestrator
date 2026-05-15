import type {
  AgentContext,
  AgentResult,
  EvalAgentOutput,
  RetrievalAgentOutput,
  CitationAgentOutput,
  AdversarialAgentOutput,
} from "../types";
import { makeEvent } from "../logAgentEvent";

export async function runLitigationEvalAgent(
  _ctx: AgentContext,
  retrieval: RetrievalAgentOutput,
  citationOutput: CitationAgentOutput,
  adversarial: AdversarialAgentOutput
): Promise<AgentResult> {
  const start = performance.now();
  const events = [makeEvent("EvalAgent", "agent_started", "Scoring workflow quality")];

  const { citationSummary } = citationOutput;

  const citationPassRate =
    citationSummary.total > 0 ? citationSummary.pass / citationSummary.total : 0;

  // Linear scale: 5 chunks = full coverage
  const retrievalCoverage = Math.min(1, retrieval.retrievedAuthority.length / 5);

  const unsupportedClaimRisk =
    adversarial.riskLevel === "high" ? 0.8 : adversarial.riskLevel === "medium" ? 0.5 : 0.2;

  const faithfulnessScore =
    citationSummary.total > 0
      ? Math.min(1, (citationSummary.pass + citationSummary.warn * 0.5) / citationSummary.total)
      : retrievalCoverage * 0.6;

  const overallConfidence =
    faithfulnessScore * 0.35 +
    citationPassRate * 0.3 +
    retrievalCoverage * 0.2 +
    (1 - unsupportedClaimRisk) * 0.15;

  const passFail: "pass" | "fail" = overallConfidence >= 0.5 ? "pass" : "fail";

  const round3 = (n: number) => Math.round(n * 1000) / 1000;

  const output: EvalAgentOutput = {
    faithfulnessScore: round3(faithfulnessScore),
    citationPassRate: round3(citationPassRate),
    retrievalCoverage: round3(retrievalCoverage),
    unsupportedClaimRisk: round3(unsupportedClaimRisk),
    overallConfidence: round3(overallConfidence),
    passFail,
  };

  const latencyMs = Math.round(performance.now() - start);
  events.push(
    makeEvent(
      "EvalAgent",
      "agent_completed",
      `Confidence: ${Math.round(overallConfidence * 100)}% | ${passFail.toUpperCase()}`,
      { latencyMs }
    )
  );

  return {
    agentName: "EvalAgent",
    status: "success",
    message: `Eval: ${passFail.toUpperCase()} | Confidence: ${Math.round(overallConfidence * 100)}% | Citation pass rate: ${Math.round(citationPassRate * 100)}%`,
    output: output as unknown as Record<string, unknown>,
    confidence: overallConfidence,
    events,
  };
}
