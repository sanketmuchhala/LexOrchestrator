// Regex-based citation extractor for common U.S. legal citation forms.
// Pragmatic first pass -- not exhaustive. Handles:
//   U.S. / S. Ct. / L. Ed.
//   F.2d / F.3d / F.4th
//   F. Supp. / F. Supp. 2d / F. Supp. 3d
//   N.Y. / N.Y.2d / N.Y.3d
//   A.D.2d / A.D.3d
//   Misc. 2d / Misc. 3d

import type { CitationExtractionResult } from "./types";

// ─── Citation patterns ───────────────────────────────────────────────────────

// Each pattern captures the full citation including volume, reporter, and page.
// Optional parenthetical year is captured when present.
const CITATION_PATTERNS: RegExp[] = [
  // U.S. Supreme Court: 509 U.S. 579 (1993)
  /\b(\d{1,4})\s+U\.?\s*S\.?\s+(\d{1,5})(?:\s*\(\d{4}\))?/g,

  // S. Ct.: 123 S. Ct. 456
  /\b(\d{1,4})\s+S\.\s*Ct\.\s+(\d{1,5})(?:\s*\(\d{4}\))?/g,

  // L. Ed. 2d: 123 L. Ed. 2d 456
  /\b(\d{1,4})\s+L\.\s*Ed\.\s*(?:2d\s+)?(\d{1,5})(?:\s*\(\d{4}\))?/g,

  // Federal Reporter: 702 F.3d 111 or 702 F.2d 111 or 702 F.4th 111
  /\b(\d{1,4})\s+F\.(?:2d|3d|4th)\s+(\d{1,5})(?:\s*\(\w[\w.\s]*\d{4}\))?/g,

  // F. Supp.: 12 F. Supp. 3d 45
  /\b(\d{1,4})\s+F\.\s*Supp\.(?:\s*(?:2d|3d))?\s+(\d{1,5})(?:\s*\(\w[\w.\s]*\d{4}\))?/g,

  // New York: 98 N.Y.2d 562 or 98 N.Y.3d 562 or 98 N.Y. 562
  /\b(\d{1,4})\s+N\.?\s*Y\.?(?:2d|3d)?\s+(\d{1,5})(?:\s*\(\d{4}\))?/g,

  // Appellate Division: 45 A.D.2d 123 or 45 A.D.3d 123
  /\b(\d{1,4})\s+A\.?\s*D\.?(?:2d|3d)\s+(\d{1,5})(?:\s*\(\w[\w.\s]*\d{4}\))?/g,

  // Misc.: 12 Misc. 2d 34 or 12 Misc. 3d 34
  /\b(\d{1,4})\s+Misc\.?\s*(?:2d|3d)\s+(\d{1,5})(?:\s*\(\w[\w.\s]*\d{4}\))?/g,
];

// ─── Normalization ───────────────────────────────────────────────────────────

function normalizeCitation(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .replace(/\.\s+/g, ". ")
    .trim();
}

function getSurroundingText(text: string, start: number, end: number, windowSize: number = 80): string {
  const before = Math.max(0, start - windowSize);
  const after = Math.min(text.length, end + windowSize);
  return text.slice(before, after).replace(/\s+/g, " ").trim();
}

// ─── Main extraction ─────────────────────────────────────────────────────────

export function extractCitations(text: string): CitationExtractionResult[] {
  const seen = new Set<string>();
  const results: CitationExtractionResult[] = [];

  for (const pattern of CITATION_PATTERNS) {
    // Reset the regex state for each invocation
    const regex = new RegExp(pattern.source, pattern.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      const rawText = match[0];
      const normalized = normalizeCitation(rawText);

      // Deduplicate by normalized text + position
      const key = `${normalized}@${match.index}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // Also deduplicate by normalized text alone (keep first occurrence)
      if (results.some((r) => r.normalizedCitation === normalized)) continue;

      results.push({
        rawText,
        normalizedCitation: normalized,
        startIndex: match.index,
        endIndex: match.index + rawText.length,
        surroundingText: getSurroundingText(text, match.index, match.index + rawText.length),
        confidence: 0.85, // regex-based extraction has good precision but not perfect
      });
    }
  }

  // Sort by position in text
  results.sort((a, b) => a.startIndex - b.startIndex);

  return results;
}
