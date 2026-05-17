import type { TraceReplaySnapshot } from "@/lib/traces/types";

function row(label: string, value: string | null | undefined) {
  if (!value) return null;
  return (
    <div className="flex gap-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: "0.5rem", marginBottom: "0.5rem" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#404040", letterSpacing: "0.16em", textTransform: "uppercase", minWidth: "120px", paddingTop: "0.125rem" }}>
        {label}
      </span>
      <span style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "13px", color: "#f4f4f4", lineHeight: 1.5 }}>
        {value}
      </span>
    </div>
  );
}

interface Props {
  snapshot: TraceReplaySnapshot;
}

export default function ReplaySnapshotPanel({ snapshot }: Props) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem" }}>
      <div className="space-y-0">
        {row("Workflow ID", snapshot.workflowRunId)}
        {row("Status", snapshot.status)}
        {row("Motion Type", snapshot.motionType?.replace(/_/g, " "))}
        {row("Jurisdiction", snapshot.jurisdiction)}
        {row("Court", snapshot.court)}
        {row("Judge", snapshot.judgeName)}
        {row("Input Summary", snapshot.inputSummary)}
        {row("Created", snapshot.createdAt ? new Date(snapshot.createdAt).toLocaleString("en-US") : null)}
      </div>

      {snapshot.draftArtifactIds.length > 0 && (
        <div style={{ marginTop: "0.75rem" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#404040", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "0.375rem" }}>
            Draft Artifact IDs
          </p>
          {snapshot.draftArtifactIds.map((id) => (
            <span
              key={id}
              style={{ display: "inline-block", fontFamily: "var(--font-mono)", fontSize: "10px", color: "#60a5fa", marginRight: "0.75rem" }}
            >
              {id}
            </span>
          ))}
        </div>
      )}

      {snapshot.citationReportIds.length > 0 && (
        <div style={{ marginTop: "0.75rem" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#404040", letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: "0.375rem" }}>
            Citation Report IDs
          </p>
          {snapshot.citationReportIds.map((id) => (
            <span
              key={id}
              style={{ display: "inline-block", fontFamily: "var(--font-mono)", fontSize: "10px", color: "#737373", marginRight: "0.75rem" }}
            >
              {id.slice(0, 8)}
            </span>
          ))}
        </div>
      )}

      <div
        style={{
          marginTop: "1.25rem",
          borderLeft: "2px solid rgba(255,255,255,0.06)",
          paddingLeft: "0.75rem",
        }}
      >
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "#404040", lineHeight: 1.6 }}>
          Replay execution is not enabled in this phase. This snapshot records the context needed to debug or reproduce the workflow.
        </p>
      </div>
    </div>
  );
}
