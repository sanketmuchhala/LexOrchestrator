// Persistence helper -- inserts into citation_verification_reports
// when Supabase is configured and a workflowRunId is provided.
// Safe to call without Supabase -- returns silently.

import type { CitationVerificationResult } from "./types";
import { DB_AVAILABLE } from "@/lib/db/supabaseServer";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

// Map internal status values to DB-compatible values
function mapExistenceStatus(status: string): string {
  const map: Record<string, string> = {
    verified: "found",
    not_found: "not_found",
    ambiguous: "found",
    unknown: "error",
  };
  return map[status] ?? "error";
}

function mapQuoteStatus(status: string): string {
  const map: Record<string, string> = {
    verified: "exact_match",
    failed: "mismatch",
    not_provided: "not_checked",
    unknown: "not_checked",
  };
  return map[status] ?? "not_checked";
}

function mapPinCiteStatus(status: string): string {
  const map: Record<string, string> = {
    verified: "confirmed",
    failed: "mismatch",
    not_provided: "not_checked",
    unknown: "not_checked",
  };
  return map[status] ?? "not_checked";
}

function mapPropositionStatus(status: string): string {
  const map: Record<string, string> = {
    supported: "supported",
    unsupported: "unsupported",
    uncertain: "partially_supported",
    not_provided: "not_checked",
  };
  return map[status] ?? "not_checked";
}

function mapTreatmentStatus(status: string): string {
  const map: Record<string, string> = {
    positive: "positive",
    negative: "negative",
    caution: "neutral",
    unknown: "not_checked",
  };
  return map[status] ?? "not_checked";
}

function mapOverallStatus(status: string): string {
  const map: Record<string, string> = {
    pass: "verified",
    warn: "parsed_unverified",
    fail: "not_found",
    unknown: "unknown",
  };
  return map[status] ?? "unknown";
}

export async function saveCitationVerificationReport(
  result: CitationVerificationResult,
  workflowRunId: string,
  draftArtifactId?: string
): Promise<void> {
  if (!DB_AVAILABLE) return;
  if (!workflowRunId) return;

  const client = getServiceClient();
  if (!client) return;

  const row = {
    workflow_run_id: workflowRunId,
    draft_artifact_id: draftArtifactId ?? null,
    citation_text: result.citationText,
    normalized_citation: result.normalizedCitation,
    opinion_id: result.matchedOpinionId ?? null,
    proposition: result.evidence.find((e) => e.source === "chunk_0")?.text ?? null,
    quote_text: null,
    pin_cite: null,
    existence_status: mapExistenceStatus(result.existenceStatus),
    quote_status: mapQuoteStatus(result.quoteStatus),
    pin_cite_status: mapPinCiteStatus(result.pinCiteStatus),
    proposition_status: mapPropositionStatus(result.propositionStatus),
    treatment_status: mapTreatmentStatus(result.treatmentStatus),
    overall_status: mapOverallStatus(result.overallStatus),
    report: result.report,
  };

  const { error } = await client.from("citation_verification_reports").insert(row);

  if (error) {
    console.warn("[CitationVerification] Failed to save report:", error.message);
  }
}
