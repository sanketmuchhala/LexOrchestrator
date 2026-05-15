import Link from "next/link";

// ─── Data ─────────────────────────────────────────────────────────────────────

const PIPELINE = [
  { step: "01", label: "Intake",       sub: "Query classification" },
  { step: "02", label: "Retrieval",    sub: "Hybrid RAG search" },
  { step: "03", label: "Validator",    sub: "Citation support" },
  { step: "04", label: "Adversarial",  sub: "Opposition pass" },
  { step: "05", label: "Hallucination",sub: "Risk monitor" },
  { step: "06", label: "Synthesis",    sub: "Cited answer" },
  { step: "07", label: "Eval",         sub: "Reliability score" },
];

const FEATURES = [
  {
    id: "rag",
    eyebrow: "Retrieval",
    title: "Hybrid RAG",
    tag: "pgvector + keyword scoring",
    body: "Vector similarity fused with TF-style keyword overlap, jurisdiction boosts, and deterministic reranking. Degrades gracefully to keyword-only when embeddings are unavailable.",
    metric: "5 ranked sources per query",
    accent: "cyan",
  },
  {
    id: "citation",
    eyebrow: "Validation",
    title: "Citation Checking",
    tag: "verified · partial · unsupported",
    body: "Every generated claim is checked against retrieved corpus entries before synthesis. Unsupported claims are flagged and counted toward hallucination risk - not hidden.",
    metric: "Per-claim support score",
    accent: "emerald",
  },
  {
    id: "hallucination",
    eyebrow: "Risk",
    title: "Hallucination Scoring",
    tag: "numeric 0 – 1",
    body: "Unsupported citation count, retrieval coverage gaps, and adversarial objection severity combine into a single numeric risk score with factor-level explanations.",
    metric: "Factor analysis per run",
    accent: "amber",
  },
];

const ACCENT: Record<string, { border: string; text: string; bg: string }> = {
  cyan:    { border: "border-cyan-400/25",    text: "text-cyan-300",    bg: "bg-cyan-400/8" },
  emerald: { border: "border-emerald-400/25", text: "text-emerald-300", bg: "bg-emerald-400/8" },
  amber:   { border: "border-amber-400/25",   text: "text-amber-300",   bg: "bg-amber-400/8" },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="relative">

      {/* Atmospheric gradient */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-40 left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-cyan-400/[0.04] blur-3xl" />
        <div className="absolute top-[30%] -right-60 h-[400px] w-[600px] rounded-full bg-violet-500/[0.035] blur-3xl" />
      </div>

      {/* ── Hero ── */}
      <section className="pt-20 pb-16 text-center">

        {/* Pill badge */}
        <div className="mx-auto mb-8 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/5 px-4 py-1.5">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
            Multi-Agent · Eval-Driven · RAG-Backed
          </span>
        </div>

        {/* Title */}
        <h1 className="mb-4 bg-gradient-to-b from-slate-50 to-slate-300 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-7xl">
          LexOrchestrator
        </h1>

        <p className="mb-2 text-lg font-medium tracking-wide text-cyan-200/80 sm:text-xl">
          Multi-Agent Litigation Reliability Engine
        </p>

        {/* Value prop */}
        <p className="mx-auto mb-10 max-w-2xl text-base leading-7 text-slate-400">
          A single LLM call cannot validate its own citations. LexOrchestrator routes every legal
          query through a seven-agent pipeline - retrieval, citation validation, adversarial review,
          and hallucination scoring - before surfacing a final answer with structured eval metrics.
        </p>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/research"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-400/10 transition hover:bg-cyan-200 active:scale-[0.98]"
          >
            Start Research
            <span aria-hidden>→</span>
          </Link>
          <Link
            href="/runs"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-6 py-3 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
          >
            View Run History
          </Link>
        </div>
      </section>

      {/* ── Pipeline visualization ── */}
      <section className="mb-20">
        <p className="mb-6 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
          7-Agent Orchestration Pipeline
        </p>

        {/* Desktop: horizontal flow */}
        <div className="hidden items-stretch gap-0 lg:flex">
          {PIPELINE.map(({ step, label, sub }, i) => (
            <div key={step} className="relative flex flex-1 items-stretch">

              {/* Connector line (before each node except the first) */}
              {i > 0 && (
                <div className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-gradient-to-r from-slate-700 to-slate-700" />
              )}

              <div className={`relative flex w-full flex-col items-center rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-4 text-center ${i > 0 ? "ml-4" : ""}`}>
                {/* Arrow between cards - overlaid */}
                {i > 0 && (
                  <div className="absolute -left-[18px] top-1/2 -translate-y-1/2 font-mono text-xs text-slate-700">
                    ›
                  </div>
                )}
                <p className="mb-1 font-mono text-[10px] font-semibold text-slate-600">{step}</p>
                <p className="text-sm font-semibold text-slate-200">{label}</p>
                <p className="mt-1 text-[11px] leading-tight text-slate-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: vertical list */}
        <div className="flex flex-col gap-2 lg:hidden">
          {PIPELINE.map(({ step, label, sub }, i) => (
            <div key={step} className="flex items-start gap-4 rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3">
              <span className="mt-0.5 font-mono text-xs font-bold text-slate-600">{step}</span>
              <div>
                <p className="text-sm font-semibold text-slate-200">{label}</p>
                <p className="text-xs text-slate-500">{sub}</p>
              </div>
              {i < PIPELINE.length - 1 && (
                <span className="ml-auto font-mono text-slate-700">↓</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature grid ── */}
      <section className="mb-20">
        <div className="mb-10 text-center">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
            Core Capabilities
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-100">
            Built for litigation reliability, not convenience
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          {FEATURES.map(({ id, eyebrow, title, tag, body, metric, accent }) => {
            const a = ACCENT[accent];
            return (
              <div
                key={id}
                className={`rounded-xl border ${a.border} ${a.bg} p-6 backdrop-blur-sm`}
              >
                <p className={`mb-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] ${a.text}`}>
                  {eyebrow}
                </p>
                <h3 className="mb-1 text-lg font-semibold text-slate-100">{title}</h3>
                <p className="mb-4 font-mono text-[11px] text-slate-500">{tag}</p>
                <p className="mb-6 text-sm leading-6 text-slate-400">{body}</p>
                <div className={`inline-flex rounded border ${a.border} px-2.5 py-1 font-mono text-[11px] font-semibold ${a.text}`}>
                  {metric}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── What's real section ── */}
      <section className="mb-20">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Database", value: "Supabase / pgvector", status: "live" },
              { label: "LLM Agents", value: "OpenAI-compatible", status: "live" },
              { label: "Retrieval", value: "Hybrid RAG", status: "live" },
              { label: "Eval Engine", value: "Structured metrics", status: "live" },
            ].map(({ label, value, status }) => (
              <div key={label}>
                <div className="mb-1 flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${status === "live" ? "bg-emerald-400" : "bg-slate-600"}`} />
                  <p className="font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">{label}</p>
                </div>
                <p className="text-sm font-semibold text-slate-200">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Disclaimer ── */}
      <footer className="border-t border-slate-800/50 py-8 text-center">
        <p className="text-xs text-slate-600">
          ⚠ Sample educational corpus only - not real legal authority. LexOrchestrator is a prototype
          for litigation AI reliability architecture. Not legal advice. Not court-ready.
        </p>
      </footer>

    </div>
  );
}
