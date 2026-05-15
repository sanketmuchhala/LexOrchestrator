import type { WorkflowArtifactRow } from "@/lib/litigation/getWorkflowRun";

type BlockType = "heading-main" | "heading-sub" | "note" | "para";

interface Block {
  type: BlockType;
  text: string;
}

const STANDARD_HEADINGS = new Set([
  "PRELIMINARY STATEMENT",
  "STATEMENT OF RELEVANT FACTS",
  "STATEMENT OF FACTS",
  "LEGAL STANDARD",
  "ARGUMENT",
  "CONCLUSION",
  "INTRODUCTION",
  "BACKGROUND",
  "DISCUSSION",
  "RELIEF REQUESTED",
  "SIGNATURE",
]);

function classifyBlock(text: string): BlockType {
  const t = text.trim();
  if (t.length === 0) return "para";

  if (t.toLowerCase().startsWith("note:") || t.startsWith("[DEMO")) {
    return "note";
  }

  if (t.length > 120) return "para";

  // Roman numeral main headings: "I. INTRODUCTION", "IV. ARGUMENT"
  if (/^[IVX]+\.\s+\S/i.test(t)) return "heading-main";

  // Letter sub-headings: "A. Argument", "B. Facts"
  if (/^[A-Z]\.\s+\S/.test(t) && t.length < 60) return "heading-sub";

  // All-caps standard heading
  const upper = t.toUpperCase();
  if (t === upper && STANDARD_HEADINGS.has(t)) return "heading-main";

  // All-caps short (< 70 chars) — still treat as heading-main
  if (t === upper && t.length < 70 && /[A-Z]{3}/.test(t)) return "heading-main";

  return "para";
}

function parseBlocks(content: string): Block[] {
  return content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => ({
      type: classifyBlock(block),
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

function renderBlock(block: Block, i: number, isFirst: boolean) {
  if (block.type === "heading-main") {
    return (
      <div
        key={i}
        style={{
          marginTop: isFirst ? 0 : "2.25rem",
          paddingTop: isFirst ? 0 : "1.5rem",
          borderTop: isFirst ? "none" : "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.22em",
            color: "#737373",
            textTransform: "uppercase",
          }}
        >
          {block.text}
        </p>
      </div>
    );
  }

  if (block.type === "heading-sub") {
    return (
      <p
        key={i}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.1em",
          color: "#737373",
          marginTop: "1.25rem",
        }}
      >
        {block.text}
      </p>
    );
  }

  if (block.type === "note") {
    return (
      <p
        key={i}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          lineHeight: "1.65",
          color: "#404040",
          padding: "0.5rem 0.875rem",
          borderLeft: "2px solid rgba(251,191,36,0.3)",
          background: "rgba(251,191,36,0.03)",
        }}
      >
        {block.text}
      </p>
    );
  }

  return (
    <p
      key={i}
      style={{
        fontFamily: "var(--font-serif), Georgia, serif",
        fontSize: "15.5px",
        lineHeight: "1.9",
        color: "#d4d4d4",
        letterSpacing: "0.01em",
      }}
    >
      {block.text}
    </p>
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

      <div className="space-y-3">
        {blocks.map((block, i) =>
          renderBlock(block, i, i === 0)
        )}
      </div>

      <CitationList citations={citations} />
    </div>
  );
}
