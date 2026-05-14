import type {
  EvalReport,
  RetrievalQualityMetrics,
  CitationValidationResult,
  RetrievedSource,
  FinalAnswerResult,
  HallucinationRiskResult,
} from "@/lib/types";
import { legalCorpus } from "@/lib/data/legalCorpus";

function averageOf(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function retrievalCoverageScore(sources: RetrievedSource[]): number {
  if (sources.length === 0) return 0.1;

  const method = sources[0]?.retrievalMethod;
  const topScore = sources[0]?.finalScore ?? sources[0]?.relevanceScore ?? 0;
  const count = sources.length;

  // Phase 2: stronger coverage calculation using hybrid scores
  if (method === "hybrid_rag" && count >= 3 && topScore >= 0.6) return 0.85;
  if (method === "hybrid_rag" && count >= 2) return 0.70;
  if (method === "hybrid_rag") return 0.55;
  if (method === "keyword_fallback" && count >= 3 && topScore >= 0.4) return 0.55;
  if (method === "keyword_fallback" && count >= 2) return 0.40;
  if (method === "memory_fallback") return 0.20;

  // Legacy: fraction of corpus (Phase 1 fallback)
  return parseFloat((sources.length / legalCorpus.length).toFixed(3));
}

function buildRetrievalQuality(sources: RetrievedSource[]): RetrievalQualityMetrics {
  const method = sources[0]?.retrievalMethod ?? "unknown";
  const vectorSearchUsed = sources.some((s) => (s.vectorScore ?? 0) > 0);
  const fallbackUsed = method !== "hybrid_rag";
  const hybridScores = sources.map((s) => s.hybridScore ?? s.relevanceScore);
  const avgHybrid = parseFloat(averageOf(hybridScores).toFixed(3));
  const topScore = sources[0]?.finalScore ?? sources[0]?.relevanceScore ?? 0;

  return {
    retrievalMethod: method,
    vectorSearchUsed,
    fallbackUsed,
    averageHybridScore: avgHybrid,
    topSourceScore: parseFloat(topScore.toFixed(3)),
    sourceCount: sources.length,
  };
}

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

  const hallucinationRiskScore = hallucinationRisk.riskScore;
  const hallucinationRiskLevel = hallucinationRisk.riskLevel;

  // Phase 2: stronger retrieval coverage
  const retrievalCoverage = parseFloat(retrievalCoverageScore(retrievedSources).toFixed(3));
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
    retrievalQuality: buildRetrievalQuality(retrievedSources),
  };
}
