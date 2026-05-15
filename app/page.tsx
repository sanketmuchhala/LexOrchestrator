import Link from "next/link";

const PIPELINE = [
  { n: "01", name: "Intake Agent",           fn: "Query classification, key term extraction, jurisdiction detection" },
  { n: "02", name: "Retrieval Agent",         fn: "Hybrid pgvector + keyword search across legal corpus" },
  { n: "03", name: "Citation Validator",      fn: "Claim-to-source matching, support scoring per citation" },
  { n: "04", name: "Adversarial Review",      fn: "Opposing counsel simulation, counterargument generation" },
  { n: "05", name: "Hallucination Monitor",   fn: "Numeric risk scoring, unsupported claim detection" },
  { n: "06", name: "Final Synthesis",         fn: "Cited legal analysis generation with confidence score" },
  { n: "07", name: "Eval Engine",             fn: "Groundedness, accuracy, reliability metric computation" },
];

const STATS = [
  { label: "Retrieval Method", value: "Hybrid RAG", sub: "pgvector + keyword" },
  { label: "Corpus", value: "Constitutional + Sample", sub: "Primary source priority" },
  { label: "Pipeline", value: "7 Agents", sub: "Sequential with full tracing" },
];

export default function LandingPage() {
  return (
    <div className="appear">

      {/* ── Case-style header ── */}
      <div className="pt-16 pb-12">
        <p
          className="label mb-6"
          style={{ letterSpacing: "0.28em" }}
        >
          In the matter of legal research reliability
        </p>

        <h1
          className="text-[clamp(3rem,8vw,6rem)] font-semibold leading-[0.95] tracking-tight text-[#f4f4f4]"
          style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
        >
          LexOrchestrator
        </h1>

        <p
          className="mt-4 text-xs uppercase tracking-[0.28em] text-[#404040]"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          Multi-Agent Litigation Reliability Engine
        </p>
      </div>

      {/* ── Rule ── */}
      <div className="rule mb-12" />

      {/* ── Two-column body ── */}
      <div className="grid gap-16 lg:grid-cols-[1fr_1fr]">

        {/* Left — Value proposition */}
        <div>
          <p
            className="label mb-4"
          >
            The Problem
          </p>
          <p
            className="text-base leading-8 text-[#a3a3a3]"
            style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
          >
            A single language model call produces plausible-sounding legal text
            with no guarantee of groundedness, citation accuracy, or adversarial
            resilience. Hallucinations in legal research carry material risk.
          </p>

          <p
            className="label mb-4 mt-10"
          >
            The System
          </p>
          <p
            className="text-base leading-8 text-[#a3a3a3]"
            style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
          >
            LexOrchestrator routes every query through a seven-agent sequential
            pipeline — retrieval, citation validation, adversarial stress-testing,
            and structured eval scoring — before surfacing a cited answer with
            reliability metrics attached to every claim.
          </p>

          <div className="mt-12">
            <Link
              href="/research"
              className="inline-block border border-[rgba(255,255,255,0.15)] bg-[#f4f4f4] px-8 py-3 text-xs font-bold uppercase tracking-[0.2em] text-black transition hover:bg-white"
              style={{ fontFamily: "var(--font-mono), monospace" }}
            >
              Begin Research
            </Link>
          </div>
        </div>

        {/* Right — Pipeline */}
        <div>
          <p className="label mb-4">Orchestration Pipeline</p>

          <div
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            {PIPELINE.map(({ n, name, fn }) => (
              <div
                key={n}
                className="flex gap-5 py-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span
                  className="shrink-0 text-[11px] font-bold text-[#404040]"
                  style={{ fontFamily: "var(--font-mono), monospace", width: "1.75rem", paddingTop: "1px" }}
                >
                  {n}
                </span>
                <div>
                  <p className="text-[13px] font-semibold text-[#f4f4f4]"
                    style={{ fontFamily: "var(--font-mono), monospace" }}
                  >
                    {name}
                  </p>
                  <p className="mt-0.5 text-xs text-[#737373]" style={{ fontFamily: "var(--font-mono), monospace" }}>
                    {fn}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="mt-16 rule" />
      <div className="grid grid-cols-3 gap-px mt-px" style={{ background: "rgba(255,255,255,0.06)" }}>
        {STATS.map(({ label, value, sub }) => (
          <div key={label} className="bg-black px-6 py-8">
            <p className="label mb-3">{label}</p>
            <p
              className="text-xl font-semibold text-[#f4f4f4]"
              style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
            >
              {value}
            </p>
            <p className="mt-1 text-xs text-[#737373]"
              style={{ fontFamily: "var(--font-mono), monospace" }}
            >
              {sub}
            </p>
          </div>
        ))}
      </div>
      <div className="rule" />

      {/* ── Disclaimer ── */}
      <p
        className="mt-12 text-[11px] leading-6 text-[#404040]"
        style={{ fontFamily: "var(--font-mono), monospace" }}
      >
        Sample educational corpus only. Not real legal authority. LexOrchestrator
        is a prototype for litigation AI reliability architecture. Not legal advice.
      </p>

    </div>
  );
}
