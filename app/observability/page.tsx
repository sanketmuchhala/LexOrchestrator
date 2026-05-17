import type { Metadata } from "next";
import Link from "next/link";
import { getObservabilityDashboardStats } from "@/lib/observability/getObservabilityDashboardStats";
import ObservabilityOverviewCards from "@/components/observability/ObservabilityOverviewCards";
import RecentWorkflowPerformanceTable from "@/components/observability/RecentWorkflowPerformanceTable";
import AgentPerformanceTable from "@/components/observability/AgentPerformanceTable";
import ObservabilityHotspots from "@/components/observability/ObservabilityHotspots";
import ObservabilityNotes from "@/components/observability/ObservabilityNotes";

export const metadata: Metadata = {
  title: "Observability — LexOrchestrator",
};

export const dynamic = "force-dynamic";

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

export default async function ObservabilityPage() {
  const stats = await getObservabilityDashboardStats(50);

  return (
    <div className="pt-10 pb-32 appear">

      {/* Header */}
      <div className="mb-10 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="label mb-2" style={{ letterSpacing: "0.28em" }}>Observability</p>
          <h1
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)",
              fontWeight: 500,
              color: "var(--text-1)",
              lineHeight: 1.4,
            }}
          >
            Workflow Performance Dashboard
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/workflows"
            style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", letterSpacing: "0.14em", textTransform: "uppercase" }}
            className="transition-colors hover:text-black"
          >
            Workflows &rarr;
          </Link>
          <Link
            href="/evals"
            style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", letterSpacing: "0.14em", textTransform: "uppercase" }}
            className="transition-colors hover:text-black"
          >
            Evals &rarr;
          </Link>
        </div>
      </div>

      {stats.totalWorkflows === 0 && (
        <div className="py-24 text-center">
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-2)" }}>
            {process.env.NEXT_PUBLIC_SUPABASE_URL
              ? "No workflow runs found. Run a draft workflow to begin collecting metrics."
              : "Database not configured. Observability metrics require Supabase."}
          </p>
        </div>
      )}

      {stats.totalWorkflows > 0 && (
        <div className="space-y-12">

          {/* § 01 Workflow Performance */}
          <section>
            <SectionTitle n="01">Workflow Performance</SectionTitle>
            <ObservabilityOverviewCards stats={stats} />
          </section>

          {/* § 02 Recent Workflows */}
          <section>
            <SectionTitle n="02">Recent Workflows</SectionTitle>
            <RecentWorkflowPerformanceTable workflows={stats.recentWorkflows} />
          </section>

          {/* § 03 Agent Breakdown */}
          <section>
            <SectionTitle n="03">Agent Breakdown</SectionTitle>
            <AgentPerformanceTable agents={stats.agentBreakdown} />
          </section>

          {/* § 04 Hotspots */}
          <section>
            <SectionTitle n="04">Hotspots</SectionTitle>
            <ObservabilityHotspots stats={stats} />
          </section>

          {/* § 05 Notes */}
          <section>
            <SectionTitle n="05">Notes</SectionTitle>
            <ObservabilityNotes />
          </section>

        </div>
      )}

    </div>
  );
}
