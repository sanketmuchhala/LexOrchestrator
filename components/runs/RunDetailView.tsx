"use client";

import type { ReactNode } from "react";
import type { RunDetail } from "@/lib/types";
import { asRecord, normalizedScore, text } from "@/lib/utils/display";

// ─── Primitives ───────────────────────────────────────────────────────────────

function SectionTitle({ n, children }: { n: string; children: string }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <span
        style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", letterSpacing: "0.2em" }}
      >
        § {n}
      </span>
      <div style={{ flex: 1, height: "1px", background: "rgba(0,0,0,0.07)" }} />
      <span
        style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-2)", letterSpacing: "0.24em" }}
        className="uppercase"
      >
        {children}
      </span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const cls =
    s === "verified" || s === "pass" || s === "complete" || s === "completed" || s === "low"
      ? "badge-pass"
      : s === "partial" || s === "medium"
      ? "badge-warn"
      : s === "unsupported" || s === "fail" || s === "error" || s === "high"
      ? "badge-fail"
      : "badge-neutral";
  return <span className={`badge ${cls}`}>{status.toUpperCase()}</span>;
}

function MetricCell({
  label, value, invert, bottomTag,
}: {
  label: string; value: number; invert?: boolean; bottomTag?: ReactNode;
}) {
  const pct = Math.round(value * 100);
  const effective = invert ? 1 - value : value;
  const color = effective >= 0.7 ? "#34d399" : effective >= 0.4 ? "#fbbf24" : "#f87171";
  return (
    <div
      className="flex-1 px-5 py-5"
      style={{ borderRight: "1px solid rgba(0,0,0,0.07)" }}
    >
      <p className="label mb-3">{label}</p>
      <div className="flex items-baseline gap-1">
        <span
          className="tabular-nums"
          style={{ fontFamily: "var(--font-mono)", fontSize: "26px", fontWeight: 700, color, lineHeight: 1 }}
        >
          {pct}
        </span>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-3)" }}>%</span>
      </div>
      {bottomTag && <div className="mt-2">{bottomTag}</div>}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function RunDetailView({ detail }: { detail: RunDetail }) {
  const { run, traces, retrievalResults, citationValidations, evalReport } = detail;
  const payload = asRecord(evalReport?.payload);

  const groundedness    = normalizedScore(payload.groundednessScore  ?? payload.groundedness_score, 0);
  const citationAcc     = normalizedScore(payload.citationAccuracyScore ?? payload.citation_accuracy_score, 0);
  const retrieval       = normalizedScore(payload.retrievalCoverage  ?? payload.retrieval_coverage_score, 0);
  const halRisk         = normalizedScore(run.hallucination_risk ?? payload.hallucinationRiskScore, 0);
  const confidence      = normalizedScore(run.confidence ?? payload.finalAnswerConfidence, 0);
  const reliability     = normalizedScore(evalReport?.final_reliability_score ?? payload.overallReliability, 0);
  const passFail        = text(evalReport?.pass_fail_status ?? (reliability >= 0.6 ? "pass" : "fail"), "unknown");

  const answerText = text(payload.answer ?? payload.legalStyleAnswer ?? payload.finalAnswer, "");
  const answerParas = answerText ? answerText.split(/\n\n+/).map(p => p.trim()).filter(Boolean) : [];
  const citations = (
    Array.isArray(payload.citations) ? payload.citations :
    Array.isArray(payload.citationsUsed) ? payload.citationsUsed : []
  ) as string[];

  return (
    <div className="space-y-12 appear">

      {/* ── § 01  Reliability Metrics ── */}
      <section>
        <SectionTitle n="01">Reliability Metrics</SectionTitle>
        <div
          style={{ border: "1px solid rgba(0,0,0,0.07)" }}
        >
          {/* Score row */}
          <div className="flex" style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
            <MetricCell label="Groundedness"     value={groundedness}  />
            <MetricCell label="Citation Acc."    value={citationAcc}   />
            <MetricCell label="Retrieval Cov."   value={retrieval}     />
            <MetricCell
              label="Hallucination Risk"
              value={halRisk}
              invert
              bottomTag={
                <span className={`badge ${halRisk <= 0.2 ? "badge-pass" : halRisk <= 0.5 ? "badge-warn" : "badge-fail"}`}>
                  {halRisk <= 0.2 ? "LOW" : halRisk <= 0.5 ? "MED" : "HIGH"}
                </span>
              }
            />
            <MetricCell label="Confidence"       value={confidence}    />
            <MetricCell
              label="Overall Reliability"
              value={reliability}
              bottomTag={<span className={`badge ${passFail === "pass" ? "badge-pass" : "badge-fail"}`}>{passFail.toUpperCase()}</span>}
            />
          </div>
          {/* Run metadata bar */}
          <div
            className="flex flex-wrap items-center gap-x-8 gap-y-1 px-5 py-3"
            style={{ background: "var(--s1)" }}
          >
            <span className="label">Run</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-3)" }}>
              {run.id.slice(0, 16)}...
            </span>
            {run.model && <>
              <span className="label">Model</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-3)" }}>
                {run.model}
              </span>
            </>}
            <span className="label">Time</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-3)" }}>
              {new Date(run.created_at).toISOString().replace("T", " ").slice(0, 19)} UTC
            </span>
          </div>
        </div>
      </section>

      {/* ── § 02  Final Legal Analysis ── */}
      <section>
        <SectionTitle n="02">Final Legal Analysis</SectionTitle>
        {answerParas.length > 0 ? (
          <div>
            <div className="space-y-5">
              {answerParas.map((para, i) => (
                <p
                  key={i}
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: "17px",
                    lineHeight: "1.85",
                    color: "var(--text-2)",
                    letterSpacing: "0.01em",
                  }}
                >
                  {para}
                </p>
              ))}
            </div>
            {citations.length > 0 && (
              <div className="mt-8" style={{ borderTop: "1px solid rgba(0,0,0,0.07)", paddingTop: "1.25rem" }}>
                <p className="label mb-3">Citations Used</p>
                <div className="flex flex-wrap gap-2">
                  {citations.map((c) => (
                    <span
                      key={c}
                      className={`badge ${String(c).startsWith("CONST-") ? "badge-const" : "badge-blue"}`}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-3)" }}>
            No final answer recorded for this run.
          </p>
        )}
      </section>

      {/* ── § 03  Agent Execution Timeline ── */}
      <section>
        <SectionTitle n="03">Agent Execution Timeline</SectionTitle>
        {traces.length === 0 ? (
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-3)" }}>No trace data recorded.</p>
        ) : (
          <div>
            {traces.map((trace, idx) => {
              const s = (trace.status ?? "complete").toLowerCase();
              const isDone = s === "complete" || s === "completed";
              const isFail = s === "error" || s === "failed";
              const borderColor = isDone ? "#34d399" : isFail ? "#f87171" : "var(--text-3)";
              const numColor   = isDone ? "#34d399" : isFail ? "#f87171" : "var(--text-2)";
              const isLast = idx === traces.length - 1;
              return (
                <div
                  key={trace.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2.5rem 12rem 1fr",
                    gap: "1.25rem",
                    padding: "1rem 0",
                    borderLeft: `2px solid ${borderColor}`,
                    paddingLeft: "1.25rem",
                    borderBottom: isLast ? "none" : "1px solid rgba(0,0,0,0.05)",
                    marginBottom: isLast ? 0 : undefined,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "11px",
                      fontWeight: 700,
                      color: numColor,
                      alignSelf: "start",
                      paddingTop: "2px",
                    }}
                  >
                    {isDone ? "OK" : String(trace.step_index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: isDone ? "var(--text-3)" : "var(--text-1)",
                        textDecoration: isDone ? "line-through" : "none",
                      }}
                    >
                      {trace.agent_name}
                    </p>
                    {trace.status && (
                      <div className="mt-1">
                        <StatusBadge status={trace.status} />
                      </div>
                    )}
                  </div>
                  <div>
                    {trace.output_summary && (
                      <p
                        style={{
                          fontFamily: "var(--font-serif), Georgia, serif",
                          fontSize: "13px",
                          lineHeight: "1.65",
                          color: isDone ? "var(--text-3)" : "var(--text-2)",
                        }}
                      >
                        {trace.output_summary}
                      </p>
                    )}
                    {trace.risk_flag && (
                      <p
                        className="mt-1"
                        style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#f87171" }}
                      >
                        FLAG: {trace.risk_flag}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── § 04  Citation Validation ── */}
      <section>
        <SectionTitle n="04">Citation Validation</SectionTitle>
        {citationValidations.length === 0 ? (
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-3)" }}>No citation validation data.</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
                <th className="pb-3 pr-6 text-left"><span className="label">Claim</span></th>
                <th className="pb-3 pr-6 text-left"><span className="label">Citation</span></th>
                <th className="pb-3 pr-6 text-left"><span className="label">Status</span></th>
                <th className="pb-3 text-right"><span className="label">Support</span></th>
              </tr>
            </thead>
            <tbody>
              {citationValidations.map((cv, i) => (
                <tr
                  key={cv.id}
                  style={{ borderBottom: i < citationValidations.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}
                  className="align-top"
                >
                  <td className="py-3.5 pr-6" style={{ maxWidth: "26rem" }}>
                    <p
                      style={{
                        fontFamily: "var(--font-serif), Georgia, serif",
                        fontSize: "14px",
                        lineHeight: "1.65",
                        color: "var(--text-2)",
                      }}
                    >
                      {cv.claim}
                    </p>
                  </td>
                  <td className="py-3.5 pr-6">
                    <span
                      style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#60a5fa" }}
                    >
                      {cv.citation_id ?? "none"}
                    </span>
                  </td>
                  <td className="py-3.5 pr-6">
                    <StatusBadge status={cv.support_status} />
                  </td>
                  <td className="py-3.5 text-right tabular-nums" style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-2)" }}>
                    {Math.round(normalizedScore(cv.support_score) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ── § 05  Retrieved Sources ── */}
      <section>
        <SectionTitle n="05">Retrieved Sources</SectionTitle>
        {retrievalResults.length === 0 ? (
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-3)" }}>No retrieval data recorded.</p>
        ) : (
          <div>
            {retrievalResults.map((rr, idx) => {
              const isPrimary = rr.citation_id.startsWith("CONST-");
              const score = normalizedScore(rr.final_score, 0);
              const scoreColor = score >= 0.7 ? "#34d399" : score >= 0.4 ? "#fbbf24" : "var(--text-2)";
              return (
                <div
                  key={rr.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "1.25rem",
                    padding: "0.875rem 0",
                    borderBottom: idx < retrievalResults.length - 1
                      ? "1px solid rgba(0,0,0,0.05)"
                      : "none",
                    borderLeft: isPrimary ? "2px solid rgba(96,165,250,0.4)" : "2px solid transparent",
                    paddingLeft: isPrimary ? "1rem" : "0",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "10px",
                      fontWeight: 700,
                      color: "var(--text-3)",
                      minWidth: "1.5rem",
                      paddingTop: "2px",
                      flexShrink: 0,
                    }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", fontWeight: 600, color: "#60a5fa" }}>
                        {rr.citation_id}
                      </span>
                      <span className={`badge ${isPrimary ? "badge-const" : "badge-neutral"}`}>
                        {isPrimary ? "CONSTITUTION" : "CORPUS"}
                      </span>
                    </div>
                    {rr.reason && (
                      <p
                        className="mt-1"
                        style={{
                          fontFamily: "var(--font-serif), Georgia, serif",
                          fontSize: "13px",
                          lineHeight: "1.6",
                          color: "var(--text-2)",
                        }}
                      >
                        {rr.reason}
                      </p>
                    )}
                  </div>
                  <div style={{ flexShrink: 0, textAlign: "right", minWidth: "3.5rem" }}>
                    <span
                      className="tabular-nums"
                      style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 700, color: scoreColor }}
                    >
                      {Math.round(score * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
}
