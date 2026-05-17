"use client";

import { useState, useMemo } from "react";

interface Props {
  workflowRunId: string;
  version: number;
}

const btnBase: React.CSSProperties = {
  fontFamily: "var(--font-mono), monospace",
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  textDecoration: "none",
  padding: "0.375rem 0.875rem",
  border: "1px solid rgba(255,255,255,0.12)",
  display: "inline-block",
  cursor: "pointer",
};

function ExportLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      download
      style={{
        ...btnBase,
        color: "#d4d4d4",
        background: "#0a0a0a",
      }}
    >
      {label}
    </a>
  );
}

function CheckOption({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        cursor: "pointer",
        fontFamily: "var(--font-mono), monospace",
        fontSize: "10px",
        color: "#737373",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        userSelect: "none",
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: "#34d399", width: "12px", height: "12px" }}
      />
      {label}
    </label>
  );
}

export default function DraftExportControls({ workflowRunId, version: _version }: Props) {
  const [includeJudgeBrief, setIncludeJudgeBrief] = useState(false);
  const [includeLocalRules, setIncludeLocalRules] = useState(false);
  const [includeAdversarial, setIncludeAdversarial] = useState(false);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    params.set("includeMetadata", "true");
    params.set("includeVerificationSummary", "true");
    if (includeJudgeBrief) params.set("includeJudgeBrief", "true");
    if (includeLocalRules) params.set("includeLocalRulesReview", "true");
    if (includeAdversarial) params.set("includeAdversarialReview", "true");
    return params.toString();
  }, [includeJudgeBrief, includeLocalRules, includeAdversarial]);

  const base = `/api/drafts/${workflowRunId}/export`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <ExportLink href={`${base}?format=pdf&${queryString}`} label="PDF" />
        <ExportLink href={`${base}?format=docx&${queryString}`} label="DOCX" />
        <ExportLink href={`${base}?format=txt&${queryString}`} label="TXT" />
      </div>

      <div className="flex flex-wrap gap-4">
        <CheckOption
          label="Judge Brief"
          checked={includeJudgeBrief}
          onChange={setIncludeJudgeBrief}
        />
        <CheckOption
          label="Local Rules"
          checked={includeLocalRules}
          onChange={setIncludeLocalRules}
        />
        <CheckOption
          label="Adversarial"
          checked={includeAdversarial}
          onChange={setIncludeAdversarial}
        />
      </div>

      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "#404040",
          lineHeight: "1.5",
        }}
      >
        Exports use the latest saved revision. Cover page and citation summary are always included.
        Format is demo-grade only -- not guaranteed court-filing ready.
      </p>
    </div>
  );
}
