import type {
  LitigationWorkflowInput,
  LitigationWorkflowResult,
  AgentContext,
  AgentEventRecord,
  AgentResult,
  IntakeAgentOutput,
  RetrievalAgentOutput,
  DraftingAgentOutput,
  CitationAgentOutput,
  AdversarialAgentOutput,
  LocalRulesAgentOutput,
  EvalAgentOutput,
} from "./types";
import { createWorkflowRun } from "./createWorkflowRun";
import { logAgentEvent, makeEvent } from "./logAgentEvent";
import { saveDraftArtifact } from "./saveDraftArtifact";
import { updateLitigationWorkflowRun } from "@/lib/db/supabaseServer";
import { runLitigationIntakeAgent } from "./agents/intakeAgent";
import { runLitigationRetrievalAgent } from "./agents/retrievalAgent";
import { runLitigationDraftingAgent } from "./agents/draftingAgent";
import { runLitigationCitationAgent } from "./agents/citationAgent";
import { runLitigationAdversarialAgent } from "./agents/adversarialAgent";
import { runLitigationLocalRulesAgent } from "./agents/localRulesAgent";
import { runLitigationJudgeBriefAgent } from "./agents/judgeBriefAgent";
import { runLitigationEvalAgent } from "./agents/evalAgent";

function formatAdversarialContent(output: AdversarialAgentOutput): string {
  const lines: string[] = [
    `ADVERSARIAL RISK: ${output.riskLevel.toUpperCase()}`,
    "",
    "STRONGEST WEAKNESSES",
    ...output.strongestWeaknesses.map((w, i) => `${i + 1}. ${w}`),
    "",
    "UNSUPPORTED CLAIMS",
    ...output.unsupportedClaims.map((c, i) => `${i + 1}. ${c}`),
    "",
    "LIKELY COUNTERARGUMENTS",
    ...output.likelyCounterarguments.map((c, i) => `${i + 1}. ${c}`),
    "",
    "RED TEAM MEMO",
    output.redTeamMemo,
  ];
  return lines.join("\n");
}

function formatLocalRulesContent(output: LocalRulesAgentOutput): string {
  const lines: string[] = [
    "FORMATTING NOTES",
    ...output.formattingNotes.map((n, i) => `${i + 1}. ${n}`),
    "",
    "RULE WARNINGS",
    ...output.ruleWarnings.map((w, i) => `${i + 1}. ${w}`),
  ];
  if (output.revisedDraftText) {
    lines.push("", "REVISED DRAFT NOTE", output.revisedDraftText);
  }
  return lines.join("\n");
}

async function dispatchAndLog(
  result: AgentResult,
  workflowRunId: string,
  allEvents: AgentEventRecord[]
): Promise<void> {
  for (const ev of result.events) {
    allEvents.push(ev);
    await logAgentEvent(workflowRunId, ev);
  }
}

export async function runLitigationWorkflow(
  input: LitigationWorkflowInput
): Promise<LitigationWorkflowResult> {
  // Step 1: create workflow run record
  const { id: workflowRunId } = await createWorkflowRun(input);
  const allEvents: AgentEventRecord[] = [];

  // Step 2: log workflow started
  const startEvent = makeEvent("Orchestrator", "run_started", `Workflow ${workflowRunId} started`);
  allEvents.push(startEvent);
  await logAgentEvent(workflowRunId, startEvent);

  const ctx: AgentContext = {
    workflowRunId,
    input,
    retrievedAuthority: [],
    draftArtifacts: [],
    citationReports: [],
    judgeProfile: null,
    metadata: {},
  };

  try {
    // Step 3: Intake Agent
    const intakeResult = await runLitigationIntakeAgent(ctx);
    await dispatchAndLog(intakeResult, workflowRunId, allEvents);
    const intake = intakeResult.output as unknown as IntakeAgentOutput;

    // Step 4: Retrieval Agent
    const retrievalResult = await runLitigationRetrievalAgent(ctx, intake);
    await dispatchAndLog(retrievalResult, workflowRunId, allEvents);
    const retrieval = retrievalResult.output as unknown as RetrievalAgentOutput;
    ctx.retrievedAuthority = retrieval.retrievedAuthority;

    // Step 5: Drafting Agent
    const draftingResult = await runLitigationDraftingAgent(ctx, intake, retrieval);
    await dispatchAndLog(draftingResult, workflowRunId, allEvents);
    const draft = draftingResult.output as unknown as DraftingAgentOutput;
    ctx.draftArtifacts.push(draft);

    // Step 6: Citation Agent
    const citationResult = await runLitigationCitationAgent(ctx, draft);
    await dispatchAndLog(citationResult, workflowRunId, allEvents);
    const citationOutput = citationResult.output as unknown as CitationAgentOutput;
    ctx.citationReports = citationOutput.citationReports;

    // Step 7: Adversarial Agent
    const adversarialResult = await runLitigationAdversarialAgent(ctx, intake, citationOutput);
    await dispatchAndLog(adversarialResult, workflowRunId, allEvents);
    const adversarial = adversarialResult.output as unknown as AdversarialAgentOutput;

    // Step 8: Local Rules Agent
    const localRulesResult = await runLitigationLocalRulesAgent(ctx, intake);
    await dispatchAndLog(localRulesResult, workflowRunId, allEvents);
    const localRulesOutput = localRulesResult.output as unknown as LocalRulesAgentOutput;

    // Step 9: Judge Brief Agent (only when judge info is provided)
    if (input.judgeName || input.judgeId) {
      const judgeBriefResult = await runLitigationJudgeBriefAgent(ctx);
      await dispatchAndLog(judgeBriefResult, workflowRunId, allEvents);
    }

    // Step 10: Eval Agent
    const evalResult = await runLitigationEvalAgent(ctx, retrieval, citationOutput, adversarial);
    await dispatchAndLog(evalResult, workflowRunId, allEvents);
    const evalOutput = evalResult.output as unknown as EvalAgentOutput;

    // Step 11: Save draft artifacts
    const savedArtifact = await saveDraftArtifact(workflowRunId, draft, "DraftingAgent");
    const artifactEvent = makeEvent("Orchestrator", "draft_chunk", savedArtifact.title);
    allEvents.push(artifactEvent);
    await logAgentEvent(workflowRunId, artifactEvent);

    await saveDraftArtifact(
      workflowRunId,
      {
        title: `Adversarial Review — ${intake.motionType.replace(/_/g, " ")}`,
        sections: [],
        draftText: formatAdversarialContent(adversarial),
        citations: [],
        artifactType: "red_team_memo",
      },
      "AdversarialAgent"
    );

    await saveDraftArtifact(
      workflowRunId,
      {
        title: `Local Rules — ${ctx.input.court}`,
        sections: [],
        draftText: formatLocalRulesContent(localRulesOutput),
        citations: [],
        artifactType: "local_rules_check",
      },
      "LocalRulesAgent"
    );

    // Step 12: Update workflow run with final scores
    await updateLitigationWorkflowRun(workflowRunId, {
      status: "completed",
      finalOutput: draft.draftText.slice(0, 2000),
      confidence: evalOutput.overallConfidence,
      faithfulnessScore: evalOutput.faithfulnessScore,
      citationPassRate: evalOutput.citationPassRate,
    });

    const completedEvent = makeEvent("Orchestrator", "run_completed", `Workflow ${workflowRunId} completed`);
    allEvents.push(completedEvent);
    await logAgentEvent(workflowRunId, completedEvent);

    // Step 13: Return result
    return {
      workflowRunId,
      status: "completed",
      finalOutput: draft.draftText,
      artifacts: ctx.draftArtifacts,
      citationSummary: citationOutput.citationSummary,
      evalSummary: {
        faithfulnessScore: evalOutput.faithfulnessScore,
        citationPassRate: evalOutput.citationPassRate,
        retrievalCoverage: evalOutput.retrievalCoverage,
        unsupportedClaimRisk: evalOutput.unsupportedClaimRisk,
        overallConfidence: evalOutput.overallConfidence,
        passFail: evalOutput.passFail,
      },
      events: allEvents,
    };
  } catch (err) {
    const failedEvent = makeEvent(
      "Orchestrator",
      "run_failed",
      err instanceof Error ? err.message : String(err)
    );
    allEvents.push(failedEvent);
    await logAgentEvent(workflowRunId, failedEvent);
    await updateLitigationWorkflowRun(workflowRunId, { status: "failed" });
    throw err;
  }
}
