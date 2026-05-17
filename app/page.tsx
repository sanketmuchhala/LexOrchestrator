import Link from "next/link";

const AGENTS = [
  {
    n: "01",
    name: "IntakeAgent",
    role: "Request Classification",
    desc: "Classifies motion type, extracts jurisdiction, identifies key legal issues, and flags missing inputs before the pipeline begins.",
    consumes: "Raw query + facts",
    produces: "Normalized intake record",
  },
  {
    n: "02",
    name: "RetrievalAgent",
    role: "Hybrid RAG",
    desc: "Runs parallel pgvector cosine search and BM25-style keyword retrieval over indexed court opinions, then fuses and re-ranks results by authority weight.",
    consumes: "Legal issues + jurisdiction",
    produces: "Ranked opinion chunks",
  },
  {
    n: "03",
    name: "DraftingAgent",
    role: "Motion Generation",
    desc: "Generates a full motion draft grounded in retrieved authority. Produces structured sections with inline citations and optional uploaded case material.",
    consumes: "Ranked chunks + facts",
    produces: "Cited motion draft",
  },
  {
    n: "04",
    name: "CitationAgent",
    role: "Verification",
    desc: "Extracts every citation from the draft and verifies each against the indexed corpus: existence, pin cite, quote accuracy, and proposition support.",
    consumes: "Draft text",
    produces: "Citation verification report",
  },
  {
    n: "05",
    name: "AdversarialAgent",
    role: "Red-Team Critique",
    desc: "Simulates opposing counsel. Identifies the strongest counterarguments, flags unsupported claims, and produces a structured rebuttal brief.",
    consumes: "Draft + citations",
    produces: "Red-team memo",
  },
  {
    n: "06",
    name: "LocalRulesAgent",
    role: "Rules Compliance",
    desc: "Checks the draft section-by-section against SDNY, Federal, and New York State local rules profiles: formatting, required sections, citation format.",
    consumes: "Draft + jurisdiction",
    produces: "Rules compliance report",
  },
  {
    n: "07",
    name: "JudgeBriefAgent",
    role: "Judge Intelligence",
    desc: "Looks up the assigned judge in cached opinion-derived profiles. Surfaces citation preferences, argument style notes, and motion-type-specific guidance.",
    consumes: "Judge name / ID",
    produces: "Judge brief",
  },
  {
    n: "08",
    name: "EvalAgent",
    role: "Quality Scoring",
    desc: "Computes a weighted confidence score across faithfulness, citation pass rate, retrieval coverage, local rules completeness, adversarial safety, and judge alignment.",
    consumes: "All agent outputs",
    produces: "Confidence score + pass/fail",
  },
];

const FEATURES = [
  {
    title: "Matter Workspaces",
    desc: "Organize drafts, uploads, and workflow runs by client matter. Full audit trail per case.",
    href: "/matters",
    stat: "Multi-matter",
  },
  {
    title: "Draft + Export",
    desc: "Editable motion editor with version history and one-click export to PDF, DOCX, or TXT.",
    href: "/draft",
    stat: "PDF / DOCX / TXT",
  },
  {
    title: "Citation Verification",
    desc: "Every citation verified against the indexed corpus: existence, pin cite, quote match, proposition support.",
    href: "/draft",
    stat: "Per-citation status",
  },
  {
    title: "Trace Debugger",
    desc: "Full agent event log. Every decision, tool call, and token count inspectable. Live polling while running.",
    href: "/traces",
    stat: "Full observability",
  },
  {
    title: "Observability Dashboard",
    desc: "Latency trends, token usage, pass/fail rates, and agent performance heatmaps across all runs.",
    href: "/observability",
    stat: "Run-level metrics",
  },
  {
    title: "Eval Scoring",
    desc: "Weighted confidence across six dimensions. Internal quality signal.",
    href: "/evals",
    stat: "6-dimension eval",
  },
];

const STATS = [
  { value: "8", label: "Specialist Agents", sub: "Sequential pipeline" },
  { value: "Hybrid RAG", label: "Retrieval", sub: "pgvector + keyword" },
  { value: "Full Trace", label: "Observability", sub: "Every decision inspectable" },
];

export default function LandingPage() {
  return (
    <div className="appear">

      {/* ── Hero ── */}
      <section className="relative pt-24 pb-20 flex flex-col items-center text-center">

        {/* Orb container */}
        <div
          className="relative mb-12 flex items-center justify-center"
          style={{ width: 180, height: 180 }}
        >
          <div
            className="agent-orb"
            style={{ width: 120, height: 120 }}
            aria-hidden="true"
          />
          <div
            className="agent-orb-ring"
            style={{ inset: "-22px", animationDelay: "0s" }}
            aria-hidden="true"
          />
          <div
            className="agent-orb-ring"
            style={{ inset: "-22px", animationDelay: "0.65s" }}
            aria-hidden="true"
          />
          <div
            className="agent-orb-ring"
            style={{ inset: "-22px", animationDelay: "1.3s" }}
            aria-hidden="true"
          />
        </div>

        {/* Heading */}
        <h1
          className="text-[clamp(3.5rem,9vw,7rem)] font-semibold leading-[0.92] tracking-tight"
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            color: "var(--text-1)",
          }}
        >
          LexOrchestrator
        </h1>

        {/* Tagline */}
        <p
          className="mt-5 text-sm uppercase tracking-[0.28em]"
          style={{
            fontFamily: "var(--font-mono), monospace",
            color: "var(--text-2)",
          }}
        >
          Eight specialist agents. One litigation workflow.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/draft"
            className="inline-block px-8 py-3 text-xs font-bold uppercase tracking-[0.18em] transition-opacity hover:opacity-80"
            style={{
              fontFamily: "var(--font-mono), monospace",
              background: "var(--text-1)",
              color: "#000000",
            }}
          >
            Start a Draft
          </Link>
          <Link
            href="/demo"
            className="inline-block px-8 py-3 text-xs font-bold uppercase tracking-[0.18em] transition-opacity hover:opacity-70"
            style={{
              fontFamily: "var(--font-mono), monospace",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "var(--text-2)",
            }}
          >
            View Demos
          </Link>
        </div>

        {/* Dot-grid background */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            zIndex: -1,
            backgroundImage: "radial-gradient(rgba(0,0,0,0.055) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            maskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 100%)",
          }}
        />
      </section>

      <div className="rule" />

      {/* ── Stats strip ── */}
      <section className="grid grid-cols-3 gap-px" style={{ background: "rgba(0,0,0,0.07)" }}>
        {STATS.map(({ value, label, sub }) => (
          <div key={label} className="px-8 py-8" style={{ background: "var(--bg)" }}>
            <p
              className="text-2xl font-semibold"
              style={{ fontFamily: "var(--font-serif), Georgia, serif", color: "var(--text-1)" }}
            >
              {value}
            </p>
            <p
              className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em]"
              style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-2)" }}
            >
              {label}
            </p>
            <p
              className="mt-1 text-[10px]"
              style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-3)" }}
            >
              {sub}
            </p>
          </div>
        ))}
      </section>

      <div className="rule" />

      {/* ── Eight agents ── */}
      <section className="py-20">
        <div className="mb-12">
          <p className="label mb-3">How it works</p>
          <p
            className="text-[clamp(1.4rem,3vw,2rem)] font-semibold leading-tight"
            style={{ fontFamily: "var(--font-serif), Georgia, serif", color: "var(--text-1)" }}
          >
            Eight agents. Sequential pipeline.<br />Every step inspectable.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-px" style={{ background: "rgba(0,0,0,0.07)" }}>
          {AGENTS.map(({ n, name, role, desc, consumes, produces }, i) => (
            <div
              key={n}
              className={`px-7 py-7 appear-${Math.min(Math.floor(i / 2) + 1, 5)}`}
              style={{ background: "var(--bg)" }}
            >
              <div className="flex items-start gap-4">
                <span
                  className="shrink-0 text-[11px] font-bold tabular-nums"
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    color: "var(--text-3)",
                    paddingTop: "3px",
                    minWidth: "1.75rem",
                  }}
                >
                  {n}
                </span>
                <div style={{ flex: 1 }}>
                  <div className="flex flex-wrap items-baseline gap-2 mb-2">
                    <p
                      className="text-[13px] font-bold"
                      style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-1)" }}
                    >
                      {name}
                    </p>
                    <span className="badge badge-neutral" style={{ fontSize: "9px" }}>
                      {role}
                    </span>
                  </div>
                  <p
                    className="text-sm leading-6 mb-4"
                    style={{ fontFamily: "var(--font-serif), Georgia, serif", color: "var(--text-2)" }}
                  >
                    {desc}
                  </p>
                  <div className="grid grid-cols-2 gap-3" style={{ borderTop: "1px solid rgba(0,0,0,0.07)", paddingTop: "12px" }}>
                    <div>
                      <p className="label" style={{ marginBottom: "3px" }}>In</p>
                      <p
                        className="text-[10px] leading-5"
                        style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-3)" }}
                      >
                        {consumes}
                      </p>
                    </div>
                    <div>
                      <p className="label" style={{ marginBottom: "3px" }}>Out</p>
                      <p
                        className="text-[10px] leading-5"
                        style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-3)" }}
                      >
                        {produces}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="rule" />

      {/* ── Feature showcase ── */}
      <section className="py-20">
        <div className="mb-12">
          <p className="label mb-3">Platform features</p>
          <p
            className="text-[clamp(1.4rem,3vw,2rem)] font-semibold leading-tight"
            style={{ fontFamily: "var(--font-serif), Georgia, serif", color: "var(--text-1)" }}
          >
            Built for the full litigation workflow.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px" style={{ background: "rgba(0,0,0,0.07)" }}>
          {FEATURES.map(({ title, desc, href, stat }) => (
            <Link
              key={title}
              href={href}
              className="block px-6 py-7 card-hover group"
              style={{ background: "var(--bg)" }}
            >
              <div className="flex items-start justify-between mb-3">
                <p
                  className="text-[13px] font-semibold"
                  style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-1)" }}
                >
                  {title}
                </p>
                <span
                  className="text-[9px] font-bold uppercase tracking-[0.15em] shrink-0 ml-3"
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    color: "var(--text-3)",
                    paddingTop: "2px",
                  }}
                >
                  {stat}
                </span>
              </div>
              <p
                className="text-sm leading-6"
                style={{ fontFamily: "var(--font-serif), Georgia, serif", color: "var(--text-2)" }}
              >
                {desc}
              </p>
              <p
                className="mt-4 text-[10px] font-semibold uppercase tracking-[0.18em]"
                style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-3)" }}
              >
                Open &rarr;
              </p>
            </Link>
          ))}
        </div>
      </section>

      <div className="rule" />

      {/* ── Footer CTA ── */}
      <section className="py-16 text-center">
        <p
          className="text-[clamp(1.3rem,2.5vw,1.8rem)] font-semibold mb-6"
          style={{ fontFamily: "var(--font-serif), Georgia, serif", color: "var(--text-1)" }}
        >
          See the pipeline in action.
        </p>
        <Link
          href="/draft"
          className="inline-block px-9 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-opacity hover:opacity-80"
          style={{
            fontFamily: "var(--font-mono), monospace",
            background: "var(--text-1)",
            color: "#000000",
          }}
        >
          Start a Draft
        </Link>
        <p
          className="mt-8 text-[11px] leading-6 max-w-xl mx-auto"
          style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-3)" }}
        >
          Demo corpus only. Not real legal authority. Not legal advice.
          LexOrchestrator is a portfolio project demonstrating litigation AI architecture.
        </p>
      </section>

    </div>
  );
}
