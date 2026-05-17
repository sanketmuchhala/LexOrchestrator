import type { Metadata } from "next";
import Link from "next/link";
import { STATIC_DEMO_RUNS } from "@/lib/demo/staticDemoRuns";

export const metadata: Metadata = {
  title: "Demo Workflows — LexOrchestrator",
};

export default function DemoIndexPage() {
  return (
    <div className="appear pt-10 pb-24">

      <div className="mb-8">
        <p className="label mb-3">Demo Mode</p>
        <h1
          className="text-[clamp(1.4rem,3vw,2rem)] font-semibold"
          style={{ fontFamily: "var(--font-serif), Georgia, serif", color: "var(--text-1)" }}
        >
          Pre-run Workflow Demos
        </h1>
        <p
          className="mt-2 text-sm leading-6 max-w-xl"
          style={{ fontFamily: "var(--font-mono)", color: "var(--text-2)" }}
        >
          These demos show full pipeline outputs run in advance — motion draft, adversarial review,
          local rules check, judge brief, citation verification, and eval scoring.
          No API calls required to view them.
        </p>
      </div>

      <div className="rule mb-8" />

      <div className="grid gap-px sm:grid-cols-2" style={{ background: "rgba(255,255,255,0.06)" }}>
        {STATIC_DEMO_RUNS.map((run) => (
          <Link
            key={run.id}
            href={`/demo/${run.id}`}
            className="block px-6 py-6 card-hover group"
            style={{ background: "var(--bg)" }}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="badge badge-neutral" style={{ fontSize: "9px" }}>
                {run.motionType.replace(/_/g, " ")}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "13px",
                  fontWeight: 700,
                  color: run.confidence >= 0.75 ? "var(--emerald)" : run.confidence >= 0.55 ? "var(--amber)" : "var(--red)",
                }}
              >
                {Math.round(run.confidence * 100)}%
              </span>
            </div>
            <p
              className="mb-2 text-sm leading-6"
              style={{ fontFamily: "var(--font-serif), Georgia, serif", color: "var(--text-1)" }}
            >
              {run.title}
            </p>
            <p
              style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)" }}
            >
              {run.court} &middot; {run.citationSummary.verified}/{run.citationSummary.total} citations verified
            </p>
            <p
              className="mt-4 text-[10px] font-bold uppercase tracking-[0.18em] transition-opacity group-hover:opacity-70"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-2)" }}
            >
              View demo &rarr;
            </p>
          </Link>
        ))}
      </div>

      <div className="rule mt-8 pt-8">
        <p
          className="text-center text-sm"
          style={{ fontFamily: "var(--font-serif), Georgia, serif", color: "var(--text-2)" }}
        >
          Want to run your own workflow?{" "}
          <Link href="/login" className="transition-opacity hover:opacity-70" style={{ color: "var(--text-1)", textDecoration: "underline" }}>
            Login
          </Link>
          {" "}for full access.
        </p>
      </div>

    </div>
  );
}
