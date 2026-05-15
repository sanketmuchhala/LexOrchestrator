// Server-only Supabase client - never import this from client components.
// Uses SUPABASE_SERVICE_ROLE_KEY which must never be exposed to the browser.

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type {
  LegalChunkFromDB,
  LegalChunkWithSimilarity,
  DocumentRecord,
  RunSummary,
  RunDetail,
  AgentTraceRecord,
  RetrievalResultRecord,
  CitationValidationRecord,
  EvalReportRecord,
  ValidatedClaim,
  RetrievedSource,
  EvalReport,
} from "@/lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DB_AVAILABLE = !!(supabaseUrl && serviceRoleKey);

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient | null {
  if (!DB_AVAILABLE) return null;
  if (!_client) {
    _client = createClient(supabaseUrl!, serviceRoleKey!, {
      auth: { persistSession: false },
    });
  }
  return _client;
}

// ─── Orchestration Runs ───────────────────────────────────────────────────────

interface InsertRunData {
  query: string;
  model: string;
}

export async function insertOrchestrationRun(data: InsertRunData): Promise<string> {
  const client = getClient();
  if (!client) return crypto.randomUUID();

  const { data: row, error } = await client
    .from("orchestration_runs")
    .insert({ query: data.query, status: "running", model: data.model })
    .select("id")
    .single();

  if (error || !row) {
    console.warn("[DB] insertOrchestrationRun failed:", error?.message);
    return crypto.randomUUID();
  }
  return row.id as string;
}

interface UpdateRunData {
  status: string;
  final_answer?: string;
  confidence?: number;
  hallucination_risk?: number;
}

export async function updateOrchestrationRun(runId: string, data: UpdateRunData): Promise<void> {
  const client = getClient();
  if (!client) return;

  const { error } = await client.from("orchestration_runs").update(data).eq("id", runId);
  if (error) console.warn("[DB] updateOrchestrationRun failed:", error.message);
}

// ─── Agent Traces ─────────────────────────────────────────────────────────────

interface AgentTraceData {
  inputSummary?: string;
  outputSummary?: string;
  status?: string;
  riskFlag?: string;
  payload: Record<string, unknown>;
}

export async function insertAgentTrace(
  runId: string,
  stepIndex: number,
  agentName: string,
  data: AgentTraceData
): Promise<void> {
  const client = getClient();
  if (!client) return;

  const { error } = await client.from("agent_traces").insert({
    run_id: runId,
    step_index: stepIndex,
    agent_name: agentName,
    input_summary: data.inputSummary ?? null,
    output_summary: data.outputSummary ?? null,
    status: data.status ?? "complete",
    risk_flag: data.riskFlag ?? null,
    payload: data.payload,
  });
  if (error) console.warn("[DB] insertAgentTrace failed:", error.message);
}

// ─── Retrieval Results ────────────────────────────────────────────────────────

export async function insertRetrievalResults(
  runId: string,
  sources: RetrievedSource[]
): Promise<void> {
  const client = getClient();
  if (!client || sources.length === 0) return;

  // Look up chunk UUIDs by citation_id
  const citationIds = sources.map((s) => s.citationId);
  const { data: chunks } = await client
    .from("document_chunks")
    .select("id, citation_id")
    .in("citation_id", citationIds);

  const chunkMap = new Map((chunks ?? []).map((c: { id: string; citation_id: string }) => [c.citation_id, c.id]));

  const rows = sources.map((s, i) => ({
    run_id: runId,
    chunk_id: chunkMap.get(s.citationId) ?? null,
    citation_id: s.citationId,
    final_score: s.finalScore ?? s.relevanceScore,
    reason: s.reason ?? null,
    retrieval_method: s.retrievalMethod ?? "hybrid_rag",
    keyword_score: s.keywordScore ?? null,
    vector_score: s.vectorScore ?? null,
    hybrid_score: s.hybridScore ?? null,
    rerank_score: s.rerankScore ?? null,
    rank_position: s.rankPosition ?? i,
  }));

  const { error } = await client.from("retrieval_results").insert(rows);
  if (error) console.warn("[DB] insertRetrievalResults failed:", error.message);
}

// ─── Citation Validations ─────────────────────────────────────────────────────

export async function insertCitationValidations(
  runId: string,
  claims: ValidatedClaim[]
): Promise<void> {
  const client = getClient();
  if (!client || claims.length === 0) return;

  const rows = claims.map((c) => ({
    run_id: runId,
    claim: c.claim,
    citation_id: c.citationId ?? null,
    support_status: c.supportStatus,
    support_score: c.supportScore,
    explanation: c.explanation,
  }));

  const { error } = await client.from("citation_validations").insert(rows);
  if (error) console.warn("[DB] insertCitationValidations failed:", error.message);
}

// ─── Eval Reports ─────────────────────────────────────────────────────────────

export async function insertEvalReport(runId: string, report: EvalReport): Promise<void> {
  const client = getClient();
  if (!client) return;

  const { error } = await client.from("eval_reports").insert({
    run_id: runId,
    groundedness_score: report.groundednessScore,
    citation_accuracy_score: report.citationAccuracyScore,
    retrieval_coverage_score: report.retrievalCoverage,
    hallucination_risk_score: report.hallucinationRiskScore,
    final_reliability_score: report.overallReliability,
    pass_fail_status: report.passFail,
    payload: report,
  });
  if (error) console.warn("[DB] insertEvalReport failed:", error.message);
}

// ─── Reads ────────────────────────────────────────────────────────────────────

export async function getRecentRuns(limit = 20): Promise<RunSummary[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from("orchestration_runs")
    .select("id, query, status, model, confidence, hallucination_risk, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[DB] getRecentRuns failed:", error.message);
    return [];
  }
  return (data ?? []) as RunSummary[];
}

export async function getRunById(id: string): Promise<RunDetail | null> {
  const client = getClient();
  if (!client) return null;

  const [runRes, tracesRes, retrievalRes, citationsRes, evalRes] = await Promise.all([
    client
      .from("orchestration_runs")
      .select("id, query, status, model, confidence, hallucination_risk, created_at")
      .eq("id", id)
      .single(),
    client
      .from("agent_traces")
      .select("id, step_index, agent_name, input_summary, output_summary, status, risk_flag, payload, created_at")
      .eq("run_id", id)
      .order("step_index"),
    client
      .from("retrieval_results")
      .select("id, citation_id, final_score, reason, created_at")
      .eq("run_id", id),
    client
      .from("citation_validations")
      .select("id, claim, citation_id, support_status, support_score, explanation, created_at")
      .eq("run_id", id),
    client
      .from("eval_reports")
      .select("id, groundedness_score, citation_accuracy_score, retrieval_coverage_score, hallucination_risk_score, final_reliability_score, pass_fail_status, payload, created_at")
      .eq("run_id", id)
      .single(),
  ]);

  if (runRes.error || !runRes.data) return null;

  return {
    run: runRes.data as RunSummary,
    traces: (tracesRes.data ?? []) as AgentTraceRecord[],
    retrievalResults: (retrievalRes.data ?? []) as RetrievalResultRecord[],
    citationValidations: (citationsRes.data ?? []) as CitationValidationRecord[],
    evalReport: evalRes.data ? (evalRes.data as EvalReportRecord) : null,
  };
}

// ─── Corpus Search ────────────────────────────────────────────────────────────

// Phase 2: vector similarity search via pgvector RPC
export async function vectorSearchLegalChunks(
  queryEmbedding: number[],
  matchCount: number = 8
): Promise<LegalChunkWithSimilarity[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client.rpc("match_legal_chunks", {
    query_embedding: queryEmbedding,
    match_count: matchCount,
  });

  if (error) {
    console.warn("[DB] vectorSearchLegalChunks RPC failed:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    document_id: row.document_id as string,
    citation_id: row.citation_id as string,
    chunk_text: row.chunk_text as string,
    keywords: (row.keywords as string[]) ?? [],
    jurisdiction: row.jurisdiction as string | null,
    practice_area: row.practice_area as string | null,
    similarity: row.similarity as number,
  }));
}

export async function searchLegalChunksFromDB(keyTerms: string[]): Promise<LegalChunkFromDB[]> {
  const client = getClient();
  if (!client || keyTerms.length === 0) return [];

  const { data, error } = await client
    .from("document_chunks")
    .select("id, document_id, citation_id, chunk_text, keywords, jurisdiction, practice_area, source_type, authority_weight, documents(title, disclaimer)")
    .limit(300);

  if (error) {
    console.warn("[DB] searchLegalChunksFromDB failed:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    document_id: row.document_id as string,
    citation_id: row.citation_id as string,
    chunk_text: row.chunk_text as string,
    keywords: (row.keywords as string[]) ?? [],
    jurisdiction: row.jurisdiction as string | null,
    practice_area: row.practice_area as string | null,
    source_type: row.source_type as string ?? "sample",
    authority_weight: row.authority_weight as number ?? 1.0,
    document_title: (row.documents as Record<string, string> | null)?.title,
    disclaimer: (row.documents as Record<string, string> | null)?.disclaimer,
  }));
}

// ─── Documents ────────────────────────────────────────────────────────────────

export interface CreateDocumentData {
  title: string;
  source_type: "primary" | "secondary" | "user_upload" | "sample";
  jurisdiction?: string;
  practice_area?: string;
  original_filename?: string;
  file_size_bytes?: number;
  mime_type?: string;
  storage_path?: string;
  authority_level?: number;
  citation_prefix?: string;
  disclaimer?: string;
}

export async function createDocument(data: CreateDocumentData): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const { data: row, error } = await client
    .from("documents")
    .insert({
      ...data,
      status: data.storage_path ? "pending" : "indexed",
      authority_level: data.authority_level ?? 5,
    })
    .select("id")
    .single();

  if (error || !row) {
    console.warn("[DB] createDocument failed:", error?.message);
    return null;
  }
  return row.id as string;
}

export async function updateDocumentStatus(
  id: string,
  status: DocumentRecord["status"],
  extra: { error_message?: string; chunk_count?: number } = {}
): Promise<void> {
  const client = getClient();
  if (!client) return;

  const { error } = await client
    .from("documents")
    .update({ status, updated_at: new Date().toISOString(), ...extra })
    .eq("id", id);
  if (error) console.warn("[DB] updateDocumentStatus failed:", error.message);
}

export async function getDocuments(limit = 50): Promise<DocumentRecord[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[DB] getDocuments failed:", error.message);
    return [];
  }
  return (data ?? []) as DocumentRecord[];
}

export { DB_AVAILABLE };
