import type {
  AgentContext,
  AgentResult,
  AdversarialAgentOutput,
  IntakeAgentOutput,
  CitationAgentOutput,
} from "../types";
import { makeEvent } from "../logAgentEvent";
import { generateStructuredOutput } from "@/lib/llm/llmClient";

const MOTION_PLAYBOOKS: Record<
  string,
  { weaknesses: string[]; unsupportedClaims: string[]; counterarguments: string[] }
> = {
  motion_to_dismiss: {
    weaknesses: [
      "The complaint may allege sufficient facts to survive dismissal under the plausibility standard.",
      "The analysis does not account for the court's obligation to accept all well-pleaded facts as true.",
      "Leave to amend has not been addressed, which courts routinely grant on a first dismissal.",
    ],
    unsupportedClaims: [
      "The assertion that plaintiff failed to plead sufficient facts lacks citation to the controlling pleading standard.",
      "The claim that the complaint is deficient on its face is stated without reference to specific allegations.",
    ],
    counterarguments: [
      "Plaintiff will argue the complaint pleads enough facts to raise the right to relief above a speculative level.",
      "Plaintiff may invoke Rule 15(a) to seek leave to amend before dismissal with prejudice.",
      "Plaintiff may argue that dismissal is premature pending discovery of additional supporting facts.",
    ],
  },
  motion_for_summary_judgment: {
    weaknesses: [
      "Genuine disputes of material fact may remain that preclude judgment as a matter of law.",
      "Evidence cited may be insufficient if the opposing party submits a competing declaration.",
      "Credibility determinations are improper at summary judgment and must go to the factfinder.",
    ],
    unsupportedClaims: [
      "The assertion that no genuine dispute of material fact exists is not supported by citation to the full evidentiary record.",
      "Inferences from the facts do not appear to be construed in the non-movant's favor as required.",
    ],
    counterarguments: [
      "Opposing party will submit a declaration creating a genuine dispute on key elements.",
      "Rule 56(d) may allow opposing party to seek a continuance to obtain necessary discovery.",
      "The court may find credibility questions that must go to the factfinder.",
    ],
  },
  general: {
    weaknesses: [
      "The analysis does not identify the controlling legal standard with sufficient specificity.",
      "The motion lacks citation to binding authority from the jurisdiction's highest court.",
      "Threshold questions of standing, ripeness, or jurisdiction have not been addressed.",
    ],
    unsupportedClaims: [
      "Legal conclusions stated without citation to supporting authority.",
      "Factual assertions made without citation to the evidentiary record.",
    ],
    counterarguments: [
      "Opposing counsel will challenge the absence of binding authority.",
      "Opposing party may raise threshold procedural objections.",
      "The factual record may be disputed in material respects.",
    ],
  },
};

function deterministicAdversarial(
  intake: IntakeAgentOutput,
  citationOutput: CitationAgentOutput
): AdversarialAgentOutput {
  const playbook = MOTION_PLAYBOOKS[intake.motionType] ?? MOTION_PLAYBOOKS.general;

  const failRate =
    citationOutput.citationSummary.total > 0
      ? citationOutput.citationSummary.fail / citationOutput.citationSummary.total
      : 0;

  const riskLevel: "low" | "medium" | "high" =
    failRate > 0.4 ? "high" : failRate > 0.15 ? "medium" : "low";

  const riskLabel = { high: "HIGH", medium: "MODERATE", low: "LOW" }[riskLevel];
  const passRate =
    citationOutput.citationSummary.total > 0
      ? Math.round((citationOutput.citationSummary.pass / citationOutput.citationSummary.total) * 100)
      : 0;

  const redTeamMemo = `${riskLabel} ADVERSARIAL RISK -- ${intake.motionType.replace(/_/g, " ")} in ${intake.jurisdiction}. Citation pass rate: ${passRate}%. Primary vulnerability: ${playbook.weaknesses[0]} Strongest counterargument: ${playbook.counterarguments[0]}`;

  return {
    strongestWeaknesses: playbook.weaknesses,
    unsupportedClaims: playbook.unsupportedClaims,
    likelyCounterarguments: playbook.counterarguments,
    riskLevel,
    redTeamMemo,
  };
}

export async function runLitigationAdversarialAgent(
  ctx: AgentContext,
  intake: IntakeAgentOutput,
  citationOutput: CitationAgentOutput
): Promise<AgentResult> {
  const start = performance.now();
  const events = [makeEvent("AdversarialAgent", "agent_started", "Generating opposing-counsel critique")];

  const fallback = deterministicAdversarial(intake, citationOutput);

  const result = await generateStructuredOutput<AdversarialAgentOutput>({
    system: `You are adversarial litigation counsel reviewing a draft motion for weaknesses.
Return JSON with these exact keys:
- strongestWeaknesses: string[] (3 specific analytical weaknesses in the draft)
- unsupportedClaims: string[] (2-3 claims in the draft that lack citation support)
- likelyCounterarguments: string[] (3 arguments opposing counsel will raise)
- riskLevel: "low" | "medium" | "high"
- redTeamMemo: string (one paragraph red-team summary starting with HIGH/MODERATE/LOW ADVERSARIAL RISK)
Return JSON only.`,
    prompt: `Motion type: ${intake.motionType}
Jurisdiction: ${intake.jurisdiction} | Court: ${ctx.input.court}
Legal issues: ${intake.legalIssues.join(", ")}
Citation summary: ${citationOutput.citationSummary.total} total, ${citationOutput.citationSummary.pass} pass, ${citationOutput.citationSummary.fail} fail
Missing inputs flagged: ${intake.missingInputs.join(", ") || "none"}`,
    schemaName: "AdversarialAgentOutput",
    fallback,
  });

  const validated =
    Array.isArray(result.strongestWeaknesses) && result.redTeamMemo ? result : fallback;

  const latencyMs = Math.round(performance.now() - start);
  events.push(makeEvent("AdversarialAgent", "agent_completed", `Risk: ${validated.riskLevel.toUpperCase()}`, { latencyMs }));

  return {
    agentName: "AdversarialAgent",
    status: "success",
    message: `Adversarial review: ${validated.riskLevel.toUpperCase()} risk. ${validated.strongestWeaknesses.length} weaknesses identified.`,
    output: validated as unknown as Record<string, unknown>,
    confidence: 0.75,
    events,
  };
}
