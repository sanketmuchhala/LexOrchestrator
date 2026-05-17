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
npm run check:demo     # verify fixture, routes, MCP, eval/local-rules/citation modules
npm run smoke:demo-path # run canonical litigation demo workflow
npm run smoke:mcp      # smoke test MCP tool modules
npm run mcp:server     # start stdio MCP server
npx tsc --noEmit       # type check without building
```

**Always run `npm run lint && npx tsc --noEmit` before committing.** Then `npm run build` to confirm the output is clean.

## Phase 11 Demo Hardening

Phase 11 is demo stability and production polish only. Do not add uploads, auth-gated matters, or new major product surfaces.

- Canonical demo fixture: `lib/demo/litigationDemoFixture.ts`
- Demo readiness check: `npm run check:demo` via `scripts/check-demo-readiness.ts`
- Demo path smoke test: `npm run smoke:demo-path` via `scripts/smoke-test-demo-path.ts`
- Draft, workflow, and eval pages cross-link by workflow run ID.
- Shared status helpers live in `lib/utils/status.ts`.
- API routes should return structured 400s for invalid input and safe 500s for unexpected failures.
- MCP startup is checked with `npm run smoke:mcp` and `npm run mcp:server`.

---

## Phase 12 Documentation Package

Documentation and positioning only. No product code changes.

### Files added

| File | Purpose |
|---|---|
| `readme.md` | Full project README: what it does, demo workflow, routes, architecture, data model, MCP, setup, limitations, roadmap |
| `docs/README.md` | Docs index with links to all doc files |
| `docs/ARCHITECTURE.md` | System overview, agent topology, Mermaid data-flow diagram, retrieval formula, eval formula, persistence model, security |
| `docs/DEMO_GUIDE.md` | Pre-demo checklist, step-by-step click guide, failure fallback plan, what not to say |
| `docs/DEMO_VIDEO_SCRIPT.md` | 4-5 minute video script with narration cues and screen guidance |
| `docs/INTERVIEW_TALKING_POINTS.md` | 30-second pitch, 90-second technical explanation, per-feature talking points, tradeoffs |
| `docs/ROADMAP.md` | Phases 13-22: upload, CourtListener, eyecite, motion editor, export, observability, auth, deployment, portfolio polish |

### Architecture diagram

`docs/ARCHITECTURE.md` contains a Mermaid `flowchart TD` diagram showing the eight-agent data flow from draft request through all agents to the draft workspace.

### Language constraints carried over from all phases

- No claim of legal advice
- No claim of hallucination-free output
- No claim of full local-rule compliance
- No claim of outcome prediction
- No mention of target employer

---

## Phase 13 Case File Upload Intake

Adds upload intake supporting `.txt` and `.md` files. Uploaded content is treated as factual case material, not legal authority.

### New modules

| Path | Purpose |
|---|---|
| `lib/uploads/types.ts` | `CaseFileDocumentRole`, `CaseFileUploadInput`, `CaseFileUploadResult`, `ExtractedCaseFile` |
| `lib/uploads/extractTextFromUpload.ts` | Text extraction: `extractTextFromUpload(File)`, `extractTextFromBuffer(ArrayBuffer, ...)`. Max 5 MB, max 100k chars. `.txt`/`.md` only. PDF/DOCX return `skipped` with a clear message. |
| `lib/uploads/saveCaseFileUpload.ts` | Persists upload record to `case_file_uploads` table (requires migration 007). Gracefully returns ephemeral object when DB unavailable. |

### DB changes (migration 007)

- New table `case_file_uploads`: stores metadata and extracted text. No binary file storage.
- `draft_artifacts.artifact_type` constraint updated to add `case_file_summary`.

### API route

`POST /api/uploads/case-file` -- multipart/form-data. Fields: `file` (required), `documentRole` (optional, default `case_file`), `workflowRunId` (optional).
Returns `{ upload: CaseFileUploadResult, extractedText: string }`.
Returns structured 400 for unsupported types, oversized files, missing file. No stack traces.

### Agent changes

- `intakeAgent.ts`: `uploadedText` removed from `missingInputs` (it is optional).
- `draftingAgent.ts`: `buildFactsSection()` helper includes uploaded text with `[UPLOADED CASE MATERIAL]` label. LLM prompt includes up to 1,200 chars of uploaded text as factual source.
- `runLitigationWorkflow.ts`: Step 3b saves `case_file_summary` artifact when `uploadedText` is present.
- `getDraftWorkspace.ts`: `caseFileArtifact` field added to `DraftWorkspace`.

### UI changes

- `DraftLauncherForm.tsx`: file input, document role select, upload button, extracted text preview with character count. `uploadedText` passed to workflow on submit.
- `CaseFilePanel.tsx`: new panel showing role, character count, truncation status, and preview of uploaded text.
- `app/draft/[id]/page.tsx`: `CaseFilePanel` rendered as § 04c when `caseFileArtifact` is present.

### Separation of concerns

- Uploaded case files = factual/record source material
- `legal_opinion_chunks` = legal authority for retrieval
- The draft clearly labels uploaded content as `[UPLOADED CASE MATERIAL]`, not as cited authority.

### Smoke command

```bash
npm run smoke:upload-intake   # extraction tests, size/type limit tests, workflow with uploadedText
```

### Limitations

- `.txt` and `.md` only. PDF and DOCX are planned for a future phase.
- File blobs are not stored; only extracted text and metadata.
- Max 5 MB per file, max 100,000 extracted characters.

---

## Phase 15 Citation Worker

Adds an optional Python/eyecite worker alongside the existing TypeScript regex extractor. The TypeScript app routes citation extraction through an adapter that prefers the worker when available and falls back to regex automatically.

### Python worker (`workers/citation/`)

| File | Purpose |
|---|---|
| `app.py` | FastAPI app: `GET /health`, `POST /extract`. Wraps `eyecite.get_citations()`. Returns normalized citation list with `source: "eyecite"`. |
| `requirements.txt` | `fastapi`, `uvicorn[standard]`, `eyecite` |
| `README.md` | Setup, run, health check, extraction example, limitations |

Start worker:
```bash
source workers/citation/.venv/bin/activate
npm run worker:citation   # or: uvicorn workers.citation.app:app --host 127.0.0.1 --port 8015
```

Enable in app: set `CITATION_WORKER_URL=http://127.0.0.1:8015` in `.env.local`.

### TypeScript adapter (`lib/citations/citationExtractorAdapter.ts`)

`extractCitationsWithBestAvailableProvider(text)` -- async. Calls worker when `CITATION_WORKER_URL` is set; falls back to `extractCitations` (regex) on timeout/error/missing env var. Sets `extractorSource: "eyecite"` or `"regex"` on each result.

Timeout: 2 seconds. No crash if worker is down.

### Updated callers (all use adapter now)

- `app/api/citations/extract/route.ts`
- `lib/citations/verifyCitationsInText.ts`
- `mcp/tools/extractCitationsTool.ts`

### New API route

`GET /api/citations/worker-health` -- returns `{ configured, healthy, extractor, message }`.

### Type changes

`CitationExtractionResult` and `CitationVerificationResult` both gain optional `extractorSource?: "eyecite" | "regex" | "fallback"`. Existing consumers are unaffected (optional field).

### Smoke commands

```bash
npm run smoke:citation-worker         # adapter fallback test; passes without worker
npm run smoke:citation-worker-direct  # direct worker test; requires worker on port 8015
```

### Language constraints

- eyecite improves extraction; it does not constitute legal validation or Shepardization.
- `extractorSource` in results is a quality signal, not a completeness guarantee.
- Treatment verification remains limited to locally indexed opinions.

---

## Phase 16 Editable Motion Editor

Upgrades `/draft/[id]` from a read-only document preview to a textarea-based editable drafting workspace with version tracking and citation re-verification.

### New modules

| Path | Purpose |
|---|---|
| `lib/drafts/types.ts` | `DraftRevision`, `DraftSaveInput`, `DraftSaveResult`, `DraftVerificationRunResult`, `EditableDraft` |
| `lib/drafts/getEditableDraft.ts` | Load latest editable content (prefers latest revision if exists, falls back to artifact content) |
| `lib/drafts/saveDraftRevision.ts` | Update artifact content in-place + insert revision row; ephemeral fallback without DB |
| `lib/drafts/listDraftRevisions.ts` | Return revision history sorted newest-first |
| `lib/drafts/verifyDraftRevision.ts` | Run `verifyCitationsInText` on edited content, persist result to artifact |

### DB changes (migration 008)

- New `draft_revisions` table: `id`, `workflow_run_id`, `draft_artifact_id`, `version`, `content`, `edit_summary`, `verification_status`, `citation_summary`, `created_by`, `created_at`, `metadata`
- `WorkflowArtifactRow` gains optional `version?: number`
- `getLitigationWorkflowArtifacts` SELECT now includes `version`
- New helpers: `updateDraftArtifactContent`, `updateDraftArtifactVerification`, `insertDraftRevisionRecord`, `getDraftRevisionsByArtifactId`
- No changes to `draft_artifacts` schema or type constraint

### API routes added

| Route | Method | Purpose |
|---|---|---|
| `/api/drafts/[id]` | GET | Load editable draft (content, version, revisions) |
| `/api/drafts/[id]` | PATCH | Save revision; optional `verifyAfterSave: true` |
| `/api/drafts/[id]/verify` | POST | Re-run citation verification on latest or provided content |

### Components added

- `EditableMotionEditor.tsx` -- client component; textarea editor with Cmd/Ctrl+S, Save, Save+Verify buttons, dirty indicator, verification summary inline display
- `DraftRevisionHistory.tsx` -- client component; version list with verification status badges; collapses to toggle after 3 entries

### Draft workspace changes (`app/draft/[id]/page.tsx`)

- Left column: § 02 Motion Draft (EditableMotionEditor), § 03 Revision History, § 04 Authority Retrieved
- Right column: § 05 Verification Inspector, § 04b Judge Brief, § 04c Case File (conditional), § 05 Adversarial Review, § 06 Local Rules, § 07 Eval Summary
- Save+Verify calls `router.refresh()` to reload Verification Inspector from updated DB data

### Eval behavior note

The eval panel (§ 07) reflects the original workflow-run eval. Manual revisions update citation verification status on the artifact, but the full `FullWorkflowEval` (confidence, faithfulness, etc.) is not recomputed on each edit. A note in this area clarifies this limitation.

### Smoke command

```bash
npm run smoke:draft-editor   # save revision, list history, verify citations, edge cases
```

### Limitations

- Textarea only; no rich-text formatting
- Eval dashboard scores reflect original workflow run, not manual revisions
- Restore-to-previous-version not yet implemented
- Draft revisions table requires migration 008 to be applied in Supabase

---

## Phase 17 Draft Export (PDF, DOCX, TXT)

Adds server-side export of the latest saved draft revision to three formats. Content is pulled from the same priority chain used by the editor: latestRevision.content -> primaryDraft.content -> workflow.final_output.

### New modules (`lib/exports/`)

| Path | Purpose |
|---|---|
| `types.ts` | `ExportFormat`, `DraftExportOptions`, `DraftExportInput`, `DraftExportPayload`, `DraftExportResult`, `DocumentSection`, `CitationExportSummary` |
| `buildDraftExportPayload.ts` | Calls `getDraftWorkspace` + `getEditableDraft` in parallel; parses content into `DocumentSection[]`; returns full payload |
| `exportTxt.ts` | Synchronous Buffer; cover block + ruled separator + sections + optional appendices |
| `exportDocx.ts` | Uses `docx` package; Times New Roman 12pt; `await Packer.toBuffer(doc)` |
| `exportPdf.ts` | Uses `pdfkit` via dynamic import (server-only); LETTER size, 72pt margins, page numbers |
| `exportDraft.ts` | Orchestrator; routes to format-specific exporter; builds fileName and mimeType |

### API route

`GET /api/drafts/[id]/export?format=(pdf|docx|txt)&includeMetadata=true&includeVerificationSummary=true&includeJudgeBrief=false&includeLocalRulesReview=false&includeAdversarialReview=false`

Returns binary response with `Content-Disposition: attachment`. Returns 400 for invalid format, 500 on failure (no stack traces).

### Component added

`DraftExportControls.tsx` -- "use client"; three `<a href download>` anchor tags (PDF, DOCX, TXT); three checkboxes (Judge Brief, Local Rules, Adversarial); URL rebuilds on checkbox change via `useMemo`.

### Draft workspace changes (`app/draft/[id]/page.tsx`)

- Added § 04 Export (DraftExportControls) in left column, between Revision History and Authority Retrieved
- Authority Retrieved renumbered from § 04 to § 05

### Libraries used

- `docx@9.6.1` -- `Packer.toBuffer()` returns `Promise<Buffer>` directly
- `pdfkit@0.18.0` -- Node.js stream API; must not be imported on the client side
- `@types/pdfkit@0.17.6`

### Smoke command

```bash
npm run smoke:draft-export   # exportTxt/exportDocx/exportPdf directly + exportDraft orchestrator + MIME/fileName validation
```

### Limitations

- Exports are demo-grade only; not guaranteed court-filing ready
- pdfkit must remain server-side only (dynamic import)
- Cover page and citation summary are always included; appendices are opt-in

---

## Phase 18 Agent Trace Debugging View

Adds a read-only trace debugger for every litigation workflow run. Surfaces agent events, tool inputs/outputs, artifacts, citation reports, and a replay context snapshot.

### New modules (`lib/traces/`)

| Path | Purpose |
|---|---|
| `types.ts` | `TraceEvent`, `TraceArtifactLink`, `TraceCitationLink`, `AgentTraceGroup`, `TraceDebugSummary`, `TraceReplaySnapshot`, `TraceTimeline` |
| `buildWorkflowTrace.ts` | Loads workflow, events (with details), artifacts, citation reports; groups by agent; computes debug summary and replay snapshot |

### DB changes

No migration required. `litigation_agent_events` already has `tool_input`, `tool_output`, `metadata` columns.

- New `WorkflowEventDetailRow` interface (extends `WorkflowEventRow` with `tool_input`, `tool_output`, `metadata`)
- New `getLitigationWorkflowEventsWithDetails` DB function (separate from `getLitigationWorkflowEvents` used by the live feed)
- `AgentEventRecord.metadata` field added; `logAgentEvent` now passes it to the DB insert
- Orchestrator events in `runLitigationWorkflow` now include `stepIndex` in metadata

### API route

`GET /api/traces/[id]` -- returns `TraceTimeline` as JSON. 404 if workflow not found. 500 on failure. No stack traces.

### UI route (`app/traces/[id]/page.tsx`)

Six sections using the established design system:
- § 01 Trace Summary -- status, counts, latency, tokens, cost, slowest agent, first error
- § 02 Timeline -- chronological events with collapsible tool input/output/metadata via `<details>`/`<summary>`
- § 03 Agent Breakdown -- per-agent status, latency, artifact count
- § 04 Artifacts Created -- type, version, verification status, content preview, link to draft workspace
- § 05 Citation Reports -- per-citation existence/proposition status
- § 06 Replay Snapshot -- workflow context snapshot; note that replay execution is not active

### Components (`components/traces/`)

| Component | Purpose |
|---|---|
| `JsonDetails.tsx` | Safe JSON pretty-print with 2,000-char truncation; uses native `<details>`/`<summary>` |
| `TraceSummaryPanel.tsx` | Stats grid and first-error callout |
| `TraceEventCard.tsx` | Single event row with collapsible details |
| `TraceTimeline.tsx` | Chronological event list |
| `AgentBreakdownPanel.tsx` | Per-agent status and latency grid |
| `TraceArtifactPanel.tsx` | Artifact cards with content preview and draft workspace link |
| `TraceCitationPanel.tsx` | Citation report list with status badges |
| `ReplaySnapshotPanel.tsx` | Snapshot context + replay-not-active notice |

### Cross-links added

"Trace" link added to the breadcrumb of `/draft/[id]`, `/workflows/[id]`, and `/evals/[id]`.

### Smoke command

```bash
npm run smoke:trace-builder   # degrades gracefully without DB; verifies all type contracts
```

### Limitations

- Traces are read-only; replay execution is not implemented
- `tool_input`/`tool_output` fields are empty for most current agent events (agents log events via `makeEvent` without tool detail); they will populate for tool_call/tool_result events as agents are enriched
- The trace page requires Supabase; without DB it shows "database not configured" state

---

## Phase 19 Workflow Observability Dashboard

Adds first-party performance observability for litigation workflows. No external tracing integration.

### New modules (`lib/observability/`)

| Path | Purpose |
|---|---|
| `types.ts` | `WorkflowPerformanceSummary`, `AgentPerformanceSummary`, `AgentBreakdownStat`, `ObservabilityDashboardStats` |
| `metrics.ts` | `sumNumbers`, `average`, `percentile`, `clampNumber`, `safeMs`, `formatDurationMs`, `formatCost`, `formatTokens`, `estimateCostFromTokens` |
| `buildWorkflowPerformance.ts` | Builds `WorkflowPerformanceSummary` from `WorkflowRunRow` + `WorkflowEventRow[]`. Groups by agent, finds slowest, sums latency/tokens/cost, estimates cost from tokens when actual cost is unavailable. |
| `getObservabilityDashboardStats.ts` | Loads recent runs + batch events, builds per-run summaries, computes p50/p95, finds hotspots. |
| `timedAgentStep.ts` | Utility for wrapping agent steps with automatic latency and error logging. Not wired into existing agents. |

### DB changes

- `insertLitigationAgentEvent` now inserts `token_count` and `cost_usd` (previously skipped)
- `AgentEventRecord` gains `tokenCount?` and `costUsd?`
- `logAgentEvent` passes them through
- New `getLitigationWorkflowEventsBatch(ids[])` -- single `IN (...)` query for batch event loading

### UI route (`app/observability/page.tsx`)

Five sections:
- § 01 Workflow Performance -- 8 metric cards (total runs, completed, failed, avg/p95 duration, avg tokens, avg cost, avg confidence)
- § 02 Recent Workflows -- table with duration, events, tokens, cost, confidence, citation pass rate, trace link
- § 03 Agent Breakdown -- aggregated by agent across all recent runs, sorted by total latency
- § 04 Hotspots -- slowest run, most expensive run, most failure-prone agent, runs missing event data
- § 05 Notes -- cost estimate disclaimer, latency explanation, no-external-telemetry notice

### Components (`components/observability/`)

MetricCard, ObservabilityOverviewCards, RecentWorkflowPerformanceTable, AgentPerformanceTable, ObservabilityHotspots, ObservabilityNotes.

### Cross-links

- "Observe" added to main navigation
- "Observe" link in /traces/[id] breadcrumb
- "Performance Observability" link on /evals page
- "Observe" link on /workflows list page

### Smoke command

```bash
npm run smoke:observability   # mock data tests + real DB if available
```

### Cost / token notes

- `cost_usd` populated only when LLM provider returns it in API response
- When absent but `token_count` is present, cost is estimated using a conservative placeholder rate
- Estimates labeled with `~` prefix and "(est.)" in UI; `costIsEstimated: true` on `WorkflowPerformanceSummary`
- `estimateCostFromTokens` uses 0.002 per 1k tokens as placeholder -- not guaranteed to match any provider's actual pricing

### Limitations

- No external telemetry integration (LangSmith, Langfuse, Datadog, OpenTelemetry)
- Token counts are currently 0 for most events since agents don't capture LLM response token usage
- Dashboard requires Supabase; without DB it shows "no data" state

---

## Phase 20 Matters and Saved Workspaces

Adds a matter workspace layer that groups workflow runs, uploads, and drafts under a single named legal matter.

### Auth state

No auth is wired. `user_id` and `organization_id` on `matters` are nullable. The app remains fully demo-first. RLS uses service_role bypass (same pattern as litigation tables). Auth-gated per-user policies and Supabase Auth integration are future work.

### Migration (`supabase/migrations/009_matters_workspaces.sql`)

- New table `matters`: id, organization_id (nullable), user_id (nullable), title, client_name, matter_type, jurisdiction, court, judge_id (FK), status, description, metadata, timestamps
- New table `matter_files`: id, matter_id, case_file_upload_id, title, file_role, extracted_text_preview
- `matter_id` nullable FK added to: `litigation_workflow_runs`, `draft_artifacts`, `case_file_uploads`, `draft_revisions`
- RLS enabled on both new tables; service_role-only policy (no open select for private matter data)

### DB additions (`lib/db/supabaseServer.ts`)

- `MatterRow`, `MatterFileRow` interfaces
- `insertMatterRecord`, `updateMatterRecord`, `getMatterById`, `listMatterRecords`
- `getMatterWorkflowRuns(matterId)`, `getMatterFiles(matterId)`, `insertMatterFile`
- `linkWorkflowRunToMatter(workflowRunId, matterId)`
- `matter_id` field added to `WorkflowRunRow`; both SELECT queries updated
- `insertLitigationWorkflowRun` accepts `matterId`
- `insertCaseFileUploadRecord` accepts `matterId`

### Library (`lib/matters/`)

| File | Purpose |
|---|---|
| `types.ts` | `Matter`, `MatterFile`, `MatterWorkspace`, `CreateMatterInput`, `UpdateMatterInput`, `MatterWorkflowSummary`, `MatterQualitySignals` |
| `createMatter.ts` | Inserts matter; `buildEphemeralMatter` for no-DB context |
| `getMatter.ts` | Fetches single matter by ID |
| `listMatters.ts` | Lists matters newest-first |
| `updateMatter.ts` | Updates matter fields |
| `linkWorkflowToMatter.ts` | Sets matter_id on a workflow run |
| `getMatterWorkspace.ts` | Loads matter + workflows + files + quality signals |

### Workflow and upload linkage

- `LitigationWorkflowInput` gains `matterId?: string`
- `createWorkflowRun` passes it to `insertLitigationWorkflowRun`
- `/api/litigation/workflows` accepts `matterId` in request body
- `CaseFileUploadInput` gains `matterId?: string`
- `saveCaseFileUpload` calls `insertMatterFile` automatically when `matterId` is set and extraction succeeded
- `/api/uploads/case-file` accepts `matterId` as form field

### Routes added

| Route | Type | Purpose |
|---|---|---|
| `/matters` | Server | List matters |
| `/matters/new` | Client | Create matter form |
| `/matters/[id]` | Server | 6-section workspace |
| `GET /api/matters` | API | List matters |
| `POST /api/matters` | API | Create matter |
| `GET /api/matters/[id]` | API | Workspace data |
| `PATCH /api/matters/[id]` | API | Update matter |

### Workspace sections (`/matters/[id]`)

- § 01 Matter Summary -- title, client, type, jurisdiction, status, description
- § 02 Start Draft Workflow -- compact launcher pre-filled with matter context, attaches matterId
- § 03 Matter Files -- file upload + list of attached files
- § 04 Drafts and Workflows -- all workflows with draft/inspection/eval/trace links
- § 05 Recent Quality Signals -- confidence, citation pass rate, faithfulness from latest completed workflow
- § 06 Notes -- matter description (shown only when present)

### Components (`components/matters/`)

`MatterListTable`, `MatterForm`, `MatterSummaryPanel`, `MatterDraftLauncher`, `MatterFilesPanel`, `MatterWorkflowTable`, `MatterQualityPanel`

### Cross-links

"Matter" link added to `/draft/[id]`, `/workflows/[id]`, `/evals/[id]`, `/traces/[id]` breadcrumbs when `workflow.matter_id` is set. "Matters" added to main navigation.

### Smoke command

```bash
npm run smoke:matters   # ephemeral matter, createMatter, getMatterWorkspace, listMatters
```

### Limitations

- Auth not wired; per-user data isolation is future work
- No matter deletion (safe default -- would cascade to linked workflows/files)
- No matter-level export or reporting
- No collaboration (comments, sharing)

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

## Phase 8 Local Rules Agent

Upgrades the Local Rules Agent from a static string-list to a structured, section-aware review module.

### Static rules module (`lib/litigation/localRules/`)

| File | Purpose |
|---|---|
| `types.ts` | `LocalRuleProfile`, `SectionCheckResult`, `LocalRulesResult` interfaces |
| `rules.ts` | Static profile data for three jurisdictions |
| `getLocalRules.ts` | Selects profile by jurisdiction/court string matching |
| `checkDraftAgainstRules.ts` | Keyword-based section detection; returns per-section detected/missing status |

### Supported profiles

| Profile ID | Label |
|---|---|
| `sdny` | Southern District of New York (SDNY) |
| `federal_generic` | Federal Court (Generic) |
| `new_york_state_generic` | New York State Court (Generic) |

Each profile includes: `formattingNotes`, `requiredSections`, `citationNotes`, `filingNotes`, `limitations`.

### Local Rules Agent behavior (`lib/litigation/agents/localRulesAgent.ts`)

Upgraded output (`LocalRulesAgentOutput`) includes:
- `profileId` / `profileLabel` — which profile was applied
- `sectionChecks` — per-section detected/required/missing status
- `missingSections` — list of required sections not detected in draft
- `warnings` — dynamic warnings based on motion type and jurisdiction
- `citationNotes`, `filingNotes` — from profile
- `confidence` — 0.8 when all sections detected, 0.6 for 1-2 missing, 0.4 for 3+
- `artifactContent` — formatted review text saved to `draft_artifacts`

The agent now receives the draft text (`draftText`) from Step 5 (DraftingAgent) and runs section detection before producing the review.

### Drafting Agent formatting changes

Deterministic fallback now uses stable section headings:
- PRELIMINARY STATEMENT
- STATEMENT OF RELEVANT FACTS
- LEGAL STANDARD
- ARGUMENT
- CONCLUSION

LLM prompt updated to request the same headings. Stable headings enable reliable section detection by the Local Rules Agent.

### Persistence

`local_rules_check` artifact now saved with `metadata.localRules` containing the full structured `LocalRulesAgentOutput`. This allows `LocalRulesPanel` to read structured data directly.

### Local Rules Panel behavior

`LocalRulesPanel.tsx` reads from `artifact.metadata.localRules` when available. Shows:
- Profile label and confidence
- Section analysis grid with pass (detected) / fail (missing) badges
- Warnings (amber)
- Formatting notes, citation notes, filing notes
- Limitations block

Falls back to text parsing for older artifacts without structured metadata.

### Document Preview improvements

`DocumentPreview.tsx` now classifies blocks into four types:
- `heading-main` — Roman numeral or all-caps standard heading; rendered with ruling separator
- `heading-sub` — letter-prefix sub-headings (A., B.); rendered in mono at smaller weight
- `note` — lines starting with "NOTE:" or "[DEMO"; rendered amber with left border
- `para` — standard legal prose; rendered in EB Garamond serif

### Limitation: artifact_type constraint

`draft_artifacts.artifact_type` is constrained to the values in migration 004. `local_rules_review` is not in that constraint; `local_rules_check` is used instead. A future migration can rename the type if needed.

### Language constraint

These notes are drafting reminders only. Every profile and panel includes an explicit limitation statement that this does not constitute a compliance certification or legal advice.

### Smoke command

```bash
npm run smoke:local-rules   # loads SDNY profile, checks complete and incomplete drafts, runs agent
```

---

## Phase 9 Evals Dashboard

Adds a quality metrics surface for completed workflow runs. This is an internal quality signal only -- not legal advice, not a compliance certification, not a hallucination-free guarantee.

### Eval computation module (`lib/litigation/evals/`)

| File | Purpose |
|---|---|
| `types.ts` | `FullWorkflowEval`, `WorkflowEvalSummary`, `CitationQualityMetrics`, `RetrievalQualityMetrics`, `ArtifactQualityMetrics`, `AgentRuntimeMetrics`, `EvalDashboardStats` |
| `computeWorkflowEval.ts` | Accepts persisted DB rows; computes full eval metrics with weighted confidence formula |
| `saveWorkflowEval.ts` | Inserts `workflow_eval` artifact to `draft_artifacts`; requires migration 006 |
| `getEvalDashboardStats.ts` | Loads recent runs, computes aggregate pass/warn/fail counts in-memory |

### Confidence formula

```
overallConfidence = citationPassRate * 0.35 + faithfulnessScore * 0.25 + retrievalCoverage * 0.15
                  + localRulesCompleteness * 0.10 + adversarialSafetyScore * 0.10 + judgeScore * 0.05
```

`passFail`: "pass" if confidence >= 0.75 AND zero failed citations; "warn" if >= 0.55; "fail" otherwise.

### Eval Agent upgrade (`lib/litigation/agents/evalAgent.ts`)

Now accepts `localRulesOutput` and `judgeBrief` as inputs from prior agents. Builds synthetic `WorkflowArtifactRow` and `WorkflowRunRow` objects to feed `computeWorkflowEval` in-memory (before artifacts are persisted to DB). Output still produces `EvalAgentOutput` (= `EvalSummary`) for backward compatibility with the main workflow result type.

### Migration 006 (`supabase/migrations/006_workflow_eval_artifact.sql`)

Drops and recreates the `draft_artifacts.artifact_type` check constraint to add `workflow_eval`. Without this migration applied, `saveWorkflowEval` silently no-ops (the workflow still completes).

### Routes added

| Route | Type | Purpose |
|---|---|---|
| `/evals` | Server component | Aggregate quality dashboard: overview cards, recent eval table |
| `/evals/[id]` | Server component | Per-run full eval: 8 score bars, citation quality, retrieval quality, artifact quality, agent runtime |

### Components added (`components/evals/`)

| Component | Purpose |
|---|---|
| `EvalScoreBar.tsx` | Reusable score bar with color-coded percentage; `invert` prop inverts the color logic (low = good) |
| `EvalOverviewCards.tsx` | Grid of aggregate stat cards (total, average confidence, pass/warn/fail counts) |
| `RecentEvalTable.tsx` | Client component; clickable rows navigate to `/evals/[id]` |
| `CitationQualityPanel.tsx` | pass/warn/fail/unknown citation counts with pass rate |
| `RetrievalQualityPanel.tsx` | Authority coverage metrics |
| `ArtifactQualityPanel.tsx` | hasDraft/hasAdversarial/hasLocalRules/hasJudgeBrief badges, section coverage bar |
| `AgentRuntimePanel.tsx` | Total events, agents completed/failed, latency, token count, cost |
| `EvalWarningsPanel.tsx` | Warning list rendered in amber mono |

### DraftEvalPanel upgrade

`DraftEvalPanel.tsx` now accepts `fullEval?: FullWorkflowEval | null` (passed from `getDraftWorkspace`). When present: shows retrieval coverage, local rules completeness, adversarial risk bars and up to 3 warnings. Footer links to `/evals/[workflow.id]`.

### Language constraints

- Eval scores are internal quality signals -- not a claim of zero hallucination.
- "Internal quality signal only" must appear in any public-facing eval surface.
- Do not claim these metrics constitute legal advice or a compliance audit.

### Smoke command

```bash
npm run smoke:workflow-eval   # 3-step: compute eval from sample data, dashboard stats, verify incomplete draft scores lower
```

---

## Phase 10 MCP Server

Adds a Model Context Protocol server that exposes LexOrchestrator litigation tools over stdio. The old seven-agent research pipeline and all app routes remain unchanged.

### Entrypoint

`mcp/server.ts` -- McpServer with StdioServerTransport. Loads env vars via dotenv before importing any tool modules so DB and LLM env vars are available at module load time.

### Tools exposed (`mcp/tools/`)

| File | Tool name | Calls |
|---|---|---|
| `searchLegalOpinionsTool.ts` | `search_legal_opinions` | `lib/retrieval/searchLegalOpinions` |
| `extractCitationsTool.ts` | `extract_citations` | `lib/citations/extractCitations` |
| `verifyCitationTool.ts` | `verify_citation` | `lib/citations/verifyCitation` |
| `runLitigationWorkflowTool.ts` | `run_litigation_workflow` | `lib/litigation/runLitigationWorkflow` |
| `getWorkflowStatusTool.ts` | `get_workflow_status` | `lib/litigation/getWorkflowRun` |
| `getDraftArtifactsTool.ts` | `get_draft_artifacts` | `lib/litigation/getWorkflowArtifacts` |
| `getJudgeBriefTool.ts` | `get_judge_brief` | `lib/litigation/judges/{findJudge,getJudgeProfile}` |
| `getEvalSummaryTool.ts` | `get_eval_summary` | `lib/litigation/evals/computeWorkflowEval` |
| `getLocalRulesProfileTool.ts` | `get_local_rules_profile` | `lib/litigation/localRules/getLocalRules` |

### Transport

stdio only. SSE is future work.

### Input validation

Zod schemas passed directly to `registerTool`. `limit` clamped to 1-20. Required string fields validated with `z.string().min(1)`.

### Package scripts

```bash
npm run mcp:server   # start the MCP server (waits for stdio input)
npm run smoke:mcp    # directly calls tool handler functions; does not require Claude Desktop
```

### Claude Desktop config path

`~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
`%APPDATA%\Claude\claude_desktop_config.json` (Windows)

See `mcp/README.md` for the full config block.

### Limitations

- SSE transport not yet implemented
- Citation verification and opinion search are limited to locally indexed data
- Judge brief requires seeded profiles (`npm run seed:litigation-demo`)
- All tools degrade gracefully with no env vars

### Smoke command

```bash
npm run smoke:mcp   # search, extract, verify, local rules, and full workflow
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
