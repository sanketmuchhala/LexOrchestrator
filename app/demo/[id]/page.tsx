import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { STATIC_DEMO_RUNS } from "@/lib/demo/staticDemoRuns";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const run = STATIC_DEMO_RUNS.find((r) => r.id === id);
  if (!run) return { title: "Demo — LexOrchestrator" };
  return { title: `Demo: ${run.motionType.replace(/_/g, " ")} — LexOrchestrator` };
}

export function generateStaticParams() {
  return STATIC_DEMO_RUNS.map((r) => ({ id: r.id }));
}

function SectionTitle({ n, label }: { n: string; label: string }) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", letterSpacing: "0.2em" }}>
        § {n}
      </span>
      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-2)", letterSpacing: "0.24em", textTransform: "uppercase" }}>
        {label}
      </span>
    </div>
  );
}

function DraftBlock({ text }: { text: string }) {
  const lines = text.split("\n\n").filter(Boolean);
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1.5rem" }}>
      {lines.map((block, i) => {
        const trimmed = block.trim();
        const isAllCaps = trimmed === trimmed.toUpperCase() && trimmed.length < 100;
        const isRoman = /^(I{1,3}|IV|V|VI{0,3}|IX|X)\./.test(trimmed);
        if (isAllCaps || isRoman) {
          return (
            <div key={i} style={{ marginBottom: "1rem" }}>
              {i > 0 && <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginBottom: "1rem" }} />}
              <p style={{ fontFamily: "var(--font-mono), monospace", fontSize: "11px", fontWeight: 700, color: "var(--text-2)", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                {trimmed}
              </p>
            </div>
          );
        }
        return (
          <p key={i} style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "14px", lineHeight: "1.85", color: "var(--text-1)", marginBottom: "1rem" }}>
            {trimmed}
          </p>
        );
      })}
    </div>
  );
}

function PreformattedPanel({ text, color }: { text: string; color?: string }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1.25rem" }}>
      <pre style={{ fontFamily: "var(--font-mono), monospace", fontSize: "11px", lineHeight: "1.7", color: color ?? "var(--text-2)", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>
        {text}
      </pre>
    </div>
  );
}

export default async function DemoRunPage({ params }: Props) {
  const { id } = await params;
  const run = STATIC_DEMO_RUNS.find((r) => r.id === id);
  if (!run) notFound();

  const passRate = run.citationSummary.total > 0
    ? Math.round((run.citationSummary.verified / run.citationSummary.total) * 100)
    : 0;

  return (
    <div className="appear pt-10 pb-32">

      {/* Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <Link href="/demo" style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-3)", letterSpacing: "0.16em", textTransform: "uppercase" }}
          className="transition-opacity hover:opacity-70">
          &larr; All Demos
        </Link>
        <div className="flex items-center gap-3">
          <span className="badge badge-neutral" style={{ fontSize: "9px" }}>READ-ONLY DEMO</span>
          <Link href="/login" style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-2)", letterSpacing: "0.14em", textTransform: "uppercase" }}
            className="transition-opacity hover:opacity-70">
            Login to run your own &rarr;
          </Link>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <p className="label mb-3" style={{ letterSpacing: "0.28em" }}>Demo Workspace</p>
        <h1 style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)", fontWeight: 500, lineHeight: 1.5, color: "var(--text-1)", maxWidth: "52rem", marginBottom: "1rem" }}>
          {run.title}
        </h1>

        {/* Meta strip */}
        <div className="flex flex-wrap items-center gap-4 mt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem" }}>
          <div>
            <p className="label mb-1">Motion Type</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-1)" }}>{run.motionType.replace(/_/g, " ")}</p>
          </div>
          <div>
            <p className="label mb-1">Jurisdiction</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-1)" }}>{run.court}</p>
          </div>
          <div>
            <p className="label mb-1">Confidence</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 700, color: run.confidence >= 0.75 ? "var(--emerald)" : run.confidence >= 0.55 ? "var(--amber)" : "var(--red)" }}>
              {Math.round(run.confidence * 100)}%
            </p>
          </div>
          <div>
            <p className="label mb-1">Status</p>
            <span className="badge badge-pass">Completed</span>
          </div>
          <div>
            <p className="label mb-1">Citations</p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-2)" }}>
              {run.citationSummary.verified}/{run.citationSummary.total} verified ({passRate}%)
            </p>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="gap-6" style={{ display: "grid", gridTemplateColumns: "1fr 22rem", alignItems: "start" }}>

        {/* Left */}
        <div className="space-y-8 min-w-0">
          <section>
            <SectionTitle n="02" label="Motion Draft" />
            <DraftBlock text={run.draft} />
          </section>

          <section>
            <SectionTitle n="05" label="Authority Retrieved" />
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-3)" }}>
              Citations verified against indexed corpus. See Verification Inspector.
            </p>
          </section>
        </div>

        {/* Right */}
        <div className="space-y-6" style={{ minWidth: 0 }}>

          <section>
            <SectionTitle n="03" label="Verification Inspector" />
            <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1rem" }}>
              <div className="flex items-center gap-4 mb-3">
                <div>
                  <p className="label mb-1">Verified</p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "16px", fontWeight: 700, color: "var(--emerald)" }}>{run.citationSummary.verified}</p>
                </div>
                <div>
                  <p className="label mb-1">Failed</p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "16px", fontWeight: 700, color: "var(--red)" }}>{run.citationSummary.failed}</p>
                </div>
                <div>
                  <p className="label mb-1">Total</p>
                  <p style={{ fontFamily: "var(--font-mono)", fontSize: "16px", fontWeight: 700, color: "var(--text-1)" }}>{run.citationSummary.total}</p>
                </div>
              </div>
              <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)" }}>
                Demo corpus. Not all citations may be indexed.
              </p>
            </div>
          </section>

          <section>
            <SectionTitle n="04b" label="Judge Brief" />
            <PreformattedPanel text={run.judgeNotes} />
          </section>

          <section>
            <SectionTitle n="05" label="Adversarial Review" />
            <PreformattedPanel text={run.adversarial} color="var(--text-2)" />
          </section>

          <section>
            <SectionTitle n="06" label="Local Rules Notes" />
            <PreformattedPanel text={run.localRules} />
          </section>

          <section>
            <SectionTitle n="07" label="Eval Summary" />
            <PreformattedPanel text={run.evalSummary} color="var(--text-2)" />
          </section>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-16 rule pt-8 text-center">
        <p style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "1.1rem", fontWeight: 500, color: "var(--text-1)", marginBottom: "1rem" }}>
          Ready to run your own workflow?
        </p>
        <Link href="/login" className="inline-block px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-opacity hover:opacity-80"
          style={{ fontFamily: "var(--font-mono)", background: "var(--text-1)", color: "#000" }}>
          Login to Start
        </Link>
      </div>

    </div>
  );
}
