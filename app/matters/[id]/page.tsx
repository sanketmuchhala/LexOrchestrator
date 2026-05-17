import type { Metadata } from "next";
import Link from "next/link";
import { getMatterWorkspace } from "@/lib/matters/getMatterWorkspace";
import MatterSummaryPanel from "@/components/matters/MatterSummaryPanel";
import MatterDraftLauncher from "@/components/matters/MatterDraftLauncher";
import MatterFilesPanel from "@/components/matters/MatterFilesPanel";
import MatterWorkflowTable from "@/components/matters/MatterWorkflowTable";
import MatterQualityPanel from "@/components/matters/MatterQualityPanel";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Matter ${id.slice(0, 8)} — LexOrchestrator` };
}

function SectionTitle({ n, children }: { n: string; children: string }) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#404040", letterSpacing: "0.2em" }}>
        § {n}
      </span>
      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#737373", letterSpacing: "0.24em", textTransform: "uppercase" }}>
        {children}
      </span>
    </div>
  );
}

export default async function MatterWorkspacePage({ params }: Props) {
  const { id } = await params;
  const workspace = await getMatterWorkspace(id);

  return (
    <div className="pt-10 pb-32 appear">

      {/* Breadcrumb */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-3">
        <Link
          href="/matters"
          style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#404040", letterSpacing: "0.16em", textTransform: "uppercase" }}
          className="transition-colors hover:text-white"
        >
          &larr; Matters
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/observability"
            style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#404040", letterSpacing: "0.14em", textTransform: "uppercase" }}
            className="transition-colors hover:text-white"
          >
            Observe &rarr;
          </Link>
        </div>
      </div>

      {workspace === null ? (
        <div className="py-24 text-center">
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#737373" }}>
            {process.env.NEXT_PUBLIC_SUPABASE_URL
              ? "Matter not found."
              : "Database not configured. Matter workspaces require Supabase."}
          </p>
          <p className="mt-2" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#404040" }}>
            Matter ID: {id}
          </p>
        </div>
      ) : (
        <>
          {/* Page header */}
          <div className="mb-8">
            <p className="label mb-2" style={{ letterSpacing: "0.28em" }}>Matter Workspace</p>
          </div>

          <div className="space-y-12">

            {/* § 01 Matter Summary */}
            <section>
              <SectionTitle n="01">Matter Summary</SectionTitle>
              <MatterSummaryPanel matter={workspace.matter} />
            </section>

            {/* § 02 Start Draft Workflow */}
            <section>
              <SectionTitle n="02">Start Draft Workflow</SectionTitle>
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem", maxWidth: "48rem" }}>
                <MatterDraftLauncher matter={workspace.matter} />
              </div>
            </section>

            {/* § 03 Matter Files */}
            <section>
              <SectionTitle n="03">Matter Files</SectionTitle>
              <MatterFilesPanel matterId={id} initialFiles={workspace.files} />
            </section>

            {/* § 04 Drafts and Workflows */}
            <section>
              <SectionTitle n="04">Drafts and Workflows</SectionTitle>
              <MatterWorkflowTable workflows={workspace.workflows} />
            </section>

            {/* § 05 Recent Quality Signals */}
            <section>
              <SectionTitle n="05">Recent Quality Signals</SectionTitle>
              <MatterQualityPanel signals={workspace.qualitySignals} />
            </section>

            {/* § 06 Notes */}
            {workspace.matter.description && (
              <section>
                <SectionTitle n="06">Notes</SectionTitle>
                <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem" }}>
                  <p style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "14px", color: "#737373", lineHeight: 1.75, maxWidth: "52rem" }}>
                    {workspace.matter.description}
                  </p>
                </div>
              </section>
            )}

          </div>
        </>
      )}

    </div>
  );
}
