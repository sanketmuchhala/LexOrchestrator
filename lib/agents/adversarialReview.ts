import type { AdversarialReviewResult, IntakeResult, CitationValidationResult } from "@/lib/types";
import { generateStructuredOutput } from "@/lib/llm/llmClient";

const ADVERSARIAL_PLAYBOOKS: Record<
  IntakeResult["legalIssue"],
  { weaknesses: string[]; missingAuthority: string[]; counterarguments: string[] }
> = {
  contract: {
    weaknesses: [
      "The analysis omits whether the contract was required to be in writing under the statute of frauds.",
      "No discussion of whether a liquidated damages clause may cap or define recoverable amounts.",
      "The argument ignores the UCC vs. common law regime distinction for goods vs. services contracts.",
    ],
    missingAuthority: [
      "Cases addressing anticipatory repudiation and its effect on the non-breaching party's obligations.",
      "Authority on the plaintiff's duty to mitigate damages and whether that duty was discharged.",
      "Jurisdiction-specific statute of limitations for contract claims.",
    ],
    counterarguments: [
      "Defendant may argue the contract was void or voidable for lack of mutual assent or mutual mistake.",
      "Defendant can contest the foreseeability of consequential damages at the time of contracting.",
      "Defense may assert that plaintiff's own material breach excused defendant's performance.",
    ],
  },
  tort: {
    weaknesses: [
      "The causal chain between the negligent act and the injury is not established with sufficient specificity.",
      "No analysis of comparative or contributory negligence that may reduce or bar recovery.",
      "The assumption of risk defense has not been addressed.",
    ],
    missingAuthority: [
      "Cases establishing the scope of duty in analogous factual contexts.",
      "Expert testimony or evidence on causation - particularly for non-obvious injury mechanisms.",
      "Jurisdiction-specific rules on joint and several liability.",
    ],
    counterarguments: [
      "Defendant will argue no legally cognizable duty existed or that it was limited in scope.",
      "The superseding intervening cause doctrine may break the chain of proximate causation.",
      "Plaintiff's comparative fault may constitute a complete or partial defense.",
    ],
  },
  evidence: {
    weaknesses: [
      "The analysis does not account for circuit splits on specific Daubert factors and how they are weighted.",
      "No discussion of whether the expert's opinion was formed specifically for litigation rather than independent research.",
      "The Daubert (federal) vs. Frye (some state) distinction has not been addressed.",
    ],
    missingAuthority: [
      "Post-Daubert circuit court decisions interpreting the gatekeeper role in the specific technical field at issue.",
      "Cases addressing the admissibility of probabilistic or statistical expert opinions.",
      "State-specific evidentiary rules where Frye remains the controlling standard.",
    ],
    counterarguments: [
      "Opposing party may challenge the expert's qualifications as insufficient in the specific sub-discipline.",
      "Daubert challenge: the methodology may not be peer-reviewed or may have an unacceptable known error rate.",
      "Argument that the expert's opinion is mere ipse dixit - unsupported by sufficient facts in this record.",
    ],
  },
  procedure: {
    weaknesses: [
      "The analysis assumes a federal procedural standard without confirming state or federal jurisdiction.",
      "No analysis of whether discovery has been adequate to oppose summary judgment.",
      "The procedural posture at the time of the motion has not been clearly addressed.",
    ],
    missingAuthority: [
      "Circuit-specific precedent on how the plausibility standard is applied to this claim type.",
      "Authority on the consequences of failure to object to procedural errors at trial (waiver).",
      "Cases on the right to amend pleadings after a 12(b)(6) dismissal.",
    ],
    counterarguments: [
      "Defendant argues that even accepting all facts as true, the complaint fails to state a plausible claim.",
      "Court may find material facts remain genuinely disputed, defeating summary judgment for either party.",
      "Movant may challenge standing, ripeness, or subject-matter jurisdiction as threshold matters.",
    ],
  },
  discovery: {
    weaknesses: [
      "Privilege assertions have not been logged in a privilege log, which may be required.",
      "The proportionality analysis does not quantify the burden against the likely benefit.",
      "No analysis of whether ESI protocols have been established.",
    ],
    missingAuthority: [
      "Cases addressing waiver of attorney-client privilege through inadvertent disclosure.",
      "Authority on the scope of the crime-fraud exception to the privilege.",
      "Caselaw on protective orders limiting the use of confidentially discovered materials.",
    ],
    counterarguments: [
      "Opposing party may argue privilege has been waived through selective disclosure or reliance on advice of counsel.",
      "Discovery requests may be challenged as disproportionate under the six-factor proportionality test.",
      "Work product doctrine may shield materials prepared in anticipation of litigation.",
    ],
  },
  general: {
    weaknesses: [
      "The query does not identify a specific jurisdiction, limiting the precision of applicable authority.",
      "Without a defined legal issue, the analysis cannot confirm which standard of review governs.",
      "The scope of the research is insufficiently focused to yield reliable, targeted results.",
    ],
    missingAuthority: [
      "Binding authority from the jurisdiction's highest court on the legal question presented.",
      "Secondary sources such as Restatements or treatises to identify majority and minority rules.",
    ],
    counterarguments: [
      "Any position taken without jurisdiction-specific authority may be vulnerable to challenge.",
      "Opposing counsel may cite circuit or state splits undermining the position taken.",
    ],
  },
};

interface LLMAdversarialResponse {
  weaknesses: string[];
  missingAuthority: string[];
  counterarguments: string[];
  overallRisk: "low" | "medium" | "high";
  summary: string;
}

export async function runAdversarialReviewAgent(
  intake: IntakeResult,
  citationValidation: CitationValidationResult
): Promise<AdversarialReviewResult> {
  const playbook = ADVERSARIAL_PLAYBOOKS[intake.legalIssue] ?? ADVERSARIAL_PLAYBOOKS.general;
  const riskScore = citationValidation.overallScore;
  const defaultRisk: AdversarialReviewResult["overallRisk"] = riskScore < 0.5 ? "high" : riskScore < 0.75 ? "medium" : "low";
  const riskLabel = { high: "HIGH ADVERSARIAL RISK", medium: "MODERATE ADVERSARIAL RISK", low: "LOW ADVERSARIAL RISK" };

  const fallback: AdversarialReviewResult = {
    weaknesses: playbook.weaknesses,
    missingAuthority: playbook.missingAuthority,
    counterarguments: playbook.counterarguments,
    overallRisk: defaultRisk,
    summary: `${riskLabel[defaultRisk]}: ${playbook.counterarguments.length} viable counterarguments. Citation support: ${Math.round(citationValidation.overallScore * 100)}%. Unsupported claims: ${citationValidation.unsupportedCount}.`,
  };

  const result = await generateStructuredOutput<LLMAdversarialResponse>({
    system: `You are adversarial legal counsel reviewing a legal AI response for weaknesses.
Given context about a legal query and its citation validation results, identify:
- weaknesses: 3 specific analytical weaknesses or missing elements
- missingAuthority: 3 types of legal authority that were not retrieved or cited
- counterarguments: 3 substantive arguments opposing counsel would raise
- overallRisk: "low" | "medium" | "high" based on citation support (high if <50% supported)
- summary: one sentence risk summary starting with HIGH/MODERATE/LOW ADVERSARIAL RISK

Return JSON only with those exact keys.`,
    prompt: `Legal issue: ${intake.queryClassification}
Jurisdiction: ${intake.jurisdiction}
Citation support score: ${Math.round(citationValidation.overallScore * 100)}%
Unsupported claims: ${citationValidation.unsupportedCount} of ${citationValidation.claims.length}
Key claims:\n${citationValidation.claims.slice(0, 3).map((c) => `- ${c.claim} [${c.supportStatus}]`).join("\n")}`,
    schemaName: "AdversarialReview",
    fallback,
  });

  const validRisks = ["low", "medium", "high"];
  if (!validRisks.includes(result.overallRisk) || !Array.isArray(result.weaknesses)) return fallback;

  return result;
}
