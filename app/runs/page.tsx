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
    <div className="pt-14 appear">

      {/* Header */}
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <p className="label mb-2" style={{ letterSpacing: "0.28em" }}>
            Archive
          </p>
          <h1
            className="text-3xl font-semibold tracking-tight text-[#f4f4f4]"
            style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
          >
            Research History
          </h1>
        </div>
        <Link
          href="/research"
          className="text-xs font-bold uppercase tracking-[0.2em] transition-colors hover:text-white"
          style={{ fontFamily: "var(--font-mono), monospace", color: "#737373" }}
        >
          New Research
        </Link>
      </div>

      <div className="rule mb-0" />

      {runs.length === 0 ? (
        <div className="py-24 text-center">
          <p
            className="text-sm text-[#737373]"
            style={{ fontFamily: "var(--font-mono), monospace" }}
          >
            {process.env.NEXT_PUBLIC_SUPABASE_URL
              ? "No runs recorded yet."
              : "Database not configured. Configure Supabase to persist runs."}
          </p>
          <Link
            href="/research"
            className="mt-6 inline-block text-xs font-bold uppercase tracking-[0.2em] text-[#f4f4f4] transition hover:text-white"
            style={{ fontFamily: "var(--font-mono), monospace" }}
          >
            Begin Research
          </Link>
        </div>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <th className="py-3 pr-6 text-left">
                <span className="label">Date</span>
              </th>
              <th className="py-3 pr-6 text-left">
                <span className="label">Query</span>
              </th>
              <th className="hidden py-3 pr-6 text-right md:table-cell">
                <span className="label">Confidence</span>
              </th>
              <th className="hidden py-3 pr-6 text-center lg:table-cell">
                <span className="label">Risk</span>
              </th>
              <th className="py-3 text-center">
                <span className="label">Status</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
            {runs.map((run) => (
              <RunCard key={run.id} {...run} />
            ))}
          </tbody>
        </table>
      )}

    </div>
  );
}
