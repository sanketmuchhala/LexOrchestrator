"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MOTION_TYPES = [
  { value: "motion_to_dismiss",            label: "Motion to Dismiss" },
  { value: "motion_for_summary_judgment",  label: "Motion for Summary Judgment" },
  { value: "motion_in_limine",             label: "Motion in Limine" },
  { value: "motion_to_compel",             label: "Motion to Compel" },
  { value: "preliminary_injunction",       label: "Preliminary Injunction" },
  { value: "general",                      label: "General / Other" },
];

const inputBase: React.CSSProperties = {
  fontFamily: "var(--font-mono), monospace",
  fontSize: "12px",
  color: "#f4f4f4",
  background: "#0a0a0a",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: "0.5rem 0.75rem",
  width: "100%",
  outline: "none",
  borderRadius: 0,
};

const textareaBase: React.CSSProperties = {
  ...inputBase,
  fontFamily: "var(--font-serif), Georgia, serif",
  fontSize: "14px",
  lineHeight: "1.7",
  resize: "vertical",
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        className="label mb-2 block"
        style={{ letterSpacing: "0.18em", display: "block", marginBottom: "0.375rem" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export default function DraftLauncherForm() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [matterName, setMatterName]     = useState("");
  const [motionType, setMotionType]     = useState("motion_to_dismiss");
  const [jurisdiction, setJurisdiction] = useState("SDNY");
  const [court, setCourt]               = useState("S.D.N.Y.");
  const [judgeName, setJudgeName]       = useState("");
  const [facts, setFacts]               = useState("");
  const [desiredOutput, setDesiredOutput] = useState("");

  const query = [
    matterName ? `Matter: ${matterName}.` : "",
    `Prepare a ${MOTION_TYPES.find((m) => m.value === motionType)?.label ?? motionType} in ${court}.`,
    facts ? facts.slice(0, 300) : "",
    desiredOutput ? `Desired output: ${desiredOutput}` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 1000);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!facts.trim()) {
      setError("Facts are required.");
      return;
    }
    setRunning(true);
    setError(null);

    try {
      const res = await fetch("/api/litigation/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          jurisdiction,
          court,
          motionType,
          judgeName: judgeName.trim() || undefined,
          facts: facts.trim(),
          desiredOutput: desiredOutput.trim() || undefined,
          workflowType: "motion_draft",
        }),
      });
      const data = (await res.json()) as { workflowRunId?: string; error?: string };
      if (!res.ok || !data.workflowRunId) {
        setError(data.error ?? "Workflow launch failed.");
        setRunning(false);
        return;
      }
      router.push(`/draft/${data.workflowRunId}`);
    } catch {
      setError("Network error. Check that the server is running.");
      setRunning(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">

      <div className="grid gap-6 md:grid-cols-2">
        <Field label="Matter name (optional)">
          <input
            type="text"
            value={matterName}
            onChange={(e) => setMatterName(e.target.value)}
            placeholder="Smith v. Acme Corp."
            style={inputBase}
          />
        </Field>

        <Field label="Motion type">
          <select
            value={motionType}
            onChange={(e) => setMotionType(e.target.value)}
            style={inputBase}
          >
            {MOTION_TYPES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Jurisdiction">
          <input
            type="text"
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            placeholder="SDNY"
            style={inputBase}
          />
        </Field>

        <Field label="Court">
          <input
            type="text"
            value={court}
            onChange={(e) => setCourt(e.target.value)}
            placeholder="S.D.N.Y."
            style={inputBase}
          />
        </Field>

        <Field label="Judge name (optional)">
          <input
            type="text"
            value={judgeName}
            onChange={(e) => setJudgeName(e.target.value)}
            placeholder="Hon. Jane Smith"
            style={inputBase}
          />
        </Field>

        <Field label="Desired output (optional)">
          <input
            type="text"
            value={desiredOutput}
            onChange={(e) => setDesiredOutput(e.target.value)}
            placeholder="motion_to_dismiss brief"
            style={inputBase}
          />
        </Field>
      </div>

      <Field label="Facts and background">
        <textarea
          value={facts}
          onChange={(e) => setFacts(e.target.value)}
          placeholder="Describe the relevant facts, procedural posture, and the relief sought..."
          rows={7}
          style={textareaBase}
          required
        />
      </Field>

      {error && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#f87171" }}>
          {error}
        </p>
      )}

      <div
        className="flex items-center justify-between pt-2"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#404040" }}>
          {running ? "Running eight-agent workflow. This may take a moment..." : "Eight agents will retrieve authority, draft, and verify citations."}
        </p>
        <button
          type="submit"
          disabled={running}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: running ? "#737373" : "#000",
            background: running ? "#111" : "#f4f4f4",
            border: "1px solid rgba(255,255,255,0.12)",
            padding: "0.5rem 1.5rem",
            cursor: running ? "default" : "pointer",
            flexShrink: 0,
          }}
        >
          {running ? "Drafting..." : "Draft Motion"}
        </button>
      </div>

    </form>
  );
}
