// Single-citation verification module.
// Checks existence, quote match, pin-cite, proposition support, and treatment.
// Uses local DB lookups only -- no external API calls for verification.

import type {
  CitationVerificationInput,
  CitationVerificationResult,
  ExistenceStatus,
  QuoteStatus,
  PinCiteStatus,
  PropositionStatus,
  TreatmentStatus,
  OverallVerificationStatus,
  VerificationEvidence,
} from "./types";
import {
  DB_AVAILABLE,
  searchOpinionByCitation,
  getOpinionChunksByOpinionId,
  getCitationEdgesByOpinionId,
} from "@/lib/db/supabaseServer";

// ─── Normalization ───────────────────────────────────────────────────────────

function normalizeCitation(raw: string): string {
  return raw.replace(/\s+/g, " ").replace(/\.\s+/g, ". ").trim();
}

function normalizeForComparison(text: string): string {
  return text.toLowerCase().replace(/\s+/g, " ").replace(/[^\w\s]/g, "").trim();
}

// ─── Fuzzy quote matching ────────────────────────────────────────────────────

function fuzzyQuoteMatch(
  quoteText: string,
  sourceText: string
): { matched: boolean; score: number; excerpt: string } {
  const normQuote = normalizeForComparison(quoteText);
  const normSource = normalizeForComparison(sourceText);

  // Direct substring match
  if (normSource.includes(normQuote)) {
    return { matched: true, score: 1.0, excerpt: quoteText };
  }

  // Word overlap score as fallback
  const quoteWords = new Set(normQuote.split(" ").filter((w) => w.length > 2));
  const sourceWords = new Set(normSource.split(" ").filter((w) => w.length > 2));
  if (quoteWords.size === 0) return { matched: false, score: 0, excerpt: "" };

  let overlap = 0;
  for (const w of quoteWords) {
    if (sourceWords.has(w)) overlap++;
  }
  const score = overlap / quoteWords.size;
  const matched = score >= 0.7;

  return { matched, score, excerpt: matched ? quoteText.slice(0, 120) : "" };
}

// ─── Pin cite check ──────────────────────────────────────────────────────────

function checkPinCite(
  pinCite: string,
  chunks: Array<{ page_start: number | null; page_end: number | null; chunk_text: string }>
): { status: PinCiteStatus; evidence: string } {
  // Try to parse page number from pin cite (e.g., "at 590" or "at *3")
  const pageMatch = pinCite.match(/at\s+\*?(\d+)/i);
  if (!pageMatch) {
    return { status: "not_provided" as PinCiteStatus, evidence: "Could not parse page from pin cite" };
  }

  const targetPage = parseInt(pageMatch[1], 10);

  for (const chunk of chunks) {
    if (chunk.page_start !== null && chunk.page_end !== null) {
      if (targetPage >= chunk.page_start && targetPage <= chunk.page_end) {
        return { status: "verified", evidence: `Pin cite page ${targetPage} found in chunk pages ${chunk.page_start}-${chunk.page_end}` };
      }
    }
  }

  // If no page metadata available, mark as not_provided rather than failed
  const hasPageData = chunks.some((c) => c.page_start !== null);
  if (!hasPageData) {
    return { status: "not_provided" as PinCiteStatus, evidence: "No page metadata available to verify pin cite" };
  }

  return { status: "failed", evidence: `Pin cite page ${targetPage} not found in available chunk pages` };
}

// ─── Proposition support check ───────────────────────────────────────────────

function checkProposition(
  proposition: string,
  chunks: Array<{ chunk_text: string; chunk_index: number }>
): { status: PropositionStatus; score: number; evidence: VerificationEvidence[] } {
  const propTerms = normalizeForComparison(proposition)
    .split(" ")
    .filter((w) => w.length > 3);

  if (propTerms.length === 0) {
    return { status: "uncertain", score: 0, evidence: [] };
  }

  let bestScore = 0;
  const evidence: VerificationEvidence[] = [];

  for (const chunk of chunks) {
    const normChunk = normalizeForComparison(chunk.chunk_text);
    const chunkWords = new Set(normChunk.split(" "));

    let hits = 0;
    for (const term of propTerms) {
      if (chunkWords.has(term)) hits++;
    }

    const score = hits / propTerms.length;

    if (score > bestScore) {
      bestScore = score;
    }

    if (score >= 0.3) {
      evidence.push({
        text: chunk.chunk_text.slice(0, 200),
        source: `chunk_${chunk.chunk_index}`,
        score,
      });
    }
  }

  let status: PropositionStatus;
  if (bestScore >= 0.6) {
    status = "supported";
  } else if (bestScore >= 0.3) {
    status = "uncertain";
  } else {
    status = "unsupported";
  }

  return { status, score: bestScore, evidence };
}

// ─── Overall status ──────────────────────────────────────────────────────────

function computeOverallStatus(
  existence: ExistenceStatus,
  quote: QuoteStatus,
  pinCite: PinCiteStatus,
  proposition: PropositionStatus,
  treatment: TreatmentStatus
): OverallVerificationStatus {
  if (existence === "not_found") return "fail";
  if (existence === "unknown") return "unknown";
  if (quote === "failed") return "fail";
  if (proposition === "unsupported") return "warn";
  if (treatment === "negative") return "warn";
  if (existence === "ambiguous") return "warn";
  if (existence === "verified" && (quote === "verified" || quote === "not_provided")) {
    if (proposition === "supported" || proposition === "not_provided") {
      return "pass";
    }
    return "warn";
  }
  return "warn";
}

// ─── Main verification ──────────────────────────────────────────────────────

export async function verifyCitation(
  input: CitationVerificationInput
): Promise<CitationVerificationResult> {
  const normalized = normalizeCitation(input.citationText);
  const evidence: VerificationEvidence[] = [];
  const report: Record<string, unknown> = {
    input: { ...input, citationText: undefined },
    normalizedCitation: normalized,
  };

  // Default states
  let existenceStatus: ExistenceStatus = "unknown";
  let quoteStatus: QuoteStatus = input.quoteText ? "unknown" : "not_provided";
  let pinCiteStatus: PinCiteStatus = input.pinCite ? "unknown" : "not_provided";
  let propositionStatus: PropositionStatus = input.proposition ? "uncertain" : "not_provided";
  let treatmentStatus: TreatmentStatus = "unknown";
  let matchedOpinionId: string | undefined;
  let matchedCaseName: string | undefined;
  let matchedCitation: string | undefined;
  let confidence = 0;
  let explanation = "";

  if (!DB_AVAILABLE) {
    explanation = "Database not configured. Cannot verify citation.";
    report.dbAvailable = false;
    return {
      citationText: input.citationText,
      normalizedCitation: normalized,
      existenceStatus,
      quoteStatus,
      pinCiteStatus,
      propositionStatus,
      treatmentStatus,
      overallStatus: "unknown",
      confidence: 0,
      explanation,
      evidence,
      report,
    };
  }

  // Step 1: Search for exact citation match in legal_opinions
  const opinions = await searchOpinionByCitation(normalized);

  if (opinions.length === 1) {
    existenceStatus = "verified";
    matchedOpinionId = opinions[0].id;
    matchedCaseName = opinions[0].case_name;
    matchedCitation = opinions[0].citation ?? undefined;
    confidence = 0.9;
    explanation = `Citation matches "${opinions[0].case_name}" (${opinions[0].citation}).`;
    evidence.push({
      text: `Matched opinion: ${opinions[0].case_name}`,
      source: "legal_opinions",
    });
  } else if (opinions.length > 1) {
    existenceStatus = "ambiguous";
    matchedOpinionId = opinions[0].id;
    matchedCaseName = opinions[0].case_name;
    matchedCitation = opinions[0].citation ?? undefined;
    confidence = 0.6;
    explanation = `Citation matches ${opinions.length} opinions. Ambiguous result.`;
  } else {
    existenceStatus = "not_found";
    confidence = 0.3;
    explanation = "Citation not found in the legal opinions corpus. It may exist in external databases not yet indexed.";
    report.searchedCorpus = true;
    report.externalNote = "Only locally indexed opinions are searched. Not finding a citation does not mean it is fabricated.";
  }

  // Steps 2-5: only proceed if we have a matched opinion
  if (matchedOpinionId) {
    const chunks = await getOpinionChunksByOpinionId(matchedOpinionId);

    // Step 2: quote verification
    if (input.quoteText && chunks.length > 0) {
      let bestQuoteMatch = { matched: false, score: 0, excerpt: "" };

      for (const chunk of chunks) {
        const result = fuzzyQuoteMatch(input.quoteText, chunk.chunk_text);
        if (result.score > bestQuoteMatch.score) {
          bestQuoteMatch = result;
        }
      }

      if (bestQuoteMatch.matched) {
        quoteStatus = "verified";
        evidence.push({
          text: `Quote match score: ${(bestQuoteMatch.score * 100).toFixed(0)}%`,
          source: "quote_verification",
          score: bestQuoteMatch.score,
        });
      } else {
        quoteStatus = "failed";
        evidence.push({
          text: `Best quote match: ${(bestQuoteMatch.score * 100).toFixed(0)}% (threshold: 70%)`,
          source: "quote_verification",
          score: bestQuoteMatch.score,
        });
      }
      report.quoteMatchScore = bestQuoteMatch.score;
    }

    // Step 3: pin cite verification
    if (input.pinCite && chunks.length > 0) {
      const pinResult = checkPinCite(input.pinCite, chunks);
      pinCiteStatus = pinResult.status;
      evidence.push({
        text: pinResult.evidence,
        source: "pin_cite_verification",
      });
      report.pinCiteResult = pinResult;
    }

    // Step 4: proposition support
    if (input.proposition && chunks.length > 0) {
      const propResult = checkProposition(
        input.proposition,
        chunks.map((c) => ({ chunk_text: c.chunk_text, chunk_index: c.chunk_index }))
      );
      propositionStatus = propResult.status;
      evidence.push(...propResult.evidence);
      report.propositionScore = propResult.score;
      report.propositionStatus = propResult.status;
    }

    // Step 5: treatment status from citation edges
    const edges = await getCitationEdgesByOpinionId(matchedOpinionId);
    if (edges.length > 0) {
      const treatments = edges.map((e) => e.treatment).filter(Boolean);
      if (treatments.includes("overruled")) {
        treatmentStatus = "negative";
      } else if (treatments.includes("questioned")) {
        treatmentStatus = "caution";
      } else if (treatments.includes("followed") || treatments.includes("cited")) {
        treatmentStatus = "positive";
      }
      report.treatmentEdges = edges.length;
    }
  }

  const overallStatus = computeOverallStatus(
    existenceStatus,
    quoteStatus,
    pinCiteStatus,
    propositionStatus,
    treatmentStatus
  );

  report.overallStatus = overallStatus;
  report.existenceStatus = existenceStatus;

  return {
    citationText: input.citationText,
    normalizedCitation: normalized,
    existenceStatus,
    quoteStatus,
    pinCiteStatus,
    propositionStatus,
    treatmentStatus,
    overallStatus,
    matchedOpinionId,
    matchedCaseName,
    matchedCitation,
    confidence,
    explanation,
    evidence,
    report,
  };
}
