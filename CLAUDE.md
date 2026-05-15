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

## Key Files
```
lib/llm/config.ts           — provider detection (OpenRouter vs OpenAI)
lib/llm/llmClient.ts        — chat completions wrapper
lib/llm/embeddingClient.ts  — embeddings wrapper with hash fallback
lib/db/supabaseServer.ts    — all DB reads/writes (server-only)
lib/types.ts                — all shared TypeScript interfaces
lib/utils/display.ts        — defensive display helpers (normalizedScore, text, asRecord, etc.)
lib/retrieval/searchLegalCorpus.ts  — hybrid RAG scoring
lib/orchestrator/runOrchestration.ts — pipeline entry point
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
