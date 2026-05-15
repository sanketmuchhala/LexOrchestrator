import Link from "next/link";
import { normalizedScore, metricTone, styleForStatus, text, relativeTime } from "@/lib/utils/display";

interface RunCardProps {
  id: string;
  query: string;
  status: string;
  model: string | null;
  confidence: number | null;
  hallucination_risk: number | null;
  created_at: string;
}

export default function RunCard({ id, query, status, model, confidence, hallucination_risk, created_at }: RunCardProps) {
  const confPct = confidence != null ? Math.round(normalizedScore(confidence) * 100) : null;
  const riskPct = hallucination_risk != null ? Math.round(normalizedScore(hallucination_risk) * 100) : null;

  // Derive pass/fail from confidence as a proxy (full eval data lives in the detail page)
  const passStatus = confPct != null ? (confPct >= 60 ? "pass" : "fail") : status;

  return (
    <Link
      href={`/runs/${id}`}
      className="group block rounded-xl border border-slate-800 bg-slate-900/40 p-5 transition hover:border-slate-700 hover:bg-slate-900/70"
    >
      {/* Query */}
      <p className="mb-3 line-clamp-2 text-sm font-medium leading-6 text-slate-200 group-hover:text-slate-100">
        {query}
      </p>

      {/* Metrics row */}
      <div className="flex flex-wrap items-center gap-2">
        {confPct != null && (
          <span className={`rounded border border-slate-700 bg-slate-950/60 px-2 py-0.5 font-mono text-[11px] font-semibold ${metricTone(confPct / 100)}`}>
            {confPct}% confidence
          </span>
        )}
        {riskPct != null && (
          <span className={`rounded border px-2 py-0.5 font-mono text-[11px] font-semibold ${
            riskPct <= 20 ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
            : riskPct <= 50 ? "border-amber-500/30 bg-amber-500/10 text-amber-300"
            : "border-rose-500/30 bg-rose-500/10 text-rose-300"
          }`}>
            {riskPct <= 20 ? "low" : riskPct <= 50 ? "medium" : "high"} hallucination risk
          </span>
        )}
        <span className={`rounded border px-2 py-0.5 font-mono text-[11px] font-semibold ${styleForStatus(passStatus)}`}>
          {text(passStatus)}
        </span>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {model && (
            <span className="font-mono text-[10px] text-slate-600">{model}</span>
          )}
          <span className="font-mono text-[10px] text-slate-700">{id.slice(0, 8)}…</span>
        </div>
        <span className="font-mono text-[10px] text-slate-600">
          {relativeTime(created_at)}
        </span>
      </div>
    </Link>
  );
}
