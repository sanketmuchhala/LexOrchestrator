import type {
  EvalReport,
  CitationValidationResult,
  RetrievedSource,
  FinalAnswerResult,
} from "@/lib/types";
import { legalCorpus } from "@/lib/data/legalCorpus";

export function runEvalEngine(
  citationValidation: CitationValidationResult,
  retrievedSources: RetrievedSource[],
  finalAnswer: FinalAnswerResult
): EvalReport {
  // Groundedness: fraction of claims that have at least weak support
  const groundednessScore = parseFloat(
    (citationValidation.supportedCount / Math.max(1, citationValidation.claims.length)).toFixed(3)
  );

  // Citation accuracy: fraction of cited IDs that exist in the retrieved source set
  const retrievedIds = new Set(retrievedSources.map((s) => s.id));
  const citedInAnswer = finalAnswer.citations;
  const validCitations = citedInAnswer.filter((id) => retrievedIds.has(id)).length;
  const citationAccuracyScore = parseFloat(
    (validCitations / Math.max(1, citedInAnswer.length)).toFixed(3)
  );

  // Hallucination risk: based on unsupported claim count
  let hallucinationRisk: EvalReport["hallucinationRisk"];
  if (citationValidation.unsupportedCount >= 2) hallucinationRisk = "high";
  else if (citationValidation.unsupportedCount === 1) hallucinationRisk = "medium";
  else hallucinationRisk = "low";

  // Retrieval coverage: relevant sources found as fraction of total corpus
  const retrievalCoverage = parseFloat(
    (retrievedSources.length / legalCorpus.length).toFixed(3)
  );

  const finalAnswerConfidence = finalAnswer.confidenceScore;

  // Overall reliability: weighted composite
  const overallReliability = parseFloat(
    (
      groundednessScore * 0.35 +
      citationAccuracyScore * 0.25 +
      (1 - (hallucinationRisk === "high" ? 0.8 : hallucinationRisk === "medium" ? 0.4 : 0.1)) * 0.2 +
      finalAnswerConfidence * 0.2
    ).toFixed(3)
  );

  return {
    groundednessScore,
    citationAccuracyScore,
    hallucinationRisk,
    retrievalCoverage,
    finalAnswerConfidence,
    overallReliability,
  };
}
