"use client";

import type { ExecutionStep } from "@/lib/types";

interface AgentCardProps {
  agentName: string;
  icon: string;
  status: "idle" | "complete" | "error";
  summary: string;
  score?: number;
  scoreLabel?: string;
  riskLevel?: "low" | "medium" | "high";
  executionStep?: ExecutionStep;
  animationDelay?: number;
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const pct = Math.round(score * 100);
  const color = score >= 0.7 ? "text-emerald-400 bg-emerald-400/10 border-emerald-500/30"
    : score >= 0.4 ? "text-amber-400 bg-amber-400/10 border-amber-500/30"
    : "text-rose-400 bg-rose-400/10 border-rose-500/30";

  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-mono ${color}`}>
      <span className="font-semibold">{pct}%</span>
      <span className="text-slate-400">{label}</span>
    </div>
  );
}

function RiskBadge({ level }: { level: "low" | "medium" | "high" }) {
  const styles = {
    low: "text-emerald-400 bg-emerald-400/10 border-emerald-500/30",
    medium: "text-amber-400 bg-amber-400/10 border-amber-500/30",
    high: "text-rose-400 bg-rose-400/10 border-rose-500/30",
  };
  return (
    <div className={`px-2 py-0.5 rounded border text-xs font-mono uppercase tracking-wider ${styles[level]}`}>
      {level} risk
    </div>
  );
}

export default function AgentCard({
  agentName,
  icon,
  status,
  summary,
  score,
  scoreLabel,
  riskLevel,
  executionStep,
  animationDelay = 0,
}: AgentCardProps) {
  const statusDot = status === "complete"
    ? "bg-emerald-500"
    : status === "error"
    ? "bg-rose-500"
    : "bg-slate-600";

  return (
    <div
      className="agent-card-enter bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-3"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-semibold text-slate-200">{agentName}</span>
          <span className={`w-2 h-2 rounded-full ${statusDot}`} />
        </div>
        {executionStep && (
          <span className="text-xs text-slate-500 font-mono">{executionStep.durationMs}ms</span>
        )}
      </div>

      <p className="text-sm text-slate-400 leading-relaxed">{summary}</p>

      {(score !== undefined || riskLevel) && (
        <div className="flex flex-wrap gap-2">
          {score !== undefined && scoreLabel && (
            <ScoreBadge score={score} label={scoreLabel} />
          )}
          {riskLevel && <RiskBadge level={riskLevel} />}
        </div>
      )}
    </div>
  );
}
