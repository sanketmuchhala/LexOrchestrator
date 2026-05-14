import type {
  EvalReport,
  CitationValidationResult,
  RetrievedSource,
  FinalAnswerResult,
  HallucinationRiskResult,
} from "@/lib/types";
import { legalCorpus } from "@/lib/data/legalCorpus";

export function runEvalEngine(
  citationValidation: CitationValidationResult,
  retrievedSources: RetrievedSource[],
  finalAnswer: FinalAnswerResult,
  hallucinationRisk: HallucinationRiskResult
): EvalReport {
  // Groundedness: fraction of claims with at least partial support
  const groundednessScore = parseFloat(
    (citationValidation.supportedCount / Math.max(1, citationValidation.claims.length)).toFixed(3)
  );

  // Citation accuracy: fraction of cited IDs present in retrieved source set
  const retrievedIds = new Set(retrievedSources.map((s) => s.citationId ?? s.id));
  const validCitations = finalAnswer.citations.filter((id) => retrievedIds.has(id)).length;
  const citationAccuracyScore = parseFloat(
    (validCitations / Math.max(1, finalAnswer.citations.length)).toFixed(3)
  );

  // Use the dedicated hallucination risk agent's output
  const hallucinationRiskScore = hallucinationRisk.riskScore;
  const hallucinationRiskLevel = hallucinationRisk.riskLevel;

  // Retrieval coverage: retrieved sources as fraction of corpus
  const retrievalCoverage = parseFloat(
    (retrievedSources.length / legalCorpus.length).toFixed(3)
  );

  const finalAnswerConfidence = finalAnswer.confidenceScore;

  // Overall reliability: weighted composite
  const overallReliability = parseFloat(
    (
      groundednessScore * 0.35 +
      citationAccuracyScore * 0.25 +
      (1 - hallucinationRiskScore) * 0.2 +
      finalAnswerConfidence * 0.2
    ).toFixed(3)
  );

  return {
    groundednessScore,
    citationAccuracyScore,
    hallucinationRisk: hallucinationRiskLevel,
    hallucinationRiskScore,
    retrievalCoverage,
    finalAnswerConfidence,
    overallReliability,
    passFail: overallReliability >= 0.6 ? "pass" : "fail",
  };
}
