"use client";

import { useState, useRef } from "react";
import type { OrchestratorResult } from "@/lib/types";
import AgentTimeline from "@/components/AgentTimeline";
import FinalAnswerPanel from "@/components/FinalAnswerPanel";
import EvalReportPanel from "@/components/EvalReportPanel";
import SourcesPanel from "@/components/SourcesPanel";

const DEMO_QUERIES = [
  "What are the evidentiary standards for admitting expert testimony in federal civil litigation?",
  "What elements must a plaintiff prove to establish a breach of contract claim?",
  "How does the summary judgment standard apply when disputed facts involve expert opinions?",
  "What are a party's discovery obligations and what limits apply to proportionality?",
];

function LoadingPulse() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-6">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-semibold text-slate-300 animate-pulse">Orchestrating agents...</p>
        <p className="text-xs text-slate-600">Intake → Retrieval → Citation Validation → Adversarial Review → Synthesis → Eval</p>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-sm">
            ⚖️
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 tracking-tight">LexOrchestrator</h1>
            <p className="text-xs text-slate-500">Multi-Agent Litigation Reliability Engine</p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          6 agents · sample corpus · no API keys required
        </div>
      </div>
    </header>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrchestratorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Orchestration failed.");
      }

      const data: OrchestratorResult = await res.json();
      setResult(data);

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setLoading(false);
    }
  }

  function loadDemoQuery(q: string) {
    setQuery(q);
    setResult(null);
    setError(null);
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        {/* Hero */}
        <section className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            v1 · Sample Corpus · Deterministic Agents
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-100 tracking-tight mb-3">
            Multi-Agent Legal AI Orchestration
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-base leading-relaxed">
            Enter a legal research question. The pipeline runs intake classification, RAG-style retrieval,
            citation validation, adversarial review, synthesis, and eval scoring — all in one pass.
          </p>
        </section>

        {/* Query Input */}
        <section className="max-w-2xl mx-auto mb-10">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="relative">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(e);
                }}
                placeholder="E.g. What are the evidentiary standards for admitting expert testimony in federal civil litigation?"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-slate-100 placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-colors min-h-[90px]"
                rows={3}
                maxLength={1000}
                disabled={loading}
              />
              <span className="absolute bottom-2.5 right-3 text-xs text-slate-600 font-mono">
                {query.length}/1000
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || query.trim().length < 5}
              className="w-full py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold text-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              {loading ? "Orchestrating..." : "Run Orchestration ⚡"}
            </button>

            <p className="text-center text-xs text-slate-600">⌘ + Enter to submit</p>
          </form>

          {/* Demo queries */}
          <div className="mt-5">
            <p className="text-xs text-slate-500 text-center mb-3 font-medium">Try a demo query:</p>
            <div className="flex flex-col gap-2">
              {DEMO_QUERIES.map((q) => (
                <button
                  key={q}
                  onClick={() => loadDemoQuery(q)}
                  disabled={loading}
                  className="text-left text-xs text-slate-400 hover:text-indigo-400 bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/30 rounded-lg px-3 py-2 transition-all duration-150 disabled:opacity-50"
                >
                  → {q}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-sm">
            ⚠ {error}
          </div>
        )}

        {/* Loading */}
        {loading && <LoadingPulse />}

        {/* Results */}
        {result && !loading && (
          <div ref={resultsRef} className="mt-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-slate-800" />
              <p className="text-xs text-slate-500 font-mono px-2">
                Pipeline complete · {result.executionTrace.reduce((a, s) => a + s.durationMs, 0)}ms total
              </p>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* Query recap */}
            <div className="mb-6 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1.5">Query</p>
              <p className="text-sm text-slate-300 leading-relaxed">{result.query}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Agent Timeline */}
              <div>
                <AgentTimeline result={result} />
              </div>

              {/* Right: Answer, Eval, Sources */}
              <div className="flex flex-col gap-6">
                <FinalAnswerPanel finalAnswer={result.finalAnswer} />
                <EvalReportPanel evalReport={result.evalReport} />
                <SourcesPanel sources={result.retrievedSources} />
              </div>
            </div>

            <p className="text-center text-xs text-slate-700 mt-10">
              ⚠ LexOrchestrator uses sample educational content only. Not real legal advice or authority.
              Always consult a licensed attorney for legal matters.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
