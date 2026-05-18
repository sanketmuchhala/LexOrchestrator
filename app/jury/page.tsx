import type { Metadata } from "next";
import JuryForm from "@/components/jury/JuryForm";

export const metadata: Metadata = {
  title: "Jury Simulation — LexOrchestrator",
};

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
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

const HOW_IT_WORKS = [
  { n: "01", label: "Submit", desc: "Provide a case summary, the legal question, jurisdiction, and motion type." },
  { n: "02", label: "Deliberate", desc: "12 simulated agents — citizens, policymakers, experts, skeptics — deliberate across 3 rounds." },
  { n: "03", label: "Verdict", desc: "The swarm produces a sentiment verdict (favor / neutral / oppose), dominant narratives, and influential voices." },
];

export default async function JuryPage({ searchParams }: Props) {
  const sp = await searchParams;
  const prefillCase = sp.caseSummary ?? "";
  const prefillQuestion = sp.legalQuestion ?? "";
  const prefillJurisdiction = sp.jurisdiction ?? "";
  const prefillMotionType = sp.motionType ?? "";
  const prefillConfidence = sp.confidence ?? "";

  return (
    <div className="appear pt-10 pb-24">

      {/* Header */}
      <div className="mb-10">
        <p className="label mb-3" style={{ letterSpacing: "0.28em" }}>
          Judge Tool · Powered by MiroFish Swarm Intelligence
        </p>
        <h1
          className="text-[clamp(2rem,5vw,3.5rem)] font-semibold leading-tight"
          style={{ fontFamily: "var(--font-serif), Georgia, serif", color: "var(--text-1)" }}
        >
          Jury Simulation
        </h1>
        <p
          className="mt-3 text-base leading-7 max-w-xl"
          style={{ fontFamily: "var(--font-serif), Georgia, serif", color: "var(--text-2)" }}
        >
          Simulate how a 12-person jury would deliberate on your case.
          A swarm of AI agents — each with a distinct role and perspective — deliberate
          across multiple rounds and converge on a verdict with full reasoning.
        </p>
      </div>

      <div className="rule mb-10" />

      {/* How it works */}
      <div className="mb-12">
        <SectionTitle n="01" label="How it works" />
        <div className="grid sm:grid-cols-3 gap-px" style={{ background: "rgba(255,255,255,0.06)" }}>
          {HOW_IT_WORKS.map(({ n, label, desc }) => (
            <div key={n} className="px-6 py-5" style={{ background: "var(--bg)" }}>
              <p className="label mb-2">{n} — {label}</p>
              <p style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "13px", lineHeight: "1.7", color: "var(--text-2)" }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <div className="mb-4">
        <SectionTitle n="02" label="Configure Simulation" />
      </div>
      <JuryForm
        prefillCaseSummary={prefillCase}
        prefillLegalQuestion={prefillQuestion}
        prefillJurisdiction={prefillJurisdiction}
        prefillMotionType={prefillMotionType}
        prefillConfidence={prefillConfidence}
      />

      <div className="rule mt-12 pt-8">
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", lineHeight: "1.7" }}>
          Swarm intelligence simulation only. Output reflects simulated agent reasoning, not real juror behavior.
          Not legal advice. Not a prediction of case outcome.
        </p>
      </div>

    </div>
  );
}
