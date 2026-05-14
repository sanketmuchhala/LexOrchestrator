// Hybrid RAG retrieval — pgvector similarity + keyword scoring + deterministic reranking.
// Fallback chain: hybrid_rag → keyword_fallback → memory_fallback
// All paths produce the same RetrievedSource shape.

import type { RetrievedSource, LegalChunkFromDB, LegalChunkWithSimilarity } from "@/lib/types";
import { vectorSearchLegalChunks, searchLegalChunksFromDB } from "@/lib/db/supabaseServer";
import { generateQueryEmbedding } from "@/lib/llm/embeddingClient";
import { legalCorpus } from "@/lib/data/legalCorpus";

const TOP_K = 5;
const VECTOR_CANDIDATES = 12;   // how many to fetch from pgvector before reranking
const KEYWORD_THRESHOLD = 0.08; // minimum score to include in keyword candidates

// ─── Scoring helpers ──────────────────────────────────────────────────────────

function scoreKeyword(keyTerms: string[], keywords: string[], text: string): number {
  if (keyTerms.length === 0) return 0;
  const textLower = text.toLowerCase();
  const kwHits = keywords.filter((kw) =>
    keyTerms.some((kt) => kw.includes(kt) || kt.includes(kw))
  ).length;
  const textHits = keyTerms.filter((kt) => textLower.includes(kt)).length;
  return Math.min(1, (kwHits / keyTerms.length) * 0.6 + (textHits / keyTerms.length) * 0.4);
}

function exactTermBonus(keyTerms: string[], text: string): number {
  const textLower = text.toLowerCase();
  const exactMatches = keyTerms.filter((kt) => textLower.includes(kt)).length;
  return Math.min(0.15, exactMatches * 0.05);
}

function jurisdictionBoost(chunkJurisdiction: string | null, queryJurisdiction?: string): number {
  if (!queryJurisdiction || !chunkJurisdiction) return 0;
  const a = chunkJurisdiction.toLowerCase();
  const b = queryJurisdiction.toLowerCase();
  return a.includes(b) || b.includes(a) ? 0.10 : 0;
}

function practiceAreaBoost(chunkArea: string | null, legalIssue: string): number {
  if (!chunkArea) return 0;
  return chunkArea.toLowerCase().includes(legalIssue.toLowerCase()) ? 0.10 : 0;
}

export function coverageAssessment(count: number): string {
  if (count >= 3) return `Strong retrieval — ${count} highly relevant authorities found.`;
  if (count >= 1) return `Partial coverage — ${count} relevant authorit${count === 1 ? "y" : "ies"} found; supplemental research advisable.`;
  return "Limited coverage — consider broadening the query or expanding the corpus.";
}

// ─── Candidate merging ────────────────────────────────────────────────────────

interface ScoredCandidate {
  chunk: LegalChunkFromDB;
  keywordScore: number;
  vectorScore: number;
  hybridScore: number;
  rerankScore: number;
}

function buildCandidates(
  keywordChunks: LegalChunkFromDB[],
  vectorChunks: LegalChunkWithSimilarity[],
  keyTerms: string[],
  legalIssue: string,
  jurisdiction?: string
): ScoredCandidate[] {
  const vectorMap = new Map(vectorChunks.map((c) => [c.citation_id, c.similarity]));

  // Union of keyword and vector candidates
  const allChunks = new Map<string, LegalChunkFromDB>();
  for (const c of keywordChunks) allChunks.set(c.citation_id, c);
  for (const c of vectorChunks) if (!allChunks.has(c.citation_id)) allChunks.set(c.citation_id, c);

  return Array.from(allChunks.values()).map((chunk) => {
    const kwScore = scoreKeyword(keyTerms, chunk.keywords, chunk.chunk_text);
    const vecScore = vectorMap.get(chunk.citation_id) ?? 0;
    const jBoost = jurisdictionBoost(chunk.jurisdiction, jurisdiction);
    const pBoost = practiceAreaBoost(chunk.practice_area, legalIssue);

    const hybrid = Math.min(1, kwScore * 0.35 + vecScore * 0.45 + jBoost + pBoost);
    const rerank = Math.min(1, hybrid + exactTermBonus(keyTerms, chunk.chunk_text));

    return { chunk, keywordScore: kwScore, vectorScore: vecScore, hybridScore: hybrid, rerankScore: rerank };
  });
}

function toRetrievedSource(
  candidate: ScoredCandidate,
  rank: number,
  method: RetrievedSource["retrievalMethod"],
  docTitle?: string
): RetrievedSource {
  const { chunk, keywordScore, vectorScore, hybridScore, rerankScore } = candidate;
  const pct = (n: number) => Math.round(n * 100);
  return {
    id: chunk.id,
    citationId: chunk.citation_id,
    title: docTitle ?? chunk.document_title ?? chunk.citation_id,
    text: chunk.chunk_text,
    docType: chunk.practice_area ?? "Legal Document (Sample)",
    jurisdiction: chunk.jurisdiction ?? "General",
    keywords: chunk.keywords,
    relevanceScore: parseFloat(rerankScore.toFixed(3)),
    reason: `Vector: ${pct(vectorScore)}% | Keyword: ${pct(keywordScore)}% | Hybrid: ${pct(hybridScore)}% | Final: ${pct(rerankScore)}%`,
    keywordScore: parseFloat(keywordScore.toFixed(3)),
    vectorScore: parseFloat(vectorScore.toFixed(3)),
    hybridScore: parseFloat(hybridScore.toFixed(3)),
    rerankScore: parseFloat(rerankScore.toFixed(3)),
    finalScore: parseFloat(rerankScore.toFixed(3)),
    rankPosition: rank,
    retrievalMethod: method,
  };
}

// ─── Memory fallback ──────────────────────────────────────────────────────────

function memoryFallback(keyTerms: string[], legalIssue: string, topK: number): RetrievedSource[] {
  console.info("[Retrieval] Using in-memory corpus fallback.");
  return legalCorpus
    .map((entry) => {
      const kwScore = scoreKeyword(keyTerms, entry.keywords, entry.text);
      const rerank = Math.min(1, kwScore + exactTermBonus(keyTerms, entry.text));
      const candidate: ScoredCandidate = { chunk: { id: entry.id, document_id: "", citation_id: entry.id, chunk_text: entry.text, keywords: entry.keywords, jurisdiction: entry.jurisdiction, practice_area: legalIssue, document_title: entry.title }, keywordScore: kwScore, vectorScore: 0, hybridScore: kwScore, rerankScore: rerank };
      return { candidate, rerank };
    })
    .filter((r) => r.rerank >= KEYWORD_THRESHOLD)
    .sort((a, b) => b.rerank - a.rerank)
    .slice(0, topK)
    .map((r, i) => toRetrievedSource(r.candidate, i + 1, "memory_fallback"));
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export interface RetrievalInput {
  query: string;
  keyTerms: string[];
  legalIssue: string;
  jurisdiction?: string;
  practiceArea?: string;
  topK?: number;
}

export async function searchLegalCorpus(input: RetrievalInput): Promise<RetrievedSource[]> {
  const { query, keyTerms, legalIssue, jurisdiction, topK = TOP_K } = input;

  // Step 1: Generate query embedding for vector search
  const queryEmbedding = await generateQueryEmbedding(query);
  let vectorChunks: LegalChunkWithSimilarity[] = [];
  let vectorSearchSucceeded = false;

  if (queryEmbedding) {
    vectorChunks = await vectorSearchLegalChunks(queryEmbedding, VECTOR_CANDIDATES);
    vectorSearchSucceeded = vectorChunks.length > 0;
  }

  // Step 2: Keyword candidates from DB (always — supplements vector results)
  const keywordChunks = await searchLegalChunksFromDB(keyTerms);

  // Step 3: If both DB paths empty, fall back to in-memory corpus
  if (vectorChunks.length === 0 && keywordChunks.length === 0) {
    return memoryFallback(keyTerms, legalIssue, topK);
  }

  // Step 4: Filter keyword candidates by minimum threshold
  const keywordFiltered = keywordChunks.filter((c) => {
    const score = scoreKeyword(keyTerms, c.keywords, c.chunk_text);
    return score >= KEYWORD_THRESHOLD || vectorChunks.some((v) => v.citation_id === c.citation_id);
  });

  // Step 5: Merge, score, rerank
  const method: RetrievedSource["retrievalMethod"] = vectorSearchSucceeded ? "hybrid_rag" : "keyword_fallback";
  const candidates = buildCandidates(keywordFiltered, vectorChunks, keyTerms, legalIssue, jurisdiction);

  const ranked = candidates
    .filter((c) => c.rerankScore >= KEYWORD_THRESHOLD)
    .sort((a, b) => b.rerankScore - a.rerankScore)
    .slice(0, topK);

  return ranked.map((c, i) => toRetrievedSource(c, i + 1, method));
}
