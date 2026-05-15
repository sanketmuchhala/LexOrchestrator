"use client";

import Link from "next/link";
import { asRecord, normalizedScore, metricTone, styleForStatus, text, list } from "@/lib/utils/display";

interface ResultSummaryCardProps {
  result: Record<string, unknown>;
  onReset: () => void;
}

export default function ResultSummaryCard({ result, onReset }: ResultSummaryCardProps) {
  const runId = text(result.runId ?? result.id, "");
  const evalReport = asRecord(result.evalReport);
  const finalAnswer = asRecord(result.finalAnswer);
  const hallucination = asRecord(result.hallucinationRisk);

  const confidence = normalizedScore(evalReport.finalAnswerConfidence ?? finalAnswer.confidenceScore ?? finalAnswer.confidence, 0);
  const reliability = normalizedScore(evalReport.overallReliability ?? evalReport.finalReliabilityScore, 0);
  const passFail = text(evalReport.passFail ?? evalReport.status ?? (reliability >= 0.6 ? "pass" : "fail"), "unknown");
  const riskLevel = text(hallucination.riskLevel ?? hallucination.level ?? evalReport.hallucinationRisk, "unknown");
  const answerText = text(finalAnswer.legalStyleAnswer ?? finalAnswer.answer ?? finalAnswer.text, "");
  const citations = list(finalAnswer.citationsUsed ?? finalAnswer.citations);

  return (
    <div className="animate-fade-in rounded-xl border border-slate-800 bg-slate-900/60 p-6">
      {/* Run header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Orchestration Complete
          </p>
          <p className="mt-1 line-clamp-1 text-sm text-slate-300">{text(result.query, "")}</p>
        </div>
        {runId && (
          <span className="rounded border border-slate-700 px-2 py-0.5 font-mono text-[11px] text-slate-500">
            {runId.slice(0, 8)}…
          </span>
        )}
      </div>

      {/* Metric pills */}
      <div className="mb-5 flex flex-wrap gap-2">
        <MetricPill label="Confidence" value={`${Math.round(confidence * 100)}%`} tone={metricTone(confidence)} />
        <MetricPill label="Hallucination Risk" value={riskLevel.toUpperCase()} tone={styleForStatus(riskLevel).split(" ").find(c => c.startsWith("text-")) ?? "text-slate-300"} />
        <MetricPill label="Eval" value={passFail.toUpperCase()} tone={styleForStatus(passFail).split(" ").find(c => c.startsWith("text-")) ?? "text-slate-300"} />
      </div>

      {/* Answer preview */}
      {answerText && (
        <div className="mb-5 rounded-lg border border-slate-800 bg-slate-950/60 p-4">
          <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
            Answer Preview
          </p>
          <p className="text-sm leading-6 text-slate-300 line-clamp-4">{answerText}</p>
        </div>
      )}

      {/* Citations */}
      {citations.length > 0 && (
        <div className="mb-5">
          <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
            Citations
          </p>
          <div className="flex flex-wrap gap-1.5">
            {citations.map((c) => (
              <span key={c} className="rounded border border-cyan-400/25 bg-cyan-400/8 px-2 py-0.5 font-mono text-[11px] text-cyan-300">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 sm:flex-row">
        {runId && (
          <Link
            href={`/runs/${runId}`}
            className="flex-1 rounded-lg bg-cyan-300 px-4 py-2.5 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            View Full Analysis →
          </Link>
        )}
        <button
          onClick={onReset}
          className="flex-1 rounded-lg border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
        >
          Run Another Query
        </button>
      </div>
    </div>
  );
}

function MetricPill({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-1.5">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-600">{label}</p>
      <p className={`mt-0.5 font-mono text-sm font-semibold ${tone}`}>{value}</p>
    </div>
  );
}
