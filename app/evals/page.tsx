import type { Metadata } from "next";
import Link from "next/link";
import { getEvalDashboardStats } from "@/lib/litigation/evals/getEvalDashboardStats";
import EvalOverviewCards from "@/components/evals/EvalOverviewCards";
import RecentEvalTable from "@/components/evals/RecentEvalTable";

export const metadata: Metadata = {
  title: "Evals — LexOrchestrator",
};

export const dynamic = "force-dynamic";

function SectionTitle({ n, children }: { n: string; children: string }) {
  return (
    <div className="mb-6 flex items-center gap-4">
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#404040", letterSpacing: "0.2em" }}>
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

export default async function EvalsPage() {
  const stats = await getEvalDashboardStats(50);

  return (
    <div className="pt-14 pb-24 appear">

      <div className="mb-8">
        <p className="label mb-2" style={{ letterSpacing: "0.28em" }}>
          Quality Metrics
        </p>
        <h1
          className="text-3xl font-semibold tracking-tight text-[#f4f4f4]"
          style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
        >
          Workflow Evals
        </h1>
        <p
          className="mt-2 text-xs text-[#737373]"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          Internal quality signals across completed litigation workflow runs.
          Not a claim of legal accuracy or compliance.
        </p>
        <div style={{ marginTop: "0.75rem" }}>
          <Link
            href="/observability"
            style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#404040", letterSpacing: "0.14em", textTransform: "uppercase" }}
            className="transition-colors hover:text-white"
          >
            Performance Observability &rarr;
          </Link>
        </div>
      </div>

      <div className="rule mb-10" />

      <div className="space-y-12">

        {/* § 01 Quality Overview */}
        <section>
          <SectionTitle n="01">Quality Overview</SectionTitle>
          {stats.totalWorkflows === 0 ? (
            <div className="py-12 text-center">
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "#737373" }}>
                {process.env.NEXT_PUBLIC_SUPABASE_URL
                  ? "No workflow runs recorded yet."
                  : "Database not configured. Run a workflow via /draft to generate eval data."}
              </p>
            </div>
          ) : (
            <EvalOverviewCards stats={stats} />
          )}
        </section>

        {/* § 02 Recent Workflow Evals */}
        <section>
          <SectionTitle n="02">Recent Workflow Evals</SectionTitle>
          <RecentEvalTable runs={stats.recentEvals} />
        </section>

        {/* § 03 Reliability Notes */}
        <section>
          <SectionTitle n="03">Reliability Notes</SectionTitle>
          <div
            className="space-y-3 px-5 py-4"
            style={{ border: "1px solid rgba(255,255,255,0.06)", background: "#0a0a0a" }}
          >
            {[
              "Scores shown here are internal quality signals derived from workflow outputs. They are not independent legal assessments.",
              "Citation pass rate depends on the size and coverage of the indexed opinion corpus. A low pass rate may reflect corpus gaps, not citation errors.",
              "Local rules review is drafting guidance only. It does not constitute a compliance certification for any court.",
              "Judge Brief guidance is argument preparation only. It does not predict judicial outcome or behavior.",
              "Retrieval coverage is estimated from citation count in the draft artifact, not from ground-truth retrieval recall.",
              "Faithfulness score reflects the proportion of grounded citations relative to total citations detected. It does not verify the legal accuracy of the analysis.",
            ].map((note, i) => (
              <p
                key={i}
                style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "14px",
                  lineHeight: "1.75",
                  color: "#737373",
                }}
              >
                {note}
              </p>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
