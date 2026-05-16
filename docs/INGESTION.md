# LexOrchestrator Ingestion

## Overview

LexOrchestrator uses two separate retrieval corpora:

| Corpus | Tables | Purpose |
|---|---|---|
| Research corpus | `documents`, `document_chunks` | Legacy seven-agent pipeline (`/research`) |
| Legal opinions | `legal_opinions`, `legal_opinion_chunks`, `legal_citation_edges` | Litigation workflow (`/draft`) |

## Research Corpus

Seeded via:

```bash
npm run seed:legal          # 12 sample educational chunks
npm run seed:constitution   # 14 US Constitution chunks (primary source, authority boost)
npm run embed:legal         # backfill pgvector embeddings (requires API key)
```

Retrieval: `lib/retrieval/searchLegalCorpus.ts` -- hybrid RAG with pgvector + keyword.

## Legal Opinions Corpus

Seeded via:

```bash
npm run seed:litigation-demo
```

Seeds three demo court opinions (Daubert, Kumho Tire, General Electric v. Joiner) with chunks, one demo judge (Jed S. Rakoff), and two judge profiles.

Retrieval: `lib/retrieval/searchLegalOpinions.ts` -- hybrid RAG over `legal_opinion_chunks`.

SQL search functions (migration 005): `match_legal_opinion_chunks()`, `search_legal_opinion_chunks_fulltext()`.

## Citation Edges

The `legal_citation_edges` table stores opinion-to-opinion citation relationships. In the demo seed, edges are minimal. Phase 14 planned ingestion from CourtListener citation graphs to expand this.

## Citation Extraction (Phase 15)

Extracted citations are verified against `legal_opinions` by `lib/citations/verifyCitation.ts`. The extraction step uses `lib/citations/citationExtractorAdapter.ts` which routes to:

1. **eyecite worker** (`workers/citation/app.py`) when `CITATION_WORKER_URL` is set -- broader citation form coverage
2. **Regex extractor** (`lib/citations/extractCitations.ts`) -- default, no Python required

## Future Ingestion (Phase 14 Roadmap)

- CourtListener bulk opinion download and ingestion
- Harvard Caselaw Access Project (CAP) bulk download
- Incremental update jobs for new opinions
- Citation edge import from CourtListener citation graph

See [ROADMAP.md](ROADMAP.md) for the phased plan.

## Schema Reference

See `supabase/migrations/` for the full schema:

| Migration | Contents |
|---|---|
| `001` | Core research corpus tables |
| `002` | pgvector extension + hybrid RAG index |
| `003` | Schema redesign |
| `004` | Litigation workflow tables |
| `005` | Legal opinion search SQL functions |
| `006` | `workflow_eval` artifact type |
| `007` | `case_file_uploads` table, `case_file_summary` artifact type |
