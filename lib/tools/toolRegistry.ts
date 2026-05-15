// MCP-inspired tool registry - each tool has a name, description, schema, and execute fn.
// Orchestrator calls all side-effectful operations through this registry for clean separation
// and future MCP migration.

import type {
  RetrievedSource,
  CitationValidationResult,
  HallucinationRiskResult,
  IntakeResult,
} from "@/lib/types";
import { searchLegalCorpus } from "@/lib/retrieval/searchLegalCorpus";
import { runCitationValidator } from "@/lib/agents/citationValidator";
import { runHallucinationRiskAgent } from "@/lib/agents/hallucinationRiskAgent";
import { insertAgentTrace } from "@/lib/db/supabaseServer";
import type { AdversarialReviewResult } from "@/lib/types";

// ─── Tool definitions ─────────────────────────────────────────────────────────

interface Tool<TInput, TOutput> {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  execute: (input: TInput) => Promise<TOutput>;
}

interface SearchInput {
  query: string;
  keyTerms: string[];
  legalIssue: string;
  jurisdiction?: string;
  practiceArea?: string;
}

interface ValidateInput {
  intake: IntakeResult;
  sources: RetrievedSource[];
}

interface ScoreRiskInput {
  citationValidation: CitationValidationResult;
  sources: RetrievedSource[];
  adversarialReview: AdversarialReviewResult;
}

interface PersistTraceInput {
  runId: string;
  stepIndex: number;
  agentName: string;
  inputSummary?: string;
  outputSummary?: string;
  riskFlag?: string;
  payload: Record<string, unknown>;
}

const searchLegalCorpusTool: Tool<SearchInput, RetrievedSource[]> = {
  name: "searchLegalCorpus",
  description: "Hybrid RAG retrieval - pgvector cosine similarity + keyword overlap scoring. Falls back to keyword-only or in-memory if embeddings unavailable.",
  inputSchema: {
    query: { type: "string" },
    keyTerms: { type: "array", items: { type: "string" } },
    legalIssue: { type: "string" },
    jurisdiction: { type: "string" },
    practiceArea: { type: "string" },
  },
  execute: async (input) => searchLegalCorpus(input),
};

const validateCitationSupportTool: Tool<ValidateInput, CitationValidationResult> = {
  name: "validateCitationSupport",
  description: "Validates each legal claim against retrieved sources and scores citation support.",
  inputSchema: {
    intake: { type: "object" },
    sources: { type: "array" },
  },
  execute: async ({ intake, sources }) => runCitationValidator(intake, sources),
};

const scoreHallucinationRiskTool: Tool<ScoreRiskInput, HallucinationRiskResult> = {
  name: "scoreHallucinationRisk",
  description: "Computes a numeric hallucination risk score based on unsupported claims, retrieval coverage, and adversarial risk.",
  inputSchema: {
    citationValidation: { type: "object" },
    sources: { type: "array" },
    adversarialReview: { type: "object" },
  },
  execute: async ({ citationValidation, sources, adversarialReview }) =>
    runHallucinationRiskAgent(citationValidation, sources, adversarialReview),
};

const persistRunTraceTool: Tool<PersistTraceInput, void> = {
  name: "persistRunTrace",
  description: "Persists an agent trace record to the database for this orchestration run.",
  inputSchema: {
    runId: { type: "string" },
    stepIndex: { type: "number" },
    agentName: { type: "string" },
    payload: { type: "object" },
  },
  execute: async ({ runId, stepIndex, agentName, inputSummary, outputSummary, riskFlag, payload }) => {
    await insertAgentTrace(runId, stepIndex, agentName, {
      inputSummary,
      outputSummary,
      riskFlag,
      payload,
    });
  },
};

// ─── Registry ─────────────────────────────────────────────────────────────────

type AnyTool = Tool<unknown, unknown>;

const registry: Record<string, AnyTool> = {
  searchLegalCorpus: searchLegalCorpusTool as AnyTool,
  validateCitationSupport: validateCitationSupportTool as AnyTool,
  scoreHallucinationRisk: scoreHallucinationRiskTool as AnyTool,
  persistRunTrace: persistRunTraceTool as AnyTool,
};

export async function callTool<TInput, TOutput>(name: string, input: TInput): Promise<TOutput> {
  const tool = registry[name];
  if (!tool) throw new Error(`Tool "${name}" not found in registry.`);
  return tool.execute(input as unknown) as Promise<TOutput>;
}

export function listTools(): { name: string; description: string }[] {
  return Object.values(registry).map((t) => ({ name: t.name, description: t.description }));
}
