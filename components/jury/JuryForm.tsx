"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono), monospace",
  fontSize: "12px",
  color: "var(--text-1)",
  background: "var(--s1)",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: "0.5rem 0.75rem",
  width: "100%",
  outline: "none",
  borderRadius: 0,
};

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono), monospace",
  fontSize: "10px",
  fontWeight: 600,
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
  color: "var(--text-3)",
  display: "block",
  marginBottom: "0.5rem",
};

interface JuryFormProps {
  prefillCaseSummary?: string;
  prefillLegalQuestion?: string;
  prefillJurisdiction?: string;
  prefillMotionType?: string;
  prefillConfidence?: string;
}

export default function JuryForm({
  prefillCaseSummary = "",
  prefillLegalQuestion = "",
  prefillJurisdiction = "",
  prefillMotionType = "",
  prefillConfidence = "",
}: JuryFormProps) {
  const router = useRouter();
  const [caseSummary, setCaseSummary] = useState(prefillCaseSummary);
  const [legalQuestion, setLegalQuestion] = useState(prefillLegalQuestion);
  const [jurisdiction, setJurisdiction] = useState(prefillJurisdiction);
  const [motionType, setMotionType] = useState(prefillMotionType);
  const [numAgents, setNumAgents] = useState(12);
  const [rounds, setRounds] = useState(3);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setRunning(true);

    try {
      const res = await fetch("/api/jury-simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseSummary: caseSummary.trim(),
          legalQuestion: legalQuestion.trim(),
          jurisdiction: jurisdiction.trim() || undefined,
          motionType: motionType.trim() || undefined,
          confidenceHint: prefillConfidence || undefined,
          numAgents,
          rounds,
        }),
      });

      const data = (await res.json()) as { id?: string; error?: string };

      if (!res.ok || !data.id) {
        setError(data.error ?? "Failed to start simulation.");
        setRunning(false);
        return;
      }

      router.push(`/jury/${data.id}`);
    } catch {
      setError("Network error. Check that the server is running.");
      setRunning(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" style={{ maxWidth: "42rem" }}>

      <div>
        <label style={labelStyle}>Case Summary *</label>
        <textarea
          value={caseSummary}
          onChange={(e) => setCaseSummary(e.target.value)}
          rows={5}
          required
          minLength={10}
          maxLength={2000}
          placeholder="Summarise the key facts, parties, and the legal dispute in 2-5 sentences..."
          style={{ ...inputStyle, resize: "vertical", lineHeight: "1.7" }}
        />
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", marginTop: "0.375rem" }}>
          {caseSummary.length} / 2000 characters
        </p>
      </div>

      <div>
        <label style={labelStyle}>Legal Question *</label>
        <input
          type="text"
          value={legalQuestion}
          onChange={(e) => setLegalQuestion(e.target.value)}
          required
          minLength={5}
          maxLength={500}
          placeholder="e.g. Should the motion to dismiss be granted on Fourth Amendment grounds?"
          style={inputStyle}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Jurisdiction</label>
          <input
            type="text"
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            placeholder="e.g. SDNY, Federal, New York State"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Motion Type</label>
          <input
            type="text"
            value={motionType}
            onChange={(e) => setMotionType(e.target.value)}
            placeholder="e.g. motion to dismiss"
            style={inputStyle}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Jurors (agents)</label>
          <select
            value={numAgents}
            onChange={(e) => setNumAgents(Number(e.target.value))}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value={10}>10 — faster (~40s)</option>
            <option value={12}>12 — standard jury</option>
            <option value={15}>15 — larger panel</option>
            <option value={20}>20 — full simulation (~120s)</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Deliberation Rounds</label>
          <select
            value={rounds}
            onChange={(e) => setRounds(Number(e.target.value))}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value={2}>2 rounds — quick</option>
            <option value={3}>3 rounds — recommended</option>
            <option value={4}>4 rounds — thorough</option>
          </select>
        </div>
      </div>

      {error && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--red)" }}>
          {error}
        </p>
      )}

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.25rem" }}>
        <button
          type="submit"
          disabled={running}
          style={{
            fontFamily: "var(--font-mono), monospace",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: running ? "var(--text-3)" : "#000",
            background: running ? "var(--s2)" : "var(--text-1)",
            border: "none",
            padding: "0.75rem 2rem",
            cursor: running ? "default" : "pointer",
          }}
        >
          {running ? "Empanelling jury..." : "Begin Simulation"}
        </button>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", marginTop: "0.75rem" }}>
          {numAgents} jurors · {rounds} deliberation rounds · est. {numAgents >= 15 ? "90-120" : "40-60"}s
        </p>
      </div>
    </form>
  );
}
