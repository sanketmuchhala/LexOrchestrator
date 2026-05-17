"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import LoadingState from "./LoadingState";

const SAMPLE_QUERIES = [
  { n: "01", q: "What constitutional protections apply to unreasonable searches and seizures under the Fourth Amendment?" },
  { n: "02", q: "What are the evidentiary standards for admitting expert testimony in federal civil litigation?" },
  { n: "03", q: "How does the Fourteenth Amendment equal protection clause apply to state discrimination claims?" },
  { n: "04", q: "What elements must a plaintiff prove to establish a breach of contract claim under common law?" },
  { n: "05", q: "What discovery proportionality limits apply under the Federal Rules of Civil Procedure?" },
];

export default function ResearchWorkspace() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 5 || loading) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed }),
      });

      const data = await res.json().catch(() => ({})) as Record<string, unknown>;

      if (!res.ok) {
        const msg = data?.error;
        throw new Error(typeof msg === "string" ? msg : "Orchestration failed.");
      }

      const runId = data?.runId as string | undefined;
      if (runId) {
        router.push(`/runs/${runId}`);
        return;
      }

      throw new Error("Pipeline completed but no run ID returned. Configure Supabase to enable persistence.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      setLoading(false);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-10 appear">

      {/* Query form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="query"
            className="label mb-2 block"
          >
            Research Query
          </label>
          <textarea
            id="query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleSubmit(e as unknown as FormEvent);
              }
            }}
            placeholder="Describe the legal issue, jurisdiction, and specific question..."
            rows={5}
            maxLength={1200}
            className="w-full resize-none bg-[var(--s1)] px-4 py-4 text-sm leading-7 text-[var(--text-1)] placeholder-[var(--text-3)] outline-none transition"
            style={{
              fontFamily: "var(--font-mono), monospace",
              border: "1px solid rgba(0,0,0,0.09)",
              borderRadius: "2px",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.18)")}
            onBlur={(e)  => (e.currentTarget.style.borderColor = "rgba(0,0,0,0.09)")}
          />
          <div
            className="mt-2 flex items-center justify-between text-[10px] text-[var(--text-3)]"
            style={{ fontFamily: "var(--font-mono), monospace" }}
          >
            <span>CMD+ENTER to submit</span>
            <span className="tabular-nums">{query.length} / 1200</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={query.trim().length < 5}
          className="w-full py-3 text-xs font-bold uppercase tracking-[0.2em] transition-colors disabled:cursor-not-allowed"
          style={{
            fontFamily: "var(--font-mono), monospace",
            background: query.trim().length >= 5 ? "var(--text-1)" : "var(--s2)",
            color: query.trim().length >= 5 ? "#ffffff" : "var(--text-3)",
            border: "1px solid rgba(0,0,0,0.09)",
            borderRadius: "2px",
          }}
        >
          Submit for Analysis
        </button>
      </form>

      {error && (
        <div
          className="px-4 py-3 text-xs text-[#f87171]"
          style={{
            fontFamily: "var(--font-mono), monospace",
            border: "1px solid rgba(248,113,113,0.2)",
            background: "rgba(248,113,113,0.04)",
            borderRadius: "2px",
          }}
        >
          ERROR: {error}
        </div>
      )}

      {/* Sample queries */}
      <div>
        <div className="rule mb-6" />
        <p className="label mb-4">Sample Queries</p>
        <div className="space-y-px">
          {SAMPLE_QUERIES.map(({ n, q }) => (
            <button
              key={n}
              onClick={() => setQuery(q)}
              className="flex w-full items-start gap-5 px-4 py-3.5 text-left transition-colors"
              style={{
                fontFamily: "var(--font-mono), monospace",
                background: "var(--s1)",
                border: "none",
                borderBottom: "1px solid rgba(0,0,0,0.05)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--s2)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "var(--s1)")}
            >
              <span className="shrink-0 text-[11px] font-bold text-[var(--text-3)]">{n}</span>
              <span className="text-xs leading-5 text-[var(--text-2)]">{q}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
