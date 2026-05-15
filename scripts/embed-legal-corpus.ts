/**
 * Backfill pgvector embeddings for legal_chunks that have embedding = NULL.
 * Run with: npm run embed:legal
 *
 * Requires: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY in .env.local
 * Safe to re-run - skips already-embedded rows.
 */

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;
const embeddingModel = process.env.EMBEDDING_MODEL ?? "text-embedding-3-small";

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

if (!openaiKey) {
  console.error("Missing OPENAI_API_KEY in .env.local - real embeddings require an API key.");
  console.error("The app will still work using the deterministic hash fallback, but semantic search will not be accurate.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
const openai = new OpenAI({ apiKey: openaiKey });

interface ChunkRow {
  id: string;
  citation_id: string;
  chunk_text: string;
  keywords: string[];
  jurisdiction: string | null;
  practice_area: string | null;
  embedding: number[] | null;
}

async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const response = await openai.embeddings.create({ model: embeddingModel, input: text });
    return response.data[0]?.embedding ?? null;
  } catch (err) {
    console.error("  Embedding API error:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

function buildEmbedText(chunk: ChunkRow): string {
  return [
    chunk.chunk_text,
    chunk.keywords.join(" "),
    chunk.jurisdiction ?? "",
    chunk.practice_area ?? "",
  ].filter(Boolean).join(" ").trim();
}

async function embed() {
  console.log(`\nStarting embedding backfill (model: ${embeddingModel})...\n`);

  const { data, error } = await supabase
    .from("document_chunks")
    .select("id, citation_id, chunk_text, keywords, jurisdiction, practice_area, embedding")
    .is("embedding", null)
    .order("citation_id");

  if (error) {
    console.error("Failed to fetch chunks:", error.message);
    process.exit(1);
  }

  const chunks: ChunkRow[] = data ?? [];
  console.log(`Found ${chunks.length} chunk(s) without embeddings.\n`);

  if (chunks.length === 0) {
    console.log("All chunks already embedded. Nothing to do.");
    return;
  }

  let embedded = 0;
  let errors = 0;
  const now = new Date().toISOString();

  for (const chunk of chunks) {
    const embedText = buildEmbedText(chunk);
    const embedding = await generateEmbedding(embedText);

    if (!embedding) {
      console.error(`  ✗ ${chunk.citation_id} - embedding failed`);
      errors++;
      continue;
    }

    const { error: updateError } = await supabase
      .from("document_chunks")
      .update({
        embedding,
        embedding_model: embeddingModel,
        embedding_updated_at: now,
      })
      .eq("id", chunk.id);

    if (updateError) {
      console.error(`  ✗ ${chunk.citation_id} - DB update failed:`, updateError.message);
      errors++;
    } else {
      console.log(`  ✓ ${chunk.citation_id} - ${embedding.length}-dim embedding stored`);
      embedded++;
    }

    // Small delay to avoid rate-limiting on free-tier OpenAI
    await new Promise((res) => setTimeout(res, 250));
  }

  console.log(`\nEmbedding backfill complete:`);
  console.log(`  ✓ ${embedded} embedded`);
  if (errors > 0) console.log(`  ✗ ${errors} failed`);
  if (errors > 0) process.exit(1);
}

embed().catch((err) => {
  console.error("embed-legal-corpus script failed:", err);
  process.exit(1);
});
