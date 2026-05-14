"use client";

import type { FinalAnswerResult } from "@/lib/types";

interface FinalAnswerPanelProps {
  finalAnswer: FinalAnswerResult;
}

function formatAnswerText(text: string) {
  return text.split("\n").map((line, i) => {
    if (line.startsWith("**") && line.endsWith("**")) {
      return <p key={i} className="font-semibold text-slate-200 mt-3 mb-1">{line.replace(/\*\*/g, "")}</p>;
    }
    if (line.startsWith("**") && line.includes("**")) {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="text-slate-300 leading-relaxed text-sm">
          {parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j} className="text-slate-100">{part}</strong> : part
          )}
        </p>
      );
    }
    if (line.startsWith("*") && line.endsWith("*")) {
      return <p key={i} className="text-slate-500 text-xs italic mt-2">{line.replace(/\*/g, "")}</p>;
    }
    if (line.trim() === "") return <div key={i} className="h-1" />;
    return <p key={i} className="text-slate-300 leading-relaxed text-sm">{line}</p>;
  });
}

export default function FinalAnswerPanel({ finalAnswer }: FinalAnswerPanelProps) {
  const confidencePct = Math.round(finalAnswer.confidenceScore * 100);
  const confColor = finalAnswer.confidenceScore >= 0.7
    ? "text-emerald-400"
    : finalAnswer.confidenceScore >= 0.4
    ? "text-amber-400"
    : "text-rose-400";

  return (
    <div className="agent-card-enter bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4" style={{ animationDelay: "720ms" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">📝</span>
          <h2 className="text-sm font-semibold text-slate-200">Final Legal Analysis</h2>
        </div>
        <span className={`text-sm font-mono font-semibold ${confColor}`}>
          {confidencePct}% confidence
        </span>
      </div>

      <div className="prose prose-invert max-w-none">
        {formatAnswerText(finalAnswer.answer)}
      </div>

      {finalAnswer.citations.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Citations</p>
          <div className="flex flex-wrap gap-2">
            {finalAnswer.citations.map((cite) => (
              <span
                key={cite}
                className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-mono"
              >
                {cite}
              </span>
            ))}
          </div>
        </div>
      )}

      {finalAnswer.riskFlags.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Risk Flags</p>
          <ul className="flex flex-col gap-1.5">
            {finalAnswer.riskFlags.map((flag, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-amber-400">
                <span className="mt-0.5 shrink-0">⚠</span>
                <span>{flag}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {finalAnswer.unresolvedQuestions.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Unresolved Questions</p>
          <ul className="flex flex-col gap-1.5">
            {finalAnswer.unresolvedQuestions.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                <span className="mt-0.5 shrink-0 text-violet-400">?</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
