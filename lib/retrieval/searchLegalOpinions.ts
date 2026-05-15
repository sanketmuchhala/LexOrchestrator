// Legal opinion retrieval -- hybrid RAG over legal_opinion_chunks.
// Fallback chain: hybrid_rag -> keyword_only -> legacy_document_chunks -> empty
// Parallel retrieval path to searchLegalCorpus.ts (which searches document_chunks).

import type {
  LegalOpinionSearchInput,
  LegalOpinionSearchResult,
  LegalOpinionSearchResponse,
  LegalOpinionSearchSource,
} from "@/lib/types";
import {
  DB_AVAILABLE,
  vectorSearchOpinionChunks,
  fulltextSearchOpinionChunks,
  directSearchOpinionChunks,
  type OpinionChunkRow,
} from "@/lib/db/supabaseServer";
import { generateQueryEmbedding } from "@/lib/llm/embeddingClient";

const DEFAULT_LIMIT = 5;
const VECTOR_CANDIDATES = 15;
const MIN_SCORE_DEFAULT = 0.05;

// ─── Scoring ──────────────────────────────────────────────────────────────────

function jurisdictionBoost(chunkJurisdiction: string | null, queryJurisdiction?: string): number {
  if (!queryJurisdiction || !chunkJurisdiction) return 0;
  const a = chunkJurisdiction.toLowerCase();
  const b = queryJurisdiction.toLowerCase();
  return a.includes(b) || b.includes(a) ? 0.08 : 0;
}

function courtBoost(chunkCourt: string | null, queryCourt?: string): number {
  if (!queryCourt || !chunkCourt) return 0;
  const a = chunkCourt.toLowerCase();
  const b = queryCourt.toLowerCase();
  return a.includes(b) || b.includes(a) ? 0.06 : 0;
}

function citationBoost(citation: string | null): number {
  return citation ? 0.05 : 0;
}

function recencyBoost(decisionDate: string | null): number {
  if (!decisionDate) return 0;
  const age = Date.now() - new Date(decisionDate).getTime();
  const yearsOld = age / (365.25 * 24 * 60 * 60 * 1000);
  if (yearsOld <= 5) return 0.03;
  if (yearsOld <= 15) return 0.01;
  return 0;
}

function keywordScore(query: string, chunkText: string): number {
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  if (terms.length === 0) return 0;
  const textLower = chunkText.toLowerCase();
  const hits = terms.filter((t) => textLower.includes(t)).length;
  return Math.min(1, hits / terms.length);
}

function computeFinalScore(
  vectorSim: number,
  kwScore: number,
  chunk: OpinionChunkRow,
  input: LegalOpinionSearchInput
): { finalScore: number; authorityScore: number } {
  const jBoost = jurisdictionBoost(chunk.jurisdiction, input.jurisdiction);
  const cBoost = courtBoost(chunk.court, input.court);
  const citBoost = citationBoost(chunk.citation);
  const rBoost = recencyBoost(chunk.decision_date);
  const authorityScore = jBoost + cBoost + citBoost + rBoost;

  const finalScore = Math.min(
    1,
    kwScore * 0.35 + vectorSim * 0.45 + jBoost + cBoost + citBoost + rBoost
  );

  return { finalScore, authorityScore };
}

// ─── Row to result ────────────────────────────────────────────────────────────

function toSearchResult(
  chunk: OpinionChunkRow,
  kwScore: number,
  vecScore: number,
  finalScore: number,
  authorityScore: number
): LegalOpinionSearchResult {
  return {
    chunkId: chunk.id,
    opinionId: chunk.opinion_id,
    caseName: chunk.case_name,
    citation: chunk.citation,
    court: chunk.court,
    jurisdiction: chunk.jurisdiction,
    decisionDate: chunk.decision_date,
    chunkText: chunk.chunk_text,
    chunkIndex: chunk.chunk_index,
    pageStart: chunk.page_start,
    pageEnd: chunk.page_end,
    spanStart: chunk.span_start,
    spanEnd: chunk.span_end,
    score: parseFloat(finalScore.toFixed(3)),
    keywordScore: parseFloat(kwScore.toFixed(3)),
    vectorScore: parseFloat(vecScore.toFixed(3)),
    authorityScore: parseFloat(authorityScore.toFixed(3)),
    metadata: chunk.metadata ?? {},
  };
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function searchLegalOpinions(
  input: LegalOpinionSearchInput
): Promise<LegalOpinionSearchResponse> {
  const limit = input.limit ?? DEFAULT_LIMIT;
  const minScore = input.minScore ?? MIN_SCORE_DEFAULT;
  const filters = {
    jurisdiction: input.jurisdiction,
    court: input.court,
    dateFrom: input.dateFrom,
    dateTo: input.dateTo,
  };

  if (!DB_AVAILABLE) {
    console.warn("[LegalOpinionSearch] Supabase not configured -- returning empty results.");
    return {
      results: [],
      fallbackUsed: true,
      source: "empty",
      retrievalMethod: "none",
      totalCandidates: 0,
    };
  }

  // Step 1: attempt vector search
  const queryEmbedding = await generateQueryEmbedding(input.query);
  let vectorChunks: OpinionChunkRow[] = [];
  let vectorSearchUsed = false;

  if (queryEmbedding) {
    vectorChunks = await vectorSearchOpinionChunks(queryEmbedding, VECTOR_CANDIDATES, filters);
    vectorSearchUsed = vectorChunks.length > 0;
  }

  // Step 2: keyword / full-text search
  const keywordChunks = await fulltextSearchOpinionChunks(input.query, VECTOR_CANDIDATES, filters);

  // Step 3: if both empty, try direct query without search
  if (vectorChunks.length === 0 && keywordChunks.length === 0) {
    const directChunks = await directSearchOpinionChunks(limit, {
      jurisdiction: input.jurisdiction,
      court: input.court,
    });

    if (directChunks.length > 0) {
      const results = directChunks.map((chunk) => {
        const kwScore = keywordScore(input.query, chunk.chunk_text);
        const { finalScore, authorityScore } = computeFinalScore(0, kwScore, chunk, input);
        return toSearchResult(chunk, kwScore, 0, finalScore, authorityScore);
      });

      results.sort((a, b) => b.score - a.score);

      return {
        results: results.slice(0, limit),
        fallbackUsed: true,
        source: "legal_opinions" as LegalOpinionSearchSource,
        retrievalMethod: "direct_query",
        totalCandidates: directChunks.length,
      };
    }

    // No legal opinion results at all
    return {
      results: [],
      fallbackUsed: true,
      source: "empty",
      retrievalMethod: "none",
      totalCandidates: 0,
    };
  }

  // Step 4: merge vector and keyword candidates
  const allChunks = new Map<string, OpinionChunkRow>();
  const vectorMap = new Map<string, number>();

  for (const chunk of vectorChunks) {
    allChunks.set(chunk.id, chunk);
    vectorMap.set(chunk.id, chunk.similarity ?? 0);
  }
  for (const chunk of keywordChunks) {
    if (!allChunks.has(chunk.id)) allChunks.set(chunk.id, chunk);
  }

  // Step 5: score and rank
  const scored: LegalOpinionSearchResult[] = [];

  for (const chunk of allChunks.values()) {
    const vecScore = vectorMap.get(chunk.id) ?? 0;
    const kwScore = keywordScore(input.query, chunk.chunk_text);
    const { finalScore, authorityScore } = computeFinalScore(vecScore, kwScore, chunk, input);

    if (finalScore >= minScore) {
      scored.push(toSearchResult(chunk, kwScore, vecScore, finalScore, authorityScore));
    }
  }

  scored.sort((a, b) => b.score - a.score);

  const method = vectorSearchUsed ? "hybrid_rag" : "keyword_only";

  return {
    results: scored.slice(0, limit),
    fallbackUsed: false,
    source: "legal_opinions",
    retrievalMethod: method,
    totalCandidates: allChunks.size,
  };
}
