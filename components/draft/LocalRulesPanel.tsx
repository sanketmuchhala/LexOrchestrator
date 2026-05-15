import type { WorkflowArtifactRow } from "@/lib/litigation/getWorkflowRun";

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

export default function LocalRulesPanel({
  artifact,
}: {
  artifact: WorkflowArtifactRow | null;
}) {
  if (!artifact) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#404040" }}>
        No local rules artifact recorded for this workflow run.
      </p>
    );
  }

  const formattingNotes = extractSection(artifact.content, "FORMATTING NOTES");
  const ruleWarnings = extractSection(artifact.content, "RULE WARNINGS");

  return (
    <div>
      {formattingNotes.length > 0 && (
        <div className="mb-5">
          <p className="label mb-2">Formatting Notes</p>
          <ul className="space-y-2">
            {formattingNotes.map((note, i) => (
              <li
                key={i}
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "14px",
                  lineHeight: "1.7",
                  color: "#a3a3a3",
                  paddingLeft: "1rem",
                  borderLeft: "2px solid rgba(255,255,255,0.06)",
                }}
              >
                {note}
              </li>
            ))}
          </ul>
        </div>
      )}

      {ruleWarnings.length > 0 && (
        <div>
          <p className="label mb-2">Rule Warnings</p>
          <ul className="space-y-2">
            {ruleWarnings.map((warn, i) => {
              const isNote = warn.toLowerCase().startsWith("note:");
              return (
                <li
                  key={i}
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: "14px",
                    lineHeight: "1.7",
                    color: isNote ? "#404040" : "#fbbf24",
                    paddingLeft: "1rem",
                    borderLeft: `2px solid ${isNote ? "rgba(255,255,255,0.04)" : "rgba(251,191,36,0.3)"}`,
                  }}
                >
                  {warn}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {formattingNotes.length === 0 && ruleWarnings.length === 0 && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#404040" }}>
          No local rules notes extracted.
        </p>
      )}
    </div>
  );
}
