import type { MatterRow, MatterFileRow, WorkflowRunRow } from "@/lib/db/supabaseServer";

export type { MatterRow, MatterFileRow };

export interface CreateMatterInput {
  title: string;
  clientName?: string;
  matterType?: string;
  jurisdiction?: string;
  court?: string;
  judgeName?: string;
  description?: string;
  organizationId?: string;
  userId?: string;
}

export interface UpdateMatterInput {
  title?: string;
  clientName?: string;
  matterType?: string;
  jurisdiction?: string;
  court?: string;
  status?: "active" | "closed" | "on_hold" | "archived";
  description?: string;
}

export interface MatterWorkflowSummary extends WorkflowRunRow {
  draftLink: string;
  workflowLink: string;
  evalLink: string;
  traceLink: string;
}

export interface MatterQualitySignals {
  latestConfidence: number | null;
  latestCitationPassRate: number | null;
  latestFaithfulnessScore: number | null;
  completedWorkflowCount: number;
  failedWorkflowCount: number;
}

export interface MatterWorkspace {
  matter: MatterRow;
  workflows: MatterWorkflowSummary[];
  files: MatterFileRow[];
  qualitySignals: MatterQualitySignals;
}
