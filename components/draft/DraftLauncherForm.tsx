"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  demoCourt,
  demoDesiredOutput,
  demoFacts,
  demoJudgeName,
  demoJurisdiction,
  demoMotionType,
} from "@/lib/demo/litigationDemoFixture";

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
  color: "var(--text-1)",
  background: "var(--s1)",
  border: "1px solid rgba(0,0,0,0.09)",
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

const DOCUMENT_ROLES = [
  { value: "case_file",   label: "General Case File" },
  { value: "complaint",   label: "Complaint" },
  { value: "deposition",  label: "Deposition Transcript" },
  { value: "affidavit",   label: "Affidavit" },
  { value: "exhibit",     label: "Exhibit" },
  { value: "motion",      label: "Prior Motion" },
  { value: "other",       label: "Other" },
];

interface UploadState {
  fileName: string;
  extractedText: string;
  characterCount: number;
  truncated: boolean;
  documentRole: string;
  error: string | null;
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

  const [uploadState, setUploadState] = useState<UploadState | null>(null);
  const [uploading, setUploading] = useState(false);
  const [documentRole, setDocumentRole] = useState("case_file");
  const fileInputRef = useState<HTMLInputElement | null>(null);

  function loadDemo() {
    setMatterName("Aurora Analytics LLC v. Northstar Retail Systems");
    setMotionType(demoMotionType);
    setJurisdiction(demoJurisdiction);
    setCourt(demoCourt);
    setJudgeName(demoJudgeName);
    setFacts(demoFacts);
    setDesiredOutput(demoDesiredOutput);
    setUploadState(null);
    setError(null);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadState(null);

    const form = new FormData();
    form.append("file", file);
    form.append("documentRole", documentRole);

    try {
      const res = await fetch("/api/uploads/case-file", { method: "POST", body: form });
      const data = await res.json() as {
        upload?: { fileName: string; extractedTextLength: number; truncated: boolean };
        extractedText?: string;
        error?: string;
      };

      if (!res.ok || data.error) {
        setUploadState({
          fileName: file.name,
          extractedText: "",
          characterCount: 0,
          truncated: false,
          documentRole,
          error: data.error ?? "Upload failed.",
        });
      } else {
        setUploadState({
          fileName: data.upload?.fileName ?? file.name,
          extractedText: data.extractedText ?? "",
          characterCount: data.upload?.extractedTextLength ?? 0,
          truncated: data.upload?.truncated ?? false,
          documentRole,
          error: null,
        });
      }
    } catch {
      setUploadState({
        fileName: file.name,
        extractedText: "",
        characterCount: 0,
        truncated: false,
        documentRole,
        error: "Network error during upload.",
      });
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-uploaded if needed
      e.target.value = "";
    }
  }

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
          uploadedText: uploadState?.extractedText || undefined,
          metadata: uploadState ? { documentRole: uploadState.documentRole } : undefined,
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

      {/* ── Case file upload ─────────────────────────────────────────────── */}
      <div style={{ borderTop: "1px solid rgba(0,0,0,0.07)", paddingTop: "1.25rem" }}>
        <p className="label mb-3" style={{ letterSpacing: "0.18em" }}>
          Case file (optional)
        </p>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", marginBottom: "0.75rem" }}>
          Upload a .txt or .md document. The extracted text is used as factual case material, not legal authority.
        </p>

        <div className="grid gap-3 md:grid-cols-2 mb-3">
          <div>
            <label className="label mb-1 block" style={{ letterSpacing: "0.14em" }}>
              Document role
            </label>
            <select
              value={documentRole}
              onChange={(e) => setDocumentRole(e.target.value)}
              disabled={uploading || running}
              style={inputBase}
            >
              {DOCUMENT_ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label mb-1 block" style={{ letterSpacing: "0.14em" }}>
              File
            </label>
            <label
              style={{
                display: "block",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: uploading || running ? "var(--text-3)" : "var(--text-2)",
                background: "var(--s1)",
                border: "1px solid rgba(0,0,0,0.09)",
                padding: "0.5rem 0.75rem",
                cursor: uploading || running ? "default" : "pointer",
                userSelect: "none",
              }}
            >
              {uploading ? "Uploading..." : "Choose file"}
              <input
                type="file"
                accept=".txt,.md,.markdown"
                disabled={uploading || running}
                onChange={handleFileUpload}
                ref={(el) => { fileInputRef[0] = el; }}
                style={{ display: "none" }}
              />
            </label>
          </div>
        </div>

        {uploadState && !uploadState.error && (
          <div
            style={{
              border: "1px solid rgba(0,0,0,0.07)",
              padding: "0.75rem",
              marginTop: "0.5rem",
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-1)" }}>
                {uploadState.fileName}
              </span>
              <div className="flex items-center gap-2">
                {uploadState.truncated && (
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#fbbf24" }}>
                    truncated
                  </span>
                )}
                <span className="badge badge-pass">extracted</span>
                <button
                  type="button"
                  onClick={() => setUploadState(null)}
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "var(--text-2)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                  }}
                >
                  remove
                </button>
              </div>
            </div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", marginBottom: "0.5rem" }}>
              {uploadState.characterCount.toLocaleString()} characters extracted
            </p>
            <p
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "12px",
                color: "var(--text-2)",
                lineHeight: "1.6",
                whiteSpace: "pre-wrap",
                maxHeight: "5rem",
                overflow: "hidden",
              }}
            >
              {uploadState.extractedText.slice(0, 280)}
              {uploadState.extractedText.length > 280 ? "..." : ""}
            </p>
          </div>
        )}

        {uploadState?.error && (
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#f87171", marginTop: "0.5rem" }}>
            {uploadState.error}
          </p>
        )}
      </div>

      {error && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#f87171" }}>
          {error}
        </p>
      )}

      <div
        className="flex flex-wrap items-center justify-between gap-4 pt-2"
        style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}
      >
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-3)" }}>
          {running ? "Running eight-agent workflow. This may take a moment..." : "Eight agents will retrieve authority, draft, and verify citations."}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={loadDemo}
            disabled={running}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "var(--text-2)",
              background: "var(--s1)",
              border: "1px solid rgba(0,0,0,0.12)",
              padding: "0.5rem 1rem",
              cursor: running ? "default" : "pointer",
              flexShrink: 0,
            }}
          >
            Load Demo
          </button>
          <button
            type="submit"
            disabled={running}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: running ? "var(--text-3)" : "#000000",
              background: running ? "var(--s2)" : "var(--text-1)",
              border: "1px solid rgba(0,0,0,0.12)",
              padding: "0.5rem 1.5rem",
              cursor: running ? "default" : "pointer",
              flexShrink: 0,
            }}
          >
            {running ? "Drafting..." : "Draft Motion"}
          </button>
        </div>
      </div>

    </form>
  );
}
