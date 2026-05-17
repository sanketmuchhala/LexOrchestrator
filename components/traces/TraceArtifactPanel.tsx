import Link from "next/link";
import type { TraceArtifactLink } from "@/lib/traces/types";

const PRIMARY_DRAFT_TYPES = new Set(["outline", "full_draft", "motion_section", "memo"]);

function verificationBadge(status: string | null) {
  if (!status) return null;
  const cls =
    status === "pass" ? "badge-pass" :
    status === "fail" ? "badge-fail" :
    status === "partial" ? "badge-warn" :
    "badge-neutral";
  return <span className={`badge ${cls}`} style={{ fontFamily: "var(--font-mono)", fontSize: "9px" }}>{status}</span>;
}

interface Props {
  artifacts: TraceArtifactLink[];
  workflowRunId: string;
}

export default function TraceArtifactPanel({ artifacts, workflowRunId }: Props) {
  if (artifacts.length === 0) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-3)" }}>
        No artifacts created for this workflow run.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {artifacts.map((a) => (
        <div
          key={a.id}
          style={{ border: "1px solid rgba(0,0,0,0.07)", padding: "1rem" }}
        >
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#60a5fa" }}>
              {a.id.slice(0, 8)}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-2)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              {a.artifactType.replace(/_/g, " ")}
            </span>
            {a.version != null && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-3)" }}>v{a.version}</span>
            )}
            {verificationBadge(a.verificationStatus)}
            {a.createdByAgent && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-3)", marginLeft: "auto" }}>
                {a.createdByAgent}
              </span>
            )}
          </div>

          {a.title && (
            <p style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "13px", color: "var(--text-1)", marginBottom: "0.375rem" }}>
              {a.title}
            </p>
          )}

          {a.contentPreview && (
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
              {a.contentPreview}
              {a.contentPreview.length >= 240 ? " ..." : ""}
            </p>
          )}

          {PRIMARY_DRAFT_TYPES.has(a.artifactType) && (
            <div style={{ marginTop: "0.5rem" }}>
              <Link
                href={`/draft/${workflowRunId}`}
                style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-2)", letterSpacing: "0.12em", textTransform: "uppercase" }}
                className="transition-colors hover:text-black"
              >
                Open Draft Workspace &rarr;
              </Link>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
