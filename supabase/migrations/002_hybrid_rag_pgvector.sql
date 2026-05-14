-- LexOrchestrator Phase 2: Hybrid RAG with pgvector
-- Apply via: Supabase Dashboard > SQL Editor
-- Safe to run multiple times (all operations use IF NOT EXISTS / OR REPLACE)

-- Enable pgvector extension
create extension if not exists vector;

-- Add embedding fields to legal_chunks
-- text-embedding-3-small produces 1536-dimensional vectors
alter table legal_chunks
  add column if not exists embedding vector(1536),
  add column if not exists embedding_model text,
  add column if not exists embedding_updated_at timestamptz;

-- Add retrieval quality columns to retrieval_results
alter table retrieval_results
  add column if not exists retrieval_method text,
  add column if not exists keyword_score numeric,
  add column if not exists vector_score numeric,
  add column if not exists hybrid_score numeric,
  add column if not exists rerank_score numeric,
  add column if not exists rank_position int;

-- HNSW index for fast cosine similarity search
-- Requires pgvector >= 0.5.0 (available on Supabase hosted as of late 2023)
-- If this fails on an older pgvector version, comment it out and use IVFFlat below
create index if not exists legal_chunks_embedding_hnsw
  on legal_chunks using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- IVFFlat alternative (uncomment if HNSW fails):
-- create index if not exists legal_chunks_embedding_ivfflat
--   on legal_chunks using ivfflat (embedding vector_cosine_ops)
--   with (lists = 4);
-- Note: IVFFlat requires the table to be populated before the index is useful.
-- Run ANALYZE on the table after embedding backfill for best performance.

-- RPC function for vector similarity search
-- Returns top match_count chunks ordered by cosine similarity to query_embedding
create or replace function match_legal_chunks(
  query_embedding vector(1536),
  match_count int default 8
)
returns table (
  id uuid,
  document_id uuid,
  citation_id text,
  chunk_text text,
  keywords text[],
  jurisdiction text,
  practice_area text,
  similarity float
)
language sql stable
as $$
  select
    lc.id,
    lc.document_id,
    lc.citation_id,
    lc.chunk_text,
    lc.keywords,
    lc.jurisdiction,
    lc.practice_area,
    1 - (lc.embedding <=> query_embedding) as similarity
  from legal_chunks lc
  where lc.embedding is not null
  order by lc.embedding <=> query_embedding
  limit match_count;
$$;
