import type { WorkflowArtifactRow } from "@/lib/litigation/getWorkflowRun";

export default function AuthorityPanel({
  artifact,
}: {
  artifact: WorkflowArtifactRow | null;
}) {
  const citations: string[] = Array.isArray(artifact?.citations)
    ? (artifact!.citations as Record<string, unknown>[])
        .map((c) => (typeof c.citation === "string" ? c.citation : ""))
        .filter(Boolean)
    : [];

  if (citations.length === 0) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-3)" }}>
        No authority artifacts stored for this workflow yet. Authority is retrieved during the
        drafting run and ground citations in the document above.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {citations.map((citation, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "0.875rem",
            padding: "0.625rem 0",
            borderBottom: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--text-3)",
              flexShrink: 0,
            }}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "#60a5fa",
            }}
          >
            {citation}
          </span>
        </div>
      ))}
      <p
        className="pt-2"
        style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)" }}
      >
        Full opinion text and metadata are stored in legal_opinion_chunks when seeded.
        Run npm run seed:litigation-demo to populate demo opinions.
      </p>
    </div>
  );
}
