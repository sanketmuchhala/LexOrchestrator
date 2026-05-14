import type { RetrievalResult, IntakeResult } from "@/lib/types";
import { searchLegalCorpus, coverageAssessment } from "@/lib/retrieval/searchLegalCorpus";
import { legalCorpus } from "@/lib/data/legalCorpus";

export async function runRetrievalAgent(intake: IntakeResult): Promise<RetrievalResult> {
  const sources = await searchLegalCorpus(intake.keyTerms, intake.legalIssue);
  const aboveThreshold = sources.filter((s) => s.relevanceScore > 0.3).length;

  return {
    sources,
    retrievalStrategy: "Keyword-overlap scoring with TF-style weighting (DB-backed with in-memory fallback). Phase 2: pgvector/Pinecone.",
    coverageAssessment: coverageAssessment(aboveThreshold),
    totalSearched: legalCorpus.length,
  };
}
