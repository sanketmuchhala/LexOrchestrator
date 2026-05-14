"use client";

import type { EvalReport } from "@/lib/types";

interface EvalReportPanelProps {
  evalReport: EvalReport;
}

interface MetricProps {
  label: string;
  value: number | string;
  isPercent?: boolean;
  invert?: boolean;
}

function MetricBar({ value, invert }: { value: number; invert?: boolean }) {
  const effective = invert ? 1 - value : value;
  const color = effective >= 0.7 ? "bg-emerald-500" : effective >= 0.4 ? "bg-amber-500" : "bg-rose-500";
  return (
    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5">
      <div
        className={`h-1.5 rounded-full transition-all ${color}`}
        style={{ width: `${Math.round(effective * 100)}%` }}
      />
    </div>
  );
}

function Metric({ label, value, isPercent, invert }: MetricProps) {
  const displayValue = typeof value === "number" && isPercent
    ? `${Math.round(value * 100)}%`
    : value;

  const numericValue = typeof value === "number" ? value : 0;
  const effective = invert ? 1 - numericValue : numericValue;
  const textColor = typeof value === "string"
    ? value === "low" ? "text-emerald-400" : value === "medium" ? "text-amber-400" : "text-rose-400"
    : effective >= 0.7 ? "text-emerald-400" : effective >= 0.4 ? "text-amber-400" : "text-rose-400";

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-500">{label}</span>
        <span className={`text-sm font-mono font-semibold ${textColor}`}>{displayValue}</span>
      </div>
      {typeof value === "number" && <MetricBar value={numericValue} invert={invert} />}
    </div>
  );
}

export default function EvalReportPanel({ evalReport }: EvalReportPanelProps) {
  const overallPct = Math.round(evalReport.overallReliability * 100);
  const overallColor = evalReport.overallReliability >= 0.7
    ? "text-emerald-400 border-emerald-500/30"
    : evalReport.overallReliability >= 0.4
    ? "text-amber-400 border-amber-500/30"
    : "text-rose-400 border-rose-500/30";

  return (
    <div className="agent-card-enter bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4" style={{ animationDelay: "840ms" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">📊</span>
          <h2 className="text-sm font-semibold text-slate-200">Eval Report</h2>
        </div>
        <div className={`px-3 py-1 rounded-full border text-sm font-mono font-bold ${overallColor}`}>
          {overallPct}% reliable
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Metric label="Groundedness Score" value={evalReport.groundednessScore} isPercent />
        <Metric label="Citation Accuracy" value={evalReport.citationAccuracyScore} isPercent />
        <Metric label="Retrieval Coverage" value={evalReport.retrievalCoverage} isPercent />
        <Metric label="Final Answer Confidence" value={evalReport.finalAnswerConfidence} isPercent />
        <Metric label="Overall Reliability" value={evalReport.overallReliability} isPercent />
        <div className="flex items-center justify-between pt-1 border-t border-slate-800">
          <span className="text-xs text-slate-500">Hallucination Risk</span>
          <span className={`text-xs font-mono font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${
            evalReport.hallucinationRisk === "low"
              ? "text-emerald-400 bg-emerald-400/10"
              : evalReport.hallucinationRisk === "medium"
              ? "text-amber-400 bg-amber-400/10"
              : "text-rose-400 bg-rose-400/10"
          }`}>
            {evalReport.hallucinationRisk}
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-600 border-t border-slate-800 pt-3">
        Scores reflect pipeline run on sample corpus only. Not a guarantee of legal accuracy.
      </p>
    </div>
  );
}
