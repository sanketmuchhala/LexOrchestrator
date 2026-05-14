import type { HallucinationRiskResult, CitationValidationResult, RetrievedSource, AdversarialReviewResult } from "@/lib/types";

export function runHallucinationRiskAgent(
  citationValidation: CitationValidationResult,
  sources: RetrievedSource[],
  adversarialReview: AdversarialReviewResult
): HallucinationRiskResult {
  const factors: string[] = [];
  let riskScore = 0;

  const totalClaims = citationValidation.claims.length || 1;

  // Primary signal: unsupported citation count (weight 0.5)
  const unsupportedFraction = citationValidation.unsupportedCount / totalClaims;
  if (unsupportedFraction > 0) {
    riskScore += unsupportedFraction * 0.5;
    factors.push(`${citationValidation.unsupportedCount} of ${totalClaims} claim(s) lack retrieved source support.`);
  }

  // Secondary signal: low retrieval coverage (weight 0.25)
  const retrievalCoverage = sources.length / 12; // relative to corpus size
  if (retrievalCoverage < 0.25) {
    riskScore += 0.25;
    factors.push(`Low retrieval coverage (${sources.length} sources) — thin evidentiary base.`);
  } else if (retrievalCoverage < 0.15) {
    riskScore += 0.15;
    factors.push("Minimal retrieval coverage — answer relies on very limited sources.");
  }

  // Tertiary signal: adversarial risk level (weight 0.25)
  if (adversarialReview.overallRisk === "high") {
    riskScore += 0.25;
    factors.push("High adversarial risk — multiple viable counterarguments identified.");
  } else if (adversarialReview.overallRisk === "medium") {
    riskScore += 0.1;
    factors.push("Moderate adversarial risk — some counterarguments require authority.");
  }

  // Partial support penalty: claims with only weak/partial support inflate uncertainty
  const partialCount = citationValidation.claims.filter((c) => c.supportStatus === "partial").length;
  if (partialCount > 1) {
    riskScore += (partialCount / totalClaims) * 0.1;
    factors.push(`${partialCount} claim(s) only partially supported — may require stronger authority.`);
  }

  riskScore = Math.min(1, parseFloat(riskScore.toFixed(3)));

  let riskLevel: HallucinationRiskResult["riskLevel"];
  if (riskScore >= 0.5) riskLevel = "high";
  else if (riskScore >= 0.25) riskLevel = "medium";
  else riskLevel = "low";

  if (factors.length === 0) {
    factors.push("All claims supported by retrieved sources — hallucination risk is low.");
  }

  return {
    riskScore,
    riskLevel,
    factors,
    unsupportedCitationCount: citationValidation.unsupportedCount,
  };
}
