import type { WorkflowArtifactRow } from "@/lib/litigation/getWorkflowRun";

function riskColor(content: string): string {
  if (content.includes("ADVERSARIAL RISK: HIGH")) return "#f87171";
  if (content.includes("ADVERSARIAL RISK: MEDIUM")) return "#fbbf24";
  if (content.includes("ADVERSARIAL RISK: LOW")) return "#34d399";
  return "#737373";
}

function riskBadge(content: string): string {
  if (content.includes("ADVERSARIAL RISK: HIGH")) return "badge-fail";
  if (content.includes("ADVERSARIAL RISK: MEDIUM")) return "badge-warn";
  if (content.includes("ADVERSARIAL RISK: LOW")) return "badge-pass";
  return "badge-neutral";
}

function extractSection(content: string, heading: string): string[] {
  const lines = content.split("\n");
  const start = lines.findIndex((l) => l.trim() === heading);
  if (start === -1) return [];
  const items: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) break;
    if (/^[A-Z\s]+$/.test(line) && line.length < 60) break;
    items.push(line.replace(/^\d+\.\s*/, ""));
  }
  return items.filter(Boolean);
}

function extractMemo(content: string): string {
  const marker = "RED TEAM MEMO\n";
  const idx = content.indexOf(marker);
  if (idx === -1) return "";
  return content.slice(idx + marker.length).trim();
}

export default function AdversarialReviewPanel({
  artifact,
}: {
  artifact: WorkflowArtifactRow | null;
}) {
  if (!artifact) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#404040" }}>
        No adversarial review artifact recorded for this workflow run.
      </p>
    );
  }

  const { content } = artifact;
  const weaknesses = extractSection(content, "STRONGEST WEAKNESSES");
  const claims = extractSection(content, "UNSUPPORTED CLAIMS");
  const counterargs = extractSection(content, "LIKELY COUNTERARGUMENTS");
  const memo = extractMemo(content);
  const color = riskColor(content);
  const badgeClass = riskBadge(content);

  return (
    <div>
      {/* Risk header */}
      <div
        className="mb-4 flex items-center gap-3 px-4 py-3"
        style={{ borderLeft: `3px solid ${color}`, background: "#0a0a0a" }}
      >
        <span className={`badge ${badgeClass}`}>
          {content.includes("HIGH")
            ? "HIGH RISK"
            : content.includes("MEDIUM")
            ? "MEDIUM RISK"
            : content.includes("LOW")
            ? "LOW RISK"
            : "UNKNOWN RISK"}
        </span>
        <p
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: "13px",
            lineHeight: "1.6",
            color: "#a3a3a3",
          }}
        >
          {memo.slice(0, 200)}
          {memo.length > 200 ? "..." : ""}
        </p>
      </div>

      {weaknesses.length > 0 && (
        <div className="mb-4">
          <p className="label mb-2">Strongest Weaknesses</p>
          <ul className="space-y-2">
            {weaknesses.map((w, i) => (
              <li
                key={i}
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "14px",
                  lineHeight: "1.7",
                  color: "#d4d4d4",
                  paddingLeft: "1rem",
                  borderLeft: "2px solid rgba(248,113,113,0.3)",
                }}
              >
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {claims.length > 0 && (
        <div className="mb-4">
          <p className="label mb-2">Unsupported Claims</p>
          <ul className="space-y-1">
            {claims.map((c, i) => (
              <li
                key={i}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "#737373",
                  paddingLeft: "0.875rem",
                }}
              >
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {counterargs.length > 0 && (
        <div>
          <p className="label mb-2">Likely Counterarguments</p>
          <ul className="space-y-2">
            {counterargs.map((c, i) => (
              <li
                key={i}
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "14px",
                  lineHeight: "1.7",
                  color: "#a3a3a3",
                  paddingLeft: "1rem",
                  borderLeft: "2px solid rgba(251,191,36,0.25)",
                }}
              >
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
