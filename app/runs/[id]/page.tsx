import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRunById } from "@/lib/db/supabaseServer";
import RunDetailView from "@/components/runs/RunDetailView";
import { relativeTime } from "@/lib/utils/display";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Run ${id.slice(0, 8)} - LexOrchestrator`,
  };
}

export default async function RunDetailPage({ params }: Props) {
  const { id } = await params;
  const detail = await getRunById(id);

  if (!detail) notFound();

  const { run } = detail;

  return (
    <div className="pt-10">

      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/runs"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-300"
        >
          <span>←</span>
          <span>Research History</span>
        </Link>
      </div>

      {/* Run metadata bar */}
      <div className="mb-8 rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-600">
              {relativeTime(run.created_at)}
            </p>
            <p className="mt-2 text-base leading-6 text-slate-200">{run.query}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded border border-slate-700 px-2.5 py-1 font-mono text-[11px] text-slate-500">
              {run.id.slice(0, 12)}…
            </span>
            {run.model && (
              <span className="rounded border border-slate-700 px-2.5 py-1 font-mono text-[11px] text-slate-500">
                {run.model}
              </span>
            )}
            <span className={`rounded border px-2.5 py-1 font-mono text-[11px] font-semibold uppercase ${
              run.status === "completed" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : run.status === "error" ? "border-rose-500/30 bg-rose-500/10 text-rose-300"
              : "border-slate-700 bg-slate-800 text-slate-400"
            }`}>
              {run.status}
            </span>
          </div>
        </div>
      </div>

      {/* Full analysis */}
      <RunDetailView detail={detail} />

      {/* Footer actions */}
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/research"
          className="rounded-lg bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200"
        >
          New Research →
        </Link>
        <Link
          href="/runs"
          className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 hover:text-slate-100"
        >
          ← All Runs
        </Link>
      </div>

    </div>
  );
}
