# LexOrchestrator Citation Worker

Optional Python service that wraps [eyecite](https://github.com/freelawproject/eyecite) for improved U.S. legal citation extraction. The Next.js app falls back to its built-in regex extractor when this worker is unavailable or not configured.

## Purpose

The TypeScript regex extractor covers common citation forms (U.S., F.2d/3d/4th, F. Supp., S. Ct., N.Y., A.D., Misc.) but misses abbreviations, parallel citations, and supra/id. references. eyecite is a production-grade parser maintained by the Free Law Project and used by CourtListener.

This worker is optional. The application works fully without it.

## Setup

```bash
# From the repo root
python -m venv workers/citation/.venv
source workers/citation/.venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r workers/citation/requirements.txt
```

## Run

```bash
# Activate the venv first, then:
uvicorn workers.citation.app:app --host 127.0.0.1 --port 8015

# Or use the npm script (requires uvicorn in PATH):
npm run worker:citation
```

The worker listens on `http://127.0.0.1:8015` by default. It should not be exposed on a public interface without authentication.

## Health check

```bash
curl http://127.0.0.1:8015/health
# { "status": "ok", "extractor": "eyecite", "eyecite_available": true }
```

## Enable in Next.js

Set the environment variable before starting the dev server or in `.env.local`:

```env
CITATION_WORKER_URL=http://127.0.0.1:8015
```

The TypeScript adapter (`lib/citations/citationExtractorAdapter.ts`) reads this variable. When set and the worker is healthy, eyecite is used. When unset or the worker is unreachable, the regex extractor is used automatically with no error.

## Extraction example

```bash
curl -X POST http://127.0.0.1:8015/extract \
  -H "Content-Type: application/json" \
  -d '{"text": "See Bell Atlantic Corp. v. Twombly, 550 U.S. 544 (2007)."}'
```

Response:
```json
{
  "citations": [
    {
      "rawText": "550 U.S. 544 (2007)",
      "normalizedCitation": "550 U.S. 544 (2007)",
      "startIndex": 38,
      "endIndex": 57,
      "surroundingText": "See Bell Atlantic Corp. v. Twombly, 550 U.S. 544 (2007).",
      "confidence": 0.9,
      "source": "eyecite"
    }
  ]
}
```

## Limitations

- Extraction is limited to U.S. legal citation forms supported by eyecite.
- The worker does not verify citations against a database; that step is handled by `lib/citations/verifyCitation.ts` in the TypeScript app.
- Treatment verification (positive/negative citing references) is not implemented in Phase 15.
- This is not a Shepardization service and makes no claim of authoritative citation treatment analysis.
- The worker has no authentication. Do not expose it on a public network interface.

## TypeScript fallback

If the worker is not running or `CITATION_WORKER_URL` is not set, the TypeScript adapter automatically uses `lib/citations/extractCitations.ts` (the regex extractor). No configuration change is required to switch back.

## Smoke test

```bash
# Adapter fallback test (no worker required):
npm run smoke:citation-worker

# Direct worker test (worker must be running on port 8015):
npm run smoke:citation-worker-direct
```
