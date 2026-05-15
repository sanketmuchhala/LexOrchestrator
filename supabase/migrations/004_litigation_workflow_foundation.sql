-- LexOrchestrator Migration 004: Litigation Workflow Foundation
-- Additive migration -- does NOT modify existing tables.
-- Apply via Supabase Dashboard > SQL Editor after 003_schema_redesign.sql.

-- ─── 1. legal_opinions ──────────────────────────────────────────────────────

create table legal_opinions (
  id              uuid        primary key default gen_random_uuid(),
  external_id     text        unique,
  source          text        not null check (source in ('courtlistener','cap','demo','public','manual')),
  court           text,
  jurisdiction    text,
  case_name       text        not null,
  citation        text,
  decision_date   date,
  judge_name      text,
  opinion_url     text,
  raw_text        text,
  html_text       text,
  metadata        jsonb       not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index idx_opinions_external_id   on legal_opinions(external_id);
create index idx_opinions_citation      on legal_opinions(citation) where citation is not null;
create index idx_opinions_court         on legal_opinions(court) where court is not null;
create index idx_opinions_jurisdiction  on legal_opinions(jurisdiction) where jurisdiction is not null;
create index idx_opinions_decision_date on legal_opinions(decision_date) where decision_date is not null;
create index idx_opinions_metadata_gin  on legal_opinions using gin(metadata);
create index idx_opinions_case_name_ft  on legal_opinions using gin(to_tsvector('english', case_name));

-- ─── 2. legal_opinion_chunks ────────────────────────────────────────────────

create table legal_opinion_chunks (
  id              uuid        primary key default gen_random_uuid(),
  opinion_id      uuid        not null references legal_opinions(id) on delete cascade,
  chunk_index     integer     not null,
  chunk_text      text        not null,
  page_start      integer,
  page_end        integer,
  span_start      integer,
  span_end        integer,
  citation        text,
  court           text,
  jurisdiction    text,
  decision_date   date,
  embedding       vector(1536),
  metadata        jsonb       not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  unique (opinion_id, chunk_index)
);

create index idx_opinion_chunks_opinion_id    on legal_opinion_chunks(opinion_id);
create index idx_opinion_chunks_citation      on legal_opinion_chunks(citation) where citation is not null;
create index idx_opinion_chunks_court         on legal_opinion_chunks(court) where court is not null;
create index idx_opinion_chunks_jurisdiction  on legal_opinion_chunks(jurisdiction) where jurisdiction is not null;
create index idx_opinion_chunks_decision_date on legal_opinion_chunks(decision_date) where decision_date is not null;
create index idx_opinion_chunks_text_ft       on legal_opinion_chunks using gin(to_tsvector('english', chunk_text));
create index idx_opinion_chunks_embedding_hnsw
  on legal_opinion_chunks using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- ─── 3. legal_citation_edges ────────────────────────────────────────────────

create table legal_citation_edges (
  id               uuid        primary key default gen_random_uuid(),
  from_opinion_id  uuid        not null references legal_opinions(id) on delete cascade,
  to_opinion_id    uuid        not null references legal_opinions(id) on delete cascade,
  cited_citation   text,
  citation_context text,
  treatment        text        check (treatment is null or treatment in (
                     'followed','distinguished','overruled','cited','discussed','questioned','unknown'
                   )),
  depth            integer,
  metadata         jsonb       not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  unique (from_opinion_id, to_opinion_id, cited_citation)
);

create index idx_citation_edges_from      on legal_citation_edges(from_opinion_id);
create index idx_citation_edges_to        on legal_citation_edges(to_opinion_id);
create index idx_citation_edges_citation  on legal_citation_edges(cited_citation) where cited_citation is not null;
create index idx_citation_edges_treatment on legal_citation_edges(treatment) where treatment is not null;

-- ─── 4. legal_judges ────────────────────────────────────────────────────────

create table legal_judges (
  id                 uuid        primary key default gen_random_uuid(),
  external_id        text        unique,
  full_name          text        not null,
  court              text,
  jurisdiction       text,
  appointment_source text,
  education          text,
  prior_roles        text,
  biography          text,
  metadata           jsonb       not null default '{}'::jsonb,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index idx_judges_external_id  on legal_judges(external_id);
create index idx_judges_full_name    on legal_judges(full_name);
create index idx_judges_court        on legal_judges(court) where court is not null;
create index idx_judges_jurisdiction on legal_judges(jurisdiction) where jurisdiction is not null;
create index idx_judges_metadata_gin on legal_judges using gin(metadata);

-- ─── 5. judge_profiles ──────────────────────────────────────────────────────

create table judge_profiles (
  id                    uuid        primary key default gen_random_uuid(),
  judge_id              uuid        not null references legal_judges(id) on delete cascade,
  profile_version       text        not null default 'v1',
  motion_type           text,
  jurisdiction          text,
  grant_rate_summary    jsonb       not null default '{}'::jsonb,
  citation_preferences  jsonb       not null default '{}'::jsonb,
  style_notes           text,
  argument_guidance     text,
  source_opinion_count  integer     not null default 0,
  generated_by          text,
  generated_at          timestamptz not null default now(),
  metadata              jsonb       not null default '{}'::jsonb,
  unique (judge_id, profile_version, motion_type, jurisdiction)
);

create index idx_judge_profiles_judge_id     on judge_profiles(judge_id);
create index idx_judge_profiles_motion_type  on judge_profiles(motion_type) where motion_type is not null;
create index idx_judge_profiles_jurisdiction on judge_profiles(jurisdiction) where jurisdiction is not null;

-- ─── 6. litigation_workflow_runs ─────────────────────────────────────────────

create table litigation_workflow_runs (
  id                  uuid        primary key default gen_random_uuid(),
  organization_id     uuid,
  user_id             uuid,
  workflow_type       text        not null default 'motion_draft'
                                  check (workflow_type in ('motion_draft','memo','brief','red_team','eval')),
  status              text        not null default 'queued'
                                  check (status in ('queued','running','completed','failed','cancelled')),
  jurisdiction        text,
  court               text,
  judge_id            uuid        references legal_judges(id) on delete set null,
  motion_type         text,
  input_summary       text,
  final_output        text,
  confidence          numeric     check (confidence is null or confidence between 0 and 1),
  faithfulness_score  numeric     check (faithfulness_score is null or faithfulness_score between 0 and 1),
  citation_pass_rate  numeric     check (citation_pass_rate is null or citation_pass_rate between 0 and 1),
  metadata            jsonb       not null default '{}'::jsonb,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index idx_workflow_runs_status       on litigation_workflow_runs(status);
create index idx_workflow_runs_type         on litigation_workflow_runs(workflow_type);
create index idx_workflow_runs_jurisdiction on litigation_workflow_runs(jurisdiction) where jurisdiction is not null;
create index idx_workflow_runs_court        on litigation_workflow_runs(court) where court is not null;
create index idx_workflow_runs_judge_id     on litigation_workflow_runs(judge_id) where judge_id is not null;
create index idx_workflow_runs_created_at   on litigation_workflow_runs(created_at desc);

-- ─── 7. litigation_agent_events ──────────────────────────────────────────────

create table litigation_agent_events (
  id               uuid        primary key default gen_random_uuid(),
  workflow_run_id  uuid        not null references litigation_workflow_runs(id) on delete cascade,
  agent_name       text        not null,
  event_type       text        not null check (event_type in (
                     'run_started','agent_started','tool_call','tool_result',
                     'retrieval_result','citation_validated','draft_chunk',
                     'agent_completed','run_completed','run_failed'
                   )),
  event_status     text,
  message          text,
  tool_name        text,
  tool_input       jsonb       not null default '{}'::jsonb,
  tool_output      jsonb       not null default '{}'::jsonb,
  token_count      integer,
  cost_usd         numeric,
  latency_ms       integer,
  created_at       timestamptz not null default now(),
  metadata         jsonb       not null default '{}'::jsonb
);

create index idx_agent_events_run_id     on litigation_agent_events(workflow_run_id);
create index idx_agent_events_agent      on litigation_agent_events(agent_name);
create index idx_agent_events_type       on litigation_agent_events(event_type);
create index idx_agent_events_created_at on litigation_agent_events(created_at);

-- ─── 8. draft_artifacts ──────────────────────────────────────────────────────

create table draft_artifacts (
  id                   uuid        primary key default gen_random_uuid(),
  workflow_run_id      uuid        not null references litigation_workflow_runs(id) on delete cascade,
  artifact_type        text        not null check (artifact_type in (
                         'motion_section','memo','red_team_memo','judge_brief',
                         'local_rules_check','full_draft','outline'
                       )),
  title                text,
  content              text        not null,
  citations            jsonb       not null default '[]'::jsonb,
  verification_status  text        check (verification_status is null or verification_status in (
                         'pending','verified','partial','failed'
                       )),
  version              integer     not null default 1,
  created_by_agent     text,
  created_at           timestamptz not null default now(),
  metadata             jsonb       not null default '{}'::jsonb
);

create index idx_draft_artifacts_run_id on draft_artifacts(workflow_run_id);
create index idx_draft_artifacts_type   on draft_artifacts(artifact_type);
create index idx_draft_artifacts_status on draft_artifacts(verification_status) where verification_status is not null;

-- ─── 9. citation_verification_reports ────────────────────────────────────────

create table citation_verification_reports (
  id                    uuid        primary key default gen_random_uuid(),
  workflow_run_id       uuid        not null references litigation_workflow_runs(id) on delete cascade,
  draft_artifact_id     uuid        references draft_artifacts(id) on delete cascade,
  citation_text         text        not null,
  normalized_citation   text,
  opinion_id            uuid        references legal_opinions(id) on delete set null,
  proposition           text,
  quote_text            text,
  pin_cite              text,
  existence_status      text        check (existence_status is null or existence_status in ('found','not_found','error')),
  quote_status          text        check (quote_status is null or quote_status in ('exact_match','close_match','mismatch','not_checked')),
  pin_cite_status       text        check (pin_cite_status is null or pin_cite_status in ('confirmed','mismatch','not_checked')),
  proposition_status    text        check (proposition_status is null or proposition_status in ('supported','partially_supported','unsupported','not_checked')),
  treatment_status      text        check (treatment_status is null or treatment_status in ('positive','negative','neutral','not_checked')),
  overall_status        text        not null default 'unknown'
                                    check (overall_status in ('verified','parsed_unverified','quote_mismatch','pin_mismatch','unsupported_proposition','not_found','error','unknown')),
  report                jsonb       not null default '{}'::jsonb,
  created_at            timestamptz not null default now()
);

create index idx_cit_verify_run_id      on citation_verification_reports(workflow_run_id);
create index idx_cit_verify_artifact_id on citation_verification_reports(draft_artifact_id) where draft_artifact_id is not null;
create index idx_cit_verify_citation    on citation_verification_reports(citation_text);
create index idx_cit_verify_normalized  on citation_verification_reports(normalized_citation) where normalized_citation is not null;
create index idx_cit_verify_opinion_id  on citation_verification_reports(opinion_id) where opinion_id is not null;
create index idx_cit_verify_status      on citation_verification_reports(overall_status);

-- ─── updated_at trigger ──────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_legal_opinions_updated_at before update on legal_opinions for each row execute function set_updated_at();
create trigger trg_legal_judges_updated_at before update on legal_judges for each row execute function set_updated_at();
create trigger trg_workflow_runs_updated_at before update on litigation_workflow_runs for each row execute function set_updated_at();

-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table legal_opinions                enable row level security;
alter table legal_opinion_chunks          enable row level security;
alter table legal_citation_edges          enable row level security;
alter table legal_judges                  enable row level security;
alter table judge_profiles                enable row level security;
alter table litigation_workflow_runs      enable row level security;
alter table litigation_agent_events       enable row level security;
alter table draft_artifacts               enable row level security;
alter table citation_verification_reports enable row level security;

-- Open policies for now (service role bypasses RLS; auth not yet wired)
create policy "opinions_select" on legal_opinions for select using (true);
create policy "opinions_insert" on legal_opinions for insert with check (true);
create policy "opinions_update" on legal_opinions for update using (true);

create policy "opinion_chunks_select" on legal_opinion_chunks for select using (true);
create policy "opinion_chunks_insert" on legal_opinion_chunks for insert with check (true);
create policy "opinion_chunks_update" on legal_opinion_chunks for update using (true);

create policy "citation_edges_select" on legal_citation_edges for select using (true);
create policy "citation_edges_insert" on legal_citation_edges for insert with check (true);

create policy "judges_select" on legal_judges for select using (true);
create policy "judges_insert" on legal_judges for insert with check (true);
create policy "judges_update" on legal_judges for update using (true);

create policy "judge_profiles_select" on judge_profiles for select using (true);
create policy "judge_profiles_insert" on judge_profiles for insert with check (true);
create policy "judge_profiles_update" on judge_profiles for update using (true);

create policy "workflow_runs_select" on litigation_workflow_runs for select using (true);
create policy "workflow_runs_insert" on litigation_workflow_runs for insert with check (true);
create policy "workflow_runs_update" on litigation_workflow_runs for update using (true);

create policy "agent_events_select" on litigation_agent_events for select using (true);
create policy "agent_events_insert" on litigation_agent_events for insert with check (true);

create policy "draft_artifacts_select" on draft_artifacts for select using (true);
create policy "draft_artifacts_insert" on draft_artifacts for insert with check (true);
create policy "draft_artifacts_update" on draft_artifacts for update using (true);

create policy "cit_verify_select" on citation_verification_reports for select using (true);
create policy "cit_verify_insert" on citation_verification_reports for insert with check (true);

-- ─── Vector search for opinion chunks ────────────────────────────────────────

create or replace function match_opinion_chunks(
  query_embedding  vector(1536),
  match_threshold  float   default 0.1,
  match_count      int     default 20
)
returns table (
  id             uuid,
  opinion_id     uuid,
  chunk_text     text,
  citation       text,
  court          text,
  jurisdiction   text,
  decision_date  date,
  similarity     float
)
language plpgsql security invoker
as $$
begin
  return query
    select oc.id, oc.opinion_id, oc.chunk_text, oc.citation,
           oc.court, oc.jurisdiction, oc.decision_date,
           (1 - (oc.embedding <=> query_embedding))::float as similarity
    from legal_opinion_chunks oc
    where oc.embedding is not null
      and (1 - (oc.embedding <=> query_embedding)) > match_threshold
    order by oc.embedding <=> query_embedding
    limit match_count;
end;
$$;
