import type {
  FinalAnswerResult,
  IntakeResult,
  RetrievedSource,
  CitationValidationResult,
  AdversarialReviewResult,
} from "@/lib/types";
import { generateStructuredOutput } from "@/lib/llm/llmClient";

function deterministicAnswer(
  intake: IntakeResult,
  sources: RetrievedSource[],
  citationValidation: CitationValidationResult
): string {
  if (sources.length === 0) {
    return `Based on the available corpus, the legal issue of "${intake.queryClassification}" in ${intake.jurisdiction} does not map strongly to retrieved authorities. A comprehensive research memorandum would require expanding the document set.`;
  }
  const topSources = sources.slice(0, 3);
  const strongClaims = citationValidation.claims.filter((c) => c.supportStatus === "verified" && c.citationId).slice(0, 2);
  const claimSentences = strongClaims.map((c) => `${c.claim} [${c.citationId}]`).join(" ");
  const sourceSummaries = topSources.map((s) => `**${s.title}** (${s.citationId ?? s.id}): ${s.text.slice(0, 160)}...`).join("\n\n");
  const issueIntros: Record<IntakeResult["legalIssue"], string> = {
    contract: `Under governing contract law in ${intake.jurisdiction}:`, tort: `In a tort action in ${intake.jurisdiction}:`,
    evidence: `Regarding evidentiary standards in ${intake.jurisdiction}:`, procedure: `Under civil procedure rules in ${intake.jurisdiction}:`,
    discovery: `Discovery obligations in ${intake.jurisdiction}:`, general: `Relevant legal authorities for this research question:`,
  };
  return [issueIntros[intake.legalIssue], "", claimSentences || `See: ${topSources.map((s) => s.citationId ?? s.id).join(", ")}.`, "", "**Retrieved Authorities:**", sourceSummaries, "", `*Citation support: ${Math.round(citationValidation.overallScore * 100)}%. Sample corpus only — not real legal authority.*`].join("\n");
}

interface LLMFinalAnswerResponse {
  legalStyleAnswer: string;
  citationsUsed: string[];
  confidence: number;
  unresolvedQuestions: string[];
  riskFlags: string[];
}

export async function runFinalSynthesisAgent(
  intake: IntakeResult,
  sources: RetrievedSource[],
  citationValidation: CitationValidationResult,
  adversarialReview: AdversarialReviewResult
): Promise<FinalAnswerResult> {
  const adversarialRiskFactor = { low: 0.1, medium: 0.25, high: 0.45 }[adversarialReview.overallRisk];
  const confidenceScore = parseFloat(Math.max(0.1, citationValidation.overallScore * 0.6 + (1 - adversarialRiskFactor) * 0.4).toFixed(3));
  const deterministicCitations = [...new Set(citationValidation.claims.filter((c) => c.citationId).map((c) => c.citationId as string))];
  const deterministicRiskFlags = [
    ...citationValidation.flags,
    ...(adversarialReview.overallRisk === "high" ? ["HIGH adversarial risk — significant counterarguments identified."] : []),
    ...(adversarialReview.overallRisk === "medium" ? ["MODERATE adversarial risk — opposing counsel has viable challenges."] : []),
  ];

  const fallback: FinalAnswerResult = {
    answer: deterministicAnswer(intake, sources, citationValidation),
    citations: deterministicCitations,
    confidenceScore,
    riskFlags: deterministicRiskFlags,
    unresolvedQuestions: adversarialReview.missingAuthority.map((ma) => `Missing authority: ${ma}`),
  };

  const sourceSummaries = sources.slice(0, 4).map((s) => `[${s.citationId ?? s.id}] ${s.title}: ${s.text.slice(0, 250)}`).join("\n\n");

  const result = await generateStructuredOutput<LLMFinalAnswerResponse>({
    system: `You are a legal research AI producing a final legal analysis. Write a clear, well-structured response that:
1. Answers the legal question using only the provided retrieved sources
2. Cites sources inline using their citation IDs (e.g. [SAMPLE-003])
3. Acknowledges limitations from the adversarial review
4. Does NOT claim to provide legal advice or real legal authority

Return JSON with these exact keys:
- legalStyleAnswer: the main legal analysis text (2–4 paragraphs)
- citationsUsed: array of citation IDs referenced in the answer
- confidence: number 0–1 reflecting overall confidence
- unresolvedQuestions: array of strings naming unresolved legal questions or missing authority
- riskFlags: array of strings naming risk factors or caveats

Return JSON only.`,
    prompt: `Query: ${intake.queryClassification}
Issue: ${intake.queryClassification} | Jurisdiction: ${intake.jurisdiction}
Citation support: ${Math.round(citationValidation.overallScore * 100)}%
Adversarial risk: ${adversarialReview.overallRisk.toUpperCase()}

Retrieved sources:\n${sourceSummaries || "No sources retrieved."}

Key weaknesses identified:\n${adversarialReview.weaknesses.slice(0, 2).join("\n")}`,
    schemaName: "FinalAnswer",
    fallback: {
      legalStyleAnswer: fallback.answer,
      citationsUsed: fallback.citations,
      confidence: fallback.confidenceScore,
      unresolvedQuestions: fallback.unresolvedQuestions,
      riskFlags: fallback.riskFlags,
    },
  });

  return {
    answer: result.legalStyleAnswer ?? fallback.answer,
    citations: Array.isArray(result.citationsUsed) ? result.citationsUsed : fallback.citations,
    confidenceScore: typeof result.confidence === "number" ? parseFloat(result.confidence.toFixed(3)) : confidenceScore,
    riskFlags: Array.isArray(result.riskFlags) ? result.riskFlags : fallback.riskFlags,
    unresolvedQuestions: Array.isArray(result.unresolvedQuestions) ? result.unresolvedQuestions : fallback.unresolvedQuestions,
  };
}
