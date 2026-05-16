// Bulk text citation verification.
// Extracts citations from freeform text, verifies each, and returns a summary.

import type {
  CitationVerificationResult,
  TextVerificationResponse,
  TextVerificationSummary,
} from "./types";
import { extractCitationsWithBestAvailableProvider } from "./citationExtractorAdapter";
import { verifyCitation } from "./verifyCitation";
import { saveCitationVerificationReport } from "./saveCitationVerificationReport";

export interface VerifyTextInput {
  text: string;
  jurisdiction?: string;
  court?: string;
  workflowRunId?: string;
  draftArtifactId?: string;
}

export async function verifyCitationsInText(
  input: VerifyTextInput
): Promise<TextVerificationResponse> {
  // Step 1: extract citations from text
  const extracted = await extractCitationsWithBestAvailableProvider(input.text);

  if (extracted.length === 0) {
    return {
      citations: [],
      summary: { total: 0, pass: 0, warn: 0, fail: 0, unknown: 0 },
    };
  }

  // Step 2: verify each citation
  const results: CitationVerificationResult[] = [];

  for (const cite of extracted) {
    const result = await verifyCitation({
      citationText: cite.rawText,
      proposition: cite.surroundingText,
      jurisdiction: input.jurisdiction,
      court: input.court,
      workflowRunId: input.workflowRunId,
      draftArtifactId: input.draftArtifactId,
    });

    results.push(result);

    // Step 3: persist if workflowRunId is provided
    if (input.workflowRunId) {
      await saveCitationVerificationReport(result, input.workflowRunId, input.draftArtifactId);
    }
  }

  // Step 4: build summary
  const summary: TextVerificationSummary = {
    total: results.length,
    pass: results.filter((r) => r.overallStatus === "pass").length,
    warn: results.filter((r) => r.overallStatus === "warn").length,
    fail: results.filter((r) => r.overallStatus === "fail").length,
    unknown: results.filter((r) => r.overallStatus === "unknown").length,
  };

  return { citations: results, summary };
}
