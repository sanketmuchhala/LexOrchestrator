"use client";

const STEPS = [
  { label: "Intake Agent",              sub: "Classifying query and extracting legal terms" },
  { label: "Hybrid Retrieval",          sub: "Searching corpus with pgvector + keyword scoring" },
  { label: "Citation Validator",        sub: "Matching claims against retrieved sources" },
  { label: "Adversarial Review",        sub: "Stress-testing reasoning as opposing counsel" },
  { label: "Hallucination Monitor",     sub: "Scoring unsupported claim risk" },
  { label: "Final Synthesis",           sub: "Generating cited legal analysis" },
  { label: "Eval Engine",               sub: "Computing reliability metrics" },
];

export default function LoadingState() {
  return (
    <div className="rounded-xl border border-cyan-400/15 bg-cyan-400/[0.03] p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-100">Running orchestration pipeline</p>
          <p className="mt-0.5 text-xs text-slate-500">
            7 agents routing, validating, and scoring your query.
          </p>
        </div>
        <div className="h-7 w-7 shrink-0 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-300" />
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map(({ label, sub }, i) => (
          <div
            key={label}
            className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2.5"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400"
                style={{ animationDelay: `${i * 120}ms` }}
              />
              <p className="text-xs font-semibold text-slate-300">{label}</p>
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
