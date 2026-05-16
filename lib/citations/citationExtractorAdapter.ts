import { extractCitations } from "./extractCitations";
import type { CitationExtractionResult, CitationExtractorSource } from "./types";

const WORKER_TIMEOUT_MS = 2000;

interface WorkerCitationShape {
  rawText: string;
  normalizedCitation: string;
  startIndex: number | null;
  endIndex: number | null;
  surroundingText: string;
  confidence: number;
  source: string;
}

function isValidWorkerResult(item: unknown): item is WorkerCitationShape {
  if (typeof item !== "object" || item === null) return false;
  const r = item as Record<string, unknown>;
  return (
    typeof r.rawText === "string" &&
    typeof r.normalizedCitation === "string" &&
    typeof r.confidence === "number"
  );
}

function toExtractionResult(
  item: WorkerCitationShape,
  source: CitationExtractorSource
): CitationExtractionResult {
  return {
    rawText: item.rawText,
    normalizedCitation: item.normalizedCitation,
    startIndex: item.startIndex ?? 0,
    endIndex: item.endIndex ?? 0,
    surroundingText: item.surroundingText ?? "",
    confidence: item.confidence,
    extractorSource: source,
  };
}

async function callWorker(
  workerUrl: string,
  text: string
): Promise<CitationExtractionResult[] | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WORKER_TIMEOUT_MS);

  try {
    const res = await fetch(`${workerUrl}/extract`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
      signal: controller.signal,
    });

    if (!res.ok) return null;

    const data = (await res.json()) as unknown;
    if (
      typeof data !== "object" ||
      data === null ||
      !Array.isArray((data as Record<string, unknown>).citations)
    ) {
      return null;
    }

    const citations = (data as { citations: unknown[] }).citations;
    const valid = citations.filter(isValidWorkerResult);
    return valid.map((item) => toExtractionResult(item, "eyecite"));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function extractCitationsWithBestAvailableProvider(
  text: string
): Promise<CitationExtractionResult[]> {
  const workerUrl = process.env.CITATION_WORKER_URL;

  if (workerUrl) {
    const workerResults = await callWorker(workerUrl, text);
    if (workerResults !== null) {
      return workerResults;
    }
    console.warn("[CitationAdapter] worker unavailable, falling back to regex extractor");
  }

  return extractCitations(text).map((c) => ({ ...c, extractorSource: "regex" as const }));
}
