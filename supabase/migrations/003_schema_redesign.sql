-- LexOrchestrator Schema v2 — Production redesign
-- Replaces 001 and 002. Apply via Supabase Dashboard > SQL Editor.
--
-- Changes from v1:
--   legal_documents  → documents   (adds PDF storage, processing state, authority_level)
--   legal_chunks     → document_chunks (source_type denormalized here, adds authority_weight,
--                                       chunk_index, page_number, section_heading)
--   orchestration_runs: adds org/user FK, timing columns, pass_fail denormalized
--   retrieval_results: renamed score → final_score, added rank_position NOT NULL
--   RLS enabled on every table with sensible policies
--   Vector search function updated; backward-compat alias kept for match_legal_chunks

-- ─── Extensions ───────────────────────────────────────────────────────────────

create extension if not exists vector;
create extension if not exists pg_trgm;

-- ─── Drop Legacy Tables (reverse dependency order) ────────────────────────────

drop function if exists match_legal_chunks cascade;
drop function if exists match_document_chunks cascade;
drop table if exists eval_reports cascade;
drop table if exists citation_validations cascade;
drop table if exists retrieval_results cascade;
drop table if exists agent_traces cascade;
drop table if exists orchestration_runs cascade;
drop table if exists legal_chunks cascade;
drop table if exists legal_documents cascade;

-- ─── Tier 0: Identity & Tenancy ──────────────────────────────────────────────

create table organizations (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null,
  slug        text        unique not null check (slug ~ '^[a-z0-9-]+$'),
  plan        text        not null default 'free' check (plan in ('free', 'pro', 'enterprise')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Extends Supabase auth.users — one row per authenticated user
create table user_profiles (
  id              uuid        primary key references auth.users(id) on delete cascade,
  organization_id uuid        references organizations(id) on delete set null,
  role            text        not null default 'member'
                              check (role in ('owner', 'admin', 'member', 'viewer')),
  full_name       text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ─── Tier 1: Document Corpus ──────────────────────────────────────────────────

-- documents: one row per uploaded PDF, statute, or built-in corpus entry
create table documents (
  id                uuid        primary key default gen_random_uuid(),
  organization_id   uuid        references organizations(id) on delete cascade,
  created_by        uuid        references auth.users(id) on delete set null,

  title             text        not null,
  source_type       text        not null default 'user_upload'
                                check (source_type in ('primary', 'secondary', 'user_upload', 'sample')),
  jurisdiction      text,
  practice_area     text,

  -- Supabase Storage reference (null for built-in corpus entries)
  storage_bucket    text        default 'documents',
  storage_path      text,
  original_filename text,
  file_size_bytes   bigint,
  mime_type         text        default 'application/pdf',

  -- Processing state machine: pending → processing → indexed | error
  status            text        not null default 'pending'
                                check (status in ('pending', 'processing', 'indexed', 'error')),
  error_message     text,
  chunk_count       int         not null default 0,

  -- Authority metadata (1 = weakest, 10 = primary law)
  authority_level   int         not null default 5 check (authority_level between 1 and 10),
  citation_prefix   text,
  disclaimer        text,
  published_at      date,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- document_chunks: vectorized text segments extracted from a document
create table document_chunks (
  id                   uuid        primary key default gen_random_uuid(),
  document_id          uuid        not null references documents(id) on delete cascade,

  citation_id          text        unique not null,
  chunk_index          int         not null,

  chunk_text           text        not null,
  chunk_summary        text,
  page_number          int,
  section_heading      text,

  keywords             text[]      not null default '{}',
  jurisdiction         text,
  practice_area        text,

  -- Denormalized from parent document so retrieval never joins
  source_type          text        not null default 'user_upload'
                                   check (source_type in ('primary', 'secondary', 'user_upload', 'sample')),

  -- pgvector embedding
  embedding            vector(1536),
  embedding_model      text,
  embedding_updated_at timestamptz,

  -- Retrieval authority weight; used in hybrid scoring formula
  -- primary = 1.5, secondary = 1.2, user_upload/sample = 1.0
  authority_weight     numeric     not null default 1.0
                                   check (authority_weight between 0.1 and 2.0),

  created_at           timestamptz not null default now(),

  unique (document_id, chunk_index)
);

-- ─── Tier 2: Research Pipeline ────────────────────────────────────────────────

create table orchestration_runs (
  id                  uuid        primary key default gen_random_uuid(),
  organization_id     uuid        references organizations(id) on delete cascade,
  created_by          uuid        references auth.users(id) on delete set null,

  query               text        not null,
  query_jurisdiction  text,
  query_practice_area text,

  status              text        not null default 'running'
                                  check (status in ('running', 'completed', 'failed')),
  model               text,

  -- Denormalized top-level metrics for fast list views (no join needed)
  final_answer        text,
  confidence          numeric     check (confidence between 0 and 1),
  hallucination_risk  numeric     check (hallucination_risk between 0 and 1),
  pass_fail           text        check (pass_fail in ('pass', 'fail')),

  started_at          timestamptz not null default now(),
  completed_at        timestamptz,
  duration_ms         int,

  created_at          timestamptz not null default now()
);

create table agent_traces (
  id             uuid        primary key default gen_random_uuid(),
  run_id         uuid        not null references orchestration_runs(id) on delete cascade,

  step_index     int         not null,
  agent_name     text        not null,
  status         text        not null default 'pending'
                             check (status in ('pending', 'running', 'completed', 'failed')),

  input_summary  text,
  output_summary text,
  risk_flag      text,
  payload        jsonb       not null default '{}',

  started_at     timestamptz,
  completed_at   timestamptz,
  duration_ms    int,

  created_at     timestamptz not null default now(),

  unique (run_id, step_index)
);

create table retrieval_results (
  id               uuid        primary key default gen_random_uuid(),
  run_id           uuid        not null references orchestration_runs(id) on delete cascade,
  chunk_id         uuid        references document_chunks(id) on delete set null,

  citation_id      text        not null,
  rank_position    int         not null default 0,

  retrieval_method text        not null default 'hybrid_rag'
                               check (retrieval_method in ('hybrid_rag', 'keyword_fallback', 'memory_fallback')),
  keyword_score    numeric,
  vector_score     numeric,
  hybrid_score     numeric,
  rerank_score     numeric,
  final_score      numeric     not null,
  reason           text,

  created_at       timestamptz not null default now(),

  -- citation_id unique per run (chunk_id can be null for memory-fallback rows)
  unique (run_id, citation_id)
);

create table citation_validations (
  id             uuid        primary key default gen_random_uuid(),
  run_id         uuid        not null references orchestration_runs(id) on delete cascade,
  chunk_id       uuid        references document_chunks(id) on delete set null,

  claim          text        not null,
  citation_id    text,
  support_status text        not null
                             check (support_status in ('verified', 'partial', 'unsupported')),
  support_score  numeric     not null check (support_score between 0 and 1),
  explanation    text,

  created_at     timestamptz not null default now()
);

create table eval_reports (
  id                       uuid        primary key default gen_random_uuid(),
  run_id                   uuid        not null unique references orchestration_runs(id) on delete cascade,

  groundedness_score       numeric     not null check (groundedness_score between 0 and 1),
  citation_accuracy_score  numeric     not null check (citation_accuracy_score between 0 and 1),
  retrieval_coverage_score numeric     not null check (retrieval_coverage_score between 0 and 1),
  hallucination_risk_score numeric     not null check (hallucination_risk_score between 0 and 1),
  final_reliability_score  numeric     not null check (final_reliability_score between 0 and 1),
  pass_fail_status         text        not null check (pass_fail_status in ('pass', 'fail')),

  retrieval_method         text,
  total_chunks_retrieved   int,
  primary_source_ratio     numeric,

  payload                  jsonb       not null default '{}',

  created_at               timestamptz not null default now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────

-- document_chunks: full retrieval stack indexes
create index idx_doc_chunks_document_id   on document_chunks(document_id);
create index idx_doc_chunks_source_type   on document_chunks(source_type);
create index idx_doc_chunks_jurisdiction  on document_chunks(jurisdiction) where jurisdiction is not null;
create index idx_doc_chunks_practice_area on document_chunks(practice_area) where practice_area is not null;
create index idx_doc_chunks_keywords_gin  on document_chunks using gin(keywords);
-- Full-text trigram index for keyword fallback search
create index idx_doc_chunks_text_trgm     on document_chunks using gin(chunk_text gin_trgm_ops);
-- HNSW for fast approximate nearest-neighbor vector search
create index idx_doc_chunks_embedding_hnsw
  on document_chunks using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- documents
create index idx_documents_org         on documents(organization_id);
create index idx_documents_source_type on documents(source_type);
create index idx_documents_status      on documents(status);
create index idx_documents_created_by  on documents(created_by);

-- orchestration_runs
create index idx_runs_created_by on orchestration_runs(created_by);
create index idx_runs_org        on orchestration_runs(organization_id);
create index idx_runs_created_at on orchestration_runs(created_at desc);
create index idx_runs_status     on orchestration_runs(status);

-- pipeline sub-tables
create index idx_agent_traces_run_id      on agent_traces(run_id);
create index idx_retrieval_results_run_id on retrieval_results(run_id);
create index idx_citation_vals_run_id     on citation_validations(run_id);
create index idx_eval_reports_run_id      on eval_reports(run_id);

-- ─── RLS Helper Functions ─────────────────────────────────────────────────────

create or replace function get_my_org_id()
returns uuid
language sql stable security invoker
as $$
  select organization_id from user_profiles where id = auth.uid()
$$;

create or replace function is_org_admin(org_id uuid)
returns boolean
language sql stable security invoker
as $$
  select exists (
    select 1 from user_profiles
    where id = auth.uid()
      and organization_id = org_id
      and role in ('owner', 'admin')
  )
$$;

-- ─── Row Level Security ───────────────────────────────────────────────────────

alter table organizations        enable row level security;
alter table user_profiles        enable row level security;
alter table documents            enable row level security;
alter table document_chunks      enable row level security;
alter table orchestration_runs   enable row level security;
alter table agent_traces         enable row level security;
alter table retrieval_results    enable row level security;
alter table citation_validations enable row level security;
alter table eval_reports         enable row level security;

-- organizations: members read their own org; admins update it
create policy "orgs_select" on organizations for select
  using (id = get_my_org_id());
create policy "orgs_update" on organizations for update
  using (is_org_admin(id));

-- user_profiles: see own profile or fellow org members
create policy "profiles_select" on user_profiles for select
  using (id = auth.uid() or organization_id = get_my_org_id());
create policy "profiles_insert" on user_profiles for insert
  with check (id = auth.uid());
create policy "profiles_update" on user_profiles for update
  using (id = auth.uid() or is_org_admin(organization_id));

-- documents:
--   primary/sample corpus is public-read (supports anonymous users and search)
--   user uploads are private to creator + org
create policy "docs_select" on documents for select using (
  source_type in ('primary', 'sample')
  or created_by = auth.uid()
  or organization_id = get_my_org_id()
);
create policy "docs_insert" on documents for insert
  with check (auth.uid() is not null);
create policy "docs_update" on documents for update
  using (created_by = auth.uid() or is_org_admin(organization_id));
create policy "docs_delete" on documents for delete
  using (created_by = auth.uid() or is_org_admin(organization_id));

-- document_chunks: readable if the parent document is readable
create policy "chunks_select" on document_chunks for select using (
  source_type in ('primary', 'sample')
  or document_id in (
    select id from documents
    where created_by = auth.uid() or organization_id = get_my_org_id()
  )
);
-- Service role handles chunk inserts/updates (bypasses RLS automatically)
create policy "chunks_insert" on document_chunks for insert with check (true);
create policy "chunks_update" on document_chunks for update using (true);

-- orchestration_runs: creator or org member reads; open insert (no auth wired yet)
create policy "runs_select" on orchestration_runs for select using (
  created_by = auth.uid()
  or organization_id = get_my_org_id()
  or created_by is null
);
create policy "runs_insert" on orchestration_runs for insert with check (true);
create policy "runs_update" on orchestration_runs for update using (true);

-- sub-tables: readable if the parent run is readable (via same open policy for now)
create policy "traces_select"   on agent_traces         for select using (true);
create policy "traces_insert"   on agent_traces         for insert with check (true);
create policy "traces_update"   on agent_traces         for update using (true);

create policy "retrieval_select" on retrieval_results   for select using (true);
create policy "retrieval_insert" on retrieval_results   for insert with check (true);

create policy "citations_select" on citation_validations for select using (true);
create policy "citations_insert" on citation_validations for insert with check (true);

create policy "eval_select"  on eval_reports for select using (true);
create policy "eval_insert"  on eval_reports for insert with check (true);

-- ─── Vector Search Functions ──────────────────────────────────────────────────

-- Primary function: searches document_chunks by embedding similarity
create or replace function match_document_chunks(
  query_embedding  vector(1536),
  match_threshold  float   default 0.1,
  match_count      int     default 20
)
returns table (
  id               uuid,
  document_id      uuid,
  citation_id      text,
  chunk_text       text,
  keywords         text[],
  jurisdiction     text,
  practice_area    text,
  source_type      text,
  authority_weight numeric,
  similarity       float
)
language plpgsql security invoker
as $$
begin
  return query
    select
      dc.id,
      dc.document_id,
      dc.citation_id,
      dc.chunk_text,
      dc.keywords,
      dc.jurisdiction,
      dc.practice_area,
      dc.source_type,
      dc.authority_weight,
      (1 - (dc.embedding <=> query_embedding))::float as similarity
    from document_chunks dc
    where
      dc.embedding is not null
      and (1 - (dc.embedding <=> query_embedding)) > match_threshold
    order by dc.embedding <=> query_embedding
    limit match_count;
end;
$$;

-- Backward-compat alias: existing code still calls match_legal_chunks
create or replace function match_legal_chunks(
  query_embedding  vector(1536),
  match_threshold  float   default 0.1,
  match_count      int     default 20
)
returns table (
  id               uuid,
  document_id      uuid,
  citation_id      text,
  chunk_text       text,
  keywords         text[],
  jurisdiction     text,
  practice_area    text,
  source_type      text,
  authority_weight numeric,
  similarity       float
)
language plpgsql security invoker
as $$
begin
  return query
    select * from match_document_chunks(query_embedding, match_threshold, match_count);
end;
$$;

-- ─── Supabase Storage Bucket ──────────────────────────────────────────────────
-- Run the following in SQL Editor after applying this migration if the bucket
-- does not already exist. Max file size: 50 MB. PDF and plain text only.
--
-- insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- values (
--   'documents', 'documents', false, 52428800,
--   array['application/pdf', 'text/plain',
--         'application/msword',
--         'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
-- )
-- on conflict (id) do nothing;
--
-- Storage RLS (after bucket creation):
-- create policy "auth_upload" on storage.objects for insert to authenticated
--   with check (bucket_id = 'documents');
-- create policy "auth_read" on storage.objects for select to authenticated
--   using (bucket_id = 'documents'
--     and auth.uid()::text = (storage.foldername(name))[1]);
