"use client";

import { useRouter } from "next/navigation";
import type { WorkflowRunRow } from "@/lib/db/supabaseServer";

function passFailClass(confidence: number | null): string {
  if (confidence == null) return "badge-neutral";
  if (confidence >= 0.75) return "badge-pass";
  if (confidence >= 0.55) return "badge-warn";
  return "badge-fail";
}

function passFailLabel(confidence: number | null): string {
  if (confidence == null) return "UNKNOWN";
  if (confidence >= 0.75) return "PASS";
  if (confidence >= 0.55) return "WARN";
  return "FAIL";
}

function scoreColor(v: number | null): string {
  if (v == null) return "var(--text-3)";
  if (v >= 0.7) return "#34d399";
  if (v >= 0.4) return "#fbbf24";
  return "#f87171";
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function EvalRow({ run }: { run: WorkflowRunRow }) {
  const router = useRouter();

  return (
    <tr
      onClick={() => router.push(`/evals/${run.id}`)}
      className="cursor-pointer"
      style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--s1)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <td
        className="py-3.5 pr-5 align-top"
        style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-2)", whiteSpace: "nowrap" }}
      >
        {shortDate(run.created_at)}
      </td>
      <td className="py-3.5 pr-5 align-top">
        <p
          style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)" }}
        >
          {run.id.slice(0, 8)}
        </p>
        {run.motion_type && (
          <p
            style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-2)", marginTop: "2px" }}
          >
            {run.motion_type.replace(/_/g, " ")}
          </p>
        )}
      </td>
      <td
        className="hidden py-3.5 pr-5 align-top md:table-cell"
        style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-2)" }}
      >
        {run.jurisdiction ?? "—"}
        {run.court ? ` / ${run.court}` : ""}
      </td>
      <td className="hidden py-3.5 pr-5 text-right align-top lg:table-cell tabular-nums">
        {run.confidence != null ? (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              fontWeight: 700,
              color: scoreColor(run.confidence),
            }}
          >
            {Math.round(run.confidence * 100)}%
          </span>
        ) : (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-3)" }}>—</span>
        )}
      </td>
      <td className="hidden py-3.5 pr-5 text-right align-top lg:table-cell tabular-nums">
        {run.citation_pass_rate != null ? (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: scoreColor(run.citation_pass_rate),
            }}
          >
            {Math.round(run.citation_pass_rate * 100)}%
          </span>
        ) : (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-3)" }}>—</span>
        )}
      </td>
      <td className="py-3.5 text-center align-top">
        <span className={`badge ${passFailClass(run.confidence)}`}>
          {passFailLabel(run.confidence)}
        </span>
      </td>
    </tr>
  );
}

export default function RecentEvalTable({ runs }: { runs: WorkflowRunRow[] }) {
  if (runs.length === 0) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-3)" }}>
        No workflow runs recorded.
      </p>
    );
  }

  return (
    <table className="w-full border-collapse">
      <thead>
        <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.07)" }}>
          <th className="pb-3 pr-5 text-left"><span className="label">Date</span></th>
          <th className="pb-3 pr-5 text-left"><span className="label">Run</span></th>
          <th className="hidden pb-3 pr-5 text-left md:table-cell"><span className="label">Jurisdiction</span></th>
          <th className="hidden pb-3 pr-5 text-right lg:table-cell"><span className="label">Confidence</span></th>
          <th className="hidden pb-3 pr-5 text-right lg:table-cell"><span className="label">Citations</span></th>
          <th className="pb-3 text-center"><span className="label">Verdict</span></th>
        </tr>
      </thead>
      <tbody>
        {runs.map((run) => (
          <EvalRow key={run.id} run={run} />
        ))}
      </tbody>
    </table>
  );
}
