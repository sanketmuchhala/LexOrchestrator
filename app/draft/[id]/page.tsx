import type { Metadata } from "next";
import Link from "next/link";
import { getDraftWorkspace } from "@/lib/litigation/getDraftWorkspace";
import DraftWorkspaceHeader from "@/components/draft/DraftWorkspaceHeader";
import DocumentPreview from "@/components/draft/DocumentPreview";
import VerificationInspector from "@/components/draft/VerificationInspector";
import AuthorityPanel from "@/components/draft/AuthorityPanel";
import AdversarialReviewPanel from "@/components/draft/AdversarialReviewPanel";
import LocalRulesPanel from "@/components/draft/LocalRulesPanel";
import DraftEvalPanel from "@/components/draft/DraftEvalPanel";
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
          color: "#404040",
          letterSpacing: "0.2em",
        }}
      >
        § {n}
      </span>
      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "#737373",
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
      style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem" }}
    >
      {children}
    </div>
  );
}

export default async function DraftWorkspacePage({ params }: Props) {
  const { id } = await params;
  const workspace = await getDraftWorkspace(id);
  const { workflow, events, primaryDraft, adversarialReview, localRulesArtifact, citationReports } = workspace;

  return (
    <div className="pt-10 pb-32 appear">

      {/* Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/draft"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "#404040",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
          className="transition-colors hover:text-white"
        >
          &larr; New Draft
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href={`/workflows/${id}`}
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "#404040",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
            className="transition-colors hover:text-white"
          >
            Technical Inspection &rarr;
          </Link>
          <Link
            href="/draft"
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
            New Draft
          </Link>
        </div>
      </div>

      {workflow === null ? (
        <div className="py-24 text-center">
          <p
            style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#737373" }}
          >
            {process.env.NEXT_PUBLIC_SUPABASE_URL
              ? "Draft workflow not found."
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
                  color: "#f4f4f4",
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
            {/* ── Left: Document ── */}
            <div className="space-y-8 min-w-0">
              <section>
                <SectionTitle n="02">Document Preview</SectionTitle>
                <PanelCard>
                  <DocumentPreview
                    artifact={primaryDraft}
                    finalOutput={workflow.final_output}
                  />
                </PanelCard>
              </section>

              <section>
                <SectionTitle n="04">Authority Retrieved</SectionTitle>
                <AuthorityPanel artifact={primaryDraft} />
              </section>
            </div>

            {/* ── Right: Inspector + secondary panels ── */}
            <div className="space-y-6" style={{ minWidth: 0 }}>
              <section>
                <SectionTitle n="03">Verification Inspector</SectionTitle>
                <div style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                  <VerificationInspector
                    reports={citationReports}
                    artifact={primaryDraft}
                  />
                </div>
              </section>

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
                <DraftEvalPanel workflow={workflow} />
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
