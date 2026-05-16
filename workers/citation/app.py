"""
LexOrchestrator citation worker.
Optional FastAPI service wrapping eyecite for improved U.S. legal citation extraction.
The Next.js app falls back to its built-in regex extractor when this worker is unavailable.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import re

try:
    from eyecite import get_citations
    from eyecite.models import (
        FullCaseCitation,
        SupraCitation,
        IdCitation,
    )
    EYECITE_AVAILABLE = True
except ImportError:
    EYECITE_AVAILABLE = False

app = FastAPI(title="LexOrchestrator Citation Worker", version="1.0.0")

MAX_TEXT_LENGTH = 200_000  # characters


# ── Models ────────────────────────────────────────────────────────────────────

class ExtractRequest(BaseModel):
    text: str


class CitationResult(BaseModel):
    rawText: str
    normalizedCitation: str
    startIndex: Optional[int]
    endIndex: Optional[int]
    surroundingText: str
    confidence: float
    source: str


class ExtractResponse(BaseModel):
    citations: List[CitationResult]


# ── Normalization ─────────────────────────────────────────────────────────────

def normalize_citation(raw: str) -> str:
    """Normalize whitespace and reporter spacing to match TypeScript extractor output."""
    normalized = re.sub(r"\s+", " ", raw)
    normalized = re.sub(r"\.\s+", ". ", normalized)
    return normalized.strip()


def get_surrounding_text(text: str, start: Optional[int], end: Optional[int], window: int = 80) -> str:
    """Return up to `window` characters of context around a citation."""
    if start is None or end is None:
        return ""
    ctx_start = max(0, start - window)
    ctx_end = min(len(text), end + window)
    snippet = text[ctx_start:ctx_end]
    return re.sub(r"\s+", " ", snippet).strip()


def citation_to_result(citation, text: str) -> Optional[CitationResult]:
    """Convert an eyecite citation object to the app-compatible shape."""
    # Skip non-opinion citation types that have no useful text
    if isinstance(citation, (IdCitation, SupraCitation)) or type(citation).__name__ == "NonopinionCitation":
        # Include only if we can get a meaningful raw text
        try:
            raw = str(citation.token)
            if not raw.strip():
                return None
        except Exception:
            return None
    else:
        try:
            raw = citation.matched_text()
        except Exception:
            try:
                raw = str(citation.token)
            except Exception:
                return None

    if not raw or not raw.strip():
        return None

    normalized = normalize_citation(raw)

    # Extract position from token span if available
    start_idx = None
    end_idx = None
    try:
        span = citation.token.start
        end_span = citation.token.end
        start_idx = int(span)
        end_idx = int(end_span)
    except (AttributeError, TypeError, ValueError):
        pass

    surrounding = get_surrounding_text(text, start_idx, end_idx)

    # eyecite citations get higher confidence than the regex fallback
    confidence = 0.9 if isinstance(citation, FullCaseCitation) else 0.85

    return CitationResult(
        rawText=raw.strip(),
        normalizedCitation=normalized,
        startIndex=start_idx,
        endIndex=end_idx,
        surroundingText=surrounding,
        confidence=confidence,
        source="eyecite",
    )


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok" if EYECITE_AVAILABLE else "degraded",
        "extractor": "eyecite" if EYECITE_AVAILABLE else "unavailable",
        "eyecite_available": EYECITE_AVAILABLE,
    }


@app.post("/extract", response_model=ExtractResponse)
def extract(req: ExtractRequest):
    if not EYECITE_AVAILABLE:
        raise HTTPException(
            status_code=503,
            detail="eyecite is not installed. Run: pip install eyecite",
        )

    text = req.text
    if not text or not text.strip():
        return ExtractResponse(citations=[])

    if len(text) > MAX_TEXT_LENGTH:
        raise HTTPException(
            status_code=400,
            detail=f"Text exceeds maximum length of {MAX_TEXT_LENGTH:,} characters.",
        )

    try:
        raw_citations = get_citations(text)
    except Exception as exc:
        # Never surface a traceback to the caller
        raise HTTPException(
            status_code=500,
            detail=f"Citation extraction failed: {type(exc).__name__}",
        ) from None

    results: List[CitationResult] = []
    seen = set()

    for citation in raw_citations:
        result = citation_to_result(citation, text)
        if result is None:
            continue
        # Deduplicate by normalized text
        key = result.normalizedCitation
        if key in seen:
            continue
        seen.add(key)
        results.append(result)

    # Sort by position; citations without position go to the end
    results.sort(key=lambda r: (r.startIndex is None, r.startIndex or 0))

    return ExtractResponse(citations=results)
