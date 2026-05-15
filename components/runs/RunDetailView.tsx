import type { ReactNode } from "react";
import type { RunDetail } from "@/lib/types";
import { asRecord, normalizedScore, text } from "@/lib/utils/display";

// ─── Primitives ───────────────────────────────────────────────────────────────

function Label({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
      {children}
    </p>
  );
}

function SectionHeader({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-white/8 pb-2 mb-4">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-500">
        {children}
      </span>
      <div className="flex-1 border-t border-white/5" />
    </div>
  );
}

function StatusTag({ status }: { status: string }) {
  const s = status.toLowerCase();
  const styles =
    s === "verified" || s === "pass" || s === "complete" || s === "completed"
      ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/5"
      : s === "partial" || s === "medium" || s === "running"
      ? "text-amber-400 border-amber-400/30 bg-amber-400/5"
      : s === "unsupported" || s === "fail" || s === "error" || s === "high"
      ? "text-red-400 border-red-400/30 bg-red-400/5"
      : "text-zinc-400 border-zinc-700 bg-black";

  return (
    <span className={`inline-block rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] ${styles}`}>
      {status.toUpperCase()}
    </span>
  );
}

function ScoreBar({ value, invert = false }: { value: number; invert?: boolean }) {
  const effective = invert ? 1 - value : value;
  const color =
    effective >= 0.7 ? "bg-emerald-400" : effective >= 0.4 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="h-px w-full bg-white/8 mt-1.5">
      <div className={`h-px ${color}`} style={{ width: `${Math.round(effective * 100)}%` }} />
    </div>
  );
}

function MetricCell({
  label,
  value,
  invert,
  isRisk,
}: {
  label: string;
  value: number;
  invert?: boolean;
  isRisk?: boolean;
}) {
  const pct = Math.round(value * 100);
  const effective = invert ? 1 - value : value;
  const color =
    effective >= 0.7 ? "text-emerald-400" : effective >= 0.4 ? "text-amber-400" : "text-red-400";

  return (
    <div className="flex-1 border-r border-white/8 last:border-r-0 px-4 py-4">
      <Label>{label}</Label>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={`font-mono text-2xl font-bold tabular-nums ${color}`}>{pct}</span>
        <span className="font-mono text-sm text-zinc-600">%</span>
        {isRisk && pct <= 20 && (
          <span className="ml-1 font-mono text-[10px] text-emerald-400">LOW</span>
        )}
        {isRisk && pct > 50 && (
          <span className="ml-1 font-mono text-[10px] text-red-400">HIGH</span>
        )}
      </div>
      <ScoreBar value={value} invert={invert} />
    </div>
  );
}

function SourceBadge({ citationId, sourceType }: { citationId: string; sourceType?: string }) {
  const isPrimary = sourceType === "primary" || citationId.startsWith("CONST-");
  return (
    <span
      className={`inline-block rounded border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-[0.1em] ${
        isPrimary
          ? "border-blue-400/40 bg-blue-400/8 text-blue-400"
          : "border-zinc-700 bg-black text-zinc-500"
      }`}
    >
      {isPrimary ? "CONSTITUTION" : "SAMPLE"}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RunDetailView({ detail }: { detail: RunDetail }) {
  const { run, traces, retrievalResults, citationValidations, evalReport } = detail;

  const payload = asRecord(evalReport?.payload);

  const groundedness = normalizedScore(payload.groundednessScore ?? payload.groundedness_score, 0);
  const citationAccuracy = normalizedScore(
    payload.citationAccuracyScore ?? payload.citation_accuracy_score,
    0
  );
  const retrievalCoverage = normalizedScore(
    payload.retrievalCoverage ?? payload.retrieval_coverage_score,
    0
  );
  const halRisk = normalizedScore(run.hallucination_risk ?? payload.hallucinationRiskScore, 0);
  const confidence = normalizedScore(
    run.confidence ?? payload.finalAnswerConfidence,
    0
  );
  const reliability = normalizedScore(
    evalReport?.final_reliability_score ?? payload.overallReliability,
    0
  );
  const passFail = text(
    evalReport?.pass_fail_status ?? (reliability >= 0.6 ? "pass" : "fail"),
    "unknown"
  );

  const answerText = text(
    payload.answer ?? payload.legalStyleAnswer ?? payload.finalAnswer,
    ""
  );
  const citations = Array.isArray(payload.citations)
    ? (payload.citations as string[])
    : Array.isArray(payload.citationsUsed)
    ? (payload.citationsUsed as string[])
    : [];

  return (
    <div className="space-y-px">

      {/* ── 1. Metrics Strip ── */}
      <div className="rounded-lg border border-white/8 bg-black overflow-hidden">
        <div className="border-b border-white/8 px-4 py-2 flex items-center justify-between">
          <Label>Reliability Metrics</Label>
          <StatusTag status={passFail} />
        </div>
        <div className="flex divide-x divide-white/8">
          <MetricCell label="Groundedness" value={groundedness} />
          <MetricCell label="Citation Accuracy" value={citationAccuracy} />
          <MetricCell label="Retrieval Coverage" value={retrievalCoverage} />
          <MetricCell label="Hallucination Risk" value={halRisk} invert isRisk />
          <MetricCell label="Answer Confidence" value={confidence} />
          <MetricCell label="Overall Reliability" value={reliability} />
        </div>
      </div>

      {/* ── 2. Final Answer ── */}
      <div className="rounded-lg border border-white/8 bg-black p-5">
        <SectionHeader>Final Legal Analysis</SectionHeader>
        {answerText ? (
          <div className="space-y-4">
            <p className="font-mono text-sm leading-7 text-zinc-200 whitespace-pre-wrap">
              {answerText}
            </p>
            {citations.length > 0 && (
              <div className="border-t border-white/8 pt-4">
                <Label>Citations</Label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {citations.map((c) => (
                    <span
                      key={c}
                      className="rounded border border-blue-400/30 bg-blue-400/5 px-2 py-0.5 font-mono text-[11px] text-blue-400"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="font-mono text-sm text-zinc-600">No final answer recorded for this run.</p>
        )}
      </div>

      {/* ── 3. Agent Execution Trace ── */}
      <div className="rounded-lg border border-white/8 bg-black p-5">
        <SectionHeader>Agent Execution Trace</SectionHeader>
        {traces.length === 0 ? (
          <p className="font-mono text-sm text-zinc-600">No trace data recorded.</p>
        ) : (
          <div className="space-y-px">
            {/* Table header */}
            <div className="hidden grid-cols-[40px_160px_90px_1fr_1fr] gap-4 px-3 py-2 lg:grid">
              <Label>Step</Label>
              <Label>Agent</Label>
              <Label>Status</Label>
              <Label>Input</Label>
              <Label>Output</Label>
            </div>
            {traces.map((trace) => (
              <div
                key={trace.id}
                className="grid gap-4 rounded border border-white/5 bg-zinc-950 px-3 py-3 text-sm lg:grid-cols-[40px_160px_90px_1fr_1fr]"
              >
                <span className="font-mono text-xs font-bold text-zinc-600">
                  {String(trace.step_index + 1).padStart(2, "0")}
                </span>
                <span className="font-mono text-xs font-semibold text-zinc-200">
                  {trace.agent_name}
                </span>
                <StatusTag status={trace.status ?? "complete"} />
                <p className="text-xs leading-5 text-zinc-500">
                  {trace.input_summary ?? "-"}
                </p>
                <p className="text-xs leading-5 text-zinc-300">
                  {trace.output_summary ?? "-"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 4. Citation Validation ── */}
      <div className="rounded-lg border border-white/8 bg-black p-5">
        <SectionHeader>Citation Validation</SectionHeader>
        {citationValidations.length === 0 ? (
          <p className="font-mono text-sm text-zinc-600">No citation validation data.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="pb-2 pr-4 text-left">
                    <Label>Claim</Label>
                  </th>
                  <th className="pb-2 pr-4 text-left">
                    <Label>Citation</Label>
                  </th>
                  <th className="pb-2 pr-4 text-left">
                    <Label>Status</Label>
                  </th>
                  <th className="pb-2 text-right">
                    <Label>Score</Label>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {citationValidations.map((cv) => (
                  <tr key={cv.id} className="align-top">
                    <td className="py-2.5 pr-4 text-xs leading-5 text-zinc-300 max-w-xs">
                      {cv.claim}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="font-mono text-[11px] text-blue-400">
                        {cv.citation_id ?? "none"}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <StatusTag status={cv.support_status} />
                    </td>
                    <td className="py-2.5 text-right font-mono text-xs tabular-nums text-zinc-400">
                      {Math.round(normalizedScore(cv.support_score) * 100)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 5. Retrieved Sources ── */}
      <div className="rounded-lg border border-white/8 bg-black p-5">
        <SectionHeader>Retrieved Sources</SectionHeader>
        {retrievalResults.length === 0 ? (
          <p className="font-mono text-sm text-zinc-600">No retrieval data recorded.</p>
        ) : (
          <div className="space-y-px">
            {retrievalResults.map((rr, idx) => {
              const isPrimary = rr.citation_id.startsWith("CONST-");
              const score = normalizedScore(rr.final_score, 0);
              const scoreColor =
                score >= 0.7
                  ? "text-emerald-400"
                  : score >= 0.4
                  ? "text-amber-400"
                  : "text-zinc-500";

              return (
                <div
                  key={rr.id}
                  className={`flex items-start gap-4 rounded border px-4 py-3 ${
                    isPrimary
                      ? "border-blue-400/20 bg-blue-400/3"
                      : "border-white/5 bg-zinc-950"
                  }`}
                >
                  <span className="mt-0.5 w-5 shrink-0 font-mono text-[10px] font-bold text-zinc-700">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-blue-400">
                        {rr.citation_id}
                      </span>
                      <SourceBadge
                        citationId={rr.citation_id}
                        sourceType={isPrimary ? "primary" : "sample"}
                      />
                    </div>
                    {rr.reason && (
                      <p className="mt-1 text-xs leading-5 text-zinc-500">{rr.reason}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className={`font-mono text-sm font-bold tabular-nums ${scoreColor}`}>
                      {Math.round(score * 100)}%
                    </span>
                    <ScoreBar value={score} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 6. Eval Metadata Footer ── */}
      <div className="rounded-lg border border-white/5 bg-zinc-950 px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
          <div className="flex items-center gap-2">
            <Label>Run ID</Label>
            <span className="font-mono text-[11px] text-zinc-500">{run.id}</span>
          </div>
          <div className="flex items-center gap-2">
            <Label>Timestamp</Label>
            <span className="font-mono text-[11px] text-zinc-500">
              {new Date(run.created_at).toISOString().replace("T", " ").slice(0, 19)} UTC
            </span>
          </div>
          {run.model && (
            <div className="flex items-center gap-2">
              <Label>Model</Label>
              <span className="font-mono text-[11px] text-zinc-500">{run.model}</span>
            </div>
          )}
          {evalReport && (
            <div className="flex items-center gap-2">
              <Label>Eval ID</Label>
              <span className="font-mono text-[11px] text-zinc-500">
                {evalReport.id.slice(0, 8)}
              </span>
            </div>
          )}
          <div className="ml-auto">
            <StatusTag status={passFail} />
          </div>
        </div>
      </div>

    </div>
  );
}
