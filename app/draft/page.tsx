import type { Metadata } from "next";
import Link from "next/link";
import DraftLauncherForm from "@/components/draft/DraftLauncherForm";

export const metadata: Metadata = {
  title: "Draft — LexOrchestrator",
};

export default function DraftPage() {
  return (
    <div className="pt-14 appear">

      <div className="mb-8">
        <p className="label mb-2" style={{ letterSpacing: "0.28em" }}>
          Motion Drafting
        </p>
        <h1
          className="text-3xl font-semibold tracking-tight text-[var(--text-1)]"
          style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
        >
          New Draft Workflow
        </h1>
        <p
          className="mt-2 text-xs text-[var(--text-2)]"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          Provide facts and motion parameters. Eight agents will retrieve authority, draft a
          motion outline, verify citations, and produce an adversarial review.
        </p>
      </div>

      <div className="rule mb-8" />

      <div style={{ maxWidth: "48rem" }}>
        <DraftLauncherForm />
      </div>

      <div
        className="mt-12 pt-8"
        style={{ borderTop: "1px solid rgba(0,0,0,0.05)" }}
      >
        <p className="label mb-4">Recent Drafts</p>
        <Link
          href="/workflows"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--text-2)",
            letterSpacing: "0.14em",
          }}
          className="transition-colors hover:text-black"
        >
          View all workflow runs &rarr;
        </Link>
      </div>

    </div>
  );
}
