import type { WorkflowArtifactRow } from "@/lib/litigation/getWorkflowRun";
import type { LocalRulesAgentOutput } from "@/lib/litigation/types";

// ─── Structured rendering from metadata ──────────────────────────────────────

function SectionCheckRow({
  label,
  detected,
  required,
}: {
  label: string;
  detected: boolean;
  required: boolean;
}) {
  const badgeClass = detected ? "badge-pass" : required ? "badge-fail" : "badge-neutral";
  const badgeText = detected ? "detected" : required ? "missing" : "optional";

  return (
    <div className="flex items-center justify-between py-1.5">
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: detected ? "var(--text-2)" : required ? "#f87171" : "var(--text-3)",
        }}
      >
        {label}
      </span>
      <span className={`badge ${badgeClass}`}>{badgeText}</span>
    </div>
  );
}

function NoteList({ items, color = "var(--text-3)" }: { items: string[]; color?: string }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: "13px",
            lineHeight: "1.65",
            color,
            paddingLeft: "0.875rem",
            borderLeft: "2px solid rgba(255,255,255,0.05)",
          }}
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function SubHead({ children }: { children: string }) {
  return (
    <p className="label mb-2" style={{ marginTop: "1rem", letterSpacing: "0.16em" }}>
      {children}
    </p>
  );
}

function StructuredPanel({ rules }: { rules: LocalRulesAgentOutput }) {
  const detectedRequired = rules.sectionChecks.filter((s) => s.required && s.detected).length;
  const totalRequired = rules.sectionChecks.filter((s) => s.required).length;
  const allClear = rules.missingSections.length === 0;

  return (
    <div>
      {/* Profile header */}
      <div
        className="mb-4 flex items-center justify-between pb-3"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}
      >
        <span
          style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-2)" }}
        >
          {rules.profileLabel}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--text-3)",
          }}
        >
          {Math.round(rules.confidence * 100)}% confidence
        </span>
      </div>

      {/* Section detection */}
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="label">Section Analysis</span>
          <span
            className={`badge ${allClear ? "badge-pass" : "badge-fail"}`}
          >
            {detectedRequired}/{totalRequired} detected
          </span>
        </div>
        <div
          style={{ border: "1px solid rgba(0,0,0,0.07)", padding: "0.5rem 0.75rem" }}
        >
          {rules.sectionChecks
            .filter((s) => s.required)
            .map((s) => (
              <SectionCheckRow
                key={s.sectionId}
                label={s.label}
                detected={s.detected}
                required={s.required}
              />
            ))}
        </div>
      </div>

      {/* Warnings */}
      {rules.warnings.length > 0 && (
        <div className="mb-4">
          <SubHead>Warnings</SubHead>
          <NoteList items={rules.warnings} color="#fbbf24" />
        </div>
      )}

      {/* Formatting notes */}
      {rules.formattingNotes.length > 0 && (
        <div className="mb-4">
          <SubHead>Formatting Notes</SubHead>
          <NoteList items={rules.formattingNotes} />
        </div>
      )}

      {/* Citation notes */}
      {rules.citationNotes.length > 0 && (
        <div className="mb-4">
          <SubHead>Citation Notes</SubHead>
          <NoteList items={rules.citationNotes} />
        </div>
      )}

      {/* Filing notes */}
      {rules.filingNotes.length > 0 && (
        <div className="mb-4">
          <SubHead>Filing Notes</SubHead>
          <NoteList items={rules.filingNotes} />
        </div>
      )}

      {/* Limitations */}
      {rules.limitations.length > 0 && (
        <div
          className="pt-3"
          style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}
        >
          <p className="label mb-1" style={{ fontSize: "9px" }}>
            Limitations
          </p>
          {rules.limitations.map((lim, i) => (
            <p
              key={i}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--text-3)",
                lineHeight: "1.6",
              }}
            >
              {lim}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Text-only fallback (legacy artifacts without metadata) ──────────────────

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

function LegacyPanel({ content }: { content: string }) {
  const formattingNotes = extractSection(content, "FORMATTING NOTES");
  const ruleWarnings = extractSection(content, "RULE WARNINGS");

  if (formattingNotes.length === 0 && ruleWarnings.length === 0) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-3)" }}>
        No local rules notes extracted.
      </p>
    );
  }

  return (
    <div>
      {formattingNotes.length > 0 && (
        <div className="mb-5">
          <p className="label mb-2">Formatting Notes</p>
          <NoteList items={formattingNotes} />
        </div>
      )}
      {ruleWarnings.length > 0 && (
        <div>
          <p className="label mb-2">Rule Warnings</p>
          <NoteList
            items={ruleWarnings}
            color="#fbbf24"
          />
        </div>
      )}
    </div>
  );
}

// ─── Main export ─────────────────────────────────────────────────────────────

export default function LocalRulesPanel({
  artifact,
}: {
  artifact: WorkflowArtifactRow | null;
}) {
  if (!artifact) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-3)" }}>
        No local rules artifact recorded for this workflow run.
      </p>
    );
  }

  const structured =
    artifact.metadata &&
    typeof artifact.metadata.localRules === "object" &&
    artifact.metadata.localRules !== null
      ? (artifact.metadata.localRules as LocalRulesAgentOutput)
      : null;

  if (structured) {
    return <StructuredPanel rules={structured} />;
  }

  return <LegacyPanel content={artifact.content} />;
}
