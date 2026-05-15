import type { WorkflowArtifactRow } from "@/lib/litigation/getWorkflowArtifacts";

function SectionTitle({ n, children }: { n: string; children: string }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "#404040",
          letterSpacing: "0.2em",
        }}
      >
        § {n}
      </span>
      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "#737373",
          letterSpacing: "0.24em",
          textTransform: "uppercase",
        }}
      >
        {children}
      </span>
    </div>
  );
}

function verificationBadge(status: string | null): string {
  if (!status) return "badge-neutral";
  const s = status.toLowerCase();
  if (s === "verified") return "badge-pass";
  if (s === "partial") return "badge-warn";
  if (s === "failed") return "badge-fail";
  return "badge-neutral";
}

const CONTENT_PREVIEW_CHARS = 400;

export default function DraftArtifactList({ artifacts }: { artifacts: WorkflowArtifactRow[] }) {
  return (
    <section>
      <SectionTitle n="03">Draft Artifacts</SectionTitle>

      {artifacts.length === 0 ? (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#404040" }}>
          No draft artifacts recorded.
        </p>
      ) : (
        <div className="space-y-4">
          {artifacts.map((artifact, idx) => {
            const preview = artifact.content.slice(0, CONTENT_PREVIEW_CHARS);
            const truncated = artifact.content.length > CONTENT_PREVIEW_CHARS;
            const citationCount = Array.isArray(artifact.citations)
              ? artifact.citations.length
              : 0;

            return (
              <div
                key={artifact.id}
                style={{ border: "1px solid rgba(255,255,255,0.06)" }}
              >
                {/* Header */}
                <div
                  className="flex flex-wrap items-start gap-3 px-5 py-4"
                  style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0a0a0a" }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      color: "#404040",
                      paddingTop: "3px",
                    }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontFamily: "var(--font-serif), Georgia, serif",
                        fontSize: "15px",
                        fontWeight: 500,
                        color: "#f4f4f4",
                        lineHeight: 1.4,
                      }}
                    >
                      {artifact.title ?? "Untitled Artifact"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="badge badge-neutral">
                        {artifact.artifact_type.replace(/_/g, " ")}
                      </span>
                      <span
                        className={`badge ${verificationBadge(artifact.verification_status)}`}
                      >
                        {artifact.verification_status ?? "pending"}
                      </span>
                      {citationCount > 0 && (
                        <span className="badge badge-blue">
                          {citationCount} citation{citationCount !== 1 ? "s" : ""}
                        </span>
                      )}
                      {artifact.created_by_agent && (
                        <span
                          style={{
                            fontFamily: "var(--font-mono)",
                            fontSize: "10px",
                            color: "#404040",
                          }}
                        >
                          by {artifact.created_by_agent}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content preview */}
                <div className="px-5 py-4">
                  <p
                    style={{
                      fontFamily: "var(--font-serif), Georgia, serif",
                      fontSize: "14px",
                      lineHeight: "1.75",
                      color: "#a3a3a3",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {preview}
                    {truncated && (
                      <span style={{ color: "#404040" }}>
                        {"\n\n"}[{artifact.content.length - CONTENT_PREVIEW_CHARS} more characters]
                      </span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
