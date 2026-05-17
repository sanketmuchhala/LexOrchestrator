import type { Metadata } from "next";
import Link from "next/link";
import { listWorkflowRuns } from "@/lib/litigation/listWorkflowRuns";

export const metadata: Metadata = {
  title: "Traces — LexOrchestrator",
};

export const dynamic = "force-dynamic";

function statusBadgeClass(status: string): string {
  if (status === "completed") return "badge-pass";
  if (status === "failed") return "badge-fail";
  if (status === "running" || status === "queued") return "badge-warn";
  return "badge-neutral";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function confidenceColor(c: number | null): string {
  if (c == null) return "var(--text-3)";
  if (c >= 0.75) return "var(--emerald)";
  if (c >= 0.55) return "var(--amber)";
  return "var(--red)";
}

export default async function TracesPage() {
  const runs = await listWorkflowRuns(60);

  return (
    <div className="appear pt-10 pb-24">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="label mb-2">Agent Traces</p>
          <h1
            className="text-[clamp(1.4rem,3vw,2rem)] font-semibold"
            style={{ fontFamily: "var(--font-serif), Georgia, serif", color: "var(--text-1)" }}
          >
            Workflow Trace History
          </h1>
        </div>
        <Link
          href="/draft"
          className="inline-block px-6 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-opacity hover:opacity-80"
          style={{
            fontFamily: "var(--font-mono), monospace",
            background: "var(--text-1)",
            color: "#000000",
          }}
        >
          New Draft
        </Link>
      </div>

      <div className="rule mb-8" />

      {runs.length === 0 ? (
        <div className="py-20 text-center">
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-2)" }}>
            {process.env.NEXT_PUBLIC_SUPABASE_URL
              ? "No workflow runs found."
              : "Database not configured. Workflow runs are not persisted without Supabase."}
          </p>
          <Link
            href="/draft"
            className="mt-6 inline-block text-xs font-bold uppercase tracking-[0.18em] transition-opacity hover:opacity-70"
            style={{
              fontFamily: "var(--font-mono), monospace",
              color: "var(--text-2)",
            }}
          >
            Run your first draft &rarr;
          </Link>
        </div>
      ) : (
        <div>
          {/* Table header */}
          <div
            className="grid gap-4 pb-2"
            style={{
              gridTemplateColumns: "8rem 7rem 9rem 9rem 1fr 5rem",
              borderBottom: "1px solid rgba(0,0,0,0.07)",
            }}
          >
            {["Run ID", "Status", "Motion Type", "Jurisdiction", "Summary", "Confidence"].map((h) => (
              <p key={h} className="label">{h}</p>
            ))}
          </div>

          {/* Rows */}
          {runs.map((run) => (
            <Link
              key={run.id}
              href={`/traces/${run.id}`}
              className="group block"
              style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
            >
              <div
                className="grid gap-4 py-3 transition-colors group-hover:bg-[var(--s1)]"
                style={{ gridTemplateColumns: "8rem 7rem 9rem 9rem 1fr 5rem" }}
              >
                {/* Run ID */}
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    color: "var(--text-2)",
                    fontWeight: 600,
                  }}
                >
                  {run.id.slice(0, 8)}
                </p>

                {/* Status */}
                <div>
                  <span className={`badge ${statusBadgeClass(run.status)}`}>
                    {run.status}
                  </span>
                </div>

                {/* Motion type */}
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "var(--text-2)",
                  }}
                >
                  {run.motion_type ?? run.workflow_type ?? "—"}
                </p>

                {/* Jurisdiction */}
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "10px",
                    color: "var(--text-3)",
                  }}
                >
                  {run.jurisdiction ?? "—"}
                  {run.court ? ` / ${run.court.slice(0, 16)}` : ""}
                </p>

                {/* Summary */}
                <p
                  style={{
                    fontFamily: "var(--font-serif), Georgia, serif",
                    fontSize: "12px",
                    color: "var(--text-2)",
                    lineHeight: 1.5,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {run.input_summary ?? "—"}
                </p>

                {/* Confidence */}
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: confidenceColor(run.confidence),
                  }}
                >
                  {run.confidence != null ? `${Math.round(run.confidence * 100)}%` : "—"}
                </p>
              </div>

              {/* Created date — sub-row */}
              <p
                className="pb-2"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "var(--text-3)",
                }}
              >
                {formatDate(run.created_at)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
