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

// ─── Legal Opinion Search (Phase 2) ──────────────────────────────────────────

export interface OpinionChunkRow {
  id: string;
  opinion_id: string;
  chunk_index: number;
  chunk_text: string;
  citation: string | null;
  court: string | null;
  jurisdiction: string | null;
  decision_date: string | null;
  page_start: number | null;
  page_end: number | null;
  span_start: number | null;
  span_end: number | null;
  case_name: string;
  metadata: Record<string, unknown>;
  similarity?: number;
  rank?: number;
}

export async function vectorSearchOpinionChunks(
  queryEmbedding: number[],
  matchCount: number = 20,
  filters?: {
    jurisdiction?: string;
    court?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<OpinionChunkRow[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client.rpc("match_legal_opinion_chunks", {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    filter_jurisdiction: filters?.jurisdiction ?? null,
    filter_court: filters?.court ?? null,
    filter_date_from: filters?.dateFrom ?? null,
    filter_date_to: filters?.dateTo ?? null,
  });

  if (error) {
    console.warn("[DB] vectorSearchOpinionChunks RPC failed:", error.message);
    return [];
  }

  return (data ?? []) as OpinionChunkRow[];
}

export async function fulltextSearchOpinionChunks(
  searchQuery: string,
  matchCount: number = 20,
  filters?: {
    jurisdiction?: string;
    court?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<OpinionChunkRow[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client.rpc("search_legal_opinion_chunks_fulltext", {
    search_query: searchQuery,
    match_count: matchCount,
    filter_jurisdiction: filters?.jurisdiction ?? null,
    filter_court: filters?.court ?? null,
    filter_date_from: filters?.dateFrom ?? null,
    filter_date_to: filters?.dateTo ?? null,
  });

  if (error) {
    console.warn("[DB] fulltextSearchOpinionChunks RPC failed:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    rank: row.rank as number,
  })) as OpinionChunkRow[];
}

export async function directSearchOpinionChunks(
  matchCount: number = 20,
  filters?: {
    jurisdiction?: string;
    court?: string;
  }
): Promise<OpinionChunkRow[]> {
  const client = getClient();
  if (!client) return [];

  let query = client
    .from("legal_opinion_chunks")
    .select("id, opinion_id, chunk_index, chunk_text, citation, court, jurisdiction, decision_date, page_start, page_end, span_start, span_end, metadata, legal_opinions(case_name)")
    .limit(matchCount);

  if (filters?.jurisdiction) {
    query = query.ilike("jurisdiction", `%${filters.jurisdiction}%`);
  }
  if (filters?.court) {
    query = query.ilike("court", `%${filters.court}%`);
  }

  const { data, error } = await query;

  if (error) {
    console.warn("[DB] directSearchOpinionChunks failed:", error.message);
    return [];
  }

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    opinion_id: row.opinion_id as string,
    chunk_index: row.chunk_index as number,
    chunk_text: row.chunk_text as string,
    citation: row.citation as string | null,
    court: row.court as string | null,
    jurisdiction: row.jurisdiction as string | null,
    decision_date: row.decision_date as string | null,
    page_start: row.page_start as number | null,
    page_end: row.page_end as number | null,
    span_start: row.span_start as number | null,
    span_end: row.span_end as number | null,
    case_name: (row.legal_opinions as Record<string, string> | null)?.case_name ?? "Unknown",
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  }));
}

// ─── Citation Verification DB Helpers (Phase 3) ──────────────────────────────

export interface OpinionRow {
  id: string;
  case_name: string;
  citation: string | null;
  court: string | null;
  jurisdiction: string | null;
  decision_date: string | null;
  raw_text: string | null;
}

export interface OpinionChunkForVerification {
  id: string;
  chunk_index: number;
  chunk_text: string;
  page_start: number | null;
  page_end: number | null;
}

export interface CitationEdgeRow {
  id: string;
  from_opinion_id: string;
  to_opinion_id: string;
  treatment: string | null;
  cited_citation: string | null;
  citation_context: string | null;
}

export async function searchOpinionByCitation(citation: string): Promise<OpinionRow[]> {
  const client = getClient();
  if (!client) return [];

  // Try exact match first
  const { data: exact, error: exactErr } = await client
    .from("legal_opinions")
    .select("id, case_name, citation, court, jurisdiction, decision_date, raw_text")
    .eq("citation", citation)
    .limit(5);

  if (exactErr) {
    console.warn("[DB] searchOpinionByCitation exact failed:", exactErr.message);
  }

  if (exact && exact.length > 0) {
    return exact as OpinionRow[];
  }

  // Fallback: ilike partial match
  const { data: partial, error: partialErr } = await client
    .from("legal_opinions")
    .select("id, case_name, citation, court, jurisdiction, decision_date, raw_text")
    .ilike("citation", `%${citation}%`)
    .limit(5);

  if (partialErr) {
    console.warn("[DB] searchOpinionByCitation partial failed:", partialErr.message);
    return [];
  }

  return (partial ?? []) as OpinionRow[];
}

export async function getOpinionChunksByOpinionId(
  opinionId: string
): Promise<OpinionChunkForVerification[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from("legal_opinion_chunks")
    .select("id, chunk_index, chunk_text, page_start, page_end")
    .eq("opinion_id", opinionId)
    .order("chunk_index");

  if (error) {
    console.warn("[DB] getOpinionChunksByOpinionId failed:", error.message);
    return [];
  }

  return (data ?? []) as OpinionChunkForVerification[];
}

export async function getCitationEdgesByOpinionId(
  opinionId: string
): Promise<CitationEdgeRow[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from("legal_citation_edges")
    .select("id, from_opinion_id, to_opinion_id, treatment, cited_citation, citation_context")
    .or(`from_opinion_id.eq.${opinionId},to_opinion_id.eq.${opinionId}`)
    .limit(50);

  if (error) {
    console.warn("[DB] getCitationEdgesByOpinionId failed:", error.message);
    return [];
  }

  return (data ?? []) as CitationEdgeRow[];
}

// ─── Litigation Workflow (Phase 4) ───────────────────────────────────────────

export async function insertLitigationWorkflowRun(data: {
  workflowType: string;
  jurisdiction?: string;
  court?: string;
  judgeId?: string;
  motionType?: string;
  inputSummary?: string;
  userId?: string;
  organizationId?: string;
  matterId?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const client = getClient();
  if (!client) return crypto.randomUUID();

  const { data: row, error } = await client
    .from("litigation_workflow_runs")
    .insert({
      workflow_type: data.workflowType,
      status: "running",
      jurisdiction: data.jurisdiction ?? null,
      court: data.court ?? null,
      judge_id: data.judgeId ?? null,
      motion_type: data.motionType ?? null,
      input_summary: data.inputSummary ?? null,
      user_id: data.userId ?? null,
      organization_id: data.organizationId ?? null,
      matter_id: data.matterId ?? null,
      metadata: data.metadata ?? {},
    })
    .select("id")
    .single();

  if (error || !row) {
    console.warn("[DB] insertLitigationWorkflowRun failed:", error?.message);
    return crypto.randomUUID();
  }
  return row.id as string;
}

export async function updateLitigationWorkflowRun(
  id: string,
  data: {
    status: string;
    finalOutput?: string;
    confidence?: number;
    faithfulnessScore?: number;
    citationPassRate?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  const client = getClient();
  if (!client) return;

  const { error } = await client
    .from("litigation_workflow_runs")
    .update({
      status: data.status,
      final_output: data.finalOutput ?? null,
      confidence: data.confidence ?? null,
      faithfulness_score: data.faithfulnessScore ?? null,
      citation_pass_rate: data.citationPassRate ?? null,
      ...(data.metadata ? { metadata: data.metadata } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) console.warn("[DB] updateLitigationWorkflowRun failed:", error.message);
}

export async function insertLitigationAgentEvent(data: {
  workflowRunId: string;
  agentName: string;
  eventType: string;
  eventStatus?: string;
  message?: string;
  toolName?: string;
  toolInput?: Record<string, unknown>;
  toolOutput?: Record<string, unknown>;
  latencyMs?: number;
  tokenCount?: number;
  costUsd?: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const client = getClient();
  if (!client) return;

  const { error } = await client.from("litigation_agent_events").insert({
    workflow_run_id: data.workflowRunId,
    agent_name: data.agentName,
    event_type: data.eventType,
    event_status: data.eventStatus ?? null,
    message: data.message ?? null,
    tool_name: data.toolName ?? null,
    tool_input: data.toolInput ?? {},
    tool_output: data.toolOutput ?? {},
    latency_ms: data.latencyMs ?? null,
    token_count: data.tokenCount ?? null,
    cost_usd: data.costUsd ?? null,
    metadata: data.metadata ?? {},
  });

  if (error) console.warn("[DB] insertLitigationAgentEvent failed:", error.message);
}

export async function insertDraftArtifactRecord(data: {
  workflowRunId: string;
  artifactType: string;
  title?: string;
  content: string;
  citations?: Record<string, unknown>[];
  createdByAgent?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const client = getClient();
  if (!client) return crypto.randomUUID();

  const insertPayload = (artifactType: string, metadata: Record<string, unknown>) => ({
    workflow_run_id: data.workflowRunId,
    artifact_type: artifactType,
    title: data.title ?? null,
    content: data.content,
    citations: data.citations ?? [],
    verification_status: "pending",
    version: 1,
    created_by_agent: data.createdByAgent ?? null,
    metadata,
  });

  const { data: row, error } = await client
    .from("draft_artifacts")
    .insert(insertPayload(data.artifactType, data.metadata ?? {}))
    .select("id")
    .single();

  if (error || !row) {
    const canFallbackToMemo =
      error?.code === "23514" &&
      ["judge_brief", "local_rules_check", "workflow_eval"].includes(data.artifactType);

    if (canFallbackToMemo) {
      const fallbackMetadata = {
        ...(data.metadata ?? {}),
        originalArtifactType: data.artifactType,
        persistenceFallback: "memo_artifact_type",
      };
      const { data: fallbackRow, error: fallbackError } = await client
        .from("draft_artifacts")
        .insert(insertPayload("memo", fallbackMetadata))
        .select("id")
        .single();

      if (!fallbackError && fallbackRow) {
        console.warn(
          `[DB] insertDraftArtifactRecord used memo fallback for ${data.artifactType}; apply migration 006 to update the check constraint.`
        );
        return fallbackRow.id as string;
      }
    }

    console.warn("[DB] insertDraftArtifactRecord failed:", error?.message);
    return crypto.randomUUID();
  }
  return row.id as string;
}

export interface JudgeProfileRow {
  judgeId: string;
  judgeName: string;
  court: string | null;
  jurisdiction: string | null;
  styleNotes: string | null;
  argumentGuidance: string | null;
  sourceOpinionCount: number;
  motionType: string | null;
}

export async function getJudgeProfileByJudgeId(
  judgeId: string
): Promise<JudgeProfileRow | null> {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client
    .from("judge_profiles")
    .select("judge_id, style_notes, argument_guidance, source_opinion_count, motion_type, jurisdiction, legal_judges(full_name, court, jurisdiction)")
    .eq("judge_id", judgeId)
    .limit(1)
    .single();

  if (error || !data) return null;

  const row = data as Record<string, unknown>;
  const judge = row.legal_judges as Record<string, string> | null;

  return {
    judgeId: row.judge_id as string,
    judgeName: judge?.full_name ?? "Unknown",
    court: (judge?.court as string | null) ?? null,
    jurisdiction: (row.jurisdiction as string | null) ?? null,
    styleNotes: (row.style_notes as string | null) ?? null,
    argumentGuidance: (row.argument_guidance as string | null) ?? null,
    sourceOpinionCount: (row.source_opinion_count as number) ?? 0,
    motionType: (row.motion_type as string | null) ?? null,
  };
}

export async function getJudgeByName(
  judgeName: string
): Promise<{ id: string; full_name: string; court: string | null; jurisdiction: string | null } | null> {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client
    .from("legal_judges")
    .select("id, full_name, court, jurisdiction")
    .ilike("full_name", `%${judgeName}%`)
    .limit(1)
    .single();

  if (error || !data) return null;

  return data as { id: string; full_name: string; court: string | null; jurisdiction: string | null };
}

// ─── Litigation Workflow Reads (Phase 5) ─────────────────────────────────────

export interface WorkflowRunRow {
  id: string;
  workflow_type: string;
  status: string;
  jurisdiction: string | null;
  court: string | null;
  motion_type: string | null;
  input_summary: string | null;
  final_output: string | null;
  confidence: number | null;
  faithfulness_score: number | null;
  citation_pass_rate: number | null;
  matter_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowEventRow {
  id: string;
  workflow_run_id: string;
  agent_name: string;
  event_type: string;
  event_status: string | null;
  message: string | null;
  tool_name: string | null;
  latency_ms: number | null;
  token_count: number | null;
  cost_usd: number | null;
  created_at: string;
}

export interface WorkflowEventDetailRow extends WorkflowEventRow {
  tool_input: Record<string, unknown> | null;
  tool_output: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
}

export interface WorkflowArtifactRow {
  id: string;
  workflow_run_id: string;
  artifact_type: string;
  title: string | null;
  content: string;
  citations: Record<string, unknown>[];
  verification_status: string | null;
  created_by_agent: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
  version?: number;
}

export interface WorkflowCitationReportRow {
  id: string;
  workflow_run_id: string;
  citation_text: string;
  normalized_citation: string | null;
  overall_status: string;
  existence_status: string | null;
  quote_status: string | null;
  pin_cite_status: string | null;
  proposition_status: string | null;
  treatment_status: string | null;
  created_at: string;
}

export async function listLitigationWorkflowRuns(limit = 50): Promise<WorkflowRunRow[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from("litigation_workflow_runs")
    .select("id, workflow_type, status, jurisdiction, court, motion_type, input_summary, confidence, faithfulness_score, citation_pass_rate, matter_id, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[DB] listLitigationWorkflowRuns failed:", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({ ...row, final_output: null })) as WorkflowRunRow[];
}

export async function getLitigationWorkflowRun(id: string): Promise<WorkflowRunRow | null> {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client
    .from("litigation_workflow_runs")
    .select("id, workflow_type, status, jurisdiction, court, motion_type, input_summary, final_output, confidence, faithfulness_score, citation_pass_rate, matter_id, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as WorkflowRunRow;
}

export async function getLitigationWorkflowEvents(
  workflowRunId: string
): Promise<WorkflowEventRow[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from("litigation_agent_events")
    .select("id, workflow_run_id, agent_name, event_type, event_status, message, tool_name, latency_ms, token_count, cost_usd, created_at")
    .eq("workflow_run_id", workflowRunId)
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("[DB] getLitigationWorkflowEvents failed:", error.message);
    return [];
  }
  return (data ?? []) as WorkflowEventRow[];
}

export async function getLitigationWorkflowEventsWithDetails(
  workflowRunId: string
): Promise<WorkflowEventDetailRow[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from("litigation_agent_events")
    .select("id, workflow_run_id, agent_name, event_type, event_status, message, tool_name, latency_ms, token_count, cost_usd, tool_input, tool_output, metadata, created_at")
    .eq("workflow_run_id", workflowRunId)
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("[DB] getLitigationWorkflowEventsWithDetails failed:", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    ...row,
    tool_input: (row.tool_input as Record<string, unknown>) ?? null,
    tool_output: (row.tool_output as Record<string, unknown>) ?? null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  })) as WorkflowEventDetailRow[];
}

export async function getLitigationWorkflowEventsBatch(
  workflowRunIds: string[]
): Promise<WorkflowEventRow[]> {
  if (workflowRunIds.length === 0) return [];
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from("litigation_agent_events")
    .select("id, workflow_run_id, agent_name, event_type, event_status, message, tool_name, latency_ms, token_count, cost_usd, created_at")
    .in("workflow_run_id", workflowRunIds)
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("[DB] getLitigationWorkflowEventsBatch failed:", error.message);
    return [];
  }
  return (data ?? []) as WorkflowEventRow[];
}

export async function getLitigationWorkflowArtifacts(
  workflowRunId: string
): Promise<WorkflowArtifactRow[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from("draft_artifacts")
    .select("id, workflow_run_id, artifact_type, title, content, citations, verification_status, created_by_agent, created_at, metadata, version")
    .eq("workflow_run_id", workflowRunId)
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("[DB] getLitigationWorkflowArtifacts failed:", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    ...row,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  })) as WorkflowArtifactRow[];
}

export async function getLitigationWorkflowCitationReports(
  workflowRunId: string
): Promise<WorkflowCitationReportRow[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from("citation_verification_reports")
    .select("id, workflow_run_id, citation_text, normalized_citation, overall_status, existence_status, quote_status, pin_cite_status, proposition_status, treatment_status, created_at")
    .eq("workflow_run_id", workflowRunId)
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("[DB] getLitigationWorkflowCitationReports failed:", error.message);
    return [];
  }
  return (data ?? []) as WorkflowCitationReportRow[];
}

// ─── Judge Helpers (Phase 7) ──────────────────────────────────────────────────

export interface JudgeRow {
  id: string;
  external_id: string | null;
  full_name: string;
  court: string | null;
  jurisdiction: string | null;
  biography: string | null;
}

export async function searchJudgesByName(
  term: string,
  limit = 5
): Promise<JudgeRow[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from("legal_judges")
    .select("id, external_id, full_name, court, jurisdiction, biography")
    .ilike("full_name", `%${term}%`)
    .limit(limit);

  if (error) {
    console.warn("[DB] searchJudgesByName failed:", error.message);
    return [];
  }
  return (data ?? []) as JudgeRow[];
}

export async function getJudgeById(id: string): Promise<JudgeRow | null> {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client
    .from("legal_judges")
    .select("id, external_id, full_name, court, jurisdiction, biography")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return data as JudgeRow;
}

export async function getJudgeProfileWithFallback(
  judgeId: string,
  motionType?: string
): Promise<JudgeProfileRow | null> {
  const client = getClient();
  if (!client) return null;

  const buildRow = (data: Record<string, unknown>): JudgeProfileRow => {
    const judge = data.legal_judges as Record<string, string> | null;
    return {
      judgeId: data.judge_id as string,
      judgeName: judge?.full_name ?? "Unknown",
      court: (judge?.court as string | null) ?? null,
      jurisdiction: (data.jurisdiction as string | null) ?? null,
      styleNotes: (data.style_notes as string | null) ?? null,
      argumentGuidance: (data.argument_guidance as string | null) ?? null,
      sourceOpinionCount: (data.source_opinion_count as number) ?? 0,
      motionType: (data.motion_type as string | null) ?? null,
    };
  };

  const selectCols = "judge_id, style_notes, argument_guidance, source_opinion_count, motion_type, jurisdiction, legal_judges(full_name, court, jurisdiction)";

  // Prefer exact motion_type match
  if (motionType) {
    const { data: exact } = await client
      .from("judge_profiles")
      .select(selectCols)
      .eq("judge_id", judgeId)
      .eq("motion_type", motionType)
      .limit(1)
      .single();
    if (exact) return buildRow(exact as Record<string, unknown>);
  }

  // Fallback: any profile for this judge
  const { data: any, error } = await client
    .from("judge_profiles")
    .select(selectCols)
    .eq("judge_id", judgeId)
    .order("source_opinion_count", { ascending: false })
    .limit(1)
    .single();

  if (error || !any) return null;
  return buildRow(any as Record<string, unknown>);
}

export async function insertJudgeProfile(data: {
  judgeId: string;
  profileVersion?: string;
  motionType?: string;
  jurisdiction?: string;
  styleNotes?: string;
  argumentGuidance?: string;
  sourceOpinionCount?: number;
  generatedBy?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const client = getClient();
  if (!client) return;

  const { error } = await client.from("judge_profiles").insert({
    judge_id: data.judgeId,
    profile_version: data.profileVersion ?? "v1",
    motion_type: data.motionType ?? null,
    jurisdiction: data.jurisdiction ?? null,
    style_notes: data.styleNotes ?? null,
    argument_guidance: data.argumentGuidance ?? null,
    source_opinion_count: data.sourceOpinionCount ?? 0,
    generated_by: data.generatedBy ?? "litigation-workflow",
    grant_rate_summary: {},
    citation_preferences: {},
    metadata: data.metadata ?? {},
  });

  if (error) console.warn("[DB] insertJudgeProfile failed:", error.message);
}

// ─── Case file uploads (Phase 13) ─────────────────────────────────────────────

export async function insertCaseFileUploadRecord(data: {
  workflowRunId?: string;
  matterId?: string;
  fileName: string;
  fileType?: string;
  fileSizeBytes?: number;
  documentRole: string;
  status: string;
  extractedText: string | null;
  extractionError: string | null;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const id = crypto.randomUUID();
  const client = getClient();
  if (!client) return id;

  const { error } = await client.from("case_file_uploads").insert({
    id,
    workflow_run_id: data.workflowRunId ?? null,
    matter_id: data.matterId ?? null,
    file_name: data.fileName,
    file_type: data.fileType ?? null,
    file_size_bytes: data.fileSizeBytes ?? null,
    document_role: data.documentRole,
    status: data.status,
    extracted_text: data.extractedText,
    extraction_error: data.extractionError,
    metadata: data.metadata ?? {},
  });

  if (error) console.warn("[DB] insertCaseFileUploadRecord failed:", error.message);
  return id;
}

// ─── Draft revision tracking (Phase 16) ───────────────────────────────────────

export interface DraftRevisionRow {
  id: string;
  workflowRunId: string;
  draftArtifactId: string | null;
  version: number;
  content: string;
  editSummary: string | null;
  verificationStatus: string | null;
  citationSummary: Record<string, unknown>;
  createdBy: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

export async function updateDraftArtifactContent(
  artifactId: string,
  content: string,
  newVersion: number
): Promise<void> {
  const client = getClient();
  if (!client) return;

  const { error } = await client
    .from("draft_artifacts")
    .update({ content, version: newVersion })
    .eq("id", artifactId);

  if (error) console.warn("[DB] updateDraftArtifactContent failed:", error.message);
}

export async function updateDraftArtifactVerification(
  artifactId: string,
  verificationStatus: string,
  citationSummary: Record<string, unknown>
): Promise<void> {
  const client = getClient();
  if (!client) return;

  const { error } = await client
    .from("draft_artifacts")
    .update({ verification_status: verificationStatus, metadata: { citationSummary } })
    .eq("id", artifactId);

  if (error) console.warn("[DB] updateDraftArtifactVerification failed:", error.message);
}

export async function insertDraftRevisionRecord(data: {
  workflowRunId: string;
  draftArtifactId: string;
  version: number;
  content: string;
  editSummary?: string;
  verificationStatus?: string;
  citationSummary?: Record<string, unknown>;
  createdBy?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const id = crypto.randomUUID();
  const client = getClient();
  if (!client) return id;

  const { error } = await client.from("draft_revisions").insert({
    id,
    workflow_run_id: data.workflowRunId,
    draft_artifact_id: data.draftArtifactId,
    version: data.version,
    content: data.content,
    edit_summary: data.editSummary ?? null,
    verification_status: data.verificationStatus ?? null,
    citation_summary: data.citationSummary ?? {},
    created_by: data.createdBy ?? "user",
    metadata: data.metadata ?? {},
  });

  if (error) console.warn("[DB] insertDraftRevisionRecord failed:", error.message);
  return id;
}

export async function getDraftRevisionsByArtifactId(
  artifactId: string,
  limit = 50
): Promise<DraftRevisionRow[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from("draft_revisions")
    .select(
      "id, workflow_run_id, draft_artifact_id, version, content, edit_summary, verification_status, citation_summary, created_by, created_at, metadata"
    )
    .eq("draft_artifact_id", artifactId)
    .order("version", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[DB] getDraftRevisionsByArtifactId failed:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    workflowRunId: row.workflow_run_id as string,
    draftArtifactId: row.draft_artifact_id as string | null,
    version: row.version as number,
    content: row.content as string,
    editSummary: row.edit_summary as string | null,
    verificationStatus: row.verification_status as string | null,
    citationSummary: (row.citation_summary as Record<string, unknown>) ?? {},
    createdBy: (row.created_by as string) ?? "user",
    createdAt: row.created_at as string,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  }));
}

// ─── Matters (Phase 20) ───────────────────────────────────────────────────────

export interface MatterRow {
  id: string;
  organization_id: string | null;
  user_id: string | null;
  title: string;
  client_name: string | null;
  matter_type: string | null;
  jurisdiction: string | null;
  court: string | null;
  judge_id: string | null;
  status: string;
  description: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MatterFileRow {
  id: string;
  matter_id: string;
  case_file_upload_id: string | null;
  title: string;
  file_role: string;
  extracted_text_preview: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export async function insertMatterRecord(data: {
  organizationId?: string;
  userId?: string;
  title: string;
  clientName?: string;
  matterType?: string;
  jurisdiction?: string;
  court?: string;
  judgeId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const id = crypto.randomUUID();
  const client = getClient();
  if (!client) return id;

  const { error } = await client.from("matters").insert({
    id,
    organization_id: data.organizationId ?? null,
    user_id: data.userId ?? null,
    title: data.title,
    client_name: data.clientName ?? null,
    matter_type: data.matterType ?? null,
    jurisdiction: data.jurisdiction ?? null,
    court: data.court ?? null,
    judge_id: data.judgeId ?? null,
    description: data.description ?? null,
    metadata: data.metadata ?? {},
  });

  if (error) console.warn("[DB] insertMatterRecord failed:", error.message);
  return id;
}

export async function updateMatterRecord(
  id: string,
  data: Partial<{
    title: string;
    clientName: string;
    matterType: string;
    jurisdiction: string;
    court: string;
    status: string;
    description: string;
    metadata: Record<string, unknown>;
  }>
): Promise<void> {
  const client = getClient();
  if (!client) return;

  const patch: Record<string, unknown> = {};
  if (data.title !== undefined) patch.title = data.title;
  if (data.clientName !== undefined) patch.client_name = data.clientName;
  if (data.matterType !== undefined) patch.matter_type = data.matterType;
  if (data.jurisdiction !== undefined) patch.jurisdiction = data.jurisdiction;
  if (data.court !== undefined) patch.court = data.court;
  if (data.status !== undefined) patch.status = data.status;
  if (data.description !== undefined) patch.description = data.description;
  if (data.metadata !== undefined) patch.metadata = data.metadata;

  const { error } = await client.from("matters").update(patch).eq("id", id);
  if (error) console.warn("[DB] updateMatterRecord failed:", error.message);
}

export async function getMatterById(id: string): Promise<MatterRow | null> {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client
    .from("matters")
    .select("id, organization_id, user_id, title, client_name, matter_type, jurisdiction, court, judge_id, status, description, metadata, created_at, updated_at")
    .eq("id", id)
    .single();

  if (error || !data) return null;
  return { ...data, metadata: (data.metadata as Record<string, unknown>) ?? {} } as MatterRow;
}

export async function listMatterRecords(limit = 50): Promise<MatterRow[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from("matters")
    .select("id, organization_id, user_id, title, client_name, matter_type, jurisdiction, court, judge_id, status, description, metadata, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.warn("[DB] listMatterRecords failed:", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    ...row,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  })) as MatterRow[];
}

export async function getMatterWorkflowRuns(matterId: string): Promise<WorkflowRunRow[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from("litigation_workflow_runs")
    .select("id, workflow_type, status, jurisdiction, court, motion_type, input_summary, final_output, confidence, faithfulness_score, citation_pass_rate, matter_id, created_at, updated_at")
    .eq("matter_id", matterId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[DB] getMatterWorkflowRuns failed:", error.message);
    return [];
  }
  return (data ?? []) as WorkflowRunRow[];
}

export async function getMatterFiles(matterId: string): Promise<MatterFileRow[]> {
  const client = getClient();
  if (!client) return [];

  const { data, error } = await client
    .from("matter_files")
    .select("id, matter_id, case_file_upload_id, title, file_role, extracted_text_preview, metadata, created_at")
    .eq("matter_id", matterId)
    .order("created_at", { ascending: false });

  if (error) {
    console.warn("[DB] getMatterFiles failed:", error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    ...row,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
  })) as MatterFileRow[];
}

export async function insertMatterFile(data: {
  matterId: string;
  caseFileUploadId?: string;
  title: string;
  fileRole?: string;
  extractedTextPreview?: string;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const id = crypto.randomUUID();
  const client = getClient();
  if (!client) return id;

  const { error } = await client.from("matter_files").insert({
    id,
    matter_id: data.matterId,
    case_file_upload_id: data.caseFileUploadId ?? null,
    title: data.title,
    file_role: data.fileRole ?? "case_file",
    extracted_text_preview: data.extractedTextPreview ?? null,
    metadata: data.metadata ?? {},
  });

  if (error) console.warn("[DB] insertMatterFile failed:", error.message);
  return id;
}

export async function linkWorkflowRunToMatter(
  workflowRunId: string,
  matterId: string
): Promise<void> {
  const client = getClient();
  if (!client) return;

  const { error } = await client
    .from("litigation_workflow_runs")
    .update({ matter_id: matterId })
    .eq("id", workflowRunId);

  if (error) console.warn("[DB] linkWorkflowRunToMatter failed:", error.message);
}
