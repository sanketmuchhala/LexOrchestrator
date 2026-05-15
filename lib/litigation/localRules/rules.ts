import type { LocalRuleProfile } from "./types";

const DISCLAIMER =
  "These notes are drafting reminders only. They do not constitute a compliance certification or legal advice. Always verify current local rules and individual judge practices before filing.";

export const LOCAL_RULE_PROFILES: LocalRuleProfile[] = [
  {
    id: "sdny",
    label: "Southern District of New York (SDNY)",
    jurisdiction: "Federal",
    court: "S.D.N.Y.",
    supportedMotionTypes: [
      "motion_to_dismiss",
      "motion_for_summary_judgment",
      "motion_in_limine",
      "motion_to_compel",
      "preliminary_injunction",
      "general",
    ],
    formattingNotes: [
      "12-point Times New Roman or equivalent proportionally spaced font is required (Local Rule 11.1).",
      "Double-spacing with 1-inch margins on all sides is required (Local Rule 11.1).",
      "Tables of contents and authorities are required for briefs exceeding 10 pages.",
      "Line numbers are not required for motion papers in SDNY.",
      "Caption must include case name, docket number, court, and the nature of the document.",
    ],
    requiredSections: [
      "Preliminary Statement",
      "Statement of Facts",
      "Legal Standard",
      "Argument",
      "Conclusion",
    ],
    citationNotes: [
      "Second Circuit controlling authority is binding; cite it first.",
      "SCOTUS precedent applies where directly on point.",
      "Cite sister-circuit decisions only where Second Circuit has not addressed the issue.",
      "Bluebook citation format is the standard for SDNY filings.",
      "Case names should be italicized in formal filings.",
    ],
    filingNotes: [
      "SDNY generally requires pre-motion conference letters before filing most dispositive motions (Local Rule 7.1(a)).",
      "Memoranda of law are typically limited to 25 pages without prior court permission.",
      "Reply memoranda are typically limited to 10 pages without prior court permission.",
      "ECF filing is required in SDNY. Check current standing orders for any exemptions.",
      "Verify current Individual Practices for the assigned judge before filing.",
    ],
    limitations: [
      DISCLAIMER,
      "SDNY Individual Judge Practices vary significantly and are not covered here.",
      "Page limits and pre-motion requirements may have changed. Verify current Local Rules.",
    ],
  },
  {
    id: "federal_generic",
    label: "Federal Court (Generic)",
    jurisdiction: "Federal",
    court: null,
    supportedMotionTypes: [
      "motion_to_dismiss",
      "motion_for_summary_judgment",
      "motion_in_limine",
      "motion_to_compel",
      "preliminary_injunction",
      "general",
    ],
    formattingNotes: [
      "Confirm font, margin, and spacing requirements in the specific district's local rules.",
      "Caption must include case name, docket number, and the nature of the document.",
      "Tables of contents and authorities are typically required for longer briefs.",
      "Each argument point should have a clear, descriptive heading.",
    ],
    requiredSections: [
      "Preliminary Statement",
      "Statement of Facts",
      "Legal Standard",
      "Argument",
      "Conclusion",
    ],
    citationNotes: [
      "Cite the controlling circuit's authority first.",
      "SCOTUS precedent is binding on all federal courts.",
      "Bluebook citation format is standard for federal court filings.",
      "Include full case name, reporter volume, page, and year in citations.",
    ],
    filingNotes: [
      "Page and word limits vary by district. Confirm the specific court's local rules.",
      "ECF filing is required in most federal districts. Confirm current standing orders.",
      "Pre-motion conference requirements vary by district and individual judge.",
      "Certificates of compliance are required for briefs subject to word limits (FRAP 32(g)).",
    ],
    limitations: [
      DISCLAIMER,
      "Specific court local rules and individual judge practices are not covered in this generic profile.",
      "Verify all formatting requirements in the assigned court's current local rules.",
    ],
  },
  {
    id: "new_york_state_generic",
    label: "New York State Court (Generic)",
    jurisdiction: "New York",
    court: null,
    supportedMotionTypes: [
      "motion_to_dismiss",
      "motion_for_summary_judgment",
      "motion_in_limine",
      "motion_to_compel",
      "general",
    ],
    formattingNotes: [
      "New York state court papers must comply with 22 NYCRR Part 202 (Uniform Civil Rules for Supreme Court).",
      "Affidavits and affirmations must be notarized or contain the required CPLR 2106 affirmation language.",
      "Caption must follow CPLR 2101 requirements including index number and court designation.",
      "Distinguish CPLR motion practice from federal motion practice in your legal standard section.",
    ],
    requiredSections: [
      "Preliminary Statement",
      "Statement of Facts",
      "Legal Standard",
      "Argument",
      "Conclusion",
    ],
    citationNotes: [
      "Cite Court of Appeals decisions as the highest binding authority.",
      "Appellate Division decisions from the applicable department are binding.",
      "New York citation format should follow New York Law Reports Style Manual.",
      "Include affirmed/reversed history for key cases.",
    ],
    filingNotes: [
      "E-filing through NYSCEF is required in most New York County Supreme Court matters.",
      "Commercial Division rules apply in IAS Commercial Parts (check Part 48).",
      "Affirmation or affidavit support is generally required for factual assertions in motion papers.",
      "Service of motion papers must comply with CPLR 2214 requirements.",
      "Verify county and judge rules separately before filing.",
    ],
    limitations: [
      DISCLAIMER,
      "County-specific and individual judge rules are not covered in this generic profile.",
      "CPLR provisions and court rules change. Always verify current requirements before filing.",
    ],
  },
];
