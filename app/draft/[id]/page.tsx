import type { Metadata } from "next";
import Link from "next/link";
import { getDraftWorkspace } from "@/lib/litigation/getDraftWorkspace";
import { listDraftRevisions } from "@/lib/drafts/listDraftRevisions";
import DraftWorkspaceHeader from "@/components/draft/DraftWorkspaceHeader";
import EditableMotionEditor from "@/components/draft/EditableMotionEditor";
import DraftRevisionHistory from "@/components/draft/DraftRevisionHistory";
import DraftExportControls from "@/components/draft/DraftExportControls";
import VerificationInspector from "@/components/draft/VerificationInspector";
import AuthorityPanel from "@/components/draft/AuthorityPanel";
import AdversarialReviewPanel from "@/components/draft/AdversarialReviewPanel";
import LocalRulesPanel from "@/components/draft/LocalRulesPanel";
import DraftEvalPanel from "@/components/draft/DraftEvalPanel";
import JudgeBriefPanel from "@/components/draft/JudgeBriefPanel";
import CaseFilePanel from "@/components/draft/CaseFilePanel";
import AgentEventFeed from "@/components/workflows/AgentEventFeed";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Draft ${id.slice(0, 8)} — LexOrchestrator` };
}

function SectionTitle({ n, children }: { n: string; children: string }) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "var(--text-3)",
          letterSpacing: "0.2em",
        }}
      >
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

function PanelCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ border: "1px solid rgba(0,0,0,0.07)", padding: "1.25rem" }}
    >
      {children}
    </div>
  );
}

export default async function DraftWorkspacePage({ params }: Props) {
  const { id } = await params;
  const workspace = await getDraftWorkspace(id);
  const { workflow, events, primaryDraft, adversarialReview, localRulesArtifact, judgeBriefArtifact, caseFileArtifact, citationReports, fullEval } = workspace;

  // Load revision history server-side for initial render
  const initialRevisions = primaryDraft
    ? await listDraftRevisions(primaryDraft.id)
    : [];

  return (
    <div className="pt-10 pb-32 appear">

      {/* Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/draft"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--text-3)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
          className="transition-colors hover:text-black"
        >
          &larr; New Draft
        </Link>
        <div className="flex items-center gap-3">
          {workflow?.matter_id && (
            <Link
              href={`/matters/${workflow.matter_id}`}
              style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", letterSpacing: "0.14em", textTransform: "uppercase" }}
              className="transition-colors hover:text-black"
            >
              Matter &rarr;
            </Link>
          )}
          <Link
            href={`/workflows/${id}`}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--text-3)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
            className="transition-colors hover:text-black"
          >
            Technical Inspection &rarr;
          </Link>
          <Link
            href={`/evals/${id}`}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--text-3)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
            className="transition-colors hover:text-black"
          >
            Eval &rarr;
          </Link>
          <Link
            href={`/traces/${id}`}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--text-3)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
            className="transition-colors hover:text-black"
          >
            Trace &rarr;
          </Link>
          <Link
            href={`/jury?legalQuestion=${encodeURIComponent(workflow?.input_summary?.slice(0, 200) ?? "")}&jurisdiction=${encodeURIComponent(workflow?.jurisdiction ?? "")}&motionType=${encodeURIComponent(workflow?.motion_type ?? "")}&confidence=${encodeURIComponent(workflow?.confidence != null ? Math.round(workflow.confidence * 100) + "%" : "")}`}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--text-3)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
            className="transition-colors hover:text-black"
          >
            Jury &rarr;
          </Link>
          <Link
            href="/draft"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              color: "#000000",
              background: "var(--text-1)",
              padding: "0.375rem 0.875rem",
              textTransform: "uppercase",
              textDecoration: "none",
            }}
            className="transition-opacity hover:opacity-80"
          >
            New Draft
          </Link>
        </div>
      </div>

      {workflow === null ? (
        <div className="py-24 text-center">
          <p
            style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-2)" }}
          >
            {process.env.NEXT_PUBLIC_SUPABASE_URL
              ? "Draft workflow not found."
              : "Database not configured. Workflow runs are not persisted without Supabase."}
          </p>
          <p
            className="mt-2"
            style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-3)" }}
          >
            Run ID: {id}
          </p>
        </div>
      ) : (
        <>
          {/* § 01 Workspace Header */}
          <div className="mb-8">
            <p className="label mb-3" style={{ letterSpacing: "0.28em" }}>
              Draft Workspace
            </p>
            {workflow.input_summary && (
              <h1
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)",
                  fontWeight: 500,
                  lineHeight: 1.5,
                  color: "var(--text-1)",
                  maxWidth: "52rem",
                  marginBottom: "1rem",
                }}
              >
                {workflow.input_summary}
              </h1>
            )}
            <DraftWorkspaceHeader workflow={workflow} />
          </div>

          {/* Main two-column layout */}
          <div
            className="gap-6"
            style={{ display: "grid", gridTemplateColumns: "1fr 22rem", alignItems: "start" }}
          >
            {/* ── Left: Editor ── */}
            <div className="space-y-8 min-w-0">
              <section>
                <div className="mb-5 flex items-center gap-4">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", letterSpacing: "0.2em" }}>
                    § 02
                  </span>
                  <div style={{ flex: 1, height: "1px", background: "rgba(0,0,0,0.07)" }} />
                  {!["completed", "failed", "cancelled"].includes(workflow.status) && (
                    <div className="flex items-center gap-2">
                      <div className="relative flex items-center justify-center" style={{ width: 24, height: 24 }}>
                        <div className="agent-orb" style={{ width: 16, height: 16 }} aria-hidden="true" />
                        <div className="agent-orb-ring" style={{ inset: "-4px", animationDelay: "0s" }} aria-hidden="true" />
                        <div className="agent-orb-ring" style={{ inset: "-4px", animationDelay: "0.7s" }} aria-hidden="true" />
                      </div>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-2)", letterSpacing: "0.16em", textTransform: "uppercase" }}>
                        Drafting
                      </span>
                    </div>
                  )}
                  {["completed", "failed", "cancelled"].includes(workflow.status) && (
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-2)", letterSpacing: "0.24em", textTransform: "uppercase" }}>
                      Motion Draft
                    </span>
                  )}
                </div>
                {primaryDraft ? (
                  <EditableMotionEditor
                    initialContent={primaryDraft.content}
                    draftArtifactId={primaryDraft.id}
                    workflowRunId={id}
                    workflow={workflow}
                  />
                ) : (
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-3)" }}>
                    No draft artifact available for this workflow run.
                  </p>
                )}
              </section>

              <section>
                <SectionTitle n="03">Revision History</SectionTitle>
                {primaryDraft ? (
                  <DraftRevisionHistory
                    initialRevisions={initialRevisions}
                  />
                ) : (
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-3)" }}>
                    No revisions yet.
                  </p>
                )}
              </section>

              <section>
                <SectionTitle n="04">Export</SectionTitle>
                <DraftExportControls
                  workflowRunId={id}
                  version={initialRevisions[0]?.version ?? primaryDraft?.version ?? 1}
                />
              </section>

              <section>
                <SectionTitle n="05">Authority Retrieved</SectionTitle>
                <AuthorityPanel artifact={primaryDraft} />
              </section>
            </div>

            {/* ── Right: Inspector + secondary panels ── */}
            <div className="space-y-6" style={{ minWidth: 0 }}>
              <section>
                <SectionTitle n="05">Verification Inspector</SectionTitle>
                <div style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
                  <VerificationInspector
                    reports={citationReports}
                    artifact={primaryDraft}
                  />
                </div>
              </section>

              <section>
                <SectionTitle n="04b">Judge Brief</SectionTitle>
                <JudgeBriefPanel artifact={judgeBriefArtifact} />
              </section>

              {caseFileArtifact && (
                <section>
                  <SectionTitle n="04c">Case File</SectionTitle>
                  <PanelCard>
                    <CaseFilePanel artifact={caseFileArtifact} />
                  </PanelCard>
                </section>
              )}

              <section>
                <SectionTitle n="05">Adversarial Review</SectionTitle>
                <AdversarialReviewPanel artifact={adversarialReview} />
              </section>

              <section>
                <SectionTitle n="06">Local Rules Notes</SectionTitle>
                <LocalRulesPanel artifact={localRulesArtifact} />
              </section>

              <section>
                <SectionTitle n="07">Eval Summary</SectionTitle>
                <DraftEvalPanel workflow={workflow} fullEval={fullEval} />
              </section>
            </div>
          </div>

          {/* Agent Feed — full width below */}
          <div className="mt-12">
            <AgentEventFeed
              workflowRunId={id}
              initialEvents={events}
              initialStatus={workflow.status}
            />
          </div>
        </>
      )}

    </div>
  );
}
