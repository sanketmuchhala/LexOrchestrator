import Link from "next/link";

/* ─── Data ──────────────────────────────────────────────────────────────── */

const AGENTS = [
  {
    n: "01",
    name: "IntakeAgent",
    role: "Classification",
    desc: "Normalises the request: detects motion type, jurisdiction, court, key legal issues, and missing inputs. No LLM call wasted on a malformed request.",
    consumes: "Raw query + facts",
    produces: "Intake record",
    color: "#6366f1",
  },
  {
    n: "02",
    name: "RetrievalAgent",
    role: "Hybrid RAG",
    desc: "Fires parallel pgvector cosine search and BM25 keyword retrieval over indexed court opinions. Fuses results with a weighted scoring formula, boosting primary sources and jurisdictional matches.",
    consumes: "Legal issues + jurisdiction",
    produces: "Ranked opinion chunks",
    color: "#8b5cf6",
  },
  {
    n: "03",
    name: "DraftingAgent",
    role: "Generation",
    desc: "Produces a fully-structured motion draft grounded in retrieved authority — Preliminary Statement, Statement of Facts, Legal Standard, Argument (Roman numeral sections), and Conclusion.",
    consumes: "Ranked chunks + facts",
    produces: "Cited motion draft",
    color: "#06b6d4",
  },
  {
    n: "04",
    name: "CitationAgent",
    role: "Verification",
    desc: "Extracts every citation using regex + optional eyecite worker. Verifies each against the corpus: existence, reporter format, pin cite page, quote fidelity, and proposition support.",
    consumes: "Draft text",
    produces: "Citation report",
    color: "#3b82f6",
  },
  {
    n: "05",
    name: "AdversarialAgent",
    role: "Red-Team",
    desc: "Simulates opposing counsel. Identifies the three strongest counterarguments, flags unsupported claims, assesses adversarial risk (HIGH / MEDIUM / LOW), and suggests rebuttal paths.",
    consumes: "Draft + citations",
    produces: "Red-team memo",
    color: "#f59e0b",
  },
  {
    n: "06",
    name: "LocalRulesAgent",
    role: "Compliance",
    desc: "Checks the draft section-by-section against jurisdiction-specific local rules profiles (SDNY, Federal, New York State). Reports missing sections, formatting violations, and filing notes.",
    consumes: "Draft + jurisdiction",
    produces: "Rules report",
    color: "#10b981",
  },
  {
    n: "07",
    name: "JudgeBriefAgent",
    role: "Intelligence",
    desc: "Queries cached judge profiles derived from prior opinions. Returns citation preferences, writing-style notes, motion-type-specific guidance, and risk flags for the assigned judge.",
    consumes: "Judge name / ID",
    produces: "Judge brief",
    color: "#f43f5e",
  },
  {
    n: "08",
    name: "EvalAgent",
    role: "Scoring",
    desc: "Computes a weighted confidence score across six dimensions. Produces a pass / warn / fail verdict and a structured quality report persisted alongside the draft.",
    consumes: "All agent outputs",
    produces: "Confidence score",
    color: "#34d399",
  },
];

const PROBLEMS = [
  {
    title: "Hallucinated citations",
    desc: "A bare LLM call invents case names, reporters, and page numbers that don't exist. No model self-corrects without a retrieval loop.",
  },
  {
    title: "No adversarial pressure",
    desc: "A single-pass draft doesn't account for opposing counsel's strongest counterarguments. Motions that aren't stress-tested get shredded at hearing.",
  },
  {
    title: "Local rules blind spots",
    desc: "Formatting, page limits, and required-section rules vary by district and judge. One missed requirement and the clerk rejects the filing.",
  },
];

const TECH_STACK = [
  { name: "Next.js 16",       role: "App Router + Turbopack"      },
  { name: "TypeScript",       role: "Strict mode, end-to-end"     },
  { name: "Supabase",         role: "Postgres + pgvector"         },
  { name: "OpenAI / OR",      role: "LLM + embeddings"            },
  { name: "eyecite",          role: "Legal citation extraction"    },
  { name: "pdfkit + docx",    role: "Server-side export"          },
  { name: "MCP stdio",        role: "Claude tool integration"     },
  { name: "Tailwind CSS",     role: "Design system"               },
];

const EVAL_DIMENSIONS = [
  { label: "Citation pass rate",       weight: "35%", color: "#60a5fa" },
  { label: "Faithfulness score",       weight: "25%", color: "#34d399" },
  { label: "Retrieval coverage",       weight: "15%", color: "#8b5cf6" },
  { label: "Local rules completeness", weight: "10%", color: "#10b981" },
  { label: "Adversarial safety",       weight: "10%", color: "#f59e0b" },
  { label: "Judge alignment",          weight: "5%",  color: "#f43f5e" },
];

/* const FEATURES = [
  {
    title: "Matter Workspaces",
    desc: "Organise drafts, uploads, and workflow runs under a named client matter. Full audit trail per case.",
    href: "/matters",
    stat: "Multi-matter",
  },
  {
    title: "Editable Draft + Export",
    desc: "Edit the motion in a live textarea. Version history tracked. Export to PDF, DOCX, or TXT in one click.",
    href: "/draft",
    stat: "PDF / DOCX / TXT",
  },
  {
    title: "Citation Verification",
    desc: "Every citation verified: existence, pin cite page, quote match, and proposition support against the indexed corpus.",
    href: "/draft",
    stat: "Per-citation status",
  },
  {
    title: "Agent Trace Debugger",
    desc: "Full event log — every agent step, tool call, token count, and latency. Live-polled while the pipeline runs.",
    href: "/traces",
    stat: "Full observability",
  },
  {
    title: "Observability Dashboard",
    desc: "p50/p95 latency, token burn, pass/fail trends, and per-agent hotspot detection across all runs.",
    href: "/observability",
    stat: "p50 / p95",
  },
  {
    title: "Eval Scoring",
    desc: "Six-dimension weighted confidence score. Pass ≥ 75%, Warn ≥ 55%, Fail below. Internal quality signal.",
    href: "/evals",
    stat: "6-dimension eval",
  },
  {
    title: "Case File Upload",
    desc: "Upload .txt or .md case material. Extracted text is labelled [UPLOADED CASE MATERIAL] in the draft — never confused with legal authority.",
    href: "/draft",
    stat: "Up to 5 MB",
  },
  {
    title: "MCP Tool Server",
    desc: "stdio MCP server exposes 9 tools — search, extract, verify, run workflow, get status, get artifacts, judge brief, eval summary, local rules.",
    href: "/workflows",
    stat: "9 MCP tools",
  },
]; */

const SAMPLE_OUTPUT = `PRELIMINARY STATEMENT

Defendant Northstar Retail Systems respectfully moves to dismiss
pursuant to Federal Rule of Civil Procedure 12(b)(6). Plaintiff's
claims fail as a matter of law: the Pilot Agreement expressly
conditioned any production deployment on a later signed order form.
No order form was executed.

LEGAL STANDARD

To survive a motion to dismiss, a complaint must plead "enough facts
to state a claim to relief that is plausible on its face." Bell
Atlantic Corp. v. Twombly, 550 U.S. 544, 570 (2007). A claim is
plausible "when the plaintiff pleads factual content that allows the
court to draw the reasonable inference that the defendant is liable."
Ashcroft v. Iqbal, 556 U.S. 662, 678 (2009).

ARGUMENT

I.  THE BREACH OF CONTRACT CLAIM FAILS

    Where sophisticated parties have negotiated in anticipation of a
    formal written agreement, no binding contract arises until that
    document is executed. R.G. Group, Inc. v. Horn & Hardart Co.,
    751 F.2d 69, 75 (2d Cir. 1984). The Pilot Agreement's plain
    language forecloses any contrary inference.

[  CitationAgent: 5/6 verified  ·  AdversarialRisk: MEDIUM  ·  Confidence: 82%  ]`;

/* ─── Component ─────────────────────────────────────────────────────────── */

export default function LandingPage() {
  return (
    <div className="appear">

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="relative pt-24 pb-20 flex flex-col items-center text-center">

        {/* Orb */}
        <div className="relative mb-12 flex items-center justify-center" style={{ width: 200, height: 200 }}>
          <div className="agent-orb" style={{ width: 120, height: 120 }} aria-hidden="true" />
          <div className="agent-orb-ring" style={{ inset: "-28px", animationDelay: "0s" }} aria-hidden="true" />
          <div className="agent-orb-ring" style={{ inset: "-28px", animationDelay: "0.65s" }} aria-hidden="true" />
          <div className="agent-orb-ring" style={{ inset: "-28px", animationDelay: "1.3s" }} aria-hidden="true" />
        </div>

        <p className="label mb-4" style={{ letterSpacing: "0.3em" }}>
          Multi-Agent Litigation AI
        </p>

        <h1
          className="text-[clamp(3.5rem,9vw,7rem)] font-semibold leading-[0.92] tracking-tight"
          style={{ fontFamily: "var(--font-serif), Georgia, serif", color: "var(--text-1)" }}
        >
          LexOrchestrator
        </h1>

        <p
          className="mt-5 max-w-xl text-base leading-8"
          style={{ fontFamily: "var(--font-serif), Georgia, serif", color: "var(--text-2)" }}
        >
          Eight specialist agents running sequentially — retrieval, drafting, citation
          verification, adversarial review, local rules, judge intelligence, and eval scoring —
          on every litigation workflow.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/draft"
            className="inline-block px-8 py-3 text-xs font-bold uppercase tracking-[0.18em] transition-opacity hover:opacity-80"
            style={{ fontFamily: "var(--font-mono)", background: "var(--text-1)", color: "#000" }}
          >
            Start a Draft
          </Link>
          {/* <Link href="/demo" ...>View Demos</Link> */}
        </div>

        {/* Dot grid */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, zIndex: -1,
            backgroundImage: "radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black 20%, transparent 100%)",
          }}
        />
      </section>

      <div className="rule" />

      {/* ══ PROBLEM ═══════════════════════════════════════════════════════ */}
      <section className="py-16">
        <div className="mb-10">
          <p className="label mb-3">The Problem</p>
          <p
            className="text-[clamp(1.2rem,2.5vw,1.7rem)] font-semibold leading-tight max-w-2xl"
            style={{ fontFamily: "var(--font-serif)", color: "var(--text-1)" }}
          >
            A single LLM call produces plausible text with no guarantee of accuracy.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-px" style={{ background: "rgba(255,255,255,0.06)" }}>
          {PROBLEMS.map(({ title, desc }) => (
            <div key={title} className="px-6 py-6" style={{ background: "var(--bg)" }}>
              <p
                className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em]"
                style={{ fontFamily: "var(--font-mono)", color: "var(--red)" }}
              >
                {title}
              </p>
              <p
                className="text-sm leading-6"
                style={{ fontFamily: "var(--font-serif)", color: "var(--text-2)" }}
              >
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="rule" />

      {/* ══ STATS ═════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-px" style={{ background: "rgba(255,255,255,0.06)" }}>
        {[
          { value: "8",          label: "Specialist Agents", sub: "Sequential pipeline"      },
          { value: "Hybrid RAG", label: "Retrieval Method",  sub: "pgvector + keyword"       },
          { value: "9",          label: "MCP Tools",         sub: "Claude tool integration"  },
          { value: "Full Trace", label: "Observability",     sub: "Every step inspectable"   },
        ].map(({ value, label, sub }) => (
          <div key={label} className="px-6 py-8" style={{ background: "var(--bg)" }}>
            <p
              className="text-2xl font-semibold"
              style={{ fontFamily: "var(--font-serif)", color: "var(--text-1)" }}
            >
              {value}
            </p>
            <p
              className="mt-1 text-[11px] font-bold uppercase tracking-[0.18em]"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-2)" }}
            >
              {label}
            </p>
            <p
              className="mt-1 text-[10px]"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-3)" }}
            >
              {sub}
            </p>
          </div>
        ))}
      </section>

      <div className="rule" />

      {/* ══ PIPELINE ══════════════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="mb-12">
          <p className="label mb-3">The Pipeline</p>
          <p
            className="text-[clamp(1.4rem,3vw,2rem)] font-semibold leading-tight"
            style={{ fontFamily: "var(--font-serif)", color: "var(--text-1)" }}
          >
            Eight agents. Sequential execution.<br />Every step inspectable in real time.
          </p>
          <p
            className="mt-3 text-sm leading-6 max-w-xl"
            style={{ fontFamily: "var(--font-mono)", color: "var(--text-2)" }}
          >
            Each agent receives the accumulated context from all prior agents.
            Events are streamed to the trace log as they occur.
          </p>
        </div>

        {/* Flow connector visual */}
        <div className="mb-12 overflow-x-auto">
          <div className="flex items-center gap-0 min-w-max mx-auto" style={{ width: "fit-content" }}>
            {AGENTS.map(({ n, name, color }, i) => (
              <div key={n} className="flex items-center">
                <div
                  className="flex flex-col items-center"
                  style={{ width: "7rem" }}
                >
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: `${color}18`,
                      border: `1.5px solid ${color}60`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, color }}>
                      {n}
                    </span>
                  </div>
                  <p
                    className="mt-2 text-center text-[9px] font-bold uppercase tracking-[0.12em]"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--text-2)" }}
                  >
                    {name.replace("Agent", "")}
                  </p>
                </div>
                {i < AGENTS.length - 1 && (
                  <div style={{ width: "2rem", height: "1px", background: "rgba(255,255,255,0.12)", flexShrink: 0, marginBottom: "1.25rem" }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Agent cards */}
        <div className="grid sm:grid-cols-2 gap-px" style={{ background: "rgba(255,255,255,0.06)" }}>
          {AGENTS.map(({ n, name, role, desc, consumes, produces, color }, i) => (
            <div
              key={n}
              className={`px-7 py-7 appear-${Math.min(Math.floor(i / 2) + 1, 5)}`}
              style={{ background: "var(--bg)" }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="shrink-0 flex items-center justify-center"
                  style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: `${color}14`, border: `1.5px solid ${color}50`,
                    marginTop: "1px",
                  }}
                >
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", fontWeight: 700, color }}>
                    {n}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div className="flex flex-wrap items-baseline gap-2 mb-2">
                    <p
                      className="text-[13px] font-bold"
                      style={{ fontFamily: "var(--font-mono)", color: "var(--text-1)" }}
                    >
                      {name}
                    </p>
                    <span
                      className="text-[9px] font-bold uppercase tracking-[0.12em] px-1.5 py-0.5"
                      style={{ color, border: `1px solid ${color}40`, background: `${color}10` }}
                    >
                      {role}
                    </span>
                  </div>
                  <p
                    className="text-sm leading-6 mb-4"
                    style={{ fontFamily: "var(--font-serif)", color: "var(--text-2)" }}
                  >
                    {desc}
                  </p>
                  <div
                    className="grid grid-cols-2 gap-3 pt-3"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div>
                      <p className="label" style={{ marginBottom: "3px" }}>In</p>
                      <p className="text-[10px] leading-5" style={{ fontFamily: "var(--font-mono)", color: "var(--text-3)" }}>
                        {consumes}
                      </p>
                    </div>
                    <div>
                      <p className="label" style={{ marginBottom: "3px" }}>Out</p>
                      <p className="text-[10px] leading-5" style={{ fontFamily: "var(--font-mono)", color: "var(--text-3)" }}>
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

      {/* ══ SAMPLE OUTPUT ═════════════════════════════════════════════════ */}
      <section className="py-20">
        <div className="mb-8">
          <p className="label mb-3">Sample Output</p>
          <p
            className="text-[clamp(1.2rem,2.5vw,1.7rem)] font-semibold leading-tight"
            style={{ fontFamily: "var(--font-serif)", color: "var(--text-1)" }}
          >
            What the pipeline actually produces.
          </p>
        </div>
        <div style={{ border: "1px solid rgba(255,255,255,0.08)", background: "var(--s1)" }}>
          {/* Header bar */}
          <div
            className="flex items-center gap-3 px-5 py-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)" }}>
              Motion to Dismiss — S.D.N.Y. — Demo Run
            </span>
            <span className="badge badge-pass" style={{ fontSize: "9px" }}>Completed</span>
            <span className="badge badge-neutral" style={{ fontSize: "9px" }}>82% confidence</span>
          </div>
          <pre
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "13px",
              lineHeight: "1.85",
              color: "var(--text-1)",
              padding: "1.5rem",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              margin: 0,
              overflowX: "auto",
            }}
          >
            {SAMPLE_OUTPUT}
          </pre>
          <div
            className="px-5 py-3 flex items-center gap-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <Link
              href="/demo/demo-001"
              style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--blue)", letterSpacing: "0.14em", textTransform: "uppercase" }}
              className="transition-opacity hover:opacity-70"
            >
              View full demo &rarr;
            </Link>
          </div>
        </div>
      </section>

      <div className="rule" />

      {/* ══ RETRIEVAL + EVAL FORMULAS ════════════════════════════════════ */}
      <section className="py-20">
        <div className="mb-12">
          <p className="label mb-3">Under the Hood</p>
          <p
            className="text-[clamp(1.4rem,3vw,2rem)] font-semibold leading-tight"
            style={{ fontFamily: "var(--font-serif)", color: "var(--text-1)" }}
          >
            Deterministic scoring formulas,<br />not black-box outputs.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-px" style={{ background: "rgba(255,255,255,0.06)" }}>

          {/* Retrieval formula */}
          <div className="px-7 py-8" style={{ background: "var(--bg)" }}>
            <p className="label mb-4">Retrieval Scoring</p>
            <pre
              style={{
                fontFamily: "var(--font-mono), monospace",
                fontSize: "11px",
                lineHeight: "2",
                color: "var(--text-1)",
                background: "var(--s1)",
                border: "1px solid rgba(255,255,255,0.06)",
                padding: "1rem",
                overflowX: "auto",
                whiteSpace: "pre",
                margin: 0,
              }}
            >{`score = min(1,
  kwScore    × 0.35
+ vecScore   × 0.45
+ jurisdictionBoost
+ courtBoost
+ authorityBoost   // +0.15 for primary sources
+ recencyBoost
)`}</pre>
            <p
              className="mt-4 text-xs leading-5"
              style={{ fontFamily: "var(--font-mono)", color: "var(--text-3)" }}
            >
              Hybrid fusion of pgvector cosine similarity and BM25-style keyword overlap.
              Primary sources (Constitution, statute) receive an authority boost.
            </p>
          </div>

          {/* Eval formula */}
          <div className="px-7 py-8" style={{ background: "var(--bg)" }}>
            <p className="label mb-4">Confidence Scoring</p>
            <div className="space-y-2 mb-4">
              {EVAL_DIMENSIONS.map(({ label, weight, color }) => (
                <div key={label} className="flex items-center gap-3">
                  <div
                    style={{
                      width: `${parseInt(weight)}%`,
                      minWidth: "2rem",
                      maxWidth: "10rem",
                      height: "3px",
                      background: color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-2)", flex: 1 }}>
                    {label}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", fontWeight: 700, color }}>
                    {weight}
                  </span>
                </div>
              ))}
            </div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)" }}>
              Pass ≥ 75% · Warn ≥ 55% · Fail below. Internal quality signal only.
            </p>
          </div>
        </div>
      </section>

      <div className="rule" />

      {/* ══ TECH STACK ════════════════════════════════════════════════════ */}
      <section className="py-16">
        <p className="label mb-8">Tech Stack</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px" style={{ background: "rgba(255,255,255,0.06)" }}>
          {TECH_STACK.map(({ name, role }) => (
            <div key={name} className="px-5 py-5" style={{ background: "var(--bg)" }}>
              <p
                className="text-[13px] font-bold"
                style={{ fontFamily: "var(--font-mono)", color: "var(--text-1)" }}
              >
                {name}
              </p>
              <p
                className="mt-1 text-[10px] leading-5"
                style={{ fontFamily: "var(--font-mono)", color: "var(--text-3)" }}
              >
                {role}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="rule" />

      {/* ══ FEATURES — commented out for now ═══════════════════════════ */}
      {/* <section className="py-20">
        <div className="mb-12">
          <p className="label mb-3">Platform Features</p>
          <p
            className="text-[clamp(1.4rem,3vw,2rem)] font-semibold leading-tight"
            style={{ fontFamily: "var(--font-serif)", color: "var(--text-1)" }}
          >
            Built for the full litigation workflow.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px" style={{ background: "rgba(255,255,255,0.06)" }}>
          {FEATURES.map(({ title, desc, href, stat }) => (
            <Link
              key={title}
              href={href}
              className="block px-5 py-6 card-hover group"
              style={{ background: "var(--bg)" }}
            >
              <div className="flex items-start justify-between mb-2">
                <p
                  className="text-[12px] font-bold leading-tight"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--text-1)" }}
                >
                  {title}
                </p>
                <span
                  className="text-[9px] font-bold uppercase tracking-[0.12em] shrink-0 ml-2"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--text-3)", paddingTop: "1px" }}
                >
                  {stat}
                </span>
              </div>
              <p
                className="text-xs leading-5 mb-4"
                style={{ fontFamily: "var(--font-serif)", color: "var(--text-2)" }}
              >
                {desc}
              </p>
              <p
                className="text-[9px] font-bold uppercase tracking-[0.18em] transition-opacity group-hover:opacity-60"
                style={{ fontFamily: "var(--font-mono)", color: "var(--text-3)" }}
              >
                Open &rarr;
              </p>
            </Link>
          ))}
        </div>
      </section> */}

      <div className="rule" />

      {/* ══ FOOTER CTA ════════════════════════════════════════════════════ */}
      <section className="py-20 text-center">
        <p
          className="text-[clamp(1.3rem,2.5vw,2rem)] font-semibold mb-3"
          style={{ fontFamily: "var(--font-serif)", color: "var(--text-1)" }}
        >
          See the pipeline in action.
        </p>
        <p
          className="mb-8 text-sm leading-6"
          style={{ fontFamily: "var(--font-serif)", color: "var(--text-2)" }}
        >
          Run a motion draft end-to-end in under 30 seconds.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/draft"
            className="inline-block px-9 py-3 text-xs font-bold uppercase tracking-[0.2em] transition-opacity hover:opacity-80"
            style={{ fontFamily: "var(--font-mono)", background: "var(--text-1)", color: "#000" }}
          >
            Start a Draft
          </Link>
          {/* <Link href="/demo" ...>View Demos</Link> */}
        </div>
        <p
          className="mt-10 text-[10px] leading-6 max-w-lg mx-auto"
          style={{ fontFamily: "var(--font-mono)", color: "var(--text-3)" }}
        >
          Demo corpus only. Not real legal authority. Not legal advice.
          LexOrchestrator is a portfolio project demonstrating litigation AI architecture.
        </p>
      </section>

    </div>
  );
}
