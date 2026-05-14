import type {
  FinalAnswerResult,
  IntakeResult,
  RetrievedSource,
  CitationValidationResult,
  AdversarialReviewResult,
} from "@/lib/types";

function buildAnswerBody(
  intake: IntakeResult,
  sources: RetrievedSource[],
  citationValidation: CitationValidationResult
): string {
  if (sources.length === 0) {
    return `Based on the available corpus, the legal issue of "${intake.queryClassification}" in ${intake.jurisdiction} does not map strongly to retrieved authorities. A comprehensive research memorandum would require expansion of the document set to provide reliable guidance.`;
  }

  const topSources = sources.slice(0, 3);
  const citedIds = topSources.map((s) => `[${s.id}]`).join(", ");

  const issueIntros: Record<IntakeResult["legalIssue"], string> = {
    contract: `Under the governing contract law framework applicable to ${intake.jurisdiction}, the following analysis addresses the identified dispute.`,
    tort: `In the context of a tort action in ${intake.jurisdiction}, the following elements and authorities are relevant.`,
    evidence: `The admissibility and reliability of evidence in ${intake.jurisdiction} is governed by the following standards.`,
    procedure: `Civil procedural rules applicable in ${intake.jurisdiction} establish the following framework for the issue presented.`,
    discovery: `Discovery obligations and protections in ${intake.jurisdiction} are governed by the following principles.`,
    general: `The following legal authorities are relevant to the research question presented.`,
  };

  const strongClaims = citationValidation.claims
    .filter((c) => c.supportStrength === "strong" && c.supportingCitationId)
    .slice(0, 2);

  const claimSentences = strongClaims
    .map((c) => `${c.claim} [${c.supportingCitationId}]`)
    .join(" ");

  const sourceSummaries = topSources
    .map((s) => `**${s.title}** (${s.id}): ${s.text.slice(0, 150)}...`)
    .join("\n\n");

  return [
    issueIntros[intake.legalIssue],
    "",
    claimSentences || `The retrieved authorities address the core issues: ${citedIds}.`,
    "",
    "**Retrieved Authorities:**",
    sourceSummaries,
    "",
    `*Note: This analysis is grounded in ${topSources.length} retrieved sample corpus entries. Confidence reflects citation support at ${Math.round(citationValidation.overallScore * 100)}%.*`,
  ].join("\n");
}

export function runFinalSynthesis(
  intake: IntakeResult,
  sources: RetrievedSource[],
  citationValidation: CitationValidationResult,
  adversarialReview: AdversarialReviewResult
): FinalAnswerResult {
  const adversarialRiskFactor = { low: 0.1, medium: 0.25, high: 0.45 }[adversarialReview.overallRisk];
  const confidenceScore = parseFloat(
    Math.max(0.1, (citationValidation.overallScore * 0.6 + (1 - adversarialRiskFactor) * 0.4)).toFixed(3)
  );

  const citations = [
    ...new Set(
      citationValidation.claims
        .filter((c) => c.supportingCitationId)
        .map((c) => c.supportingCitationId as string)
    ),
  ];

  const riskFlags: string[] = [
    ...citationValidation.flags,
    ...(adversarialReview.overallRisk === "high" ? ["HIGH adversarial risk — significant counterarguments identified."] : []),
    ...(adversarialReview.overallRisk === "medium" ? ["MODERATE adversarial risk — opposing counsel has viable challenges."] : []),
  ];

  const unresolvedQuestions = adversarialReview.missingAuthority.map(
    (ma) => `Missing authority: ${ma}`
  );

  return {
    answer: buildAnswerBody(intake, sources, citationValidation),
    citations,
    confidenceScore,
    riskFlags,
    unresolvedQuestions,
  };
}
