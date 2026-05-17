import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRunById } from "@/lib/db/supabaseServer";
import RunDetailView from "@/components/runs/RunDetailView";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Analysis ${id.slice(0, 8)} — LexOrchestrator` };
}

export default async function RunDetailPage({ params }: Props) {
  const { id } = await params;
  const detail = await getRunById(id);

  if (!detail) notFound();

  const { run } = detail;

  const confidencePct = run.confidence != null ? Math.round(run.confidence * 100) : null;
  const halRiskPct    = run.hallucination_risk != null ? Math.round(run.hallucination_risk * 100) : null;
  const passFail      = run.confidence != null
    ? (run.confidence >= 0.6 ? "pass" : "fail")
    : null;

  return (
    <div className="pt-10 pb-24 appear">

      {/* ── Breadcrumb ── */}
      <div className="mb-10 flex items-center justify-between">
        <Link
          href="/runs"
          style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-3)", letterSpacing: "0.16em" }}
          className="uppercase transition-colors hover:text-black"
        >
          &larr; Research History
        </Link>
        <Link
          href="/research"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.2em",
            color: "#000000",
            background: "var(--text-1)",
            padding: "0.375rem 0.875rem",
            textDecoration: "none",
          }}
          className="uppercase transition-opacity hover:opacity-80"
        >
          New Research
        </Link>
      </div>

      {/* ── Query header ── */}
      <div className="mb-12">
        <p
          className="label mb-3"
          style={{ letterSpacing: "0.28em" }}
        >
          Research Query
        </p>
        <h1
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: "clamp(1.4rem, 3vw, 2rem)",
            fontWeight: 500,
            lineHeight: 1.45,
            color: "var(--text-1)",
            letterSpacing: "-0.01em",
            maxWidth: "52rem",
          }}
        >
          {run.query}
        </h1>

        {/* Meta strip */}
        <div
          className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2"
          style={{ borderTop: "1px solid rgba(0,0,0,0.07)", paddingTop: "1.25rem" }}
        >
          {/* Status */}
          <span
            className={`badge ${
              run.status === "completed" ? "badge-pass"
              : run.status === "failed"  ? "badge-fail"
              : "badge-warn"
            }`}
          >
            {run.status.toUpperCase()}
          </span>

          {/* Pass/Fail */}
          {passFail && (
            <span className={`badge ${passFail === "pass" ? "badge-pass" : "badge-fail"}`}>
              {passFail.toUpperCase()}
            </span>
          )}

          {/* Confidence */}
          {confidencePct != null && (
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="label">Confidence</span>
              <span
                className="tabular-nums"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: confidencePct >= 70 ? "#34d399" : confidencePct >= 40 ? "#fbbf24" : "#f87171",
                }}
              >
                {confidencePct}%
              </span>
            </span>
          )}

          {/* Hallucination risk */}
          {halRiskPct != null && (
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="label">Hal. Risk</span>
              <span
                className="tabular-nums"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  color: halRiskPct <= 20 ? "#34d399" : halRiskPct <= 50 ? "#fbbf24" : "#f87171",
                }}
              >
                {halRiskPct}%
              </span>
            </span>
          )}

          {/* Model */}
          {run.model && (
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="label">Model</span>
              <span
                style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-3)" }}
              >
                {run.model}
              </span>
            </span>
          )}

          {/* Timestamp */}
          <span
            style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-3)", marginLeft: "auto" }}
          >
            {new Date(run.created_at).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </span>
        </div>
      </div>

      {/* ── Full analysis ── */}
      <RunDetailView detail={detail} />

    </div>
  );
}
