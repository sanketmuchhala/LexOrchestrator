import type { LocalRuleProfile, SectionCheckResult } from "./types";

interface SectionPattern {
  sectionId: string;
  label: string;
  required: boolean;
  keywords: string[];
}

const SECTION_PATTERNS: SectionPattern[] = [
  {
    sectionId: "preliminary_statement",
    label: "Preliminary Statement",
    required: true,
    keywords: [
      "preliminary statement",
      "introduction",
      "pursuant to",
      "movant respectfully",
      "defendant moves",
      "plaintiff moves",
      "this motion",
      "comes now",
    ],
  },
  {
    sectionId: "statement_of_facts",
    label: "Statement of Facts",
    required: true,
    keywords: [
      "statement of facts",
      "statement of relevant facts",
      "relevant facts",
      "factual background",
      "background",
      "facts",
      "the parties",
      "plaintiff entered",
      "defendant entered",
    ],
  },
  {
    sectionId: "legal_standard",
    label: "Legal Standard",
    required: true,
    keywords: [
      "legal standard",
      "standard of review",
      "rule 12(b)(6)",
      "rule 56",
      "under federal rule",
      "under rule",
      "applicable standard",
      "to survive a motion",
      "to withstand",
      "the court must",
    ],
  },
  {
    sectionId: "argument",
    label: "Argument",
    required: true,
    keywords: [
      "argument",
      "the court should",
      "the motion should",
      "movant submits",
      "respectfully submits",
      "for the foregoing reasons, the court should",
    ],
  },
  {
    sectionId: "conclusion",
    label: "Conclusion",
    required: true,
    keywords: [
      "conclusion",
      "for the foregoing reasons",
      "wherefore",
      "the court should grant",
      "grant the motion",
      "deny the motion",
      "the movant respectfully requests",
    ],
  },
  {
    sectionId: "signature_block",
    label: "Signature Block",
    required: false,
    keywords: [
      "respectfully submitted",
      "dated:",
      "/s/",
      "attorney for",
      "counsel for",
      "esq.",
    ],
  },
];

function detectSection(draftText: string, pattern: SectionPattern): boolean {
  const lower = draftText.toLowerCase();
  return pattern.keywords.some((kw) => lower.includes(kw.toLowerCase()));
}

export function checkDraftAgainstRules(
  draftText: string,
  profile: LocalRuleProfile
): SectionCheckResult[] {
  if (!draftText || draftText.trim().length === 0) {
    return SECTION_PATTERNS.map((p) => ({
      sectionId: p.sectionId,
      label: p.label,
      required: p.required,
      detected: false,
    }));
  }

  return SECTION_PATTERNS.map((pattern) => ({
    sectionId: pattern.sectionId,
    label: pattern.label,
    required: profile.requiredSections.some(
      (rs) => rs.toLowerCase().includes(pattern.label.toLowerCase().split(" ")[0])
    ),
    detected: detectSection(draftText, pattern),
  }));
}

export function getMissingSections(checks: SectionCheckResult[]): string[] {
  return checks
    .filter((c) => c.required && !c.detected)
    .map((c) => c.label);
}
