# Deployment

LexOrchestrator is a Next.js 16 (App Router) application. This document covers deploying to Vercel with Supabase, with notes on the optional Python citation worker and the local-only MCP server.

---

## Recommended Architecture

| Component | Service | Notes |
|---|---|---|
| Next.js app | Vercel (or any Node.js host) | Main web application and API routes |
| Database + vector search | Supabase (Postgres + pgvector) | Required for persistence; app runs in demo mode without it |
| Citation worker (optional) | Render / Fly.io / Railway | Python FastAPI service; regex fallback when absent |
| MCP server | Local (stdio) | Not hosted; runs on developer machines or in Claude Desktop |

---

## Environment Variables

| Variable | Required | Public | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Yes | Supabase project URL. Enables DB-backed workflow runs. |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | No | Server-only. Used for all DB writes (bypasses RLS). Never expose to browser. |
| `SUPABASE_ANON_KEY` | Optional | No | Reserved for future client-side auth. Not currently used. |
| `OPENROUTER_API_KEY` | Optional | No | LLM key via OpenRouter (recommended). Deterministic fallback when absent. |
| `OPENAI_API_KEY` | Optional | No | LLM key via OpenAI (used only if OPENROUTER_API_KEY is not set). |
| `CITATION_WORKER_URL` | Optional | No | URL of the Python eyecite worker. Regex fallback when absent. |
| `NEXT_PUBLIC_APP_URL` | Recommended | Yes | Absolute base URL of the deployed app (e.g. `https://your-app.vercel.app`). |

Copy `.env.example` to `.env.local` to get started. Never commit `.env.local` or `.env` to git.

---

## Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com).

2. Enable the pgvector extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

3. Apply migrations in order via Supabase Dashboard > SQL Editor:
   ```
   supabase/migrations/001_lexorchestrator_phase1.sql
   supabase/migrations/002_hybrid_rag_pgvector.sql
   supabase/migrations/003_schema_redesign.sql
   supabase/migrations/004_litigation_workflow_foundation.sql
   supabase/migrations/005_search_legal_opinions.sql
   supabase/migrations/006_workflow_eval_artifact.sql
   supabase/migrations/007_case_file_uploads.sql
   supabase/migrations/008_draft_revisions.sql
   supabase/migrations/009_matters_workspaces.sql
   ```

4. Seed demo data (optional but recommended for the demo workflow):
   ```bash
   npm run seed:litigation-demo
   ```

5. Configure environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` -- your project URL (from Settings > API)
   - `SUPABASE_SERVICE_ROLE_KEY` -- service role key (from Settings > API > Service Role)

RLS notes:
- All tables have RLS enabled.
- The server always uses `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS.
- Per-user auth-gated policies are future work (Phase 22+).
- The `matters` table uses service_role-only read (no open select policy). All other litigation tables use open policies for demo access.

---

## Citation Worker Deployment (Optional)

The Python eyecite citation worker improves citation extraction quality. The app falls back to a built-in regex extractor when the worker is absent -- no configuration change required.

If you want to deploy it:

1. Deploy `workers/citation/` to Render, Fly.io, or Railway.

2. Start command:
   ```bash
   uvicorn workers.citation.app:app --host 0.0.0.0 --port 8015
   ```

3. Health check endpoint: `GET /health`

4. Set `CITATION_WORKER_URL=https://your-worker.onrender.com` in your app's environment.

5. Verify via the app health route:
   ```
   GET /api/health
   ```

See `workers/citation/README.md` for full worker setup instructions.

---

## Vercel Deployment

1. Push your repo to GitHub. Connect to Vercel (Import Project).

2. Build settings (Vercel auto-detects these for Next.js):
   - Build command: `npm run build`
   - Output directory: `.next`
   - Install command: `npm install`

3. Set environment variables in Vercel Dashboard > Settings > Environment Variables:
   - All server-only vars (no `NEXT_PUBLIC_` prefix) must be set as server-only.
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_APP_URL` are safe to expose to the browser.
   - Do not expose `SUPABASE_SERVICE_ROLE_KEY` as a public variable.

4. Deploy.

5. Post-deploy checks (see below).

---

## Post-Deploy Checks

Run these after every production deployment:

```bash
# Health check (should return { "status": "ok" })
curl https://your-app.vercel.app/api/health

# Env status (should return no secrets)
curl https://your-app.vercel.app/api/health/env
```

Manual spot-checks:
- `/draft` -- new draft form loads
- `/matters` -- matters list loads (empty without DB is fine)
- `/evals` -- evals list loads
- `/observability` -- observability dashboard loads
- Submit a demo workflow from `/draft` and confirm redirect to `/draft/[id]`

Run smoke tests locally before deploying:
```bash
npm run smoke:demo-path
npm run smoke:matters
npm run smoke:observability
```

---

## Known Deployment Limitations

- No live CourtListener or external opinion database required. All retrieval works against the locally seeded corpus.
- Large file uploads (.txt/.md up to 5 MB) work on Vercel without extra configuration. Very large uploads may hit Vercel's 4.5 MB request body limit -- use a dedicated upload service for production scale.
- PDF and DOCX export is server-side and works on Vercel. Load-test before high-volume use; pdfkit is synchronous.
- The MCP server is stdio-only and runs on developer machines. It is not a hosted service and does not need to be deployed.
- The citation Python worker requires a separate deployment (optional). The app works without it.

---

## Rollback Plan

1. Revert the Vercel deployment to the previous successful deployment via the Vercel Dashboard.
2. If an LLM key is causing errors, remove `OPENROUTER_API_KEY` / `OPENAI_API_KEY` from Vercel env vars. The app will fall back to deterministic agent outputs.
3. If the citation worker is causing issues, remove `CITATION_WORKER_URL`. The app will use the regex extractor automatically.
4. If the database is unavailable, the app runs in memory-only demo mode. Remove Supabase env vars to confirm fallback works.

---

## Local Pre-Deploy Checklist

```bash
npm run check:safety       # no secrets or forbidden terms
npm run check:demo         # all demo routes and modules present
npm run check:deployment   # deployment docs, health routes, scripts present
npm run lint               # ESLint clean
npx tsc --noEmit           # TypeScript clean
npm run build              # production build passes
npm run smoke:demo-path    # end-to-end workflow smoke test
npm run smoke:matters      # matters smoke test
npm run smoke:observability # observability smoke test
```
