-- Migration 008: Draft revision tracking for Phase 16 editable motion editor.
-- Apply via Supabase Dashboard > SQL Editor after 007_case_file_uploads.sql.

-- ── Table: draft_revisions ────────────────────────────────────────────────────
-- Stores the edit history for draft artifacts. Each PATCH to a draft produces
-- one revision row. The canonical draft_artifacts row is updated in-place
-- to always reflect the latest content; this table preserves the history.

CREATE TABLE IF NOT EXISTS draft_revisions (
  id                  uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id     uuid         REFERENCES litigation_workflow_runs(id) ON DELETE CASCADE,
  draft_artifact_id   uuid         REFERENCES draft_artifacts(id) ON DELETE SET NULL,
  version             integer      NOT NULL,
  content             text         NOT NULL,
  edit_summary        text,
  verification_status text         CHECK (verification_status IN ('pending', 'verified', 'partial', 'failed')),
  citation_summary    jsonb        NOT NULL DEFAULT '{}'::jsonb,
  created_by          text         NOT NULL DEFAULT 'user',
  created_at          timestamptz  NOT NULL DEFAULT now(),
  metadata            jsonb        NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_draft_revisions_workflow_run_id
  ON draft_revisions (workflow_run_id);

CREATE INDEX IF NOT EXISTS idx_draft_revisions_artifact_id
  ON draft_revisions (draft_artifact_id);

CREATE INDEX IF NOT EXISTS idx_draft_revisions_artifact_version
  ON draft_revisions (draft_artifact_id, version);

CREATE INDEX IF NOT EXISTS idx_draft_revisions_created_at
  ON draft_revisions (created_at DESC);

-- RLS: enable but allow service role full access (matches existing table pattern)
ALTER TABLE draft_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_draft_revisions"
  ON draft_revisions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
