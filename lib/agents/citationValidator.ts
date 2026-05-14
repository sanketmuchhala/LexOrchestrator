import type { CitationValidationResult, RetrievedSource, IntakeResult, ValidatedClaim } from "@/lib/types";

const CLAIMS_BY_ISSUE: Record<IntakeResult["legalIssue"], string[]> = {
  contract: [
    "A valid contract requires offer, acceptance, and consideration.",
    "The plaintiff must demonstrate the defendant's failure to perform.",
    "Breach of contract damages must flow from the breach and not be speculative.",
    "Consequential damages require foreseeability at the time of contracting.",
  ],
  tort: [
    "The defendant owed a legally cognizable duty of care to the plaintiff.",
    "The alleged breach must be the proximate cause of the plaintiff's injury.",
    "An intervening superseding cause may sever the chain of causation.",
    "Damages in negligence must be actual and cognizable.",
  ],
  evidence: [
    "Expert testimony must meet the applicable admissibility standard.",
    "The trial court acts as gatekeeper for scientific and technical evidence.",
    "An expert must be qualified by knowledge, skill, or experience.",
    "The Daubert and Frye standards differ in their reliability assessment approach.",
    "Reliable methodology is a prerequisite to expert testimony admission.",
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

function matchClaimToSources(claim: string, sources: RetrievedSource[]): { citationId: string | null; strength: ValidatedClaim["supportStrength"] } {
  if (sources.length === 0) return { citationId: null, strength: "unsupported" };

  const claimLower = claim.toLowerCase();
  const claimWords = claimLower.split(/\s+/).filter((w) => w.length > 4);

  let bestScore = 0;
  let bestId: string | null = null;

  for (const source of sources) {
    const sourceText = (source.text + " " + source.keywords.join(" ")).toLowerCase();
    const hits = claimWords.filter((w) => sourceText.includes(w)).length;
    const score = claimWords.length > 0 ? hits / claimWords.length : 0;
    if (score > bestScore) {
      bestScore = score;
      bestId = source.id;
    }
  }

  if (bestScore >= 0.4) return { citationId: bestId, strength: "strong" };
  if (bestScore >= 0.15) return { citationId: bestId, strength: "weak" };
  return { citationId: null, strength: "unsupported" };
}

export function runCitationValidator(
  intake: IntakeResult,
  sources: RetrievedSource[]
): CitationValidationResult {
  const rawClaims = CLAIMS_BY_ISSUE[intake.legalIssue] ?? CLAIMS_BY_ISSUE.general;
  const claims: ValidatedClaim[] = rawClaims.map((claim) => {
    const { citationId, strength } = matchClaimToSources(claim, sources);
    let flag: string | null = null;
    if (strength === "unsupported") flag = "No retrieved source supports this claim — hallucination risk elevated.";
    if (strength === "weak") flag = "Weak support only — claim requires stronger authority.";

    return {
      claim,
      supportingCitationId: citationId,
      supportStrength: strength,
      flag,
    };
  });

  const supported = claims.filter((c) => c.supportStrength !== "unsupported").length;
  const unsupported = claims.filter((c) => c.supportStrength === "unsupported").length;
  const overallScore = parseFloat((supported / claims.length).toFixed(3));

  const flags: string[] = [];
  if (unsupported > 0) flags.push(`${unsupported} claim(s) lack retrieved source support.`);
  if (sources.length < 2) flags.push("Thin retrieval — fewer than 2 sources retrieved; citation accuracy may be low.");
  if (overallScore < 0.5) flags.push("Overall citation support below threshold — response reliability is reduced.");

  return { claims, overallScore, flags, supportedCount: supported, unsupportedCount: unsupported };
}
