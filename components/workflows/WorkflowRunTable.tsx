"use client";

import { useRouter } from "next/navigation";
import type { WorkflowRunRow } from "@/lib/litigation/listWorkflowRuns";
import { formatDateTime, formatPercent, getStatusBadgeClass } from "@/lib/utils/status";

function confColor(v: number): string {
  if (v >= 0.7) return "#34d399";
  if (v >= 0.4) return "#fbbf24";
  return "#f87171";
}

function WorkflowRow({ run }: { run: WorkflowRunRow }) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(`/workflows/${run.id}`)}
      className="cursor-pointer"
      style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--s1)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <td
        className="py-4 pr-6 align-top"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "11px",
          color: "var(--text-2)",
          whiteSpace: "nowrap",
        }}
      >
        {formatDateTime(run.created_at)}
      </td>

      <td className="py-4 pr-6 align-top" style={{ maxWidth: "28rem" }}>
        <p
          className="line-clamp-2 text-sm leading-6 text-[var(--text-2)]"
          style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
        >
          {run.input_summary ?? "No summary"}
        </p>
        <p
          className="mt-1"
          style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)" }}
        >
          {run.id.slice(0, 8)} &middot; {run.motion_type ?? run.workflow_type}
        </p>
      </td>

      <td className="hidden py-4 pr-6 align-top md:table-cell">
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--text-2)",
          }}
        >
          {run.jurisdiction ?? "—"}
          {run.court ? ` / ${run.court}` : ""}
        </span>
      </td>

      <td className="hidden py-4 pr-6 text-right align-top lg:table-cell tabular-nums">
        {run.confidence != null ? (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              fontWeight: 700,
              color: confColor(run.confidence!),
            }}
          >
            {formatPercent(run.confidence)}
          </span>
        ) : (
          <span
            style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-3)" }}
          >
            —
          </span>
        )}
      </td>

      <td className="hidden py-4 pr-6 text-right align-top lg:table-cell tabular-nums">
        {run.faithfulness_score != null ? (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: confColor(run.faithfulness_score!),
            }}
          >
            {formatPercent(run.faithfulness_score)}
          </span>
        ) : (
          <span
            style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-3)" }}
          >
            —
          </span>
        )}
      </td>

      <td className="py-4 text-center align-top">
        <span className={`badge ${getStatusBadgeClass(run.status)}`}>
          {(run.status || "unknown").toUpperCase()}
        </span>
      </td>
    </tr>
  );
}

export default function WorkflowRunTable({ runs }: { runs: WorkflowRunRow[] }) {
  if (runs.length === 0) return null;

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <th className="py-3 pr-6 text-left">
            <span className="label">Date</span>
          </th>
          <th className="py-3 pr-6 text-left">
            <span className="label">Query</span>
          </th>
          <th className="hidden py-3 pr-6 text-left md:table-cell">
            <span className="label">Jurisdiction</span>
          </th>
          <th className="hidden py-3 pr-6 text-right lg:table-cell">
            <span className="label">Confidence</span>
          </th>
          <th className="hidden py-3 pr-6 text-right lg:table-cell">
            <span className="label">Faithfulness</span>
          </th>
          <th className="py-3 text-center">
            <span className="label">Status</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {runs.map((run) => (
          <WorkflowRow key={run.id} run={run} />
        ))}
      </tbody>
    </table>
  );
}
