# LexOrchestrator

LexOrchestrator is a litigation workflow agent demo. It takes a legal drafting request through eight sequential specialist agents -- intake, retrieval, drafting, citation verification, adversarial review, local rules review, judge brief preparation, and eval scoring -- and surfaces the results in a structured workspace UI.

This is a portfolio project demonstrating multi-agent orchestration, hybrid RAG retrieval, citation verification, and workflow eval. It is not a production legal service and does not provide legal advice.

> All corpus entries and demo judge data are fictional or sample educational content only. Not real legal authority or professional legal advice.

---

## What It Does

**Draft workflow.** Submit a motion description, jurisdiction, court, and judge name. The eight-agent pipeline runs sequentially and produces a structured motion outline grounded in retrieved authority.

**Authority retrieval.** A hybrid RAG search over indexed court opinions combines keyword scoring (0.35), vector cosine similarity (0.45), and authority boosts for jurisdiction, court, citation presence, and recency.

**Draft editing.** The draft workspace (`/draft/[id]`) is editable. Save a revision with Cmd/Ctrl+S or the Save button. Click "Save + Verify" to re-run citation verification on the edited text. Revision history is tracked and displayed.

**Matter workspaces.** `/matters` groups related workflow runs, uploads, and drafts under a single matter. Create a matter, launch draft workflows from it, upload case files, and view all quality signals in one place. Workflows and uploads automatically link to the matter when `matterId` is provided. Auth is not required -- `user_id` and `organization_id` are nullable. Auth-gated per-user policies are future work.

**Observability dashboard.** `/observability` aggregates performance across recent workflow runs: p50/p95 duration, average token count, agent breakdown, and hotspots (slowest run, most failure-prone agent). Token and cost values depend on provider response data; estimates are labeled as such. No external tracing integration is active.

**Agent trace.** Every workflow run has a trace view at `/traces/[id]`. The trace shows all agent events in chronological order with tool inputs, outputs, latency, and metadata. A per-agent breakdown shows which agents completed, failed, how long each took, and which artifacts each created. The § 06 Replay Snapshot records the context needed to reproduce or debug the run. Traces are read-only; replay execution is not active.

**Draft export.** The § 04 Export section on the draft workspace provides one-click download as PDF, DOCX, or TXT. Optional appendices (Judge Brief, Local Rules, Adversarial Review) can be toggled via checkboxes. Exports use the latest saved revision. Cover page and citation summary are always included. Demo-grade only -- not guaranteed court-filing ready.

**Citation verification.** Every citation in the draft is checked against indexed opinions for existence, quote accuracy, pin cite, proposition support, and treatment status. An optional Python worker using eyecite can be enabled for improved extraction (see [workers/citation/README.md](workers/citation/README.md)); the app falls back to the built-in regex extractor when the worker is unavailable.

**Judge brief.** If a judge name is provided, the system looks up cached profile data derived from indexed opinions and returns style notes, citation preferences, and argument guidance. Preparation signal only -- not outcome prediction.

**Local rules review.** A static rules module checks the draft against required sections for the target jurisdiction (SDNY, Federal generic, New York State generic) and surfaces missing sections and formatting warnings.

**Adversarial review.** A red-team agent generates the opposing-counsel critique: strongest weaknesses, unsupported claims, and likely counterarguments.

**Eval dashboard.** A weighted confidence formula combines citation pass rate, faithfulness, retrieval coverage, local rules completeness, adversarial safety, and judge coverage into a single overallConfidence score with pass/warn/fail verdict.

**MCP tool server.** A stdio MCP server exposes nine tools for search, citation extract/verify, workflow run, status, artifacts, judge brief, eval summary, and local rules profile.

---

## Demo Workflow

1. Run pre-demo checks:
   ```bash
   npm run check:demo
   npm run smoke:demo-path
   npm run smoke:mcp
   ```

2. Start the dev server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:3000/draft`.

4. Click **Load Demo** to populate the canonical SDNY motion-to-dismiss fixture (Aurora Analytics v. Northstar Retail Systems, defendant-side, Judge Rakoff).

5. Submit. The workflow runs all eight agents and redirects to `/draft/[id]`.

6. On the draft workspace:
   - Left column: Document Preview (motion outline), Authority Retrieved (citations)
   - Right column: Verification Inspector, Judge Brief, Adversarial Review, Local Rules Notes, Eval Summary

7. Click **Technical Inspection** to open `/workflows/[id]` -- agent event feed, raw artifact list, citation report table.

8. Click **Full Eval** to open `/evals/[id]` -- eight score bars, citation quality, retrieval quality, artifact quality, agent runtime.

9. From `/evals`, navigate to the dashboard at `/evals` to see aggregate metrics across runs.

---

## Routes

| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/research` | Seven-agent research pipeline (legacy) |
| `/runs` | Research run history |
| `/runs/[id]` | Research run detail |
| `/draft` | New draft form |
| `/draft/[id]` | Draft workspace: document, verification inspector, judge brief, local rules, adversarial, eval |
| `/workflows` | Litigation workflow run list |
| `/workflows/[id]` | Technical inspection: agent events, artifacts, citations |
| `/evals` | Eval dashboard: aggregate quality metrics |
| `/evals/[id]` | Per-run eval: eight score bars, citation/retrieval/artifact/runtime panels |

---

## Architecture

Two parallel pipelines run side by side. Neither modifies the other.

**Legacy pipeline** (`lib/orchestrator/runOrchestration.ts`): Seven agents -- intake, retrieval, citation validation, adversarial, hallucination monitor, final synthesis, eval. Powers `/research` and `/runs`.

**Litigation workflow** (`lib/litigation/runLitigationWorkflow.ts`): Eight specialist agents run sequentially. Each agent receives the full context built by prior agents.

| Agent | Role |
|---|---|
| Intake Agent | Normalizes request: motionType, jurisdiction, keyFacts, legalIssues |
| Retrieval Agent | Hybrid RAG search over `legal_opinion_chunks` |
| Drafting Agent | Generates motion outline grounded in retrieved authority |
| Citation Agent | Verifies all citations in draft via the Phase 3 verifier |
| Adversarial Agent | Opposing-counsel critique: weaknesses, unsupported claims, counterarguments |
| Local Rules Agent | Section detection and formatting warnings for the target jurisdiction |
| Judge Brief Agent | Looks up cached judge profiles; returns preparation guidance |
| Eval Agent | Deterministic scoring: computes `FullWorkflowEval` from in-memory agent outputs |

Agents with no upstream data dependency (adversarial, local rules, judge brief) can be parallelized in a future phase.

---

## Data Model

| Table | Purpose |
|---|---|
| `legal_opinions` | Court opinions metadata (CourtListener / CAP / demo) |
| `legal_opinion_chunks` | Chunked opinion text with pgvector embeddings |
| `legal_citation_edges` | Opinion-to-opinion citation graph |
| `legal_judges` | Judge metadata |
| `judge_profiles` | Cached judge analysis for Judge Brief |
| `litigation_workflow_runs` | One row per workflow run; updated with final scores |
| `litigation_agent_events` | Streamable event feed per agent step |
| `draft_artifacts` | Generated motion sections, memos, red-team outputs, eval artifacts |
| `citation_verification_reports` | Per-citation existence/quote/proposition/treatment results |

---

## MCP Server

A stdio MCP server exposes nine litigation tools.

```bash
npm run mcp:server    # start stdio MCP server (waits for protocol input)
npm run smoke:mcp     # directly test tool modules; no client required
```

**Tools exposed:**

| Tool | Description |
|---|---|
| `search_legal_opinions` | Hybrid RAG search over indexed opinions |
| `extract_citations` | Regex-based U.S. citation extractor |
| `verify_citation` | Existence and accuracy check for a single citation |
| `run_litigation_workflow` | Full eight-agent workflow |
| `get_workflow_status` | Workflow status and agent event feed |
| `get_draft_artifacts` | Draft artifacts by run ID |
| `get_judge_brief` | Cached judge preparation guidance |
| `get_eval_summary` | Full quality evaluation for a completed run |
| `get_local_rules_profile` | Local rules profile for jurisdiction and court |

**Claude Desktop config** (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "lexorchestrator": {
      "command": "npx",
      "args": ["tsx", "/ABSOLUTE/PATH/TO/REPO/mcp/server.ts"],
      "env": {
        "NEXT_PUBLIC_SUPABASE_URL": "your-supabase-url",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key",
        "OPENROUTER_API_KEY": "your-openrouter-key"
      }
    }
  }
}
```

---

## Local Setup

```bash
git clone https://github.com/sanketmuchhala/LexOrchestrator.git
cd LexOrchestrator
npm install
npm run dev
```

Open `http://localhost:3000`. All routes work without any env vars; agents fall back to deterministic outputs.

**Optional env vars** (`.env.local`):

```env
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=
OPENAI_API_KEY=
LLM_MODEL=
EMBEDDING_MODEL=
```

Without keys: workflow runs complete with deterministic fallback output, no DB persistence, no semantic search.
With Supabase only: persistence, dashboard history, judge profile lookup.
With an LLM key: full agent quality.

**Seed demo data:**

```bash
npm run seed:litigation-demo   # 3 demo opinions, 1 judge, 2 judge profiles
```

---

## Quality Checks

```bash
npm run check:safety    # scans for forbidden terms and secret patterns
npm run check:demo      # verifies fixture, routes, MCP, and module presence
npm run lint            # ESLint across app/ components/ lib/ scripts/ mcp/
npx tsc --noEmit        # TypeScript strict mode type check
npm run build           # production build must pass before commit

# Smoke tests
npm run smoke:legal-search
npm run smoke:citations
npm run smoke:citation-worker    # adapter + fallback test (no worker required)
npm run smoke:litigation-workflow
npm run smoke:judge-brief
npm run smoke:local-rules
npm run smoke:workflow-eval
npm run smoke:mcp
npm run smoke:demo-path

# Run everything
npm run check:all
```

---

## Known Limitations

- Demo fixture facts and judge profiles are fictional or educational only.
- Citation verification is limited to locally indexed opinions. Citations not in the corpus return `not_found`.
- Local rules review is drafting guidance only. It is not a compliance certification or a substitute for counsel reviewing the actual local rules.
- Judge Brief output is argument preparation signal only. It does not predict outcomes or reflect current judicial preferences.
- File upload supports `.txt` and `.md` only. PDF and DOCX are planned (Phase 15).
- Uploaded case files are factual source material only -- not legal authority and not cited as such.
- PDF and DOCX exports are demo-grade. They are not formatted to court-specific filing standards (no CM/ECF, no e-filing integration).
- No lawyer-grade validation or legal advice claim.
- No live CourtListener dependency required for the demo.
- The seven-agent research pipeline (`/research`) and the litigation workflow (`/draft`) are separate; research runs do not appear in the workflow dashboard.

---

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for the phased plan through Phase 22.

Completed through Phase 20 (Matters and Saved Workspaces). Next priorities:
- Real CourtListener / CAP ingestion (Phase 14)
- PDF and DOCX file upload for case files (planned)
- Agent trace replay and debugging view (Phase 18)
- Auth and multi-matter support (Phase 19+)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + CSS custom properties |
| Database | Supabase (Postgres + pgvector) |
| LLM | OpenAI SDK via OpenRouter or OpenAI direct |
| MCP | `@modelcontextprotocol/sdk` v1.29, stdio transport |
| Fonts | IBM Plex Mono, EB Garamond |

---

## Architecture Diagram

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
