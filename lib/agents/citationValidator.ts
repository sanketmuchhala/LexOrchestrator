import type { CitationValidationResult, RetrievedSource, IntakeResult, ValidatedClaim } from "@/lib/types";
import { generateStructuredOutput } from "@/lib/llm/llmClient";

const CLAIMS_BY_ISSUE: Record<IntakeResult["legalIssue"], string[]> = {
  contract: [
    "A valid contract requires offer, acceptance, and consideration.",
    "The plaintiff must demonstrate the defendant's failure to perform as required.",
    "Breach of contract damages must flow directly from the breach and not be speculative.",
    "Consequential damages require foreseeability at the time of contracting.",
  ],
  tort: [
    "The defendant owed a legally cognizable duty of care to the plaintiff.",
    "The alleged breach must be the proximate cause of the plaintiff's injury.",
    "An intervening superseding cause may sever the chain of causation.",
    "Damages in negligence must be actual and cognizable.",
  ],
  evidence: [
    "Expert testimony must meet the applicable federal or state admissibility standard.",
    "The trial court acts as gatekeeper for scientific and technical expert evidence.",
    "An expert must be qualified by knowledge, skill, experience, training, or education.",
    "The Daubert and Frye standards apply different tests for reliability.",
    "Reliable methodology is a prerequisite to the admission of expert opinion.",
  ],
  procedure: [
    "Summary judgment requires no genuine dispute as to any material fact.",
    "A complaint must state a plausible claim for relief to survive a motion to dismiss.",
    "The movant bears the initial burden of demonstrating the absence of a genuine issue.",
    "Appellate review of procedural rulings applies the abuse of discretion standard.",
  ],
  discovery: [
    "Discovery must be proportional to the needs of the case.",
    "Attorney-client privilege protects confidential communications made for legal advice.",
    "The party asserting privilege bears the burden of demonstrating it applies.",
    "Courts may limit discovery that is cumulative or disproportionately burdensome.",
  ],
  general: [
    "Legal research requires identification of binding and persuasive authority.",
    "Jurisdiction determines which courts and legal standards govern the dispute.",
    "The applicable standard of review affects the weight given to lower court rulings.",
  ],
};

function deterministicValidate(claims: string[], sources: RetrievedSource[]): ValidatedClaim[] {
  return claims.map((claim) => {
    if (sources.length === 0) {
      return { claim, citationId: null, supportStatus: "unsupported" as const, supportScore: 0, explanation: "No sources retrieved." };
    }
    const claimWords = claim.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
    let bestScore = 0;
    let bestId: string | null = null;
    for (const source of sources) {
      const sourceText = (source.text + " " + source.keywords.join(" ")).toLowerCase();
      const hits = claimWords.filter((w) => sourceText.includes(w)).length;
      const score = claimWords.length > 0 ? hits / claimWords.length : 0;
      if (score > bestScore) { bestScore = score; bestId = source.citationId ?? source.id; }
    }
    const supportStatus: ValidatedClaim["supportStatus"] = bestScore >= 0.4 ? "verified" : bestScore >= 0.15 ? "partial" : "unsupported";
    const explanation = supportStatus === "verified"
      ? `Strongly supported by ${bestId} - keyword overlap confirms alignment.`
      : supportStatus === "partial"
      ? `Partially supported by ${bestId} - additional authority advisable.`
      : "No retrieved source adequately supports this claim - hallucination risk elevated.";
    return { claim, citationId: bestId, supportStatus, supportScore: parseFloat(bestScore.toFixed(3)), explanation };
  });
}

interface LLMValidationResponse {
  validations: ValidatedClaim[];
}

export async function runCitationValidator(
  intake: IntakeResult,
  sources: RetrievedSource[]
): Promise<CitationValidationResult> {
  const rawClaims = CLAIMS_BY_ISSUE[intake.legalIssue] ?? CLAIMS_BY_ISSUE.general;
  const fallbackClaims = deterministicValidate(rawClaims, sources);

  const sourceSummaries = sources
    .slice(0, 5)
    .map((s) => `Citation ID: ${s.citationId ?? s.id}\nTitle: ${s.title}\nText: ${s.text.slice(0, 300)}`)
    .join("\n\n---\n\n");

  const llmResult = await generateStructuredOutput<LLMValidationResponse>({
    system: `You are a legal citation validator for a litigation reliability system. Given a set of legal claims and retrieved corpus sources, evaluate whether each claim is supported by the sources.

For each claim, return a JSON object with:
- claim: the original claim text
- citationId: the citation ID of the best supporting source, or null if unsupported
- supportStatus: "verified" (clear, direct support), "partial" (indirect or incomplete support), or "unsupported" (no adequate support found)
- supportScore: a number 0–1 reflecting support strength
- explanation: one sentence explaining the assessment

Return a JSON object with a "validations" key containing an array of these objects.`,
    prompt: `Legal claims to validate:\n${rawClaims.map((c, i) => `${i + 1}. ${c}`).join("\n")}\n\nRetrieved sources:\n${sourceSummaries || "No sources retrieved."}`,
    schemaName: "CitationValidation",
    fallback: { validations: fallbackClaims },
  });

  const claims = Array.isArray(llmResult.validations) && llmResult.validations.length === rawClaims.length
    ? llmResult.validations
    : fallbackClaims;

  const supportedCount = claims.filter((c) => c.supportStatus !== "unsupported").length;
  const unsupportedCount = claims.length - supportedCount;
  const overallScore = parseFloat((supportedCount / Math.max(1, claims.length)).toFixed(3));

  const flags: string[] = [];
  if (unsupportedCount > 0) flags.push(`${unsupportedCount} claim(s) lack retrieved source support.`);
  if (sources.length < 2) flags.push("Thin retrieval - fewer than 2 sources; citation accuracy may be low.");
  if (overallScore < 0.5) flags.push("Overall citation support below threshold - response reliability is reduced.");

  return { claims, overallScore, flags, supportedCount, unsupportedCount };
}
