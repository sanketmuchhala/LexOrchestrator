// Sequential multi-agent pipeline — each agent enriches context for the next
import type { OrchestratorResult, ExecutionStep } from "@/lib/types";
import { runIntakeAgent } from "@/lib/agents/intakeAgent";
import { runRetrievalAgent } from "@/lib/agents/retrievalAgent";
import { runCitationValidator } from "@/lib/agents/citationValidator";
import { runAdversarialReview } from "@/lib/agents/adversarialReview";
import { runFinalSynthesis } from "@/lib/agents/finalSynthesis";
import { runEvalEngine } from "@/lib/evals/evalEngine";

function time<T>(fn: () => T): { result: T; durationMs: number } {
  const start = performance.now();
  const result = fn();
  return { result, durationMs: Math.round(performance.now() - start) };
}

export function runOrchestrationPipeline(query: string): OrchestratorResult {
  const trace: ExecutionStep[] = [];

  const { result: intake, durationMs: t1 } = time(() => runIntakeAgent(query));
  trace.push({ agent: "Intake Agent", durationMs: t1, status: "complete" });

  const { result: retrieval, durationMs: t2 } = time(() => runRetrievalAgent(intake));
  trace.push({ agent: "Retrieval Agent", durationMs: t2, status: "complete" });

  const { result: citationValidation, durationMs: t3 } = time(() =>
    runCitationValidator(intake, retrieval.sources)
  );
  trace.push({ agent: "Citation Validator", durationMs: t3, status: "complete" });

  const { result: adversarialReview, durationMs: t4 } = time(() =>
    runAdversarialReview(intake, citationValidation)
  );
  trace.push({ agent: "Adversarial Review", durationMs: t4, status: "complete" });

  const { result: finalAnswer, durationMs: t5 } = time(() =>
    runFinalSynthesis(intake, retrieval.sources, citationValidation, adversarialReview)
  );
  trace.push({ agent: "Final Synthesis", durationMs: t5, status: "complete" });

  const { result: evalReport, durationMs: t6 } = time(() =>
    runEvalEngine(citationValidation, retrieval.sources, finalAnswer)
  );
  trace.push({ agent: "Eval Engine", durationMs: t6, status: "complete" });

  return {
    query,
    intake,
    retrievedSources: retrieval.sources,
    citationValidation,
    adversarialReview,
    finalAnswer,
    evalReport,
    executionTrace: trace,
  };
}
