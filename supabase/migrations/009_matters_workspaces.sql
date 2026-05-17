-- Migration 009: Matter workspaces for Phase 20.
-- Apply via Supabase Dashboard > SQL Editor after 008_draft_revisions.sql.

-- ── Table: matters ─────────────────────────────────────────────────────────────
-- A matter groups related workflow runs, uploads, and drafts under a single
-- legal matter context. Nullable user_id and organization_id support demo mode;
-- auth-gated access policies are future work once auth is wired.

CREATE TABLE IF NOT EXISTS matters (
  id              uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid         REFERENCES organizations(id) ON DELETE SET NULL,
  user_id         uuid,
  title           text         NOT NULL,
  client_name     text,
  matter_type     text,
  jurisdiction    text,
  court           text,
  judge_id        uuid         REFERENCES legal_judges(id) ON DELETE SET NULL,
  status          text         NOT NULL DEFAULT 'active'
                               CHECK (status IN ('active', 'closed', 'on_hold', 'archived')),
  description     text,
  metadata        jsonb        NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz  NOT NULL DEFAULT now(),
  updated_at      timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_matters_organization_id ON matters (organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_matters_user_id         ON matters (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_matters_status          ON matters (status);
CREATE INDEX IF NOT EXISTS idx_matters_jurisdiction    ON matters (jurisdiction) WHERE jurisdiction IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_matters_created_at      ON matters (created_at DESC);

-- ── Table: matter_files ────────────────────────────────────────────────────────
-- Links uploaded case files to a matter, with an optional role label and preview.

CREATE TABLE IF NOT EXISTS matter_files (
  id                   uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id            uuid         NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  case_file_upload_id  uuid         REFERENCES case_file_uploads(id) ON DELETE SET NULL,
  title                text         NOT NULL,
  file_role            text         NOT NULL DEFAULT 'case_file',
  extracted_text_preview text,
  metadata             jsonb        NOT NULL DEFAULT '{}'::jsonb,
  created_at           timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_matter_files_matter_id           ON matter_files (matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_files_case_file_upload_id ON matter_files (case_file_upload_id) WHERE case_file_upload_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_matter_files_file_role           ON matter_files (file_role);
CREATE INDEX IF NOT EXISTS idx_matter_files_created_at          ON matter_files (created_at DESC);

-- ── Add matter_id to existing tables ──────────────────────────────────────────

ALTER TABLE litigation_workflow_runs
  ADD COLUMN IF NOT EXISTS matter_id uuid REFERENCES matters(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workflow_runs_matter_id
  ON litigation_workflow_runs (matter_id) WHERE matter_id IS NOT NULL;

ALTER TABLE draft_artifacts
  ADD COLUMN IF NOT EXISTS matter_id uuid REFERENCES matters(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_draft_artifacts_matter_id
  ON draft_artifacts (matter_id) WHERE matter_id IS NOT NULL;

ALTER TABLE case_file_uploads
  ADD COLUMN IF NOT EXISTS matter_id uuid REFERENCES matters(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_case_file_uploads_matter_id
  ON case_file_uploads (matter_id) WHERE matter_id IS NOT NULL;

ALTER TABLE draft_revisions
  ADD COLUMN IF NOT EXISTS matter_id uuid REFERENCES matters(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_draft_revisions_matter_id
  ON draft_revisions (matter_id) WHERE matter_id IS NOT NULL;

-- ── updated_at trigger for matters ────────────────────────────────────────────
-- Reuses the set_updated_at function defined in migration 004.

CREATE TRIGGER trg_matters_updated_at
  BEFORE UPDATE ON matters
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ─────────────────────────────────────────────────────────
-- Matter data is private. No open select policy. Service role has full access.
-- Auth-gated per-user/per-org policies are future work.

ALTER TABLE matters     ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_matters"
  ON matters FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "service_role_all_matter_files"
  ON matter_files FOR ALL TO service_role USING (true) WITH CHECK (true);
