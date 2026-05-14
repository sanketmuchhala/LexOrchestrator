import type { RetrievalResult, RetrievedSource, IntakeResult } from "@/lib/types";
import { legalCorpus } from "@/lib/data/legalCorpus";

const TOP_K = 4;
const RELEVANCE_THRESHOLD = 0.15;

function scoreSnippet(keyTerms: string[], keywords: string[], text: string): number {
  const textLower = text.toLowerCase();
  const keywordHits = keywords.filter((kw) => keyTerms.some((kt) => kw.includes(kt) || kt.includes(kw))).length;
  const textHits = keyTerms.filter((kt) => textLower.includes(kt)).length;

  // Weighted: keyword index match + in-text match, normalized by query size
  const kwScore = keyTerms.length > 0 ? keywordHits / keyTerms.length : 0;
  const textScore = keyTerms.length > 0 ? textHits / keyTerms.length : 0;
  return Math.min(1, kwScore * 0.6 + textScore * 0.4);
}

export function runRetrievalAgent(intake: IntakeResult): RetrievalResult {
  const { keyTerms } = intake;

  const scored = legalCorpus
    .map((entry) => ({
      ...entry,
      relevanceScore: parseFloat(scoreSnippet(keyTerms, entry.keywords, entry.text).toFixed(3)),
    }))
    .filter((e) => e.relevanceScore >= RELEVANCE_THRESHOLD)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, TOP_K);

  const aboveThreshold = scored.filter((s) => s.relevanceScore > 0.3).length;

  let coverageAssessment: string;
  if (aboveThreshold >= 3) {
    coverageAssessment = `Strong retrieval coverage — ${aboveThreshold} highly relevant authorities found across the corpus.`;
  } else if (aboveThreshold >= 1) {
    coverageAssessment = `Partial coverage — ${aboveThreshold} relevant authorit${aboveThreshold === 1 ? "y" : "ies"} found; supplemental research may be needed.`;
  } else {
    coverageAssessment = "Limited coverage — query terms did not strongly match the available corpus. Consider broadening the query or expanding the document set.";
  }

  const sources: RetrievedSource[] = scored.map((s) => ({
    id: s.id,
    title: s.title,
    text: s.text,
    docType: s.docType,
    jurisdiction: s.jurisdiction,
    keywords: s.keywords,
    relevanceScore: s.relevanceScore,
  }));

  return {
    sources,
    retrievalStrategy: "Keyword overlap scoring with in-text frequency weighting (TF-style, no external vector DB)",
    coverageAssessment,
    totalSearched: legalCorpus.length,
  };
}
