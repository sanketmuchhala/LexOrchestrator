import type { Metadata } from "next";
import Link from "next/link";
import { getWorkflowRun } from "@/lib/litigation/getWorkflowRun";
import WorkflowSummaryPanel from "@/components/workflows/WorkflowSummaryPanel";
import AgentEventFeed from "@/components/workflows/AgentEventFeed";
import DraftArtifactList from "@/components/workflows/DraftArtifactList";
import CitationReportTable from "@/components/workflows/CitationReportTable";
import EvalSummaryPanel from "@/components/workflows/EvalSummaryPanel";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Workflow ${id.slice(0, 8)} — LexOrchestrator` };
}

export default async function WorkflowDetailPage({ params }: Props) {
  const { id } = await params;
  const { workflow, events, artifacts, citationReports } = await getWorkflowRun(id);

  return (
    <div className="pt-10 pb-24 appear">

      {/* Breadcrumb */}
      <div className="mb-10 flex items-center justify-between">
        <Link
          href="/workflows"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "#404040",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
          className="transition-colors hover:text-white"
        >
          &larr; Workflow Runs
        </Link>
        <div className="flex items-center gap-3">
          {workflow?.matter_id && (
            <Link
              href={`/matters/${workflow.matter_id}`}
              style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#404040", letterSpacing: "0.14em", textTransform: "uppercase" }}
              className="transition-colors hover:text-white"
            >
              Matter &rarr;
            </Link>
          )}
          <Link
            href={`/draft/${id}`}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "#404040",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
            className="transition-colors hover:text-white"
          >
            Draft Workspace &rarr;
          </Link>
          <Link
            href={`/evals/${id}`}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "#404040",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
            className="transition-colors hover:text-white"
          >
            Eval &rarr;
          </Link>
          <Link
            href={`/traces/${id}`}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "#404040",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
            className="transition-colors hover:text-white"
          >
            Trace &rarr;
          </Link>
          <Link
            href="/workflows"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              color: "#000",
              background: "#f4f4f4",
              padding: "0.375rem 0.875rem",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
            className="transition-opacity hover:opacity-80"
          >
            New Workflow
          </Link>
        </div>
      </div>

      {workflow === null ? (
        <div className="py-24 text-center">
          <p
            style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#737373" }}
          >
            {process.env.NEXT_PUBLIC_SUPABASE_URL
              ? "Workflow run not found."
              : "Database not configured. Workflow runs are not persisted without Supabase."}
          </p>
          <p
            className="mt-2"
            style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#404040" }}
          >
            Run ID: {id}
          </p>
        </div>
      ) : (
        <>
          {/* Run ID header */}
          <div className="mb-10">
            <p className="label mb-2" style={{ letterSpacing: "0.28em" }}>
              Workflow Run
            </p>
            <h1
              style={{
                fontFamily: "var(--font-serif), Georgia, serif",
                fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)",
                fontWeight: 500,
                lineHeight: 1.5,
                color: "#f4f4f4",
                maxWidth: "52rem",
              }}
            >
              {workflow.input_summary ?? `Workflow ${workflow.id.slice(0, 8)}`}
            </h1>
            <p
              className="mt-2"
              style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#404040" }}
            >
              {workflow.id}
            </p>
          </div>

          <div className="space-y-12">
            <WorkflowSummaryPanel workflow={workflow} />

            <AgentEventFeed
              workflowRunId={id}
              initialEvents={events}
              initialStatus={workflow.status}
            />

            <DraftArtifactList artifacts={artifacts} />

            <CitationReportTable reports={citationReports} />

            <EvalSummaryPanel workflow={workflow} />
          </div>
        </>
      )}

    </div>
  );
}
