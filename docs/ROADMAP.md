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

## Phase 17: Export to PDF / DOCX

**Goal:** One-click export of the motion draft to PDF or DOCX.

**Why it matters:** Attorneys file in court, not in a browser. The output needs to leave the system in a format that can be filed, shared, or edited in Word.

**Deliverables:**
- PDF export via Puppeteer or `@react-pdf/renderer`
- DOCX export via `docx` package
- Correct legal document formatting: header, page numbers, case caption
- Export button on `/draft/[id]`
- Download via `/api/draft/[id]/export?format=pdf`

**Not included:** E-filing integration, court-specific CM/ECF formatting.

---

## Phase 18: Agent Trace Replay and Debugging View

**Goal:** Replay any agent run step-by-step with full input/output at each stage.

**Why it matters:** Debugging agent pipelines currently requires reading raw event rows. A replay UI lets developers and reviewers understand exactly what each agent received and produced.

**Deliverables:**
- Step-through UI on `/workflows/[id]`
- Per-step view: agent name, inputs, LLM prompt (if applicable), raw output, latency
- Diff view between successive drafting iterations
- Export trace as JSON for offline analysis

**Not included:** Live breakpoints, interactive prompt editing.

---

## Phase 19: Cost, Latency, and Token Observability

**Goal:** Per-run and aggregate cost, latency, and token tracking.

**Why it matters:** Production deployment requires cost control. A $0.02 per run vs $0.20 per run difference matters at scale. The current eval dashboard tracks latency but not cost.

**Deliverables:**
- Token count and cost estimate stored per agent event
- Aggregate cost dashboard on `/evals`
- Per-model cost config in `lib/llm/config.ts`
- Alert threshold for unexpectedly expensive runs
- Weekly cost summary export

**Not included:** Multi-tenant cost allocation, billing integration.

---

## Phase 20: Auth, Matters, and Saved Workspaces

**Goal:** User accounts, matter organization, and saved draft history.

**Why it matters:** The current system is single-user with no persistence beyond the DB. A production surface needs attorneys to log in, organize work by matter, and access prior drafts.

**Deliverables:**
- Supabase Auth integration (email/password or OAuth)
- `matters` table: case name, docket number, jurisdiction, court, assigned attorneys
- Draft and workflow runs scoped to matter and user
- Matter dashboard: `/matters` and `/matters/[id]`
- RLS policies enforcing user-scoped data access

**Not included:** Clio/iManage integration, multi-tenant organizations, billing.

---

## Phase 21: Deployment Hardening

**Goal:** Production-grade deployment configuration.

**Why it matters:** The current setup runs on `npm run dev`. A portfolio demo benefits from a publicly accessible deployment.

**Deliverables:**
- Vercel or Railway deployment configuration
- Environment variable management via Vercel env or Railway secrets
- Migration runner on deploy
- Health check endpoint (`/api/health`)
- Rate limiting on `/api/litigation/workflows` to prevent abuse
- `npm run build` enforced in CI

**Not included:** Kubernetes, custom CDN, WAF.

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
