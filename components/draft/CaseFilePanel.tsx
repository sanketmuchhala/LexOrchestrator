import type { WorkflowArtifactRow } from "@/lib/litigation/getWorkflowRun";

interface CaseFileMeta {
  source?: string;
  characterCount?: number;
  documentRole?: string;
  truncated?: boolean;
}

function roleLabel(role: string | undefined): string {
  const map: Record<string, string> = {
    complaint: "Complaint",
    deposition: "Deposition Transcript",
    affidavit: "Affidavit",
    exhibit: "Exhibit",
    motion: "Prior Motion",
    case_file: "Case File",
    other: "Other",
  };
  return map[role ?? ""] ?? "Case File";
}

interface Props {
  artifact: WorkflowArtifactRow | null;
}

export default function CaseFilePanel({ artifact }: Props) {
  if (!artifact) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#404040" }}>
        No case file was uploaded for this workflow run.
      </p>
    );
  }

  const meta = (artifact.metadata ?? {}) as CaseFileMeta;
  const charCount = meta.characterCount ?? 0;
  const role = roleLabel(meta.documentRole);
  const truncated = meta.truncated ?? false;

  // Extract preview from artifact content (skip the header lines)
  const contentLines = artifact.content?.split("\n") ?? [];
  const previewStart = contentLines.findIndex((l) => l.startsWith("[Preview"));
  const previewLines =
    previewStart >= 0 ? contentLines.slice(previewStart + 1) : contentLines.slice(4);
  const preview = previewLines.join("\n").slice(0, 600).trim();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="label">Document role</span>
        <span className="badge badge-neutral">{role}</span>
      </div>

      <div className="flex items-center justify-between">
        <span className="label">Extracted</span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#f4f4f4" }}>
          {charCount.toLocaleString()} chars
          {truncated && (
            <span style={{ color: "#fbbf24", marginLeft: "0.5rem" }}>(truncated)</span>
          )}
        </span>
      </div>

      {preview && (
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: "0.75rem",
            marginTop: "0.25rem",
          }}
        >
          <p className="label mb-2">Preview</p>
          <p
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "13px",
              color: "#737373",
              lineHeight: "1.7",
              whiteSpace: "pre-wrap",
            }}
          >
            {preview}
            {(artifact.content?.length ?? 0) > 600 && (
              <span style={{ color: "#404040" }}>{" "}[...]</span>
            )}
          </p>
        </div>
      )}

      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingTop: "0.75rem",
        }}
      >
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#404040", lineHeight: "1.6" }}>
          Uploaded case material is used as factual source only. It is not legal authority and is not cited as such.
        </p>
      </div>
    </div>
  );
}
