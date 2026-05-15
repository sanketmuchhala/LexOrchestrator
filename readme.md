# LexOrchestrator

**Multi-Agent Litigation Reliability Engine - Phase 2**

LexOrchestrator is a full-stack multi-agent AI system for legal research reliability. It routes legal queries through a sequential agent pipeline - intake classification, RAG retrieval, citation validation, adversarial review, hallucination risk scoring, and eval reporting - before producing a final cited answer.

This is a prototype for litigation AI reliability architecture. It is not a production legal service and does not provide legal advice.

> ⚠️ **Disclaimer**: All corpus entries are sample educational content only. Not real legal authority, case law, or professional legal advice.

---

## What LexOrchestrator Is

LexOrchestrator is a Next.js litigation workflow demo that runs legal research and drafting requests through retrieval, drafting, citation verification, adversarial review, local rules review, judge brief generation, and eval scoring. It is designed to demonstrate orchestration and reliability checks, not to provide legal advice or guarantee legal accuracy.

The original seven-agent research pipeline remains available. The litigation draft flow is a parallel workflow under `/draft`, `/workflows`, `/evals`, and `/api/litigation/workflows`.

## Demo Workflow

1. Visit `/draft`.
2. Click **Load Demo** to populate the canonical SDNY motion-to-dismiss fixture.
3. Submit the draft workflow.
4. Review `/draft/[id]` for the draft preview, verification inspector, Judge Brief, Local Rules Review, Adversarial Review, and Eval Summary.
5. Use the cross-links to inspect `/workflows/[id]` and `/evals/[id]`.
6. Run the MCP smoke test before a demo.

## How To Run Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000/draft`.

## Required Optional Env Vars

The app degrades to deterministic fallback behavior when external services are absent.

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENROUTER_API_KEY=
LLM_MODEL=
EMBEDDING_MODEL=
```

Supabase enables persisted workflow runs, seeded demo judge profiles, citation report storage, and dashboard history. An LLM key improves generation quality; without one, fallback output is used.

## Demo Commands

```bash
npm run seed:litigation-demo
npm run check:demo
npm run smoke:demo-path
```

## MCP Server Command

```bash
npm run smoke:mcp
npm run mcp:server
```

`npm run mcp:server` starts the stdio MCP server for compatible MCP clients. It is not an SSE server.

## Quality Checks

```bash
npm run check:safety
npm run lint
npx tsc --noEmit
npm run build
npm run check:demo
```

`npm run check:all` runs the core safety, lint, type, build, and demo-readiness checks. Longer smoke tests stay separate.

## Known Limitations

- Demo fixture facts and seeded judge data are fictional or demo-safe.
- Citation verification is limited to locally indexed opinions and extractor coverage.
- Local rules review is drafting guidance only, not a compliance certification.
- Judge Brief output is argument preparation only and does not predict outcomes.
- No file uploads, auth-gated matters, or production legal compliance workflow are included.

---

## What Is Real in Phase 2

| Capability | Status |
|-----------|--------|
| Supabase/Postgres persistence (runs, traces, citations, eval scores) | ✅ Real |
| **pgvector hybrid RAG** (cosine similarity + keyword + jurisdiction boost) | ✅ Real (Phase 2) |
| **Embedding backfill script** (`npm run embed:legal`) | ✅ Real (Phase 2) |
| **Retrieval quality metrics** in eval report (method, vectorSearchUsed, avgHybridScore) | ✅ Real (Phase 2) |
| OpenAI-compatible LLM calls (intake, citation validation, adversarial review, synthesis) | ✅ Real (with mock fallback) |
| Deterministic hallucination risk scoring | ✅ Real |
| Tool registry (MCP-inspired, 4 tools) | ✅ Real |
| Sequential orchestration with per-step tracing | ✅ Real |
| Run history API (`GET /api/runs`, `GET /api/runs/[id]`) | ✅ Real |
| Eval report with groundedness, citation accuracy, reliability score, pass/fail | ✅ Real |
| Auth / user accounts | ❌ Future |
| Pinecone / external vector store | ❌ Future |
| Document upload | ❌ Future |

---

## Phase 2: Hybrid RAG Architecture

### Retrieval Pipeline

```
Query → generateQueryEmbedding → vectorSearchLegalChunks (pgvector RPC)
                                          ↓
Query → keyTerms → searchLegalChunksFromDB → keyword scoring
                                          ↓
                               Merge candidates by citation_id
                                          ↓
                  hybridScore = keyword(0.35) + vector(0.45) + jurisdiction(0.10) + practiceArea(0.10)
                                          ↓
                               Reranker: exact term bonus (+0.05/match)
                                          ↓
                               Top 5 by rerankScore → RetrievedSource[]
```

**Fallback chain:**
1. `hybrid_rag` - pgvector similarity + keyword (requires embeddings in DB)
2. `keyword_fallback` - keyword scoring only (if vector search fails or no embeddings)
3. `memory_fallback` - in-memory corpus (if Supabase unavailable)

### Scoring Weights

| Signal | Weight |
|--------|--------|
| Vector cosine similarity | 0.45 |
| Keyword overlap (TF-style) | 0.35 |
| Jurisdiction match boost | 0.10 |
| Practice area match boost | 0.10 |
| Exact term rerank bonus | +0.05 per term (capped at 0.15) |

### Per-Source Score Fields (in API response)

```json
{
  "citationId": "SAMPLE-003",
  "vectorScore": 0.847,
  "keywordScore": 0.612,
  "hybridScore": 0.748,
  "rerankScore": 0.798,
  "finalScore": 0.798,
  "rankPosition": 1,
  "retrievalMethod": "hybrid_rag",
  "reason": "Vector: 85% | Keyword: 61% | Hybrid: 75% | Final: 80%"
}
```

### Retrieval Quality in Eval Report

```json
{
  "retrievalQuality": {
    "retrievalMethod": "hybrid_rag",
    "vectorSearchUsed": true,
    "fallbackUsed": false,
    "averageHybridScore": 0.683,
    "topSourceScore": 0.798,
    "sourceCount": 5
  }
}
```

---

## Architecture

```mermaid
graph TD
    Q[User Query] --> IA[Intake Agent<br/>LLM + fallback]
    IA -->|keyTerms, legalIssue| TR[Tool Registry]
    TR -->|searchLegalCorpus| RA[Retrieval Agent<br/>DB + in-memory fallback]
    RA -->|Retrieved Sources| TR2[Tool Registry]
    TR2 -->|validateCitationSupport| CV[Citation Validator<br/>LLM + fallback]
    CV -->|Claim Scores| AR[Adversarial Review<br/>LLM + fallback]
    AR -->|Risk Assessment| TR3[Tool Registry]
    TR3 -->|scoreHallucinationRisk| HR[Hallucination Risk Monitor<br/>Deterministic]
    HR --> FS[Final Synthesis<br/>LLM + fallback]
    FS --> EE[Eval Engine<br/>Deterministic]
    EE --> DB[(Supabase/Postgres)]
    EE --> R[Phase1OrchestratorResult]

    style IA fill:#4f46e5,color:#fff
    style RA fill:#7c3aed,color:#fff
    style CV fill:#0891b2,color:#fff
    style AR fill:#dc2626,color:#fff
    style HR fill:#b45309,color:#fff
    style FS fill:#059669,color:#fff
    style EE fill:#d97706,color:#fff
    style DB fill:#0f172a,color:#94a3b8
```

---

## Database Schema

Seven tables in Supabase/Postgres:

| Table | Purpose |
|-------|---------|
| `legal_documents` | Parent records for corpus entries |
| `legal_chunks` | Searchable text units with `citation_id` (SAMPLE-XXX) |
| `orchestration_runs` | One row per query - status, confidence, hallucination risk |
| `agent_traces` | One row per agent step per run - input/output summaries, payloads |
| `retrieval_results` | Which chunks were retrieved for each run |
| `citation_validations` | Per-claim support status (verified/partial/unsupported) |
| `eval_reports` | Reliability metrics - groundedness, citation accuracy, pass/fail |

Apply migrations in order:
1. Paste `supabase/migrations/001_lexorchestrator_phase1.sql` into the Supabase SQL Editor
2. Paste `supabase/migrations/002_hybrid_rag_pgvector.sql` to enable pgvector and hybrid RAG

> **Note on HNSW index:** Requires pgvector ≥ 0.5.0 (available on Supabase hosted). If it fails, see the IVFFlat alternative commented out in the migration file.

---

## Environment Variables

Create `.env.local` in the project root:

```env
# Supabase (required for persistence)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# LLM (optional - falls back to deterministic mock if absent)
OPENAI_API_KEY=sk-...
LLM_MODEL=gpt-4o-mini

# Embeddings - Phase 2 (optional - falls back to hash-based vectors if absent)
EMBEDDING_MODEL=text-embedding-3-small
```

**Fallback behavior when keys are missing:**
- No `SUPABASE_*`: app runs, pipeline completes, returns `persisted: false`
- No `OPENAI_API_KEY`: agents use deterministic mock outputs, retrieval uses hash-based embeddings (not semantically meaningful), full pipeline still works
- No embeddings in DB: retrieval falls back to `keyword_fallback`, `evalReport.retrievalQuality.vectorSearchUsed = false`

---

## Local Development

### Prerequisites
- Node.js 18+
- npm 9+
- Supabase project (free tier works)

### Setup

```bash
git clone https://github.com/your-username/LexOrchestrator.git
cd LexOrchestrator
npm install
cp .env.local.example .env.local   # fill in your keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Apply Database Migrations

1. Paste `supabase/migrations/001_lexorchestrator_phase1.sql` into Supabase SQL Editor
2. Paste `supabase/migrations/002_hybrid_rag_pgvector.sql` to enable pgvector + hybrid RAG

### Seed Legal Corpus

```bash
npm run seed:legal
```

Seeds 12 sample educational chunks into `legal_documents` and `legal_chunks`. Idempotent.

### Generate Embeddings (Phase 2)

```bash
npm run embed:legal
```

Backfills pgvector embeddings for all chunks where `embedding IS NULL`. Requires `OPENAI_API_KEY`. Safe to re-run - skips already-embedded rows. After this, queries use `hybrid_rag` retrieval instead of `keyword_fallback`.

---

## API Reference

### `POST /api/orchestrate`

Runs the full 7-agent pipeline. Returns a `Phase1OrchestratorResult`.

```json
// Request
{ "query": "What are the evidentiary standards for expert testimony in federal court?" }

// Response shape
{
  "runId": "uuid",
  "query": "...",
  "intake": { "legalIssue", "jurisdiction", "riskLevel", "keyTerms", ... },
  "retrievedSources": [{ "citationId", "title", "text", "relevanceScore", "keywordScore", "vectorScore", "hybridScore", "rerankScore", "finalScore", "rankPosition", "retrievalMethod", "reason" }],
  "citationValidation": { "claims": [{ "claim", "citationId", "supportStatus", "supportScore", "explanation" }], "overallScore", ... },
  "hallucinationRisk": { "riskScore", "riskLevel", "factors", "unsupportedCitationCount" },
  "adversarialReview": { "weaknesses", "missingAuthority", "counterarguments", "overallRisk", "summary" },
  "finalAnswer": { "answer", "citations", "confidenceScore", "riskFlags", "unresolvedQuestions" },
  "evalReport": { "groundednessScore", "citationAccuracyScore", "hallucinationRiskScore", "retrievalCoverage", "finalAnswerConfidence", "overallReliability", "passFail", "retrievalQuality": { "retrievalMethod", "vectorSearchUsed", "fallbackUsed", "averageHybridScore", "topSourceScore", "sourceCount" } },
  "executionTrace": [{ "agent", "durationMs", "status" }],
  "persisted": true,
  "modelUsed": "gpt-4o-mini"
}
```

### `GET /api/runs`

Returns the 20 most recent orchestration runs.

### `GET /api/runs/[id]`

Returns full run detail: orchestration run + all agent traces + retrieval results + citation validations + eval report.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16+ (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| Database | Supabase / Postgres |
| LLM | OpenAI-compatible API (gpt-4o-mini default) |
| Agents | Async TypeScript functions with LLM + deterministic fallback |
| Tool Registry | MCP-inspired, 4 tools |

---

## Demo Query

> **"What are the evidentiary standards for admitting expert testimony in federal civil litigation?"**

With keys configured:
- Intake (GPT): `evidence / Federal / medium risk`
- Retrieval (DB): SAMPLE-003 (Daubert), SAMPLE-004, SAMPLE-011 (Frye)
- Citation Validator (GPT): `verified` support for core admissibility claims
- Adversarial (GPT): Daubert/Frye circuit split, ipse dixit risk
- Hallucination Risk: score ≤ 0.2 (low)
- Synthesis (GPT): cited 3-paragraph analysis
- Eval: `pass` - high groundedness, low hallucination risk
- All persisted to Supabase

---

## Future Roadmap

- [ ] **pgvector semantic retrieval** - replace keyword scoring with cosine similarity
- [ ] **Pinecone integration** - external vector store for large corpora
- [ ] **Real citation parser** - validate against Westlaw/Lexis APIs
- [ ] **Judge simulation agent** - 8th agent modeling court disposition
- [ ] **Streaming via SSE** - real-time per-agent reveal in the UI
- [ ] **MCP server** - expose tool registry as a real MCP endpoint
- [ ] **Eval dataset** - labeled queries with ground-truth citation outcomes
- [ ] **Document upload** - user-supplied briefs as retrieval corpus
- [ ] **Clio / iManage integration** - connect to practice management systems
- [ ] **Multi-user auth** - Supabase RLS for user-scoped runs
- [ ] **Confidence calibration** - fine-tune weights against expert-labeled data

---

## Project Structure

```
supabase/
  migrations/
    001_lexorchestrator_phase1.sql    DB schema
scripts/
  seed-legal-corpus.ts               Seeds 12 sample chunks
app/
  layout.tsx / page.tsx / globals.css
  api/
    orchestrate/route.ts             POST - runs full pipeline
    runs/route.ts                    GET - recent run list
    runs/[id]/route.ts               GET - run detail
lib/
  types.ts                           All shared interfaces
  db/supabaseServer.ts               Server-only Supabase client + helpers
  llm/llmClient.ts                   OpenAI wrapper with mock fallback
  retrieval/searchLegalCorpus.ts     DB-backed retrieval with in-memory fallback
  tools/toolRegistry.ts              MCP-inspired tool registry (4 tools)
  agents/
    intakeAgent.ts                   Query classification (LLM + fallback)
    retrievalAgent.ts                Corpus retrieval (DB + fallback)
    citationValidator.ts             Claim support scoring (LLM + fallback)
    hallucinationRiskAgent.ts        Numeric risk scoring (deterministic)
    adversarialReview.ts             Opposing counsel sim (LLM + fallback)
    finalSynthesis.ts                Cited answer generation (LLM + fallback)
  orchestrator/
    pipeline.ts                      Sync mock pipeline (v1, kept for reference)
    runOrchestration.ts              Async DB+LLM pipeline (Phase 1 live path)
  evals/evalEngine.ts                Reliability scoring + pass/fail
  data/legalCorpus.ts                In-memory corpus (retrieval fallback)
```
