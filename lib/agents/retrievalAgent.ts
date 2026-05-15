import type { RetrievalResult, IntakeResult } from "@/lib/types";
import { searchLegalCorpus, coverageAssessment } from "@/lib/retrieval/searchLegalCorpus";
import { legalCorpus } from "@/lib/data/legalCorpus";

export async function runRetrievalAgent(intake: IntakeResult, query: string): Promise<RetrievalResult> {
  const sources = await searchLegalCorpus({
    query,
    keyTerms: intake.keyTerms,
    legalIssue: intake.legalIssue,
    jurisdiction: intake.jurisdiction !== "General / Multi-Jurisdiction" ? intake.jurisdiction : undefined,
    practiceArea: intake.legalIssue,
  });

  const aboveThreshold = sources.filter((s) => s.relevanceScore > 0.3).length;
  const method = sources[0]?.retrievalMethod ?? "keyword_fallback";
  const vectorUsed = sources.some((s) => (s.vectorScore ?? 0) > 0);

  const strategyLabel = method === "hybrid_rag"
    ? `Hybrid RAG - pgvector cosine similarity (0.45) + keyword overlap (0.35) + jurisdiction/practice-area boost (0.20)`
    : method === "keyword_fallback"
    ? `Keyword fallback - TF-style token overlap scoring (vector search unavailable or no embeddings)`
    : `In-memory fallback - static corpus, keyword scoring only`;

  const warnings: string[] = [];
  if (!vectorUsed) warnings.push("Vector search not used - run embed:legal to backfill embeddings for hybrid RAG.");
  if (sources.length < 2) warnings.push("Thin retrieval - fewer than 2 sources returned; answer quality may be reduced.");

  return {
    sources,
    retrievalStrategy: strategyLabel + (warnings.length > 0 ? ` | Warnings: ${warnings.join(" ")}` : ""),
    coverageAssessment: coverageAssessment(aboveThreshold),
    totalSearched: legalCorpus.length,
  };
}
