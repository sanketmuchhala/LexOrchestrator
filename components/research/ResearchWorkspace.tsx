"use client";

import { FormEvent, useState } from "react";
import LoadingState from "./LoadingState";
import ResultSummaryCard from "./ResultSummaryCard";

const SAMPLE_QUERIES = [
  "What are the evidentiary standards for admitting expert testimony in federal civil litigation?",
  "What elements must a plaintiff prove to establish a breach of contract claim?",
  "How does the summary judgment standard apply when disputed facts involve expert opinions?",
  "What are a party's discovery obligations and what proportionality limits apply?",
];

export default function ResearchWorkspace() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data: unknown = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = (data as Record<string, unknown>)?.error;
        throw new Error(typeof errMsg === "string" ? errMsg : "Orchestration failed.");
      }
      setResult(data as Record<string, unknown>);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setResult(null);
    setError(null);
    setQuery("");
  }

  return (
    <div className="space-y-6">

      {/* Input form (hidden once result is showing) */}
      {!result && (
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="query" className="mb-2 block font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Legal Research Query
              </label>
              <textarea
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(e as unknown as FormEvent); }}
                placeholder="Describe the legal issue, jurisdiction, and specific question…"
                rows={4}
                maxLength={1200}
                disabled={loading}
                className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-100 placeholder-slate-600 outline-none transition focus:border-cyan-400/60 focus:ring-1 focus:ring-cyan-400/20 disabled:opacity-60"
              />
              <p className="mt-1.5 text-right font-mono text-[10px] text-slate-700">
                {query.length} / 1200
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="hidden text-xs text-slate-600 sm:block">⌘ + Enter to submit</p>
              <button
                type="submit"
                disabled={loading || query.trim().length < 5}
                className="w-full rounded-lg bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-600 sm:w-auto"
              >
                {loading ? "Orchestrating…" : "Run Orchestration ⚡"}
              </button>
            </div>
          </form>

          {/* Sample queries */}
          {!loading && (
            <div className="mt-5 border-t border-slate-800 pt-5">
              <p className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                Sample Queries
              </p>
              <div className="space-y-2">
                {SAMPLE_QUERIES.map((q) => (
                  <button
                    key={q}
                    onClick={() => setQuery(q)}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-left text-xs text-slate-400 transition hover:border-slate-700 hover:text-slate-200"
                  >
                    <span className="mr-2 font-mono text-slate-700">→</span>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Loading */}
      {loading && <LoadingState />}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-lg border border-rose-500/25 bg-rose-500/8 px-4 py-3 text-sm text-rose-300">
          ⚠ {error}
        </div>
      )}

      {/* Result summary */}
      {result && !loading && (
        <ResultSummaryCard result={result} onReset={reset} />
      )}

    </div>
  );
}
