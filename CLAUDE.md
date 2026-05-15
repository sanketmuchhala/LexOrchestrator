# LexOrchestrator — Claude Code Instructions

## Project Identity
Multi-agent legal AI orchestration system built as a portfolio project. Seven sequential agents retrieve, validate, and score legal research queries against a hybrid RAG corpus (pgvector + keyword).

**Critical constraint: the name of the target employer must never appear anywhere in the codebase, commits, or GitHub.** If you encounter it, remove it.

---

## Stack
- **Framework:** Next.js 16 (App Router, Turbopack) · TypeScript strict mode
- **Database:** Supabase (Postgres + pgvector)
- **LLM/Embeddings:** OpenAI SDK pointed at OpenRouter (`OPENROUTER_API_KEY`) or OpenAI (`OPENAI_API_KEY`). Keys starting with `sk-or-` are auto-detected as OpenRouter and get the right `baseURL` and headers automatically via `lib/llm/config.ts`.
- **Styling:** Tailwind CSS + global CSS custom properties
- **Fonts:** IBM Plex Mono (`--font-mono`) · EB Garamond (`--font-serif`) via next/font/google

---

## Commands
```bash
npm run dev            # development server (localhost:3000)
npm run build          # production build — must pass before every commit
npm run lint           # eslint across app/ components/ lib/ scripts/
npm run seed:legal     # seed 12 sample corpus chunks into Supabase
npm run seed:constitution  # seed 14 US Constitution chunks (primary RAG source)
npm run embed:legal    # backfill pgvector embeddings (requires API key)
npx tsc --noEmit       # type check without building
```

**Always run `npm run lint && npx tsc --noEmit` before committing.** Then `npm run build` to confirm the output is clean.

---

## Design System — "Federal Court Documents meets Financial Terminal"

True black aesthetic. Every new UI component must follow this:

### Colors (CSS variables in `app/globals.css`)
| Variable | Value | Use |
|---|---|---|
| `--bg` | `#000000` | Page background |
| `--s1` | `#0a0a0a` | Primary surface |
| `--s2` | `#111111` | Secondary surface |
| `--border` | `rgba(255,255,255,0.06)` | Default borders |
| `--text-1` | `#f4f4f4` | Primary text |
| `--text-2` | `#737373` | Secondary text |
| `--text-3` | `#404040` | Tertiary/disabled |
| `--emerald` | `#34d399` | Pass / low risk / good |
| `--amber` | `#fbbf24` | Warning / medium |
| `--red` | `#f87171` | Fail / high risk / error |
| `--blue` | `#60a5fa` | Citation references |
| `--blue-hi` | `#93c5fd` | Constitution / primary sources |

### Typography rules
- **Data, labels, IDs, scores, metrics** → `var(--font-mono)` (IBM Plex Mono)
- **Legal prose, queries, analysis text, headings** → `var(--font-serif)` (EB Garamond)
- **Labels** → use `.label` class: 10px mono uppercase tracking-[0.2em] `#737373`
- **No rounded corners** — use flat borders only (`border-radius: 0` or `rounded-none`)
- **No emojis anywhere**
- **Section numbering** — use `§ 01`, `§ 02` etc. with ruled separators

### CSS utility classes (from `app/globals.css`)
```
.label          — small all-caps mono label
.badge          — base pill badge
.badge-pass     — emerald (verified, pass, low risk)
.badge-fail     — red (unsupported, fail, high risk)
.badge-warn     — amber (partial, medium)
.badge-neutral  — zinc (unknown, pending)
.badge-blue     — blue (citation IDs)
.badge-const    — blue-hi (Constitution / primary source)
.rule           — 1px horizontal rule rgba(255,255,255,0.06)
.appear         — fade-up entrance animation
.appear-1 to .appear-5  — staggered variants
.pulse-dot      — animated green dot for live status
```

---

## Architecture

### Routes
| Route | Type | Purpose |
|---|---|---|
| `/` | Server component | Landing page with pipeline overview and stats |
| `/research` | Client component | Query input → loading state → redirect to run |
| `/runs` | Server component | Paginated run history table |
| `/runs/[id]` | Server component | Full analysis detail — permanent shareable URL |
| `/api/orchestrate` | POST | Runs the 7-agent pipeline, returns `{ runId }` |
| `/api/runs` | GET | Recent runs list |
| `/api/runs/[id]` | GET | Single run detail |

### Seven-agent pipeline (runs sequentially in `lib/orchestrator/runOrchestration.ts`)
1. **Intake Agent** — classifies query, extracts legal terms and jurisdiction
2. **Retrieval Agent** — hybrid RAG: pgvector cosine + keyword overlap + authority boost
3. **Citation Validator** — matches claims against retrieved source chunks
4. **Adversarial Review** — generates opposing counsel challenges
5. **Hallucination Monitor** — scores unsupported citation risk
6. **Final Synthesis** — produces cited legal analysis with confidence score
7. **Eval Engine** — computes groundedness, accuracy, reliability metrics

### Retrieval scoring formula (`lib/retrieval/searchLegalCorpus.ts`)
```
finalScore = min(1, kwScore×0.35 + vecScore×0.45 + jurisdictionBoost + practiceBoost + authorityBoost)
authorityBoost = chunk.source_type === "primary" ? 0.15 : 0  (Constitution gets priority)
```

### LLM config (`lib/llm/config.ts`)
Auto-detects provider from key prefix. `USE_OPENROUTER` is true when `OPENROUTER_API_KEY` is set **or** when `OPENAI_API_KEY` starts with `sk-or-`. Both `llmClient.ts` and `embeddingClient.ts` import from here — never read env vars directly in those files.

### Database (`lib/db/supabaseServer.ts`)
Server-only. Uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS). Never import this from client components. The anon key is only for client-side Supabase calls (not currently used).

---

## Database Schema (v2 — migration 003)

Key tables:
- `documents` — PDF uploads + built-in corpus. `source_type`: `primary | secondary | user_upload | sample`. `status`: `pending → processing → indexed | error`.
- `document_chunks` — vectorized segments. `source_type` and `authority_weight` denormalized here (no join needed during retrieval). `embedding vector(1536)`.
- `orchestration_runs` — one per query. `confidence`, `hallucination_risk`, `pass_fail` denormalized for fast list views.
- `agent_traces`, `retrieval_results`, `citation_validations`, `eval_reports` — pipeline sub-tables, all cascade-delete from run.
- `organizations`, `user_profiles` — multi-tenancy scaffold (not yet wired to auth in the UI).

RLS is enabled on all tables. Service role key bypasses it. Corpus with `source_type in ('primary','sample')` is readable by anon.

Vector search: `match_document_chunks()` is the primary function. `match_legal_chunks()` is a backward-compat alias.

---

## Phase 1 Database Foundation (migration 004)

Additive migration -- does not modify existing tables. The seven-agent pipeline remains active.

New tables prepare for motion drafting, judge brief, verification inspector, and agent event streaming:

| Table | Purpose |
|---|---|
| `legal_opinions` | Real court opinions from CourtListener / CAP / demo fixtures |
| `legal_opinion_chunks` | Chunked opinion text with pgvector embeddings |
| `legal_citation_edges` | Opinion-to-opinion citation graph |
| `legal_judges` | Judge metadata |
| `judge_profiles` | Cached judge analysis for Judge Brief sidebar |
| `litigation_workflow_runs` | Top-level workflow run for draft-generation flows |
| `litigation_agent_events` | Streamable event feed for agent UI |
| `draft_artifacts` | Generated motion sections, memos, red-team outputs |
| `citation_verification_reports` | Detailed citation verification results |

Vector search: `match_opinion_chunks()` searches opinion chunks by embedding similarity.

RLS enabled on all new tables. Open policies for now (service role handles writes).

```bash
npm run seed:litigation-demo   # seeds 3 demo opinions, chunks, 1 judge, 1 judge profile
```

---

## Phase 2 Legal Opinion Retrieval (migration 005)

New parallel retrieval path for litigation workflows. Old `searchLegalCorpus.ts` (document_chunks) remains active.

### New retrieval module

`lib/retrieval/searchLegalOpinions.ts` -- hybrid RAG over `legal_opinion_chunks`:

```
finalScore = min(1, keywordScore * 0.35 + vectorScore * 0.45 + jurisdictionBoost + courtBoost + citationBoost + recencyBoost)
```

Fallback chain: `hybrid_rag` -> `keyword_only` -> `direct_query` -> `empty`

### SQL function (migration 005)

`match_legal_opinion_chunks()` -- vector similarity with jurisdiction/court/date filters.
`search_legal_opinion_chunks_fulltext()` -- full-text keyword search with same filters.

### API route

`POST /api/legal-opinions/search` -- accepts `{ query, jurisdiction?, court?, dateFrom?, dateTo?, limit? }`

### DB helpers

`lib/db/supabaseServer.ts` -- added `vectorSearchOpinionChunks()`, `fulltextSearchOpinionChunks()`, `directSearchOpinionChunks()`

### Smoke test

```bash
npm run smoke:legal-search   # runs 3 demo queries, degrades gracefully without Supabase
```

---

## Phase 3 Citation Verification

Output verification layer for generated or pasted legal text. This is output verification, not a claim of zero hallucination.

### Extraction module

`lib/citations/extractCitations.ts` -- regex-based extractor for common U.S. citation forms (U.S., F.2d/3d/4th, F. Supp., S. Ct., N.Y., A.D., Misc.).

### Verification module

`lib/citations/verifyCitation.ts` -- single citation verification:
1. Normalize citation text
2. Search `legal_opinions` by exact/partial citation match
3. If matched: check quote, pin cite, proposition support, treatment status
4. Produce structured result with confidence and evidence

`lib/citations/verifyCitationsInText.ts` -- bulk text verification: extract all citations from freeform text, verify each, produce summary.

### API routes

| Route | Method | Purpose |
|---|---|---|
| `/api/citations/extract` | POST | Extract citations from text |
| `/api/citations/verify` | POST | Verify a single citation |
| `/api/citations/verify-text` | POST | Extract and verify all citations in text |

### Persistence

`lib/citations/saveCitationVerificationReport.ts` -- saves to `citation_verification_reports` table when Supabase is configured and `workflowRunId` is provided.

### Current limitations

- Regex extraction only (no ML-based extraction)
- Verification limited to locally indexed opinions
- Quote matching uses word overlap (not semantic similarity)
- Proposition support is term-overlap based (not LLM-based)
- Pin cite verification requires page metadata in chunks (often absent)

### Smoke test

```bash
npm run smoke:citations   # runs extraction, verification, bulk text verification
```

---

## Phase 4 Litigation Orchestrator

Parallel architecture alongside the original seven-agent research pipeline. The old pipeline (`lib/orchestrator/runOrchestration.ts`) is unchanged. Phase 4 introduces a new orchestrator and specialist agents specifically for litigation drafting workflows.

### Parallel architecture

The Phase 4 workflow is entirely separate:
- Old pipeline: `lib/orchestrator/` + `lib/agents/` + `/api/orchestrate`
- New pipeline: `lib/litigation/` + `lib/litigation/agents/` + `/api/litigation/workflows`

Neither pipeline modifies the other.

### Core module: `lib/litigation/`

| File | Purpose |
|---|---|
| `types.ts` | All litigation workflow types: `LitigationWorkflowInput`, `LitigationWorkflowResult`, `AgentContext`, `AgentResult`, per-agent output types |
| `createWorkflowRun.ts` | Inserts into `litigation_workflow_runs`. Returns ephemeral UUID if Supabase is unavailable. |
| `logAgentEvent.ts` | Inserts into `litigation_agent_events`. No-ops safely if Supabase is unavailable. |
| `saveDraftArtifact.ts` | Inserts into `draft_artifacts`. Returns local object if Supabase is unavailable. |
| `runLitigationWorkflow.ts` | Main entry point. Runs all agents sequentially, persists events, returns `LitigationWorkflowResult`. |

### Specialist agents: `lib/litigation/agents/`

| Agent | Purpose | Fallback |
|---|---|---|
| `intakeAgent.ts` | Normalize request: motionType, jurisdiction, keyFacts, legalIssues, missingInputs | Deterministic pattern matching |
| `retrievalAgent.ts` | Hybrid RAG via Phase 2 `searchLegalOpinions` | Returns empty results with explanation |
| `draftingAgent.ts` | Generate motion/memo outline grounded in retrieved authority | Deterministic 5-section outline |
| `citationAgent.ts` | Verify citations in draft via Phase 3 `verifyCitationsInText` | Returns empty citationSummary |
| `adversarialAgent.ts` | Opposing-counsel critique: weaknesses, unsupported claims, counterarguments | Playbook by motion type |
| `localRulesAgent.ts` | Jurisdiction formatting reminders (SDNY, Federal, New York) | Pattern match on jurisdiction string |
| `judgeBriefAgent.ts` | Look up `judge_profiles` by judgeId or judgeName | Returns "no cached judge profile available" |
| `evalAgent.ts` | Deterministic scoring: faithfulness, citationPassRate, retrievalCoverage, overallConfidence | Always runs; no LLM dependency |

### Execution model

Agents run sequentially for now. The `AgentContext` object is built progressively -- each agent receives what prior agents produced. Future parallelization: agents with no data dependency on each other (adversarial, local rules, judge brief) can be parallelized by running them concurrently and awaiting all three before eval.

### Persistence tables used

- `litigation_workflow_runs` -- one row per workflow run; updated with final scores at completion
- `litigation_agent_events` -- one row per agent event; event_type must match the DB check constraint
- `draft_artifacts` -- draft content and citations saved after the drafting agent completes
- `citation_verification_reports` -- written by Phase 3 `verifyCitationsInText` when workflowRunId is provided

### API route

`POST /api/litigation/workflows` -- accepts `LitigationWorkflowInput`, returns `LitigationWorkflowResult`:
```json
{
  "query": "...",
  "jurisdiction": "SDNY",
  "court": "S.D.N.Y.",
  "judgeName": "Demo Judge",
  "motionType": "motion_to_dismiss",
  "facts": "..."
}
```

### Smoke test

```bash
npm run smoke:litigation-workflow   # runs full 8-agent workflow, degrades gracefully without Supabase or API keys
```

---

## Phase 5 Workflow Inspection UI

Adds a workflow inspection surface for the Phase 4 litigation pipeline. The old seven-agent research pipeline (`/research`, `/runs`) remains fully active and unchanged.

### UI routes added

| Route | Type | Purpose |
|---|---|---|
| `/workflows` | Server component | List recent litigation workflow runs with Demo Workflow Launcher |
| `/workflows/[id]` | Server component | Full workflow inspection — 5 sections |

### API routes added

| Route | Method | Purpose |
|---|---|---|
| `/api/litigation/workflows/[id]` | GET | Full workflow detail: run + events + artifacts + citationReports |
| `/api/litigation/workflows/[id]/events` | GET | Agent events for a workflow run |
| `/api/litigation/workflows/[id]/artifacts` | GET | Draft artifacts for a workflow run |

### Components added (`components/workflows/`)

| Component | Type | Purpose |
|---|---|---|
| `WorkflowRunTable.tsx` | Client | Clickable table of workflow runs |
| `WorkflowSummaryPanel.tsx` | Server | § 01 confidence/faithfulness/status grid |
| `AgentEventFeed.tsx` | Client | § 02 chronological event feed with 2.5 s polling when running |
| `DraftArtifactList.tsx` | Server | § 03 artifact cards with content preview |
| `CitationReportTable.tsx` | Server | § 04 per-citation existence/quote/proposition status |
| `EvalSummaryPanel.tsx` | Server | § 05 final scores + output prose |
| `DemoWorkflowLauncher.tsx` | Client | Button that POSTs to /api/litigation/workflows and redirects |

### DB helpers added (`lib/litigation/`)

`listWorkflowRuns`, `getWorkflowRun`, `getWorkflowEvents`, `getWorkflowArtifacts`, `getWorkflowCitationReports`

All backed by new `supabaseServer.ts` helpers. Return safe empty arrays when DB is unavailable.

### Polling vs SSE

Phase 5 implements DB-polled refresh. `AgentEventFeed` polls `/api/litigation/workflows/[id]` every 2.5 seconds when workflow status is `queued` or `running`. Polling stops automatically when the status reaches a terminal state (`completed`, `failed`, `cancelled`). True SSE is left for a future phase.

### Navigation

"Workflows" added to the main navigation bar alongside "Research" and "History".

### Full motion editor

Not yet built. `/workflows/[id]` is read-only inspection only. See Phase 6.

---

## Phase 6 Motion Drafting Workspace

Adds the first-version legal drafting surface. `/workflows/[id]` remains the technical inspection page. `/draft/[id]` is the product-facing drafting workspace.

### Routes

| Route | Purpose |
|---|---|
| `/draft` | New draft form -- matter name, motion type, jurisdiction, court, judge, facts, desired output |
| `/draft/[id]` | Two-column drafting workspace with document preview and verification inspector |

On form submit, `/draft` POSTs to `POST /api/litigation/workflows` and redirects to `/draft/[workflowRunId]`.

### Workspace layout (`/draft/[id]`)

Two-column grid (`1fr 22rem`):

| Column | Contents |
|---|---|
| Left (wider) | § 02 Document Preview, § 04 Authority Retrieved |
| Right (22rem) | § 03 Verification Inspector, § 05 Adversarial Review, § 06 Local Rules Notes, § 07 Eval Summary |

Below both columns: Agent Feed (reused from Phase 5 `AgentEventFeed` with live polling).

### Workspace sections

| Section | Data source |
|---|---|
| § 01 Draft Workspace Header | `litigation_workflow_runs` (status, motion_type, scores) |
| § 02 Document Preview | `draft_artifacts` where type in (outline, full_draft, motion_section, memo) |
| § 03 Verification Inspector | `citation_verification_reports`; falls back to draft artifact citations |
| § 04 Authority Retrieved | Citations array from primary draft artifact |
| § 05 Adversarial Review | `draft_artifacts` where type = red_team_memo |
| § 06 Local Rules Notes | `draft_artifacts` where type = local_rules_check |
| § 07 Eval Summary | `litigation_workflow_runs` (confidence, faithfulness_score, citation_pass_rate) |

### Components added (`components/draft/`)

`DraftLauncherForm`, `DraftWorkspaceHeader`, `DocumentPreview`, `VerificationInspector`, `AuthorityPanel`, `AdversarialReviewPanel`, `LocalRulesPanel`, `DraftEvalPanel`

### runLitigationWorkflow changes

Phase 6 adds two additional `saveDraftArtifact` calls after the drafting agent:
- `AdversarialAgent` output serialized and saved as type `red_team_memo`
- `LocalRulesAgent` output serialized and saved as type `local_rules_check`

This gives the workspace three queryable artifacts per run: `outline`, `red_team_memo`, `local_rules_check`.

### Data helper added

`lib/litigation/getDraftWorkspace.ts` -- extends `getWorkflowRun` with `primaryDraft`, `adversarialReview`, `localRulesArtifact` fields selected from the artifacts array.

### Document preview behavior

Parses draft text by double-newline into blocks. Heading detection: short block, all-caps, or Roman numeral prefix (`I.`, `II.`, etc.). Headings render in mono uppercase; prose renders in EB Garamond serif at 16px/1.85 line height.

### Verification inspector behavior

When `citation_verification_reports` are present: shows per-citation status with sub-status badges (exists, quote, pin cite, proposition, treatment). Summary strip shows pass/warn/fail counts.

When reports are absent but draft artifact has citations: shows them as "not verified" in amber.

When both are empty: shows "No citations detected" with an explanation.

### /workflows vs /draft

- `/workflows/[id]` = technical inspection (all events, raw artifact list, citation reports table, eval scores)
- `/draft/[id]` = product surface (document preview, verification inspector, adversarial review, local rules, eval)
- Link from `/draft/[id]` → `/workflows/[id]` labeled "Technical Inspection"

### Navigation

"Draft" added as the first nav link (before Research, History, Workflows).

---

## Phase 7 Judge Brief Agent

Adds judge-aware argument preparation to the litigation workflow and draft workspace.

### Judge lookup helpers (`lib/litigation/judges/`)

| File | Purpose |
|---|---|
| `findJudge.ts` | Looks up judge by ID (exact) or name (fuzzy). Supports court and jurisdiction filters. Returns `matchStatus`: exact / partial / not_found / ambiguous. |
| `getJudgeProfile.ts` | Loads `judge_profiles` by judge_id. Prefers matching `motion_type`, falls back to any cached profile for the judge. Returns null safely. |
| `saveJudgeProfile.ts` | Inserts a generated profile into `judge_profiles`. No-ops if Supabase is unavailable. |

### Judge Brief Agent behavior (`lib/litigation/agents/judgeBriefAgent.ts`)

Returns `JudgeBriefResult` with:
- `matchStatus`: exact | partial | not_found | ambiguous | not_requested
- `profileAvailable`: whether a cached opinion-derived profile was found
- `styleNotes`, `citationPreferences`, `argumentGuidance`, `motionTypeGuidance`, `riskNotes`, `limitations`
- `artifactContent`: formatted text saved to `draft_artifacts`

Logic flow:
1. No judge provided → `not_requested`, empty artifactContent, no artifact saved
2. Judge not found → `not_found`, artifact saved with lookup explanation
3. Judge found, profile cached → `profileAvailable: true`, full guidance
4. Judge found, no profile → deterministic fallback with generic court-level guidance

Language constraint: use "argument guidance", "style notes", "preparation signals", "available profile data". Never claim outcome prediction or win probability.

### Artifact persistence

`judge_brief` artifact saved to `draft_artifacts` whenever judge info is provided (even for not_found). Artifact `metadata.judgeBrief` stores the full structured `JudgeBriefResult` for the workspace panel.

### Draft workspace changes

`JudgeBriefPanel` added to the right column of `/draft/[id]` (§ 04b, between Verification Inspector and Adversarial Review). Shows judge identity, match status, style notes, citation preferences, argument guidance, motion-type guidance, risk notes, and limitations.

If no judge brief artifact exists: "No Judge Brief was generated for this workflow."
If judge not found: "Judge profile unavailable. The workflow continued without judge-specific guidance."

### Demo seed changes

`scripts/seed-litigation-demo.ts` now seeds two judge profiles for Jed S. Rakoff (SDNY):
- `daubert` motion type (3 source opinions)
- `motion_to_dismiss` motion type (5 source opinions)

Both clearly marked as demo fixture data.

### Smoke command

```bash
npm run smoke:judge-brief   # finds demo judge, loads profile, runs agent, tests all three paths
```

---

## Key Files
```
lib/llm/config.ts           — provider detection (OpenRouter vs OpenAI)
lib/llm/llmClient.ts        — chat completions wrapper
lib/llm/embeddingClient.ts  — embeddings wrapper with hash fallback
lib/db/supabaseServer.ts    — all DB reads/writes (server-only)
lib/types.ts                — all shared TypeScript interfaces
lib/utils/display.ts        — defensive display helpers (normalizedScore, text, asRecord, etc.)
lib/retrieval/searchLegalCorpus.ts  — hybrid RAG scoring
lib/orchestrator/runOrchestration.ts — seven-agent research pipeline entry point
lib/litigation/runLitigationWorkflow.ts — eight-agent litigation workflow entry point
app/globals.css             — design tokens, badge classes, animations
```

---

## Coding Conventions
- **No comments explaining what code does** — names should be self-documenting. Only add a comment when the WHY is non-obvious (hidden constraint, workaround, subtle invariant).
- **No `console.log`** — use `console.warn("[Module] message")` for operational warnings only.
- **Graceful degradation** — entire app works with zero env vars: in-memory corpus, deterministic agent outputs, no persistence.
- **Server components** call `supabaseServer.ts` directly — no HTTP roundtrip through API routes.
- **Client components** that need data fetch from `/api/*` routes.
- **`"use client"`** only when needed (interactivity, hooks, router).
- Seed scripts load `.env.local` first, then `.env` as fallback — both are supported.

---

## Fallback Behavior
| Missing | Effect |
|---|---|
| No `SUPABASE_*` | In-memory corpus only, `persisted: false`, run IDs are ephemeral UUIDs |
| No API key | Agents return deterministic keyword-based outputs; embeddings use FNV-1a hash fallback |
| DB unavailable | Inserts silently no-op, reads return empty arrays |

---

## Commit Style
- Short imperative subject line
- No `Co-Authored-By: Claude` lines
- No em dashes (`—`) in commit messages or code comments

---

## Phase 0 Safety Gate

Before every commit, run:

```bash
npm run check:all
```

This runs, in order:
1. `check:safety` -- scans for forbidden employer terms and leaked secrets
2. `lint` -- ESLint across source dirs
3. `tsc --noEmit` -- type check
4. `build` -- production build

The safety script lives at `scripts/check-safety.ts`. It will exit 1 if:
- Any forbidden employer name appears in tracked project files
- Any secret pattern (API keys, JWT secrets) appears in source files
- `.env` or `.env.local` is tracked by git

Package scripts available:
```bash
npm run check:safety    # safety scan only
npm run check:all       # full preflight (safety + lint + typecheck + build)
```

