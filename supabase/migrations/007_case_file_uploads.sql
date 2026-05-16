-- Migration 007: Case file upload intake for Phase 13.
-- Apply via Supabase Dashboard > SQL Editor after 006_workflow_eval_artifact.sql.

-- ── Table: case_file_uploads ───────────────────────────────────────────────────
-- Stores metadata and extracted text for uploaded case materials.
-- File blobs are NOT stored here; only extracted text and metadata.

CREATE TABLE IF NOT EXISTS case_file_uploads (
  id                uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_run_id   uuid         REFERENCES litigation_workflow_runs(id) ON DELETE SET NULL,
  organization_id   uuid,
  user_id           uuid,
  file_name         text         NOT NULL,
  file_type         text,
  file_size_bytes   integer,
  document_role     text         NOT NULL DEFAULT 'case_file'
                                 CHECK (document_role IN (
                                   'complaint', 'deposition', 'affidavit',
                                   'exhibit', 'motion', 'case_file', 'other'
                                 )),
  status            text         NOT NULL DEFAULT 'uploaded'
                                 CHECK (status IN ('uploaded', 'extracted', 'error', 'skipped')),
  extracted_text    text,
  extraction_error  text,
  metadata          jsonb        NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz  NOT NULL DEFAULT now(),
  updated_at        timestamptz  NOT NULL DEFAULT now()
);

-- RLS: enable but allow service role full access (matches existing table pattern)
ALTER TABLE case_file_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all_case_file_uploads"
  ON case_file_uploads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Update draft_artifacts artifact_type constraint ────────────────────────────
-- Add case_file_summary to the allowed artifact types.

ALTER TABLE draft_artifacts
  DROP CONSTRAINT IF EXISTS draft_artifacts_artifact_type_check;

ALTER TABLE draft_artifacts
  ADD CONSTRAINT draft_artifacts_artifact_type_check
  CHECK (artifact_type IN (
    'motion_section',
    'memo',
    'red_team_memo',
    'judge_brief',
    'local_rules_check',
    'full_draft',
    'outline',
    'workflow_eval',
    'case_file_summary'
  ));
