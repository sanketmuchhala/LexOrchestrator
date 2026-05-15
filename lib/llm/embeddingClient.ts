// Embeddings wrapper — supports OpenRouter and OpenAI, with deterministic fallback.
// Set OPENROUTER_API_KEY to use OpenRouter for embeddings.
// Set OPENAI_API_KEY to use OpenAI directly.
// If neither key is set → deterministic hash-based fallback (reproducible but not
// semantically meaningful; hybrid RAG degrades to keyword-only scoring).

import OpenAI from "openai";
import {
  LLM_API_KEY,
  LLM_BASE_URL,
  LLM_EXTRA_HEADERS,
  DEFAULT_EMBEDDING_MODEL,
} from "@/lib/llm/config";

export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? DEFAULT_EMBEDDING_MODEL;
const EMBEDDING_DIMS = 1536;

let _client: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (!LLM_API_KEY) return null;
  if (!_client) {
    _client = new OpenAI({
      apiKey: LLM_API_KEY,
      baseURL: LLM_BASE_URL,
      defaultHeaders: LLM_EXTRA_HEADERS,
    });
  }
  return _client;
}

// FNV-1a 32-bit hash - produces deterministic numbers from text for the fallback
function fnv1a(str: string, seed = 0x811c9dc5): number {
  let hash = seed;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = (Math.imul(hash, 0x01000193) >>> 0);
  }
  return hash;
}

// Deterministic 1536-dim unit vector derived from text hash.
// Not semantically meaningful - used only when no API key is present.
function deterministicEmbedding(text: string): number[] {
  const vec: number[] = new Array(EMBEDDING_DIMS);
  let sumSq = 0;
  for (let i = 0; i < EMBEDDING_DIMS; i++) {
    const raw = fnv1a(text, i * 2654435761) / 0xffffffff;
    vec[i] = raw * 2 - 1; // shift to [-1, 1]
    sumSq += vec[i] * vec[i];
  }
  // L2-normalize so cosine similarity is well-defined
  const norm = Math.sqrt(sumSq) || 1;
  return vec.map((v) => v / norm);
}

let _warnedFallback = false;

export async function generateEmbedding(text: string): Promise<number[] | null> {
  const client = getClient();

  if (!client) {
    if (!_warnedFallback) {
      console.warn("[Embedding] No API key set — using deterministic hash fallback (not semantically meaningful).");
      _warnedFallback = true;
    }
    return deterministicEmbedding(text);
  }

  try {
    const response = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });
    return response.data[0]?.embedding ?? null;
  } catch (err) {
    console.warn("[Embedding] generateEmbedding failed:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

// For query embeddings - same as generateEmbedding but semantically scoped for retrieval
export async function generateQueryEmbedding(query: string): Promise<number[] | null> {
  return generateEmbedding(query);
}
