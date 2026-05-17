# LexOrchestrator Roadmap

Phases 0-12 are complete. This document covers the planned next phases.

---

## Phase 13: File Upload Intake

**Goal:** Allow attorneys to attach a PDF or plain-text document (complaint, contract, prior brief) to a draft request.

**Why it matters:** The current system accepts facts as a typed text field. Real drafting starts from documents. Upload intake lets the retrieval and drafting agents work from the actual record rather than a summarized description.

**Deliverables:**
- File upload field on `/draft` form
- Server-side text extraction (PDF → plain text via `pdf-parse` or similar)
- Extracted text passed to the workflow as `uploadedText`
- Chunked and indexed alongside retrieved authority for in-context grounding
- UI display of uploaded document alongside generated draft

**Not included:** OCR for scanned documents, Bates-stamp parsing, exhibit management.

---

## Phase 14: Real CourtListener / CAP Ingestion Pipeline

**Goal:** Replace demo fixture opinions with a real, regularly updated corpus of published court opinions.

**Why it matters:** Citation verification and retrieval quality are bounded by corpus size. Three demo opinions are enough to demonstrate the architecture but not enough to make verification useful in practice. CourtListener and the Harvard Caselaw Access Project (CAP) provide free access to millions of published opinions.

**Deliverables:**
- CourtListener bulk opinion ingestion script
- CAP bulk ingestion script (alternative)
- Opinion chunking and pgvector embedding pipeline
- Citation edge import from CourtListener citation graph
- Incremental update job (daily or weekly)
- Corpus size dashboard on `/evals`

**Not included:** Westlaw or Lexis integration (proprietary APIs), real-time CourtListener streaming.

---

## Phase 15: Citation Verification Upgrade

**Goal:** More rigorous citation extraction and verification using a Python worker and the eyecite library.

**Why it matters:** The current regex extractor covers common citation forms but misses abbreviations, parallel citations, and supra/infra references. eyecite is a production-grade Python citation parser used by CourtListener.

**Deliverables:**
- Python worker service wrapping eyecite for extraction
- API endpoint for the worker (REST or subprocess)
- TypeScript client in `lib/citations/` replacing or complementing the regex extractor
- Improved normalization (eyecite canonical forms)
- Parallel citation detection
- `supra` and `id.` reference resolution

**Not included:** Westlaw/Lexis direct lookup, citation authority ranking beyond local corpus.

---

## Phase 16: Motion Editor (Complete)

**Goal:** Editable inline motion editor on the draft workspace.

**Why it matters:** The current draft workspace is read-only. Attorneys need to edit the generated outline, add their own arguments, and see the verification inspector update as citations change.

**Deliverables:**
- Rich text editor on `/draft/[id]` (ProseMirror or TipTap)
- Inline citation highlighting linked to Verification Inspector
- Re-verify on citation change (debounced call to `verify_citation` MCP tool or API)
- Section-level re-drafting (select a section, regenerate with revised prompt)
- Auto-save to `draft_artifacts` on edit

**Not included:** Multi-user collaborative editing, version history diff view.

---

## Phase 17: Export to PDF / DOCX (Complete)

**Goal:** One-click export of the motion draft to PDF, DOCX, or TXT.

**Why it matters:** Attorneys file in court, not in a browser. The output needs to leave the system in a format that can be filed, shared, or edited in Word.

**Deliverables:**
- PDF export via `pdfkit` (LETTER, page numbers, cover block)
- DOCX export via `docx` package (Times New Roman 12pt, HeadingLevel.HEADING_1 for sections)
- TXT export (UTF-8, ruled separators, same content priority chain)
- Optional appendices: citation verification summary, judge brief, local rules review, adversarial review
- `DraftExportControls` component on `/draft/[id]` with checkboxes for appendices
- Download via `GET /api/drafts/[id]/export?format=(pdf|docx|txt)`
- Content pulled from latest saved revision; falls back to artifact content then workflow output

**Not included:** E-filing integration, court-specific CM/ECF formatting, rich-text preservation.

---

## Phase 18: Agent Trace Debugging View (Complete)

**Goal:** Inspectable trace view for every litigation workflow run.

**Why it matters:** Debugging agent pipelines requires readable access to what each agent received, produced, and how long it took. The trace view surfaces this without requiring DB access.

**Deliverables:**
- `/traces/[id]` -- six-section trace page: summary, timeline, agent breakdown, artifacts, citation reports, replay snapshot
- `GET /api/traces/[id]` -- JSON trace endpoint returning full TraceTimeline
- `buildWorkflowTrace` library function in `lib/traces/`
- `tool_input`, `tool_output`, `metadata` now surfaced on events via `getLitigationWorkflowEventsWithDetails`
- `stepIndex` metadata on orchestrator-level events
- Cross-links from `/draft/[id]`, `/workflows/[id]`, `/evals/[id]` to `/traces/[id]`
- Collapsible JSON details panels via native `<details>`/`<summary>` (no client-side JS required)

**Not included:** Live replay execution, interactive prompt editing, diff view between iterations.

---

## Phase 19: Workflow Observability Dashboard (Complete)

**Goal:** Per-run and aggregate cost, latency, and token tracking.

**Why it matters:** Understanding pipeline performance requires visibility into which agents are slow, which runs are expensive, and where failures concentrate -- without requiring external tooling.

**Deliverables:**
- `/observability` -- five-section dashboard: performance overview, recent workflows table, agent breakdown, hotspots, notes
- `lib/observability/` -- types, metrics utilities, `buildWorkflowPerformance`, `getObservabilityDashboardStats`, `timedAgentStep`
- `components/observability/` -- MetricCard, ObservabilityOverviewCards, RecentWorkflowPerformanceTable, AgentPerformanceTable, ObservabilityHotspots, ObservabilityNotes
- `tokenCount` and `costUsd` wired through `AgentEventRecord` -> `logAgentEvent` -> DB insert
- Batch event loader (`getLitigationWorkflowEventsBatch`) for efficient dashboard queries
- p50/p95 duration and cost percentiles computed in-memory
- Cost labeled as estimated when derived from token counts rather than recorded actuals
- Cross-links from /workflows, /evals, /traces/[id] to /observability
- "Observe" added to main navigation

**Not included:** External tracing integrations (LangSmith, Langfuse, Datadog, OpenTelemetry), multi-tenant cost allocation, alert thresholds, billing integration.

---

## Phase 20: Matters and Saved Workspaces (Complete)

**Goal:** Matter workspace layer to organize workflows, uploads, drafts, and evaluations.

**Why it matters:** Without matters, every workflow run is an isolated operation. Grouping by matter gives attorneys a workspace to track all work on a case in one place.

**Deliverables:**
- `matters` and `matter_files` tables (migration 009)
- `matter_id` nullable FK added to `litigation_workflow_runs`, `draft_artifacts`, `case_file_uploads`, `draft_revisions`
- `/matters` list page, `/matters/new` create form, `/matters/[id]` workspace with 6 sections
- `MatterDraftLauncher` client component pre-fills jurisdiction/court from matter and attaches `matterId` to workflow
- `MatterFilesPanel` client component for uploading `.txt`/`.md` files to a matter
- Upload and workflow API routes accept optional `matterId`
- `saveCaseFileUpload` creates a `matter_files` row automatically when `matterId` is provided
- "Matter" cross-link added to `/draft/[id]`, `/workflows/[id]`, `/evals/[id]`, `/traces/[id]`
- "Matters" added to main navigation
- Auth is not required -- `user_id` and `organization_id` remain nullable; demo mode fully supported
- RLS uses service_role pattern matching existing tables; per-user policies are future work

**Not included:** Supabase Auth integration, RLS auth-gated policies, Clio/iManage integration, billing, collaboration.

---

## Phase 21: Deployment Hardening (Complete)

**Goal:** Production-grade deployment readiness without adding new product features.

**Why it matters:** A portfolio demo that can be publicly deployed needs env validation, health routes, no local-only assumptions, and deployment documentation.

**Deliverables:**
- `GET /api/health` -- lightweight health check with db and worker reachability
- `GET /api/health/env` -- env configuration status (no secret values)
- `lib/env/validateEnv.ts` -- `getEnvStatus()` and `assertProductionEnvSafe()` with masked availability
- `lib/utils/logger.ts` -- structured logger (console.warn/error, NODE_ENV-aware, no secret output)
- `scripts/check-deployment-readiness.ts` + `npm run check:deployment`
- `.env.example` with placeholder-only values and comments
- `docs/DEPLOYMENT.md` -- full deployment guide (Vercel + Supabase + optional worker)
- `check:all` updated to include `check:demo`, `check:deployment`, lint, tsc, build

**Not included:** Rate limiting, Kubernetes, CDN, migration runner on deploy, CI/CD pipeline.

---

## Phase 22: Final Portfolio Polish

**Goal:** Final interview-ready documentation, demo video, and portfolio presentation.

**Why it matters:** A technically complete project still needs clear communication to be effective as a portfolio artifact.

**Deliverables:**
- Recorded 4-5 minute demo video
- One-page technical architecture summary (PDF)
- Updated README with final phase coverage
- Clean git history: no debug commits, no WIP messages
- All smoke tests green on a clean clone with no env vars

**Not included:** Public launch, marketing site.
