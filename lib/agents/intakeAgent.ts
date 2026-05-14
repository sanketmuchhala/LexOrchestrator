import type { IntakeResult } from "@/lib/types";

const LEGAL_ISSUE_PATTERNS: Record<IntakeResult["legalIssue"], string[]> = {
  contract: ["contract", "breach", "agreement", "consideration", "offer", "acceptance", "damages", "performance", "warranty", "indemnif"],
  tort: ["negligence", "malpractice", "duty", "care", "proximate", "cause", "injury", "liable", "liability", "tort", "reckless", "intentional"],
  evidence: ["evidence", "evidentiary", "admissib", "expert", "witness", "daubert", "frye", "hearsay", "privilege", "testimony", "exhibit"],
  procedure: ["summary judgment", "motion", "dismiss", "pleading", "complaint", "appellate", "appeal", "jurisdiction", "venue", "standing"],
  discovery: ["discovery", "deposition", "interrogator", "subpoena", "production", "privilege", "protective order", "proportional"],
  general: [],
};

const HIGH_RISK_TERMS = ["criminal", "sanctions", "malpractice", "fraud", "constitutional", "class action", "injunction", "contempt"];
const MEDIUM_RISK_TERMS = ["appeal", "federal", "damages", "expert", "privilege", "summary judgment"];

const JURISDICTION_PATTERNS: Record<string, string[]> = {
  Federal: ["federal", "circuit", "u.s. district", "f.3d", "f.2d", "f. supp", "supreme court"],
  California: ["california", "cal.", "9th circuit"],
  "New York": ["new york", "n.y.", "2d circuit"],
  Texas: ["texas", "tex.", "5th circuit"],
  "General / Multi-Jurisdiction": [],
};

const DOC_TYPE_PATTERNS: Record<IntakeResult["documentType"], string[]> = {
  motion: ["motion", "dismiss", "summary judgment", "injunction", "relief"],
  brief: ["brief", "argument", "appeal", "memorandum"],
  opinion: ["opinion", "holding", "court held", "decided"],
  deposition: ["deposition", "testimony", "witness", "sworn"],
  general: [],
};

function detectField<T extends string>(
  query: string,
  patterns: Record<T, string[]>,
  fallback: T
): T {
  const lower = query.toLowerCase();
  let best: T = fallback;
  let bestScore = 0;
  for (const [field, terms] of Object.entries(patterns) as [T, string[]][]) {
    const score = terms.filter((t) => lower.includes(t)).length;
    if (score > bestScore) {
      bestScore = score;
      best = field;
    }
  }
  return best;
}

function extractKeyTerms(query: string): string[] {
  const stopWords = new Set(["the", "a", "an", "in", "of", "for", "to", "and", "or", "is", "are", "be", "was", "were", "what", "how", "when", "where", "which", "that", "this", "with", "from", "as", "by", "at", "on"]);
  return query
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w))
    .slice(0, 12);
}

function assessRisk(query: string): IntakeResult["riskLevel"] {
  const lower = query.toLowerCase();
  if (HIGH_RISK_TERMS.some((t) => lower.includes(t))) return "high";
  if (MEDIUM_RISK_TERMS.some((t) => lower.includes(t))) return "medium";
  return "low";
}

export function runIntakeAgent(query: string): IntakeResult {
  const legalIssue = detectField(query, LEGAL_ISSUE_PATTERNS, "general");
  const jurisdiction = detectField(query, JURISDICTION_PATTERNS, "General / Multi-Jurisdiction");
  const documentType = detectField(query, DOC_TYPE_PATTERNS, "general");
  const riskLevel = assessRisk(query);
  const keyTerms = extractKeyTerms(query);

  const issueLabels: Record<IntakeResult["legalIssue"], string> = {
    contract: "Commercial Contract Dispute",
    tort: "Tort / Personal Injury",
    evidence: "Evidentiary / Expert Witness",
    procedure: "Civil Procedure",
    discovery: "Discovery & Disclosure",
    general: "General Legal Research",
  };

  return {
    legalIssue,
    jurisdiction,
    documentType,
    riskLevel,
    queryClassification: issueLabels[legalIssue],
    keyTerms,
    confidence: keyTerms.length >= 4 ? 0.85 : 0.65,
  };
}
