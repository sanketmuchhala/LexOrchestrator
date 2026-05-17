"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MATTER_TYPES = [
  { value: "litigation",        label: "Litigation" },
  { value: "motion_practice",   label: "Motion Practice" },
  { value: "appeal",            label: "Appeal" },
  { value: "arbitration",       label: "Arbitration" },
  { value: "contract_dispute",  label: "Contract Dispute" },
  { value: "regulatory",        label: "Regulatory" },
  { value: "general",           label: "General / Other" },
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

function Field({ label, children, optional }: { label: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <div>
      <label style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-3)", letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>
        {label}{optional && <span style={{ color: "#2a2a2a", marginLeft: "0.5rem" }}>(optional)</span>}
      </label>
      {children}
    </div>
  );
}

export default function MatterForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [clientName, setClientName] = useState("");
  const [matterType, setMatterType] = useState("litigation");
  const [jurisdiction, setJurisdiction] = useState("");
  const [court, setCourt] = useState("");
  const [judgeName, setJudgeName] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) { setError("Title is required."); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/matters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          clientName: clientName.trim() || undefined,
          matterType: matterType || undefined,
          jurisdiction: jurisdiction.trim() || undefined,
          court: court.trim() || undefined,
          judgeName: judgeName.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Failed to create matter.");
      }

      const data = await res.json() as { id: string };
      router.push(`/matters/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" style={{ maxWidth: "40rem" }}>
      <Field label="Title">
        <input style={inputBase} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Aurora Analytics v. Northstar — SDNY" />
      </Field>

      <Field label="Client Name" optional>
        <input style={inputBase} value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client or party name" />
      </Field>

      <Field label="Matter Type">
        <select style={{ ...inputBase, cursor: "pointer" }} value={matterType} onChange={(e) => setMatterType(e.target.value)}>
          {MATTER_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <Field label="Jurisdiction" optional>
          <input style={inputBase} value={jurisdiction} onChange={(e) => setJurisdiction(e.target.value)} placeholder="Federal, SDNY, etc." />
        </Field>
        <Field label="Court" optional>
          <input style={inputBase} value={court} onChange={(e) => setCourt(e.target.value)} placeholder="S.D.N.Y., USCA 2nd, etc." />
        </Field>
      </div>

      <Field label="Judge Name" optional>
        <input style={inputBase} value={judgeName} onChange={(e) => setJudgeName(e.target.value)} placeholder="Judge name for brief preparation" />
      </Field>

      <Field label="Description" optional>
        <textarea
          style={{ ...inputBase, fontFamily: "var(--font-serif), Georgia, serif", fontSize: "14px", lineHeight: "1.7", resize: "vertical", minHeight: "80px" }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of the matter and key issues."
        />
      </Field>

      {error && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#f87171" }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          padding: "0.5rem 1.25rem",
          background: submitting ? "var(--s2)" : "var(--text-1)",
          color: submitting ? "var(--text-3)" : "#000000",
          border: "none",
          cursor: submitting ? "default" : "pointer",
        }}
      >
        {submitting ? "Creating..." : "Create Matter"}
      </button>
    </form>
  );
}
