// Server-safe — no hooks, no client-only APIs. Receives full RunDetail data as props.

import type { ReactNode } from "react";
import type { RunDetail } from "@/lib/types";
import { metricTone, styleForStatus, normalizedScore, text, asRecord } from "@/lib/utils/display";

interface RunDetailViewProps {
  detail: RunDetail;
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, eyebrow, children }: { title: string; eyebrow?: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 shadow-2xl shadow-black/10">
      <div className="mb-4">
        {eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300/70">{eyebrow}</p>}
        <h2 className="mt-0.5 text-base font-semibold text-slate-100">{title}</h2>
      </div>
      {children}
    </section>
  );
}

// ─── Metric bar card ──────────────────────────────────────────────────────────

function MetricCard({ label, value, invert, caption }: { label: string; value: number; invert?: boolean; caption?: string }) {
  const bar = invert ? 1 - value : value;
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
        <p className={`font-mono text-xl font-semibold ${metricTone(value, invert)}`}>{Math.round(value * 100)}%</p>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-slate-800">
        <div
          className={`h-1.5 rounded-full ${bar >= 0.72 ? "bg-emerald-400" : bar >= 0.45 ? "bg-amber-400" : "bg-rose-400"}`}
          style={{ width: `${Math.round(bar * 100)}%` }}
        />
      </div>
      {caption && <p className="mt-2 text-[11px] text-slate-600">{caption}</p>}
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function RunDetailView({ detail }: RunDetailViewProps) {
  const { run, traces, retrievalResults, citationValidations, evalReport } = detail;

  const confidence = normalizedScore(run.confidence, 0);
  const halRisk = normalizedScore(run.hallucination_risk, 0);
  const evalPayload = asRecord(evalReport?.payload);

  // Derived metrics from eval payload or run summary
  const groundedness = normalizedScore(evalPayload.groundednessScore ?? evalPayload.groundedness_score, 0);
  const citationAccuracy = normalizedScore(evalPayload.citationAccuracyScore ?? evalPayload.citation_accuracy_score, 0);
  const retrievalCoverage = normalizedScore(evalPayload.retrievalCoverage ?? evalPayload.retrieval_coverage_score, 0);
  const reliability = normalizedScore(evalPayload.overallReliability ?? evalPayload.final_reliability_score, 0);
  const passFail = text(evalReport?.pass_fail_status ?? (reliability >= 0.6 ? "pass" : "fail"), "unknown");

  // Retrieval quality
  const rqPayload = asRecord(evalPayload.retrievalQuality);
  const retrievalMethod = text(rqPayload.retrievalMethod, "unknown");
  const vectorUsed = rqPayload.vectorSearchUsed === true;

  return (
    <div className="space-y-5">

      {/* ── Reliability Dashboard ── */}
      <Section title="Reliability Dashboard" eyebrow="Eval Report">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard label="Groundedness" value={groundedness} caption="Claims anchored to retrieved sources." />
          <MetricCard label="Citation Accuracy" value={citationAccuracy} caption="Cited IDs present in retrieval set." />
          <MetricCard label="Retrieval Coverage" value={retrievalCoverage} caption="Coverage of query across corpus." />
          <MetricCard label="Hallucination Risk" value={halRisk} invert caption="Lower is better." />
          <MetricCard label="Final Reliability" value={reliability} caption={`Pass/fail: ${passFail.toUpperCase()}`} />
          <MetricCard label="Answer Confidence" value={confidence} caption="Synthesis confidence score." />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className={`inline-flex rounded border px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.12em] ${styleForStatus(passFail)}`}>
            {passFail}
          </span>
          <span className={`inline-flex rounded border px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.12em] ${
            retrievalMethod.includes("hybrid") ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
            : retrievalMethod.includes("keyword") ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
            : "border-slate-700 bg-slate-800 text-slate-400"
          }`}>
            {retrievalMethod}
          </span>
          {vectorUsed && (
            <span className="inline-flex rounded border border-violet-400/30 bg-violet-400/10 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-[0.12em] text-violet-300">
              pgvector
            </span>
          )}
        </div>
      </Section>

      {/* ── Agent Execution Timeline ── */}
      <Section title="Agent Execution Timeline" eyebrow="Trace">
        <div className="space-y-3">
          {traces.length === 0 ? (
            <p className="text-sm text-slate-600">No execution trace recorded for this run.</p>
          ) : (
            <>
              {traces.map((trace) => (
                <div key={trace.id} className="grid gap-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4 sm:grid-cols-[80px_1fr]">
                  <div>
                    <p className="font-mono text-[10px] text-slate-600">STEP {String(trace.step_index + 1).padStart(2, "0")}</p>
                    <span className={`mt-1.5 inline-flex rounded border px-2 py-0.5 text-[11px] font-semibold uppercase ${styleForStatus(trace.status ?? "complete")}`}>
                      {trace.status ?? "complete"}
                    </span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-sm font-semibold text-slate-200">{trace.agent_name}</h3>
                      {trace.risk_flag != null && (
                        <span className={`rounded border px-2 py-0.5 text-[11px] font-medium ${styleForStatus(trace.risk_flag)}`}>
                          {trace.risk_flag}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 grid gap-3 lg:grid-cols-2">
                      {trace.input_summary != null && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-700">Input</p>
                          <p className="mt-1 text-sm leading-6 text-slate-500">{trace.input_summary}</p>
                        </div>
                      )}
                      {trace.output_summary != null && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">Output</p>
                          <p className="mt-1 text-sm leading-6 text-slate-300">{trace.output_summary}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </Section>

      {/* Two-column grid: Citation Validation + Retrieved Sources */}
      <div className="grid gap-5 xl:grid-cols-2">

        {/* ── Citation Validation ── */}
        <Section title="Citation Validation" eyebrow="Support Check">
          {citationValidations.length > 0 ? (
            <div className="overflow-hidden rounded-lg border border-slate-800">
              <div className="hidden grid-cols-[1fr_100px_90px_1fr] gap-3 border-b border-slate-800 bg-slate-900 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 lg:grid">
                <span>Claim</span><span>Citation</span><span>Status</span><span>Explanation</span>
              </div>
              <div className="divide-y divide-slate-800">
                {citationValidations.map((cv) => (
                  <div key={cv.id} className="grid gap-3 px-4 py-3 lg:grid-cols-[1fr_100px_90px_1fr]">
                    <p className="text-sm leading-5 text-slate-300">{cv.claim}</p>
                    <p className="font-mono text-xs text-cyan-300">{cv.citation_id ?? "none"}</p>
                    <span className={`w-fit self-start rounded border px-2 py-0.5 text-[11px] font-semibold uppercase ${styleForStatus(cv.support_status)}`}>
                      {cv.support_status}
                    </span>
                    <p className="text-xs leading-5 text-slate-500">{cv.explanation ?? "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-600">No citation validation data for this run.</p>
          )}
        </Section>

        {/* ── Retrieved Sources ── */}
        <Section title="Retrieved Sources" eyebrow="RAG">
          {retrievalResults.length > 0 ? (
            <div className="space-y-3">
              {retrievalResults.map((rr, idx) => (
                <div key={rr.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-600">#{idx + 1}</span>
                      <span className="rounded border border-cyan-400/25 bg-cyan-400/8 px-2 py-0.5 font-mono text-[11px] text-cyan-300">
                        {rr.citation_id}
                      </span>
                    </div>
                    <span className={`font-mono text-sm font-semibold ${metricTone(rr.score)}`}>
                      {Math.round(normalizedScore(rr.score) * 100)}%
                    </span>
                  </div>
                  {rr.reason && <p className="mt-2 text-xs text-slate-500">{rr.reason}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-600">No retrieval data recorded for this run.</p>
          )}
        </Section>
      </div>

      {/* ── Final Answer (from eval payload) ── */}
      {!!evalPayload.answer && (
        <Section title="Final Answer" eyebrow="Synthesis">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
              {text(evalPayload.answer)}
            </p>
          </div>
          {Array.isArray(evalPayload.citations) && (evalPayload.citations as string[]).length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-600">Citations</p>
              <div className="flex flex-wrap gap-1.5">
                {(evalPayload.citations as string[]).map((c) => (
                  <span key={c} className="rounded border border-cyan-400/25 bg-cyan-400/8 px-2 py-0.5 font-mono text-[11px] text-cyan-300">{c}</span>
                ))}
              </div>
            </div>
          )}
        </Section>
      )}

      {/* ── Eval metadata ── */}
      {evalReport && (
        <section className="rounded-lg border border-slate-800 bg-slate-900/40 px-5 py-4">
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] text-slate-600">
            <span>Eval ID: <span className="font-mono text-slate-500">{evalReport.id.slice(0, 12)}…</span></span>
            <span>Pass/Fail: <span className={`font-semibold ${styleForStatus(evalReport.pass_fail_status).split(" ").find(c => c.startsWith("text-")) ?? ""}`}>{evalReport.pass_fail_status}</span></span>
            <span>Saved: <span className="text-slate-500">{new Date(evalReport.created_at).toLocaleString()}</span></span>
          </div>
        </section>
      )}

    </div>
  );
}
