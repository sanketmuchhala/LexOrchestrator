import type { JurySimulationInput } from "./types";

export function buildSeedText(input: JurySimulationInput): string {
  const jurisdiction = input.jurisdiction?.trim() || "Federal";
  const motionType = input.motionType?.trim() || "legal matter";
  const keyArgument = input.caseSummary.trim().slice(0, 300);
  const confidence = input.confidenceHint?.trim() || "unknown";

  return [
    `CASE SUMMARY: ${jurisdiction} — ${motionType}`,
    `QUESTION: ${input.legalQuestion.trim()}`,
    `KEY ARGUMENT: ${keyArgument}`,
    `CONFIDENCE: ${confidence}`,
  ].join("\n");
}
