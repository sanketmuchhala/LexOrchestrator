// DB-backed retrieval with in-memory fallback.
// Phase 2 TODO: replace keyword scoring with pgvector cosine similarity or Pinecone.

import type { RetrievedSource } from "@/lib/types";
import { searchLegalChunksFromDB } from "@/lib/db/supabaseServer";
import { legalCorpus } from "@/lib/data/legalCorpus";

const TOP_K = 5;
const RELEVANCE_THRESHOLD = 0.12;

function scoreSnippet(keyTerms: string[], keywords: string[], text: string): number {
  const textLower = text.toLowerCase();
  const kwHits = keywords.filter((kw) =>
    keyTerms.some((kt) => kw.includes(kt) || kt.includes(kw))
  ).length;
  const textHits = keyTerms.filter((kt) => textLower.includes(kt)).length;
  const len = keyTerms.length || 1;
  return Math.min(1, (kwHits / len) * 0.6 + (textHits / len) * 0.4);
}

function coverageAssessment(count: number): string {
  if (count >= 3) return `Strong retrieval — ${count} highly relevant authorities found.`;
  if (count >= 1) return `Partial coverage — ${count} relevant authorit${count === 1 ? "y" : "ies"} found; supplemental research advisable.`;
  return "Limited coverage — consider broadening the query or expanding the corpus.";
}

export async function searchLegalCorpus(
  keyTerms: string[],
  legalIssue: string
): Promise<RetrievedSource[]> {
  // Try DB first
  const dbChunks = await searchLegalChunksFromDB(keyTerms);

  if (dbChunks.length > 0) {
    const scored = dbChunks
      .map((chunk) => {
        const score = scoreSnippet(keyTerms, chunk.keywords, chunk.chunk_text);
        return {
          id: chunk.id,
          citationId: chunk.citation_id,
          title: chunk.document_title ?? chunk.citation_id,
          text: chunk.chunk_text,
          docType: chunk.practice_area ?? "Legal Document (Sample)",
          jurisdiction: chunk.jurisdiction ?? "General",
          keywords: chunk.keywords,
          relevanceScore: parseFloat(score.toFixed(3)),
          reason: `Keyword match: ${Math.round(score * 100)}% overlap with query terms`,
        };
      })
      .filter((s) => s.relevanceScore >= RELEVANCE_THRESHOLD)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, TOP_K);

    return scored;
  }

  // In-memory fallback using legalCorpus static data
  console.info(`[Retrieval] DB empty or unavailable for issue "${legalIssue}" — using in-memory corpus.`);

  return legalCorpus
    .map((entry) => {
      const score = scoreSnippet(keyTerms, entry.keywords, entry.text);
      return {
        id: entry.id,
        citationId: entry.id,
        title: entry.title,
        text: entry.text,
        docType: entry.docType,
        jurisdiction: entry.jurisdiction,
        keywords: entry.keywords,
        relevanceScore: parseFloat(score.toFixed(3)),
        reason: `In-memory fallback — keyword overlap scoring`,
      };
    })
    .filter((s) => s.relevanceScore >= RELEVANCE_THRESHOLD)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, TOP_K);
}

export { coverageAssessment };
