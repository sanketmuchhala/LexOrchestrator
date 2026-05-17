import type { Metadata } from "next";
import Link from "next/link";
import { listMatters } from "@/lib/matters/listMatters";
import MatterListTable from "@/components/matters/MatterListTable";

export const metadata: Metadata = {
  title: "Matters — LexOrchestrator",
};

export const dynamic = "force-dynamic";

export default async function MattersPage() {
  const matters = await listMatters(50);

  return (
    <div className="pt-14 appear">

      <div className="mb-8 flex items-end justify-between gap-6 flex-wrap">
        <div>
          <p className="label mb-2" style={{ letterSpacing: "0.28em" }}>Workspaces</p>
          <h1
            className="text-3xl font-semibold tracking-tight text-[var(--text-1)]"
            style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
          >
            Matters
          </h1>
          <p
            className="mt-2 text-xs text-[var(--text-2)]"
            style={{ fontFamily: "var(--font-mono), monospace" }}
          >
            Group workflow runs, drafts, uploads, and evaluations under a single matter workspace.
          </p>
        </div>
        <Link
          href="/matters/new"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            padding: "0.5rem 1.25rem",
            background: "var(--text-1)",
            color: "#000000",
            textDecoration: "none",
          }}
          className="transition-opacity hover:opacity-80"
        >
          New Matter
        </Link>
      </div>

      <div className="rule mb-8" />

      {matters.length === 0 && !process.env.NEXT_PUBLIC_SUPABASE_URL ? (
        <div className="py-24 text-center">
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-2)" }}>
            Database not configured. Matters require Supabase to persist.
          </p>
          <p className="mt-2" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-3)" }}>
            Create a matter to verify the form works in demo mode, but it will not persist.
          </p>
        </div>
      ) : (
        <MatterListTable matters={matters} />
      )}

    </div>
  );
}
