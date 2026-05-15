"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO_INPUT = {
  query:
    "Defendant moves to dismiss plaintiff's breach of contract claim under Rule 12(b)(6) for failure to plead sufficient facts establishing the existence of a binding agreement and breach thereof.",
  jurisdiction: "SDNY",
  court: "S.D.N.Y.",
  motionType: "motion_to_dismiss",
  judgeName: "Demo Judge",
  facts:
    "Plaintiff and defendant entered into a written services agreement dated January 2023. Defendant failed to perform and did not provide notice of non-performance.",
};

export default function DemoWorkflowLauncher() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function launch() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/litigation/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(DEMO_INPUT),
      });
      const data = (await res.json()) as { workflowRunId?: string; error?: string };
      if (!res.ok || !data.workflowRunId) {
        setError(data.error ?? "Workflow launch failed.");
        setRunning(false);
        return;
      }
      router.push(`/workflows/${data.workflowRunId}`);
    } catch {
      setError("Network error. Check that the dev server is running.");
      setRunning(false);
    }
  }

  return (
    <div>
      <button
        onClick={launch}
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
          padding: "0.5rem 1.25rem",
          cursor: running ? "default" : "pointer",
          transition: "opacity 0.15s",
        }}
      >
        {running ? "Launching..." : "Run Demo Workflow"}
      </button>
      {error && (
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "#f87171",
            marginTop: "0.5rem",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
