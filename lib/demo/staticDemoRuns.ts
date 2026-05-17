export interface StaticDemoRun {
  id: string;
  title: string;
  motionType: string;
  jurisdiction: string;
  court: string;
  confidence: number;
  status: "completed";
  draft: string;
  adversarial: string;
  localRules: string;
  judgeName: string;
  judgeNotes: string;
  citationSummary: { total: number; verified: number; failed: number };
  evalSummary: string;
}

export const STATIC_DEMO_RUNS: StaticDemoRun[] = [
  {
    id: "demo-001",
    title: "Aurora Analytics LLC v. Northstar Retail Systems — Motion to Dismiss",
    motionType: "motion_to_dismiss",
    jurisdiction: "SDNY",
    court: "S.D.N.Y.",
    confidence: 0.82,
    status: "completed",
    draft: `UNITED STATES DISTRICT COURT
SOUTHERN DISTRICT OF NEW YORK

AURORA ANALYTICS LLC,
    Plaintiff,

    v.                                    No. [REDACTED]

NORTHSTAR RETAIL SYSTEMS, INC.,
    Defendant.

MEMORANDUM OF LAW IN SUPPORT OF DEFENDANT'S MOTION TO DISMISS

PRELIMINARY STATEMENT

Defendant Northstar Retail Systems, Inc. respectfully moves to dismiss the Complaint pursuant to Federal Rule of Civil Procedure 12(b)(6). Plaintiff Aurora Analytics LLC asserts breach of contract, promissory estoppel, and unjust enrichment arising from a pilot software evaluation that never ripened into a binding production agreement. Each count fails as a matter of law.

STATEMENT OF RELEVANT FACTS

The parties entered a written pilot agreement (the "Pilot Agreement") permitting Aurora to configure a sample analytics dashboard for a six-week evaluation. The Pilot Agreement expressly stated that any production deployment required a later, mutually executed order form. No order form was signed. Aurora's Complaint acknowledges this. Despite the absence of a binding production contract, Aurora now sues on alleged oral assurances made during negotiations.

LEGAL STANDARD

To survive a motion to dismiss under Rule 12(b)(6), a complaint must plead "enough facts to state a claim to relief that is plausible on its face." Bell Atlantic Corp. v. Twombly, 550 U.S. 544, 570 (2007). A claim is plausible "when the plaintiff pleads factual content that allows the court to draw the reasonable inference that the defendant is liable for the misconduct alleged." Ashcroft v. Iqbal, 556 U.S. 662, 678 (2009).

ARGUMENT

I. THE BREACH OF CONTRACT CLAIM FAILS

Aurora cannot state a breach of contract claim because the Pilot Agreement expressly conditioned any production engagement on a signed order form. Under New York law, where sophisticated parties have negotiated in anticipation of a formal written agreement, no binding contract arises until that document is executed. See R.G. Group, Inc. v. Horn & Hardart Co., 751 F.2d 69, 75 (2d Cir. 1984). The Pilot Agreement's plain language forecloses any inference that Aurora held a right to production deployment absent a signed order form.

II. THE PROMISSORY ESTOPPEL CLAIM IS DUPLICATIVE AND MERITLESS

Where a written agreement governs the parties' relationship, a promissory estoppel claim predicated on extra-contractual oral promises is barred. Merrill Lynch & Co. v. Allegheny Energy, Inc., 500 F.3d 171, 186 (2d Cir. 2007). The oral assurances Aurora cites — alleged statements that Northstar "would proceed to a paid rollout" — are quintessential pre-contract negotiations, not promissory commitments on which reasonable reliance could be placed.

III. UNJUST ENRICHMENT CANNOT STAND ALONGSIDE A GOVERNING CONTRACT

New York law bars unjust enrichment claims where a valid contract covers the subject matter of the dispute. Clark-Fitzpatrick, Inc. v. Long Island R.R. Co., 70 N.Y.2d 382, 388 (1987). The Pilot Agreement defines the parties' rights with respect to Aurora's configuration services. Unjust enrichment is therefore unavailable.

CONCLUSION

For the foregoing reasons, Defendant Northstar Retail Systems respectfully requests that the Court dismiss the Complaint in its entirety.

[DEMO ONLY — Not legal advice. Sample output for portfolio demonstration.]`,

    adversarial: `ADVERSARIAL RISK: MEDIUM

STRONGEST COUNTERARGUMENTS PLAINTIFF WILL RAISE:

1. PARTIAL PERFORMANCE DOCTRINE
Plaintiff will argue that Northstar's acceptance of, and six-week use of, the analytics dashboard constitutes partial performance sufficient to create an implied contract for compensation. Aurora may cite Jemzura v. Jemzura, 36 N.Y.2d 496, 504 (1975) for the proposition that part performance in reliance on an oral promise can overcome the writing requirement.

Response: The Pilot Agreement's no-deployment-without-order-form clause applies to production use, not to the evaluation itself. The evaluation period was contemplated and compensated by the Pilot Agreement.

2. FRAUDULENT INDUCEMENT / DETRIMENTAL RELIANCE
Aurora may recast the promissory estoppel claim as fraudulent inducement, arguing that Northstar's representations induced Aurora to invest additional configuration hours beyond the pilot scope.

Response: Sophisticated commercial parties cannot rely on oral representations that contradict an integrated written agreement. The parol evidence rule bars extrinsic modification.

3. UNJUST ENRICHMENT SURVIVES IN THE ALTERNATIVE
Plaintiff will argue unjust enrichment may be pled in the alternative where the contract's enforceability is disputed.

Response: While Rule 8(d)(3) permits alternative pleading, the unjust enrichment claim must still allege facts showing the contract does not apply — which the Complaint does not plead.

ASSESSMENT: Motion has approximately 70-75% likelihood of partial success (dismissal of unjust enrichment and promissory estoppel). The breach of contract claim presents closer questions depending on parol evidence admissibility.

[DEMO ONLY — Not legal advice or outcome prediction.]`,

    localRules: `LOCAL RULES COMPLIANCE REVIEW — S.D.N.Y.

Profile: Southern District of New York (SDNY)
Confidence: High (all required sections detected)

SECTION ANALYSIS:
[PASS] Preliminary Statement — present
[PASS] Statement of Relevant Facts — present
[PASS] Legal Standard — present
[PASS] Argument — present (with Roman numeral headings)
[PASS] Conclusion — present

FORMATTING NOTES:
- Individual Rule 2.A: Font must be 12-point Times New Roman or Courier
- Individual Rule 2.B: Margins 1 inch on all sides
- Individual Rule 2.C: Double-spaced text (except footnotes and block quotations)
- Page limit: 25 pages for opening briefs (Local Rule 7.1(b))
- Caption must include all parties and docket number

CITATION NOTES:
- S.D.N.Y. follows Bluebook citation format
- Federal circuit citations should include full case name, volume, reporter, page, circuit, year
- Pinpoint citations required for all quotations

LIMITATIONS: This review is based on keyword detection only. It does not constitute a compliance certification. Verify against current Local Rules before filing.`,

    judgeName: "Hon. Jed S. Rakoff",
    judgeNotes: `JUDGE BRIEF — Hon. Jed S. Rakoff (S.D.N.Y.)

Match Status: Exact match (demo profile)
Profile Source: Cached opinion analysis — demo fixture

STYLE NOTES:
Judge Rakoff is known for clear, direct writing and skepticism of over-lengthy briefs. He values concise, well-organized arguments. Keep the brief under 20 pages where possible.

CITATION PREFERENCES:
Prefers clear, accurate Bluebook citations. Has commented favorably on briefs that lead with the strongest precedent rather than building to it. String citations disfavored.

ARGUMENT GUIDANCE:
- Open with your strongest legal argument, not background
- Avoid boilerplate recitations of the pleading standard
- Address the weakest part of your position proactively
- Footnotes should be used sparingly

MOTION-TYPE GUIDANCE (Motion to Dismiss):
Judge Rakoff applies Twombly/Iqbal rigorously. He has granted 12(b)(6) motions where complaints relied on conclusory allegations. Emphasize the lack of specific factual allegations supporting each element.

RISK NOTES:
Judge Rakoff has, in some cases, converted Rule 12(b)(6) motions to summary judgment sua sponte. Ensure the factual record fully supports your position even at this early stage.

LIMITATIONS: This profile is a demo fixture only. Always verify with current opinions and clerk guidance.`,

    citationSummary: { total: 6, verified: 5, failed: 1 },

    evalSummary: `EVAL SUMMARY — Demo Run 001

Overall Confidence: 82%  [PASS]

Faithfulness Score:       88%   Citations grounded in retrieved authority
Citation Pass Rate:       83%   5/6 citations verified in indexed corpus
Retrieval Coverage:       79%   Key precedents on oral contracts retrieved
Local Rules Completeness: 95%   All required sections detected
Adversarial Safety:       70%   Medium adversarial risk; rebuttal paths identified
Judge Alignment:          75%   Profile matched; style notes incorporated

WARNINGS:
- One citation (Clark-Fitzpatrick, 70 N.Y.2d 382) not found in demo corpus; verify independently
- Adversarial analysis indicates partial performance doctrine deserves additional briefing

Internal quality signal only. Not legal advice. Demo corpus; not a complete legal authority database.`,
  },
  {
    id: "demo-002",
    title: "TechCorp v. DataFlow — Motion for Summary Judgment (Patent License)",
    motionType: "summary_judgment",
    jurisdiction: "Federal",
    court: "U.S. District Court",
    confidence: 0.76,
    status: "completed",
    draft: `UNITED STATES DISTRICT COURT
DISTRICT OF [REDACTED]

TECHCORP, INC.,
    Plaintiff,

    v.                                    No. [REDACTED]

DATAFLOW SYSTEMS LLC,
    Defendant.

MEMORANDUM OF LAW IN SUPPORT OF DEFENDANT'S MOTION FOR SUMMARY JUDGMENT

PRELIMINARY STATEMENT

Defendant DataFlow Systems LLC moves for summary judgment pursuant to Federal Rule of Civil Procedure 56. Plaintiff TechCorp's patent infringement claim fails as a matter of law because DataFlow holds a valid, express license to practice the asserted patents under the parties' 2019 Technology License Agreement (the "TLA"). No genuine dispute of material fact exists: the TLA unambiguously grants DataFlow the right to use and sublicense the patent portfolio at issue.

STATEMENT OF RELEVANT FACTS

In 2019, TechCorp and DataFlow executed the TLA, which conveyed to DataFlow "a non-exclusive, perpetual, worldwide license to make, use, sell, and sublicense any TechCorp patents existing as of the Effective Date or issuing from applications pending as of the Effective Date." The patents asserted in this action all issued from applications pending as of the TLA Effective Date of March 15, 2019. DataFlow's use of the licensed technology is precisely the use contemplated by the TLA.

LEGAL STANDARD

Summary judgment is appropriate when "there is no genuine dispute as to any material fact and the movant is entitled to judgment as a matter of law." Fed. R. Civ. P. 56(a). On a motion for summary judgment, the court must view the facts in the light most favorable to the non-moving party.

ARGUMENT

I. THE TLA GRANTS DATAFLOW AN EXPRESS LICENSE TO THE ASSERTED PATENTS

Patent license agreements are construed as a matter of law by the court. Transcore, L.P. v. Electronic Transaction Consultants Corp., 563 F.3d 1271, 1275 (Fed. Cir. 2009). The TLA's unambiguous text covers applications pending as of March 15, 2019 — which is precisely the category into which all asserted patents fall. See Wang Labs., Inc. v. Mitsubishi Electronics America, Inc., 103 F.3d 1571, 1578 (Fed. Cir. 1997).

II. TECHCORP'S NARROWING INTERPRETATION IS FORECLOSED BY THE AGREEMENT'S PLAIN TEXT

TechCorp argues the license covers only patents "for use in the original DataFlow product line." This interpretation finds no support in the TLA's text, which uses no product-line limitation. Where contract language is unambiguous, extrinsic evidence of intent is inadmissible. Vitronics Corp. v. Conceptronic, Inc., 90 F.3d 1576, 1582 (Fed. Cir. 1996).

CONCLUSION

The undisputed record establishes that DataFlow holds a valid, express license to the asserted patents. Summary judgment should be granted in DataFlow's favor.

[DEMO ONLY — Not legal advice. Sample output for portfolio demonstration.]`,

    adversarial: `ADVERSARIAL RISK: LOW-MEDIUM

STRONGEST COUNTERARGUMENTS PLAINTIFF WILL RAISE:

1. SCOPE OF LICENSE — PRODUCT LINE LIMITATION
TechCorp will argue extrinsic evidence (negotiation emails, course of dealing) shows the parties intended a product-line limitation even if not explicit in the TLA.

Response: Parol evidence is inadmissible to vary unambiguous contract terms. The TLA's language is clear.

2. SUBLICENSE EXCEEDED GRANT
TechCorp may argue DataFlow's sublicense to third parties exceeded the scope of the "sublicense" right in the TLA.

Response: The TLA explicitly grants sublicense rights without limitation; DataFlow's sublicenses fall within the grant.

ASSESSMENT: Strong position for DataFlow. The written license language is unambiguous. Primary risk is that court allows extrinsic evidence at the summary judgment stage.

[DEMO ONLY — Not legal advice or outcome prediction.]`,

    localRules: `LOCAL RULES COMPLIANCE REVIEW — Federal (Generic)

Profile: Federal Court (Generic)
Confidence: High

SECTION ANALYSIS:
[PASS] Preliminary Statement — present
[PASS] Statement of Relevant Facts — present
[PASS] Legal Standard — present
[PASS] Argument — present
[PASS] Conclusion — present

FORMATTING NOTES:
- Double-space text; 1-inch margins; 12-point serif font
- Summary judgment briefs: consult local rules for page limit (often 25-35 pages)
- Statement of Undisputed Material Facts required in most districts (Local Rule 56.1 equivalent)
- Include proposed order

LIMITATIONS: Demo review only. Verify with current local rules for specific district.`,

    judgeName: "N/A (no judge specified)",
    judgeNotes: "No judge specified for this demo run. Judge Brief not generated.",

    citationSummary: { total: 5, verified: 4, failed: 1 },

    evalSummary: `EVAL SUMMARY — Demo Run 002

Overall Confidence: 76%  [PASS]

Faithfulness Score:       81%   Citations grounded in retrieved authority
Citation Pass Rate:       80%   4/5 citations verified in indexed corpus
Retrieval Coverage:       72%   Key patent license precedents retrieved
Local Rules Completeness: 90%   All required sections detected
Adversarial Safety:       78%   Low-medium risk; strong license argument
Judge Alignment:          N/A   No judge specified

WARNINGS:
- Wang Labs citation not found in demo corpus; verify independently
- Consider adding Local Rule 56.1 statement of undisputed facts

Internal quality signal only. Not legal advice. Demo corpus; not a complete legal authority database.`,
  },
];
