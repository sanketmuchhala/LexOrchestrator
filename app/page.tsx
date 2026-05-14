"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type ApiRecord = Record<string, unknown>;

const SAMPLE_QUERY =
  "Can a party survive summary judgment in a negligence claim when expert testimony is disputed and discovery is incomplete?";

const LOADING_STEPS = [
  "Intake agent classifying legal issue",
  "Retrieval router searching authority",
  "Citation validator checking support",
  "Adversarial reviewer stress testing answer",
  "Hallucination monitor scoring risk",
  "Eval loop compiling reliability report",
];

const DEFAULT_TRACE_AGENTS = [
  "Intake Agent",
  "Retrieval Agent",
  "Citation Validator",
  "Adversarial Review",
  "Hallucination Risk Monitor",
  "Final Synthesis",
  "Eval Engine",
];

const statusStyles: Record<string, string> = {
  verified: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  supported: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  strong: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  complete: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  pass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  partial: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  weak: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  medium: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  unsupported: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  failed: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  fail: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  high: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  error: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  low: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

function asRecord(value: unknown): ApiRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as ApiRecord) : {};
}

function firstRecord(...values: unknown[]): ApiRecord {
  for (const value of values) {
    const record = asRecord(value);
    if (Object.keys(record).length > 0) return record;
  }
  return {};
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function firstArray(...values: unknown[]): unknown[] {
  for (const value of values) {
    const array = asArray(value);
    if (array.length > 0) return array;
  }
  return [];
}

function text(value: unknown, fallback = "Not reported"): string {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function optionalText(value: unknown): string | null {
  const rendered = text(value, "");
  return rendered ? rendered : null;
}

function number(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizedScore(value: unknown, fallback = 0): number {
  const raw = number(value, fallback);
  const normalized = raw > 1 ? raw / 100 : raw;
  return Math.max(0, Math.min(1, normalized));
}

function percent(value: unknown, fallback = 0): string {
  return `${Math.round(normalizedScore(value, fallback) * 100)}%`;
}

function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => text(item, "")).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

function styleForStatus(status: string): string {
  return statusStyles[status.toLowerCase()] ?? "border-slate-600 bg-slate-800 text-slate-300";
}

function riskFromLevel(level: string): number {
  const normalized = level.toLowerCase();
  if (normalized === "low") return 0.18;
  if (normalized === "medium") return 0.48;
  if (normalized === "high") return 0.82;
  return 0.35;
}

function metricTone(value: number, invert = false): string {
  const effective = invert ? 1 - value : value;
  if (effective >= 0.72) return "text-emerald-300";
  if (effective >= 0.45) return "text-amber-300";
  return "text-rose-300";
}

function DashboardCard({
  label,
  value,
  caption,
  invert,
}: {
  label: string;
  value: number;
  caption?: string;
  invert?: boolean;
}) {
  const display = Math.round(value * 100);
  const barValue = invert ? 1 - value : value;
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/80 p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</p>
        <p className={`font-mono text-xl font-semibold ${metricTone(value, invert)}`}>{display}%</p>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-slate-800">
        <div
          className={`h-1.5 rounded-full ${
            barValue >= 0.72 ? "bg-emerald-400" : barValue >= 0.45 ? "bg-amber-400" : "bg-rose-400"
          }`}
          style={{ width: `${Math.round(barValue * 100)}%` }}
        />
      </div>
      {caption && <p className="mt-3 text-xs leading-relaxed text-slate-500">{caption}</p>}
    </div>
  );
}

function Section({
  title,
  eyebrow,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-xl border border-slate-800 bg-slate-950/70 p-5 shadow-2xl shadow-black/10 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">{eyebrow}</p>}
          <h2 className="mt-1 text-base font-semibold text-slate-100">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-400/30 bg-cyan-400/10 font-mono text-sm font-semibold text-cyan-200">
            LX
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">LexOrchestrator</p>
            <p className="text-xs text-slate-500">Litigation reliability pipeline</p>
          </div>
        </div>
        <div className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          DB-backed orchestration ready
        </div>
      </div>
    </header>
  );
}

function LoadingState() {
  return (
    <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.04] p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-100">Running orchestration</p>
          <p className="text-xs text-slate-500">Agents are routing, checking, challenging, and scoring the answer.</p>
        </div>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400/20 border-t-cyan-300" />
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {LOADING_STEPS.map((step, index) => (
          <div key={step} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" style={{ animationDelay: `${index * 120}ms` }} />
              <p className="text-xs font-medium text-slate-300">{step}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RunHistory({ runs }: { runs: ApiRecord[] }) {
  return (
    <aside className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-100">Run History</h2>
        <span className="rounded border border-slate-700 px-2 py-0.5 font-mono text-[11px] text-slate-500">GET /api/runs</span>
      </div>
      {runs.length > 0 ? (
        <div className="space-y-2">
          {runs.slice(0, 5).map((run, index) => (
            <div key={text(run.id ?? run.runId, String(index))} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
              <p className="line-clamp-2 text-xs font-medium leading-relaxed text-slate-300">
                {text(run.query ?? run.title, "Saved orchestration")}
              </p>
              <p className="mt-2 font-mono text-[11px] text-slate-600">{text(run.runId ?? run.id ?? run.createdAt, "saved run")}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-slate-500">
          Run history will appear after the first saved orchestration.
        </p>
      )}
    </aside>
  );
}

function Hero() {
  return (
    <section className="grid gap-8 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:py-14">
      <div>
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-200">
          Multi-agent legal AI demo
        </div>
        <h1 className="text-4xl font-semibold tracking-tight text-slate-50 sm:text-6xl">LexOrchestrator</h1>
        <p className="mt-3 text-xl font-medium text-cyan-100 sm:text-2xl">Multi-Agent Litigation Reliability Engine</p>
        <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400">
          Routes legal questions through retrieval, citation validation, adversarial review, hallucination-risk
          scoring, and eval reporting before producing a final answer.
        </p>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Reliability workflow</p>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-300">
          {["RAG retrieval", "Citation validation", "Tool routing", "Eval loops", "Risk scoring", "Final synthesis"].map((item) => (
            <div key={item} className="rounded-md border border-slate-800 bg-slate-950/70 px-3 py-2">
              {item}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function QueryWorkspace({
  query,
  setQuery,
  loading,
  error,
  onSubmit,
}: {
  query: string;
  setQuery: (value: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (event: FormEvent) => void;
}) {
  return (
    <Section title="Query Workspace" eyebrow="Orchestrate">
      <form onSubmit={onSubmit} className="space-y-4">
        <textarea
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={SAMPLE_QUERY}
          rows={5}
          maxLength={1200}
          disabled={loading}
          className="min-h-36 w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => setQuery(SAMPLE_QUERY)}
            disabled={loading}
            className="rounded-md border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-cyan-400/40 hover:text-cyan-100 disabled:opacity-60"
          >
            Sample Query
          </button>
          <button
            type="submit"
            disabled={loading || query.trim().length < 5}
            className="rounded-md bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
          >
            {loading ? "Running Orchestration" : "Run Orchestration"}
          </button>
        </div>
        {error && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}
      </form>
    </Section>
  );
}

function ReliabilityDashboard({ result }: { result: ApiRecord }) {
  const evalReport = asRecord(result.evalReport);
  const citationValidation = asRecord(result.citationValidation);
  const finalAnswer = asRecord(result.finalAnswer);
  const hallucination = result.hallucinationRisk;
  const hallucinationRecord = asRecord(hallucination);
  const riskLevel = text(hallucinationRecord.riskLevel ?? hallucinationRecord.level ?? evalReport.hallucinationRisk, "low");
  const riskScore = normalizedScore(hallucinationRecord.riskScore ?? hallucinationRecord.score, riskFromLevel(riskLevel));
  const finalReliability = normalizedScore(evalReport.finalReliabilityScore ?? evalReport.overallReliability ?? evalReport.reliabilityScore, 0);
  const passStatus = text(evalReport.status ?? evalReport.passFailStatus ?? (finalReliability >= 0.7 ? "pass" : "fail"));

  return (
    <Section title="Reliability Dashboard" eyebrow="Eval report">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <DashboardCard label="Groundedness" value={normalizedScore(evalReport.groundednessScore, 0)} caption="Answer content anchored to retrieved source text." />
        <DashboardCard label="Citation Accuracy" value={normalizedScore(evalReport.citationAccuracyScore ?? citationValidation.overallScore, 0)} caption="Cited claims supported by validation pass." />
        <DashboardCard label="Retrieval Coverage" value={normalizedScore(evalReport.retrievalCoverage ?? evalReport.retrievalCoverageScore, 0)} caption="Coverage of relevant issues and authority." />
        <DashboardCard label="Hallucination Risk" value={riskScore} invert caption="Lower is better after risk mitigation." />
        <DashboardCard label="Final Reliability" value={finalReliability} caption={`Pass/fail status: ${passStatus.toUpperCase()}.`} />
        <DashboardCard label="Answer Confidence" value={normalizedScore(evalReport.finalAnswerConfidence ?? finalAnswer.confidenceScore ?? finalAnswer.confidence, 0)} caption="Final synthesis confidence after review." />
      </div>
      <div className={`mt-4 inline-flex rounded-md border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${styleForStatus(passStatus)}`}>
        {passStatus}
      </div>
    </Section>
  );
}

function ExecutionTimeline({ result }: { result: ApiRecord }) {
  const trace = firstArray(result.executionTrace, result.trace, result.steps);
  const items = trace.length > 0 ? trace : DEFAULT_TRACE_AGENTS.map((agent) => ({ agent, status: "complete" }));

  return (
    <Section title="Agent Execution Timeline" eyebrow="Trace">
      <div className="space-y-3">
        {items.map((item, index) => {
          const step = asRecord(item);
          const agent = text(step.agentName ?? step.agent ?? step.name ?? step.stage, `Step ${index + 1}`);
          const status = text(step.status ?? step.state, "complete");
          const inputSummary = text(step.inputSummary ?? step.input ?? step.promptSummary, summarizeInput(agent, result));
          const outputSummary = text(step.outputSummary ?? step.output ?? step.summary ?? step.resultSummary, summarizeOutput(agent, result));
          const riskFlag = optionalText(step.riskFlag ?? step.risk ?? step.flag);

          return (
            <div key={`${agent}-${index}`} className="grid gap-3 rounded-lg border border-slate-800 bg-slate-900/70 p-4 sm:grid-cols-[72px_1fr]">
              <div>
                <p className="font-mono text-xs text-slate-500">STEP {number(step.stepNumber ?? step.step ?? index + 1)}</p>
                <span className={`mt-2 inline-flex rounded border px-2 py-0.5 text-[11px] font-semibold uppercase ${styleForStatus(status)}`}>
                  {status}
                </span>
              </div>
              <div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <h3 className="text-sm font-semibold text-slate-100">{agent}</h3>
                  {riskFlag && (
                    <span className={`w-fit rounded border px-2 py-0.5 text-[11px] font-medium ${styleForStatus(riskFlag)}`}>
                      Risk: {riskFlag}
                    </span>
                  )}
                </div>
                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">Input summary</p>
                    <p className="mt-1 text-sm leading-6 text-slate-400">{inputSummary}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-600">Output summary</p>
                    <p className="mt-1 text-sm leading-6 text-slate-300">{outputSummary}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

function summarizeInput(agent: string, result: ApiRecord): string {
  const query = text(result.query, "Legal research query");
  if (agent.toLowerCase().includes("retrieval")) return "Intake classification and extracted legal terms routed into retrieval.";
  if (agent.toLowerCase().includes("citation")) return "Candidate claims and retrieved authority submitted for support checking.";
  if (agent.toLowerCase().includes("adversarial")) return "Draft reasoning, source set, and citation findings submitted for opposition review.";
  if (agent.toLowerCase().includes("eval")) return "Full run artifacts scored for groundedness, citation support, and final reliability.";
  return query;
}

function summarizeOutput(agent: string, result: ApiRecord): string {
  const intake = asRecord(result.intake);
  const sources = firstArray(result.retrievedSources, asRecord(result.retrieval).sources);
  const citationValidation = asRecord(result.citationValidation);
  const adversarialReview = asRecord(result.adversarialReview);
  const evalReport = asRecord(result.evalReport);
  if (agent.toLowerCase().includes("intake")) {
    return `Classified as ${text(intake.queryClassification ?? intake.legalIssue, "legal issue")} in ${text(intake.jurisdiction, "unspecified jurisdiction")}.`;
  }
  if (agent.toLowerCase().includes("retrieval")) return `Retrieved ${sources.length} source candidates for validation.`;
  if (agent.toLowerCase().includes("citation")) {
    return `${firstArray(citationValidation.claims, citationValidation.validations).length} claims reviewed; score ${percent(citationValidation.overallScore, 0)}.`;
  }
  if (agent.toLowerCase().includes("adversarial")) return text(adversarialReview.summary, "Opposing arguments and missing evidence identified.");
  if (agent.toLowerCase().includes("eval")) return `Final reliability ${percent(evalReport.overallReliability ?? evalReport.finalReliabilityScore, 0)}.`;
  return "Pipeline stage completed.";
}

function SourcesPanel({ result }: { result: ApiRecord }) {
  const retrieval = asRecord(result.retrieval);
  const sources = firstArray(result.retrievedSources, retrieval.sources, result.sources);

  return (
    <Section title="Retrieved Sources" eyebrow="RAG">
      {sources.length === 0 ? (
        <p className="text-sm text-slate-500">No retrieved sources were returned for this run.</p>
      ) : (
        <div className="space-y-3">
          {sources.map((sourceValue, index) => {
            const source = asRecord(sourceValue);
            const score = normalizedScore(source.score ?? source.relevanceScore ?? source.similarity, 0);
            return (
              <article key={text(source.citationId ?? source.id, String(index))} className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded border border-cyan-400/30 bg-cyan-400/10 px-2 py-0.5 font-mono text-xs text-cyan-200">
                        {text(source.citationId ?? source.id, `SRC-${index + 1}`)}
                      </span>
                      <h3 className="text-sm font-semibold text-slate-100">{text(source.title, "Untitled source")}</h3>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      {text(source.jurisdiction, "Jurisdiction not reported")} / {text(source.practiceArea ?? source.practice_area ?? source.docType, "Practice area not reported")}
                    </p>
                  </div>
                  <span className="font-mono text-sm font-semibold text-cyan-200">{Math.round(score * 100)}%</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-400">{text(source.reason ?? source.retrievalReason ?? source.matchReason, "Matched through retrieval scoring.")}</p>
                <p className="mt-3 rounded-md border border-slate-800 bg-slate-950/60 p-3 text-sm leading-6 text-slate-300">
                  {text(source.snippet ?? source.textSnippet ?? source.text ?? source.content, "No text snippet returned.")}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </Section>
  );
}

function CitationValidationPanel({ result }: { result: ApiRecord }) {
  const validation = asRecord(result.citationValidation);
  const claims = firstArray(validation.claims, validation.validations, validation.results, result.citationValidations);

  return (
    <Section title="Citation Validation" eyebrow="Support check">
      {claims.length === 0 ? (
        <p className="text-sm text-slate-500">Citation validation details were not returned for this run.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <div className="hidden grid-cols-[1.3fr_120px_120px_1.2fr] gap-3 border-b border-slate-800 bg-slate-900 px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 lg:grid">
            <span>Claim</span>
            <span>Citation ID</span>
            <span>Status</span>
            <span>Explanation</span>
          </div>
          <div className="divide-y divide-slate-800">
            {claims.map((claimValue, index) => {
              const claim = asRecord(claimValue);
              const status = text(claim.supportStatus ?? claim.supportStrength ?? claim.status, "partial");
              const score = normalizedScore(claim.supportScore ?? claim.score, status === "strong" || status === "verified" ? 0.9 : status === "unsupported" ? 0.15 : 0.55);
              return (
                <div key={index} className="grid gap-3 bg-slate-950/50 px-4 py-4 lg:grid-cols-[1.3fr_120px_120px_1.2fr]">
                  <p className="text-sm leading-6 text-slate-300">{text(claim.claim, "Claim not reported")}</p>
                  <p className="font-mono text-xs text-cyan-200">{text(claim.citationId ?? claim.supportingCitationId ?? claim.citation_id, "none")}</p>
                  <div>
                    <span className={`inline-flex rounded border px-2 py-0.5 text-[11px] font-semibold uppercase ${styleForStatus(status)}`}>
                      {status} / {Math.round(score * 100)}%
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-slate-400">{text(claim.explanation ?? claim.flag ?? claim.reason, "No explanation returned.")}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Section>
  );
}

function HallucinationRiskPanel({ result }: { result: ApiRecord }) {
  const evalReport = asRecord(result.evalReport);
  const riskRecord = firstRecord(result.hallucinationRisk, result.hallucinationRiskReport, evalReport.hallucinationRiskReport);
  const riskLevel = text(riskRecord.riskLevel ?? riskRecord.level ?? evalReport.hallucinationRisk, "low");
  const score = normalizedScore(riskRecord.riskScore ?? riskRecord.score, riskFromLevel(riskLevel));
  const factors = list(riskRecord.riskFactors ?? riskRecord.factors ?? evalReport.riskFactors);
  const mitigations = list(riskRecord.mitigationSteps ?? riskRecord.mitigations ?? riskRecord.mitigation);

  return (
    <Section title="Hallucination Risk" eyebrow="Risk monitor">
      <div className="grid gap-4 lg:grid-cols-[180px_1fr_1fr]">
        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Risk score</p>
          <p className={`mt-3 font-mono text-3xl font-semibold ${metricTone(score, true)}`}>{Math.round(score * 100)}%</p>
          <span className={`mt-3 inline-flex rounded border px-2 py-0.5 text-[11px] font-semibold uppercase ${styleForStatus(riskLevel)}`}>
            {riskLevel}
          </span>
        </div>
        <ListBlock title="Risk Factors" items={factors} fallback="No hallucination risk factors returned." />
        <ListBlock title="Mitigation Steps" items={mitigations} fallback="No mitigation steps returned." />
      </div>
    </Section>
  );
}

function AdversarialReviewPanel({ result }: { result: ApiRecord }) {
  const review = asRecord(result.adversarialReview);
  return (
    <Section title="Adversarial Review" eyebrow="Opposition pass">
      <div className="grid gap-4 lg:grid-cols-2">
        <ListBlock title="Opposing Arguments" items={list(review.opposingArguments ?? review.counterarguments)} fallback="No opposing arguments returned." />
        <ListBlock title="Missing Evidence" items={list(review.missingEvidence ?? review.missingAuthority)} fallback="No missing evidence returned." />
        <ListBlock title="Weak Citations" items={list(review.weakCitations ?? review.weaknesses)} fallback="No weak citations returned." />
        <ListBlock title="Suggested Improvements" items={list(review.suggestedImprovements ?? review.improvements ?? review.recommendations)} fallback="No suggested improvements returned." />
      </div>
    </Section>
  );
}

function FinalAnswerPanel({ result }: { result: ApiRecord }) {
  const finalAnswer = asRecord(result.finalAnswer);
  const citations = list(finalAnswer.citationsUsed ?? finalAnswer.citations);
  const unresolved = list(finalAnswer.unresolvedQuestions ?? finalAnswer.openQuestions);
  const confidence = normalizedScore(finalAnswer.confidence ?? finalAnswer.confidenceScore, 0);

  return (
    <Section title="Final Answer" eyebrow="Synthesis">
      <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
        <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">
          {text(finalAnswer.legalStyleAnswer ?? finalAnswer.answer ?? finalAnswer.text, "No final answer returned.")}
        </p>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_180px]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Citations used</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {citations.length > 0 ? (
              citations.map((citation) => (
                <span key={citation} className="rounded border border-cyan-400/30 bg-cyan-400/10 px-2 py-1 font-mono text-xs text-cyan-200">
                  {citation}
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-500">No citations reported.</p>
            )}
          </div>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Confidence</p>
          <p className={`mt-2 font-mono text-2xl font-semibold ${metricTone(confidence)}`}>{Math.round(confidence * 100)}%</p>
        </div>
      </div>
      <div className="mt-4">
        <ListBlock title="Unresolved Questions" items={unresolved} fallback="No unresolved questions reported." />
      </div>
    </Section>
  );
}

function ListBlock({ title, items, fallback }: { title: string; items: string[]; fallback: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="text-sm leading-6 text-slate-300">
              <span className="mr-2 font-mono text-xs text-cyan-300">{String(index + 1).padStart(2, "0")}</span>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-500">{fallback}</p>
      )}
    </div>
  );
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [runs, setRuns] = useState<ApiRecord[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadRuns() {
      try {
        const response = await fetch("/api/runs", { cache: "no-store" });
        if (!response.ok) return;
        const data: unknown = await response.json();
        const records = firstArray(data, asRecord(data).runs, asRecord(data).data)
          .map((item) => asRecord(item))
          .filter((item) => Object.keys(item).length > 0);
        if (!cancelled) setRuns(records);
      } catch {
        if (!cancelled) setRuns([]);
      }
    }
    loadRuns();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (query.trim().length < 5 || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });

      const data: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(text(asRecord(data).error, "Orchestration failed."));
      }

      setResult(asRecord(data));
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unexpected orchestration error.");
    } finally {
      setLoading(false);
    }
  }

  const runMetadata = useMemo(() => {
    if (!result) return null;
    const trace = firstArray(result.executionTrace, result.trace, result.steps);
    return {
      runId: text(result.runId ?? result.id, "unsaved run"),
      persisted: text(result.persisted, "not reported"),
      steps: trace.length,
    };
  }, [result]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.11),transparent_34rem),linear-gradient(180deg,#020617_0%,#0f172a_48%,#020617_100%)] text-slate-100">
      <Header />
      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <Hero />

        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <QueryWorkspace query={query} setQuery={setQuery} loading={loading} error={error} onSubmit={handleSubmit} />
          <RunHistory runs={runs} />
        </div>

        <div className="mt-6">{loading && <LoadingState />}</div>

        {result && !loading && (
          <div ref={resultsRef} className="mt-8 space-y-5">
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Completed run</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{text(result.query, query)}</p>
                </div>
                {runMetadata && (
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded border border-slate-700 px-2 py-1 font-mono text-slate-400">{runMetadata.runId}</span>
                    <span className="rounded border border-slate-700 px-2 py-1 text-slate-400">{runMetadata.steps} trace steps</span>
                    <span className="rounded border border-slate-700 px-2 py-1 text-slate-400">Persisted: {runMetadata.persisted}</span>
                  </div>
                )}
              </div>
            </div>

            <ReliabilityDashboard result={result} />
            <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              <ExecutionTimeline result={result} />
              <div className="space-y-5">
                <SourcesPanel result={result} />
                <CitationValidationPanel result={result} />
              </div>
            </div>
            <HallucinationRiskPanel result={result} />
            <AdversarialReviewPanel result={result} />
            <FinalAnswerPanel result={result} />
          </div>
        )}
      </main>
    </div>
  );
}
