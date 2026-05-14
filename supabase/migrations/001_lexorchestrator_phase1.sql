-- LexOrchestrator Phase 1 Schema
-- Apply via: Supabase Dashboard > SQL Editor, or `npx supabase db push`

-- legal_documents: parent record per corpus entry
create table if not exists legal_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  jurisdiction text,
  practice_area text,
  source_type text default 'sample',
  disclaimer text default 'Sample educational content, not legal authority.',
  created_at timestamptz default now()
);

-- legal_chunks: searchable text units (one per SAMPLE-XXX citation ID)
create table if not exists legal_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references legal_documents(id) on delete cascade,
  citation_id text unique not null,
  chunk_text text not null,
  keywords text[] default '{}',
  jurisdiction text,
  practice_area text,
  created_at timestamptz default now()
);

-- orchestration_runs: one row per query submitted to the pipeline
create table if not exists orchestration_runs (
  id uuid primary key default gen_random_uuid(),
  query text not null,
  status text not null default 'running',
  model text,
  final_answer text,
  confidence numeric,
  hallucination_risk numeric,
  created_at timestamptz default now()
);

-- agent_traces: one row per agent step per run
create table if not exists agent_traces (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references orchestration_runs(id) on delete cascade,
  step_index int not null,
  agent_name text not null,
  input_summary text,
  output_summary text,
  status text,
  risk_flag text,
  payload jsonb not null default '{}',
  created_at timestamptz default now()
);

-- retrieval_results: which chunks were returned for each run
create table if not exists retrieval_results (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references orchestration_runs(id) on delete cascade,
  chunk_id uuid references legal_chunks(id),
  citation_id text not null,
  score numeric not null,
  reason text,
  created_at timestamptz default now()
);

-- citation_validations: per-claim support assessment per run
create table if not exists citation_validations (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references orchestration_runs(id) on delete cascade,
  claim text not null,
  citation_id text,
  support_status text not null check (support_status in ('verified', 'partial', 'unsupported')),
  support_score numeric not null,
  explanation text,
  created_at timestamptz default now()
);

-- eval_reports: structured reliability metrics per run
create table if not exists eval_reports (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references orchestration_runs(id) on delete cascade,
  groundedness_score numeric not null,
  citation_accuracy_score numeric not null,
  retrieval_coverage_score numeric not null,
  hallucination_risk_score numeric not null,
  final_reliability_score numeric not null,
  pass_fail_status text not null check (pass_fail_status in ('pass', 'fail')),
  payload jsonb not null default '{}',
  created_at timestamptz default now()
);

-- Indexes for common query patterns
create index if not exists legal_chunks_keywords_gin on legal_chunks using gin(keywords);
create index if not exists legal_chunks_citation_id on legal_chunks(citation_id);
create index if not exists orchestration_runs_created_at on orchestration_runs(created_at desc);
create index if not exists agent_traces_run_id on agent_traces(run_id);
create index if not exists retrieval_results_run_id on retrieval_results(run_id);
create index if not exists citation_validations_run_id on citation_validations(run_id);
create index if not exists eval_reports_run_id on eval_reports(run_id);
