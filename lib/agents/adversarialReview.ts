import type { AdversarialReviewResult, IntakeResult, CitationValidationResult } from "@/lib/types";

const ADVERSARIAL_PLAYBOOKS: Record<
  IntakeResult["legalIssue"],
  { weaknesses: string[]; missingAuthority: string[]; counterarguments: string[] }
> = {
  contract: {
    weaknesses: [
      "The analysis does not address whether the contract was reduced to writing or relied upon the statute of frauds.",
      "No discussion of whether there was a valid liquidated damages clause that may cap recovery.",
      "The argument omits analysis of the UCC vs. common law contract regime distinction.",
    ],
    missingAuthority: [
      "Cases addressing anticipatory repudiation and the effect on the non-breaching party's obligations.",
      "Authority on the mitigation of damages duty and whether the plaintiff fulfilled it.",
      "Jurisdiction-specific statute of limitations for contract claims.",
    ],
    counterarguments: [
      "Defendant may argue the contract was void or voidable for lack of mutual assent or mistake.",
      "Defendant can contest the foreseeability of consequential damages at the time of contracting.",
      "Defense may assert that plaintiff's own breach excused defendant's performance under the doctrine of material breach.",
    ],
  },
  tort: {
    weaknesses: [
      "The causal chain between the negligent act and the injury is not fully established with specificity.",
      "No analysis of comparative or contributory negligence that may reduce or bar the plaintiff's recovery.",
      "The assumption of risk defense has not been addressed.",
    ],
    missingAuthority: [
      "Cases establishing the scope of duty in analogous factual contexts.",
      "Expert testimony or medical evidence on causation—particularly for non-obvious injuries.",
      "Jurisdiction-specific rules on joint and several liability.",
    ],
    counterarguments: [
      "Defendant will argue no duty existed or that the duty was limited in scope.",
      "The superseding intervening cause doctrine may break the chain of proximate causation.",
      "Plaintiff's contributory fault may constitute a complete or partial defense depending on the jurisdiction.",
    ],
  },
  evidence: {
    weaknesses: [
      "The analysis does not account for circuit splits on specific Daubert factors and their weighting.",
      "No discussion of whether the expert's opinion was formed specifically for litigation rather than independent research.",
      "The distinction between Daubert (federal) and Frye (some state) jurisdictions has not been addressed.",
    ],
    missingAuthority: [
      "Post-Daubert circuit court cases interpreting the gatekeeper role in the specific technical field at issue.",
      "Cases addressing the admissibility of probabilistic or statistical expert opinions.",
      "State-specific evidentiary rules where Frye remains the controlling standard.",
    ],
    counterarguments: [
      "Opposing party may challenge the expert's qualifications as insufficient in the specific sub-discipline.",
      "Daubert challenge: the methodology may not have been peer-reviewed or have a known error rate.",
      "Argument that expert's opinion is mere ipse dixit — unsupported by sufficient facts in this record.",
    ],
  },
  procedure: {
    weaknesses: [
      "The analysis assumes the federal procedural standard applies without confirming whether this is a state court action.",
      "No analysis of whether discovery has been sufficient to oppose summary judgment.",
      "The procedural posture at the time of the motion has not been addressed.",
    ],
    missingAuthority: [
      "Circuit-specific precedent on how the plausibility standard is applied in this type of case.",
      "Cases addressing the consequence of failure to object to procedural errors at trial (waiver doctrine).",
      "Authority on the right to amend pleadings as a matter of course after a Rule 12(b)(6) dismissal.",
    ],
    counterarguments: [
      "Defendant will argue that even accepting all facts as true, the complaint fails to state a plausible claim.",
      "The court may find that material facts remain genuinely disputed, defeating summary judgment for either party.",
      "Movant may challenge standing, ripeness, or subject-matter jurisdiction as a threshold matter.",
    ],
  },
  discovery: {
    weaknesses: [
      "Privilege assertions have not been logged in a privilege log, which may be required under the applicable rules.",
      "The proportionality analysis does not quantify the burden against the benefit.",
      "No analysis of whether electronically stored information (ESI) protocols have been established.",
    ],
    missingAuthority: [
      "Cases addressing waiver of attorney-client privilege through inadvertent disclosure.",
      "Authority on the scope of the crime-fraud exception to privilege.",
      "Caselaw on protective orders limiting the use of confidential discovered materials.",
    ],
    counterarguments: [
      "Opposing party may argue privilege has been waived through selective disclosure or reliance on advice-of-counsel defense.",
      "Discovery requests may be challenged as disproportionate using the six-factor proportionality test.",
      "The work product doctrine may be invoked to shield materials prepared in anticipation of litigation.",
    ],
  },
  general: {
    weaknesses: [
      "The query does not identify a specific jurisdiction, limiting the precision of applicable authority.",
      "Without a defined legal issue, the analysis cannot confirm which standard of review governs.",
      "The scope of the research is insufficiently focused to yield reliable results.",
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

export function runAdversarialReview(
  intake: IntakeResult,
  citationValidation: CitationValidationResult
): AdversarialReviewResult {
  const playbook = ADVERSARIAL_PLAYBOOKS[intake.legalIssue] ?? ADVERSARIAL_PLAYBOOKS.general;

  let overallRisk: AdversarialReviewResult["overallRisk"];
  if (citationValidation.overallScore < 0.5) overallRisk = "high";
  else if (citationValidation.overallScore < 0.75) overallRisk = "medium";
  else overallRisk = "low";

  const riskLabel = { high: "HIGH ADVERSARIAL RISK", medium: "MODERATE ADVERSARIAL RISK", low: "LOW ADVERSARIAL RISK" };

  return {
    weaknesses: playbook.weaknesses,
    missingAuthority: playbook.missingAuthority,
    counterarguments: playbook.counterarguments,
    overallRisk,
    summary: `${riskLabel[overallRisk]}: Opposing counsel has ${playbook.counterarguments.length} viable counterarguments. Citation support is ${Math.round(citationValidation.overallScore * 100)}% — ${citationValidation.unsupportedCount} unsupported claim(s) present hallucination risk.`,
  };
}
