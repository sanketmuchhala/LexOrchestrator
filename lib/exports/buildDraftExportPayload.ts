import { getDraftWorkspace } from "@/lib/litigation/getDraftWorkspace";
import { getEditableDraft } from "@/lib/drafts/getEditableDraft";
import type { DraftExportPayload, DocumentSection, CitationExportSummary } from "./types";

const STANDARD_HEADINGS = new Set([
  "PRELIMINARY STATEMENT",
  "STATEMENT OF RELEVANT FACTS",
  "STATEMENT OF FACTS",
  "LEGAL STANDARD",
  "LEGAL STANDARDS",
  "ARGUMENT",
  "CONCLUSION",
  "INTRODUCTION",
  "BACKGROUND",
  "DISCUSSION",
]);

function isHeading(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.length > 100) return false;
  if (STANDARD_HEADINGS.has(trimmed)) return true;
  // All-caps line that isn't too long
  if (trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed)) return true;
  // Roman numeral prefix: I. II. III.
  if (/^(I{1,3}|IV|V?I{0,3}|IX|X)\.\s+[A-Z]/.test(trimmed)) return true;
  return false;
}

function parseIntoSections(content: string): DocumentSection[] {
  if (!content.trim()) {
    return [{ body: "No draft content available." }];
  }

  const blocks = content.split(/\n\n+/);
  const sections: DocumentSection[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;
    const firstLine = trimmed.split("\n")[0].trim();
    if (isHeading(firstLine)) {
      const remainder = trimmed.slice(firstLine.length).trim();
      sections.push({
        heading: firstLine,
        isMainHeading: true,
        body: remainder,
      });
    } else {
      sections.push({ body: trimmed });
    }
  }

  return sections.length > 0 ? sections : [{ body: content.trim() }];
}

export async function buildDraftExportPayload(
  workflowRunId: string
): Promise<DraftExportPayload> {
  // Load workspace (includes all artifacts) and latest editable draft in parallel
  const [workspace, editable] = await Promise.all([
    getDraftWorkspace(workflowRunId).catch(() => null),
    getEditableDraft(workflowRunId).catch(() => null),
  ]);

  const workflow = workspace?.workflow ?? null;

  // Content priority chain
  const content =
    editable?.latestRevision?.content ??
    editable?.content ??
    workspace?.primaryDraft?.content ??
    workflow?.final_output ??
    "";

  const version =
    editable?.latestRevision?.version ?? editable?.version ?? 1;

  const verificationStatus =
    editable?.latestRevision?.verificationStatus ??
    editable?.verificationStatus ??
    workspace?.primaryDraft?.verification_status ??
    null;

  // Citation summary from latest revision or workflow row
  let citationSummary: CitationExportSummary | null = null;
  if (editable?.latestRevision?.citationSummary?.total !== undefined) {
    citationSummary = editable.latestRevision.citationSummary;
  } else if (workspace?.citationReports && workspace.citationReports.length > 0) {
    const reports = workspace.citationReports;
    citationSummary = {
      total: reports.length,
      pass: reports.filter((r) => r.overall_status === "pass").length,
      warn: reports.filter((r) => r.overall_status === "warn").length,
      fail: reports.filter((r) => r.overall_status === "fail").length,
      unknown: reports.filter((r) => r.overall_status === "unknown").length,
    };
  }

  // Motion title
  const motionType = workflow?.motion_type ?? null;
  const motionLabel = motionType
    ? motionType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Motion";
  const title = workflow?.input_summary ?? `${motionLabel} — ${workflow?.court ?? "Court"}`;

  // Optional appendix content
  const appendixJudgeBrief = workspace?.judgeBriefArtifact?.content ?? null;
  const appendixLocalRules = workspace?.localRulesArtifact?.content ?? null;
  const appendixAdversarial = workspace?.adversarialReview?.content ?? null;

  return {
    title,
    motionType,
    jurisdiction: workflow?.jurisdiction ?? null,
    court: workflow?.court ?? null,
    workflowRunId,
    exportedAt: new Date().toISOString(),
    version,
    verificationStatus,
    citationSummary,
    mainSections: parseIntoSections(content),
    appendixJudgeBrief,
    appendixLocalRules,
    appendixAdversarial,
  };
}
