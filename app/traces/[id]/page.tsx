import type { Metadata } from "next";
import Link from "next/link";
import { buildWorkflowTrace } from "@/lib/traces/buildWorkflowTrace";
import TraceSummaryPanel from "@/components/traces/TraceSummaryPanel";
import TraceTimeline from "@/components/traces/TraceTimeline";
import AgentBreakdownPanel from "@/components/traces/AgentBreakdownPanel";
import TraceArtifactPanel from "@/components/traces/TraceArtifactPanel";
import TraceCitationPanel from "@/components/traces/TraceCitationPanel";
import ReplaySnapshotPanel from "@/components/traces/ReplaySnapshotPanel";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Trace ${id.slice(0, 8)} — LexOrchestrator` };
}

function SectionTitle({ n, children }: { n: string; children: string }) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", letterSpacing: "0.2em" }}>
        § {n}
      </span>
      <div style={{ flex: 1, height: "1px", background: "rgba(0,0,0,0.07)" }} />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "var(--text-2)",
          letterSpacing: "0.24em",
          textTransform: "uppercase",
        }}
      >
        {children}
      </span>
    </div>
  );
}

export default async function TraceDetailPage({ params }: Props) {
  const { id } = await params;
  const trace = await buildWorkflowTrace(id);

  const noData = trace.workflow === null && trace.events.length === 0;

  return (
    <div className="pt-10 pb-32 appear">

      {/* Breadcrumb */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-3">
        <Link
          href="/workflows"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--text-3)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
          className="transition-colors hover:text-black"
        >
          &larr; Workflows
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          {trace.workflow?.matter_id && (
            <Link
              href={`/matters/${trace.workflow.matter_id}`}
              style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", letterSpacing: "0.14em", textTransform: "uppercase" }}
              className="transition-colors hover:text-black"
            >
              Matter &rarr;
            </Link>
          )}
          <Link
            href={`/draft/${id}`}
            style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", letterSpacing: "0.14em", textTransform: "uppercase" }}
            className="transition-colors hover:text-black"
          >
            Draft Workspace &rarr;
          </Link>
          <Link
            href={`/workflows/${id}`}
            style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", letterSpacing: "0.14em", textTransform: "uppercase" }}
            className="transition-colors hover:text-black"
          >
            Workflow Inspection &rarr;
          </Link>
          <Link
            href={`/evals/${id}`}
            style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", letterSpacing: "0.14em", textTransform: "uppercase" }}
            className="transition-colors hover:text-black"
          >
            Eval &rarr;
          </Link>
          <Link
            href={`/api/drafts/${id}/export?format=txt`}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--text-3)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
            className="transition-colors hover:text-black"
          >
            Export TXT &rarr;
          </Link>
          <Link
            href="/observability"
            style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", letterSpacing: "0.14em", textTransform: "uppercase" }}
            className="transition-colors hover:text-black"
          >
            Observe &rarr;
          </Link>
        </div>
      </div>

      {/* Page header */}
      <div className="mb-8">
        <p className="label mb-3" style={{ letterSpacing: "0.28em" }}>Agent Trace</p>
        <h1
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)",
            fontWeight: 500,
            lineHeight: 1.5,
            color: "var(--text-1)",
            maxWidth: "52rem",
            marginBottom: "0.5rem",
          }}
        >
          {trace.workflow?.input_summary ?? `Workflow ${id.slice(0, 8)}`}
        </h1>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)" }}>{id}</p>
      </div>

      {noData ? (
        <div className="py-24 text-center">
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-2)" }}>
            {process.env.NEXT_PUBLIC_SUPABASE_URL
              ? "Workflow run not found."
              : "Database not configured. Traces are not available without Supabase."}
          </p>
          <p className="mt-2" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-3)" }}>
            Run ID: {id}
          </p>
        </div>
      ) : (
        <div className="space-y-12">

          {/* § 01 Trace Summary */}
          <section>
            <SectionTitle n="01">Trace Summary</SectionTitle>
            <TraceSummaryPanel
              workflow={trace.workflow}
              summary={trace.debugSummary}
              snapshot={trace.replaySnapshot}
            />
          </section>

          {/* § 02 Timeline */}
          <section>
            <SectionTitle n="02">Timeline</SectionTitle>
            <TraceTimeline events={trace.events} />
          </section>

          {/* § 03 Agent Breakdown */}
          <section>
            <SectionTitle n="03">Agent Breakdown</SectionTitle>
            <AgentBreakdownPanel agentGroups={trace.agentGroups} />
          </section>

          {/* § 04 Artifacts Created */}
          <section>
            <SectionTitle n="04">Artifacts Created</SectionTitle>
            <TraceArtifactPanel artifacts={trace.artifacts} workflowRunId={id} />
          </section>

          {/* § 05 Citation Reports */}
          <section>
            <SectionTitle n="05">Citation Reports</SectionTitle>
            <TraceCitationPanel citationReports={trace.citationReports} />
          </section>

          {/* § 06 Replay Snapshot */}
          <section>
            <SectionTitle n="06">Replay Snapshot</SectionTitle>
            <ReplaySnapshotPanel snapshot={trace.replaySnapshot} />
          </section>

        </div>
      )}

    </div>
  );
}
