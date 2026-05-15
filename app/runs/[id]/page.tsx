import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRunById } from "@/lib/db/supabaseServer";
import RunDetailView from "@/components/runs/RunDetailView";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Analysis ${id.slice(0, 8)} - LexOrchestrator` };
}

export default async function RunDetailPage({ params }: Props) {
  const { id } = await params;
  const detail = await getRunById(id);

  if (!detail) notFound();

  const { run } = detail;

  const statusColor =
    run.status === "completed"
      ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/5"
      : run.status === "error"
      ? "text-red-400 border-red-400/30 bg-red-400/5"
      : "text-zinc-400 border-zinc-700 bg-black";

  return (
    <div className="pt-8 pb-20">

      {/* Nav breadcrumb */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href="/runs"
          className="font-mono text-[11px] text-zinc-600 transition hover:text-zinc-300"
        >
          &larr; All Runs
        </Link>
        <Link
          href="/research"
          className="rounded border border-white/10 bg-white px-4 py-1.5 font-mono text-[11px] font-bold text-black transition hover:bg-zinc-100"
        >
          NEW RESEARCH
        </Link>
      </div>

      {/* Query header */}
      <div className="mb-6 rounded-xl border border-white/8 bg-black p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
              Research Query
            </p>
            <p className="mt-2 font-mono text-sm leading-6 text-zinc-100">{run.query}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <span className="rounded border border-white/8 px-2.5 py-1 font-mono text-[10px] text-zinc-600">
              {run.id.slice(0, 12)}
            </span>
            {run.model && (
              <span className="rounded border border-white/8 px-2.5 py-1 font-mono text-[10px] text-zinc-600">
                {run.model}
              </span>
            )}
            <span className={`rounded border px-2.5 py-1 font-mono text-[10px] font-bold uppercase ${statusColor}`}>
              {run.status}
            </span>
          </div>
        </div>
      </div>

      {/* Full analysis */}
      <RunDetailView detail={detail} />

    </div>
  );
}
