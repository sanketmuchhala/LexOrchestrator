import type { Metadata } from "next";
import Link from "next/link";
import { getRecentRuns } from "@/lib/db/supabaseServer";
import RunCard from "@/components/runs/RunCard";

export const metadata: Metadata = {
  title: "Research History - LexOrchestrator",
};

export const dynamic = "force-dynamic";

export default async function RunsPage() {
  const runs = await getRecentRuns(50);

  return (
    <div className="pt-10">

      {/* Page header */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
            Orchestration Runs
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold text-slate-100">Research History</h1>
          <p className="mt-1 text-sm text-slate-500">
            {runs.length > 0
              ? `${runs.length} saved run${runs.length === 1 ? "" : "s"} - click any to view the full analysis.`
              : "No runs recorded yet. Start with a query."}
          </p>
        </div>
        <Link
          href="/research"
          className="rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
        >
          New Research →
        </Link>
      </div>

      {/* Run list */}
      {runs.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {runs.map((run) => (
            <RunCard key={run.id} {...run} />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 py-16 text-center">
          <p className="mb-1 text-sm font-semibold text-slate-400">No runs yet</p>
          <p className="mb-6 text-sm text-slate-600">
            {process.env.NEXT_PUBLIC_SUPABASE_URL
              ? "Run a query to start building history."
              : "Database not configured - runs will not be persisted."}
          </p>
          <Link
            href="/research"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
          >
            Start Research →
          </Link>
        </div>
      )}

    </div>
  );
}
