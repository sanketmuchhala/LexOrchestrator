// Async multi-agent orchestration pipeline with DB persistence.
// Each step enriches context for the next. All side effects flow through the tool registry.

import type {
  Phase1OrchestratorResult,
  ExecutionStep,
  RetrievedSource,
  CitationValidationResult,
  HallucinationRiskResult,
} from "@/lib/types";
import { runIntakeAgent } from "@/lib/agents/intakeAgent";
import { runAdversarialReviewAgent } from "@/lib/agents/adversarialReview";
import { runFinalSynthesisAgent } from "@/lib/agents/finalSynthesis";
import { runEvalEngine } from "@/lib/evals/evalEngine";
import { callTool } from "@/lib/tools/toolRegistry";
import {
  insertOrchestrationRun,
  updateOrchestrationRun,
  insertRetrievalResults,
  insertCitationValidations,
  insertEvalReport,
  DB_AVAILABLE,
} from "@/lib/db/supabaseServer";
import { LLM_AVAILABLE, LLM_MODEL } from "@/lib/llm/llmClient";

function time<T>(fn: () => Promise<T>): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  return fn().then((result) => ({ result, durationMs: Math.round(performance.now() - start) }));
}

export async function runOrchestration(query: string): Promise<Phase1OrchestratorResult> {
  const modelUsed = LLM_AVAILABLE ? LLM_MODEL : "mock";
  const trace: ExecutionStep[] = [];

  // 1. Create persistent run record
  const runId = await insertOrchestrationRun({ query, model: modelUsed });

  try {
    // 2. Intake Agent
    const { result: intake, durationMs: t1 } = await time(() => runIntakeAgent(query));
    trace.push({ agent: "Intake Agent", durationMs: t1, status: "complete" });
    await callTool("persistRunTrace", {
      runId, stepIndex: 0, agentName: "Intake Agent",
      inputSummary: `Query: ${query.slice(0, 120)}`,
      outputSummary: `Classified: ${intake.queryClassification} | Jurisdiction: ${intake.jurisdiction} | Risk: ${intake.riskLevel}`,
      payload: intake,
    });

    // 3. Retrieval Agent (via tool registry → DB-backed with fallback)
    const { result: sources, durationMs: t2 } = await time(() =>
      callTool<{ keyTerms: string[]; legalIssue: string }, RetrievedSource[]>("searchLegalCorpus", {
        keyTerms: intake.keyTerms,
        legalIssue: intake.legalIssue,
      })
    );
    trace.push({ agent: "Retrieval Agent", durationMs: t2, status: "complete" });
    await callTool("persistRunTrace", {
      runId, stepIndex: 1, agentName: "Retrieval Agent",
      inputSummary: `Key terms: ${intake.keyTerms.slice(0, 6).join(", ")}`,
      outputSummary: `Retrieved ${sources.length} source(s). Top: ${sources[0]?.title ?? "none"} (${Math.round((sources[0]?.relevanceScore ?? 0) * 100)}%)`,
      payload: { sources: sources.map((s) => ({ id: s.citationId, title: s.title, score: s.relevanceScore })) },
    });
    await insertRetrievalResults(runId, sources);

    // 4. Citation Validator (via tool registry → LLM with fallback)
    const { result: citationValidation, durationMs: t3 } = await time(() =>
      callTool<{ intake: typeof intake; sources: RetrievedSource[] }, CitationValidationResult>("validateCitationSupport", { intake, sources })
    );
    trace.push({ agent: "Citation Validator", durationMs: t3, status: "complete" });
    await callTool("persistRunTrace", {
      runId, stepIndex: 2, agentName: "Citation Validator",
      inputSummary: `${citationValidation.claims.length} claims against ${sources.length} sources`,
      outputSummary: `Score: ${Math.round(citationValidation.overallScore * 100)}% | Supported: ${citationValidation.supportedCount} | Unsupported: ${citationValidation.unsupportedCount}`,
      riskFlag: citationValidation.unsupportedCount > 0 ? "unsupported-claims" : undefined,
      payload: { claims: citationValidation.claims, overallScore: citationValidation.overallScore },
    });
    await insertCitationValidations(runId, citationValidation.claims);

    // 5. Adversarial Review Agent (LLM with fallback)
    const { result: adversarialReview, durationMs: t4 } = await time(() =>
      runAdversarialReviewAgent(intake, citationValidation)
    );
    trace.push({ agent: "Adversarial Review", durationMs: t4, status: "complete" });
    await callTool("persistRunTrace", {
      runId, stepIndex: 3, agentName: "Adversarial Review",
      inputSummary: `Citation score: ${Math.round(citationValidation.overallScore * 100)}%`,
      outputSummary: adversarialReview.summary,
      riskFlag: adversarialReview.overallRisk === "high" ? "high-adversarial-risk" : undefined,
      payload: { weaknesses: adversarialReview.weaknesses, counterarguments: adversarialReview.counterarguments, overallRisk: adversarialReview.overallRisk },
    });

    // 6. Hallucination Risk Agent (deterministic scoring)
    const { result: hallucinationRisk, durationMs: t5 } = await time(() =>
      callTool<{ citationValidation: CitationValidationResult; sources: RetrievedSource[]; adversarialReview: typeof adversarialReview }, HallucinationRiskResult>(
        "scoreHallucinationRisk",
        { citationValidation, sources, adversarialReview }
      )
    );
    trace.push({ agent: "Hallucination Risk Monitor", durationMs: t5, status: "complete" });
    await callTool("persistRunTrace", {
      runId, stepIndex: 4, agentName: "Hallucination Risk Monitor",
      inputSummary: `Unsupported claims: ${citationValidation.unsupportedCount}`,
      outputSummary: `Risk score: ${Math.round(hallucinationRisk.riskScore * 100)}% | Level: ${hallucinationRisk.riskLevel.toUpperCase()}`,
      riskFlag: hallucinationRisk.riskLevel !== "low" ? hallucinationRisk.riskLevel : undefined,
      payload: hallucinationRisk,
    });

    // 7. Final Synthesis Agent (LLM with fallback)
    const { result: finalAnswer, durationMs: t6 } = await time(() =>
      runFinalSynthesisAgent(intake, sources, citationValidation, adversarialReview)
    );
    trace.push({ agent: "Final Synthesis", durationMs: t6, status: "complete" });
    await callTool("persistRunTrace", {
      runId, stepIndex: 5, agentName: "Final Synthesis",
      inputSummary: "All prior agent outputs",
      outputSummary: `Confidence: ${Math.round(finalAnswer.confidenceScore * 100)}% | Citations: ${finalAnswer.citations.join(", ") || "none"}`,
      payload: { citations: finalAnswer.citations, confidenceScore: finalAnswer.confidenceScore, riskFlags: finalAnswer.riskFlags },
    });

    // 8. Eval Engine (deterministic)
    const { result: evalReport, durationMs: t7 } = await time(async () =>
      runEvalEngine(citationValidation, sources, finalAnswer, hallucinationRisk)
    );
    trace.push({ agent: "Eval Engine", durationMs: t7, status: "complete" });
    await callTool("persistRunTrace", {
      runId, stepIndex: 6, agentName: "Eval Engine",
      inputSummary: "Full pipeline artifacts",
      outputSummary: `Reliability: ${Math.round(evalReport.overallReliability * 100)}% | ${evalReport.passFail.toUpperCase()} | Hallucination: ${evalReport.hallucinationRisk}`,
      payload: evalReport,
    });
    await insertEvalReport(runId, evalReport);

    // 9. Finalize run record
    await updateOrchestrationRun(runId, {
      status: "completed",
      final_answer: finalAnswer.answer.slice(0, 1000),
      confidence: finalAnswer.confidenceScore,
      hallucination_risk: hallucinationRisk.riskScore,
    });

    return {
      runId,
      query,
      intake,
      retrievedSources: sources,
      citationValidation,
      hallucinationRisk,
      adversarialReview,
      finalAnswer,
      evalReport,
      executionTrace: trace,
      persisted: DB_AVAILABLE,
      modelUsed,
    };
  } catch (err) {
    await updateOrchestrationRun(runId, { status: "error" });
    throw err;
  }
}
