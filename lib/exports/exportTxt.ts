import type { DraftExportPayload, DraftExportOptions } from "./types";

const RULE = "─".repeat(72);
const DASH = "-".repeat(72);

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZoneName: "short",
    });
  } catch {
    return iso;
  }
}

export function exportTxt(
  payload: DraftExportPayload,
  options: DraftExportOptions = {}
): Buffer {
  const {
    includeMetadata = true,
    includeVerificationSummary = true,
    includeJudgeBrief = false,
    includeLocalRulesReview = false,
    includeAdversarialReview = false,
  } = options;

  const lines: string[] = [];

  // Cover metadata
  if (includeMetadata) {
    lines.push(payload.title.toUpperCase());
    lines.push(RULE);
    if (payload.motionType) lines.push(`Motion Type:    ${payload.motionType.replace(/_/g, " ")}`);
    if (payload.jurisdiction) lines.push(`Jurisdiction:   ${payload.jurisdiction}`);
    if (payload.court) lines.push(`Court:          ${payload.court}`);
    lines.push(`Version:        v${payload.version}`);
    if (payload.verificationStatus) lines.push(`Citations:      ${payload.verificationStatus}`);
    lines.push(`Exported:       ${formatDate(payload.exportedAt)}`);
    lines.push(`Run ID:         ${payload.workflowRunId}`);
    lines.push(RULE);
    lines.push(
      "NOTICE: This document is a draft generated for review purposes only. " +
      "It does not constitute legal advice and is not court-filing ready."
    );
    lines.push(RULE);
    lines.push("");
  }

  // Main content
  for (const section of payload.mainSections) {
    if (section.heading) {
      lines.push(section.heading);
      lines.push("");
    }
    if (section.body) {
      lines.push(section.body);
      lines.push("");
    }
  }

  // Citation verification summary
  if (includeVerificationSummary && payload.citationSummary) {
    const cs = payload.citationSummary;
    lines.push(RULE);
    lines.push("APPENDIX A -- CITATION VERIFICATION SUMMARY");
    lines.push(RULE);
    lines.push(`Total citations:  ${cs.total}`);
    lines.push(`Pass:             ${cs.pass}`);
    lines.push(`Warn:             ${cs.warn}`);
    lines.push(`Fail:             ${cs.fail}`);
    lines.push(`Unknown:          ${cs.unknown}`);
    lines.push("");
    lines.push(
      "Citation verification is limited to locally indexed opinions. " +
      "Citations not in the corpus return not_found."
    );
    lines.push("");
  }

  // Optional appendices
  const appendices: { label: string; content: string }[] = [];
  if (includeJudgeBrief && payload.appendixJudgeBrief) {
    appendices.push({ label: "JUDGE BRIEF", content: payload.appendixJudgeBrief });
  }
  if (includeLocalRulesReview && payload.appendixLocalRules) {
    appendices.push({ label: "LOCAL RULES REVIEW", content: payload.appendixLocalRules });
  }
  if (includeAdversarialReview && payload.appendixAdversarial) {
    appendices.push({ label: "ADVERSARIAL REVIEW", content: payload.appendixAdversarial });
  }

  for (const appendix of appendices) {
    lines.push(DASH);
    lines.push(`APPENDIX -- ${appendix.label}`);
    lines.push(DASH);
    lines.push(appendix.content);
    lines.push("");
  }

  return Buffer.from(lines.join("\n"), "utf-8");
}
