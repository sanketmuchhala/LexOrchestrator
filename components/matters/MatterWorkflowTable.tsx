import Link from "next/link";
import type { MatterWorkflowSummary } from "@/lib/matters/types";

function statusBadge(status: string) {
  const cls =
    status === "completed" ? "badge-pass" :
    status === "failed" ? "badge-fail" :
    status === "running" ? "badge-warn" :
    "badge-neutral";
  return <span className={`badge ${cls}`} style={{ fontFamily: "var(--font-mono)", fontSize: "9px" }}>{status}</span>;
}

function shortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return iso.slice(0, 10);
  }
}

interface Props {
  workflows: MatterWorkflowSummary[];
}

export default function MatterWorkflowTable({ workflows }: Props) {
  if (workflows.length === 0) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-3)" }}>
        No workflows yet. Start one with the launcher above.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {workflows.map((wf) => (
        <div key={wf.id} style={{ border: "1px solid rgba(0,0,0,0.07)", padding: "0.875rem" }}>
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#60a5fa" }}>
              {wf.id.slice(0, 8)}
            </span>
            {statusBadge(wf.status)}
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-2)" }}>
              {wf.motion_type?.replace(/_/g, " ") ?? wf.workflow_type}
            </span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-3)", marginLeft: "auto" }}>
              {shortDate(wf.created_at)}
            </span>
          </div>
          {wf.input_summary && (
            <p style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "13px", color: "var(--text-2)", marginBottom: "0.5rem", lineHeight: 1.5 }}>
              {wf.input_summary.slice(0, 120)}{wf.input_summary.length > 120 ? "..." : ""}
            </p>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { label: "Draft", href: wf.draftLink },
              { label: "Inspection", href: wf.workflowLink },
              { label: "Eval", href: wf.evalLink },
              { label: "Trace", href: wf.traceLink },
            ].map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-3)", letterSpacing: "0.12em", textTransform: "uppercase" }}
                className="transition-colors hover:text-black"
              >
                {label} &rarr;
              </Link>
            ))}
            {wf.confidence != null && (
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-3)", marginLeft: "auto" }}>
                conf {(wf.confidence * 100).toFixed(0)}%
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
