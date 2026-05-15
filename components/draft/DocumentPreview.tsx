import type { WorkflowArtifactRow } from "@/lib/litigation/getWorkflowRun";

function isHeading(text: string): boolean {
  const t = text.trim();
  if (t.length > 100) return false;
  if (/^[IVX]+\.\s/i.test(t)) return true;
  const upper = t.toUpperCase();
  return t === upper && t.length < 70 && /[A-Z]/.test(t);
}

function parseBlocks(content: string): Array<{ type: "heading" | "para"; text: string }> {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => ({
      type: isHeading(block) ? "heading" : "para",
      text: block,
    }));
}

function CitationBadge({ text }: { text: string }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        color: "#60a5fa",
        borderBottom: "1px dotted rgba(96,165,250,0.4)",
        cursor: "default",
      }}
      title={`Citation: ${text}`}
    >
      {text}
    </span>
  );
}

function CitationList({ citations }: { citations: Record<string, unknown>[] }) {
  const items = citations
    .map((c) => (typeof c.citation === "string" ? c.citation : ""))
    .filter(Boolean);
  if (items.length === 0) return null;

  return (
    <div
      className="mt-8 pt-6"
      style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
    >
      <p className="label mb-3">Citations Referenced</p>
      <div className="flex flex-wrap gap-2">
        {items.map((c, i) => (
          <CitationBadge key={i} text={c} />
        ))}
      </div>
    </div>
  );
}

export default function DocumentPreview({
  artifact,
  finalOutput,
}: {
  artifact: WorkflowArtifactRow | null;
  finalOutput?: string | null;
}) {
  const content = artifact?.content ?? finalOutput ?? null;
  const citations: Record<string, unknown>[] = Array.isArray(artifact?.citations)
    ? (artifact!.citations as Record<string, unknown>[])
    : [];

  if (!content) {
    return (
      <div
        className="flex items-center justify-center py-16"
        style={{ border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#404040" }}>
          No draft artifact recorded for this workflow run.
        </p>
      </div>
    );
  }

  const blocks = parseBlocks(content);

  return (
    <div>
      {artifact?.title && (
        <p
          className="label mb-6"
          style={{ letterSpacing: "0.18em", textTransform: "uppercase" }}
        >
          {artifact.title}
        </p>
      )}

      <div className="space-y-4">
        {blocks.map((block, i) =>
          block.type === "heading" ? (
            <p
              key={i}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.2em",
                color: "#737373",
                textTransform: "uppercase",
                marginTop: i > 0 ? "2rem" : 0,
                paddingTop: i > 0 ? "1.25rem" : 0,
                borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
              }}
            >
              {block.text}
            </p>
          ) : (
            <p
              key={i}
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "16px",
                lineHeight: "1.85",
                color: "#d4d4d4",
                letterSpacing: "0.01em",
              }}
            >
              {block.text}
            </p>
          )
        )}
      </div>

      <CitationList citations={citations} />
    </div>
  );
}
