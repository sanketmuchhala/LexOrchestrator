import { verifyCitationsInText } from "@/lib/citations/verifyCitationsInText";
import { updateDraftArtifactVerification } from "@/lib/db/supabaseServer";
import type { DraftVerificationRunResult } from "./types";

function determineVerificationStatus(
  pass: number,
  warn: number,
  fail: number,
  total: number
): "pending" | "verified" | "partial" | "failed" {
  if (total === 0) return "pending";
  if (fail > 0) return "failed";
  if (pass > 0 && warn === 0) return "verified";
  return "partial";
}

export async function verifyDraftRevision(input: {
  content: string;
  workflowRunId: string;
  draftArtifactId: string;
  jurisdiction?: string;
  court?: string;
}): Promise<DraftVerificationRunResult> {
  const { citations, summary } = await verifyCitationsInText({
    text: input.content,
    jurisdiction: input.jurisdiction,
    court: input.court,
    workflowRunId: input.workflowRunId,
    draftArtifactId: input.draftArtifactId,
  });

  const verificationStatus = determineVerificationStatus(
    summary.pass,
    summary.warn,
    summary.fail,
    summary.total
  );

  const citationSummary = {
    total: summary.total,
    pass: summary.pass,
    warn: summary.warn,
    fail: summary.fail,
    unknown: summary.unknown,
  };

  // Persist verification result to the canonical artifact record
  await updateDraftArtifactVerification(
    input.draftArtifactId,
    verificationStatus,
    citationSummary
  );

  return { citationSummary, reports: citations, verificationStatus };
}
