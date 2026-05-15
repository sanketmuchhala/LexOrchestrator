-- Migration 006: Add workflow_eval artifact type for Phase 9 evals dashboard.
-- Apply via Supabase Dashboard > SQL Editor after 005_search_legal_opinions.sql.

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
    'workflow_eval'
  ));
