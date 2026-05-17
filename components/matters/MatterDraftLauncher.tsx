"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MatterRow } from "@/lib/matters/types";

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

interface Props {
  matter: MatterRow;
}

export default function MatterDraftLauncher({ matter }: Props) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facts, setFacts] = useState("");
  const [desiredOutput, setDesiredOutput] = useState("");
  const [motionType, setMotionType] = useState("motion_to_dismiss");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const query = facts.trim() || `${matter.matter_type ?? "Litigation"} matter for ${matter.client_name ?? "client"} in ${matter.jurisdiction ?? "Federal"} court.`;

    setRunning(true);
    try {
      const res = await fetch("/api/litigation/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          jurisdiction: matter.jurisdiction ?? "Federal",
          court: matter.court ?? "U.S. District Court",
          motionType,
          facts: facts.trim() || undefined,
          desiredOutput: desiredOutput.trim() || undefined,
          matterId: matter.id,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Workflow failed.");
      }

      const data = await res.json() as { workflowRunId: string };
      router.push(`/draft/${data.workflowRunId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setRunning(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
        <div>
          <label style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-3)", letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>
            Motion Type
          </label>
          <select style={{ ...inputBase, cursor: "pointer" }} value={motionType} onChange={(e) => setMotionType(e.target.value)}>
            <option value="motion_to_dismiss">Motion to Dismiss</option>
            <option value="motion_for_summary_judgment">Motion for Summary Judgment</option>
            <option value="motion_in_limine">Motion in Limine</option>
            <option value="motion_to_compel">Motion to Compel</option>
            <option value="preliminary_injunction">Preliminary Injunction</option>
            <option value="general">General / Other</option>
          </select>
        </div>
        <div>
          <label style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-3)", letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>
            Jurisdiction
          </label>
          <input style={{ ...inputBase, color: "var(--text-3)" }} value={matter.jurisdiction ?? "Federal"} readOnly />
        </div>
      </div>

      <div>
        <label style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-3)", letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>
          Facts / Key Issues
        </label>
        <textarea
          style={{ ...inputBase, fontFamily: "var(--font-serif), Georgia, serif", fontSize: "14px", lineHeight: "1.7", resize: "vertical", minHeight: "100px" }}
          value={facts}
          onChange={(e) => setFacts(e.target.value)}
          placeholder="Describe the key facts, legal issues, and what the motion should accomplish."
        />
      </div>

      <div>
        <label style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-3)", letterSpacing: "0.2em", textTransform: "uppercase", display: "block", marginBottom: "0.375rem" }}>
          Desired Output <span style={{ color: "#2a2a2a", marginLeft: "0.5rem" }}>(optional)</span>
        </label>
        <input
          style={inputBase}
          value={desiredOutput}
          onChange={(e) => setDesiredOutput(e.target.value)}
          placeholder="e.g. Motion to dismiss with prejudice"
        />
      </div>

      {error && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#f87171" }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={running}
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          padding: "0.5rem 1.25rem",
          background: running ? "var(--s2)" : "var(--text-1)",
          color: running ? "var(--text-3)" : "#000000",
          border: "none",
          cursor: running ? "default" : "pointer",
        }}
      >
        {running ? "Running agents..." : "Start Draft Workflow"}
      </button>
    </form>
  );
}
