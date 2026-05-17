import type { Metadata } from "next";
import Link from "next/link";
import { listWorkflowRuns } from "@/lib/litigation/listWorkflowRuns";
import WorkflowRunTable from "@/components/workflows/WorkflowRunTable";
import DemoWorkflowLauncher from "@/components/workflows/DemoWorkflowLauncher";

export const metadata: Metadata = {
  title: "Workflows — LexOrchestrator",
};

export const dynamic = "force-dynamic";

export default async function WorkflowsPage() {
  const runs = await listWorkflowRuns(50);

  return (
    <div className="pt-14 appear">

      {/* Header */}
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <p className="label mb-2" style={{ letterSpacing: "0.28em" }}>
            Litigation
          </p>
          <h1
            className="text-3xl font-semibold tracking-tight text-[#f4f4f4]"
            style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
          >
            Workflow Runs
          </h1>
          <p
            className="mt-2 text-xs text-[#737373]"
            style={{ fontFamily: "var(--font-mono), monospace" }}
          >
            Eight-agent litigation pipeline. Intake, retrieval, drafting, citation
            verification, adversarial review, local rules, judge brief, and eval.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/observability"
            style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#404040", letterSpacing: "0.14em", textTransform: "uppercase" }}
            className="transition-colors hover:text-white"
          >
            Observe &rarr;
          </Link>
          <DemoWorkflowLauncher />
        </div>
      </div>

      <div className="rule mb-0" />

      {runs.length === 0 ? (
        <div className="py-24 text-center">
          <p
            className="text-sm text-[#737373]"
            style={{ fontFamily: "var(--font-mono), monospace" }}
          >
            {process.env.NEXT_PUBLIC_SUPABASE_URL
              ? "No workflow runs recorded yet."
              : "Database not configured. Run a demo workflow to see results here."}
          </p>
          <p
            className="mt-3 text-xs text-[#404040]"
            style={{ fontFamily: "var(--font-mono), monospace" }}
          >
            Use the Run Demo Workflow button above to launch a test run.
          </p>
        </div>
      ) : (
        <WorkflowRunTable runs={runs} />
      )}

    </div>
  );
}
