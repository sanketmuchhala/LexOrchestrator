import type { Metadata } from "next";
import Link from "next/link";
import JurySimulationView from "@/components/jury/JurySimulationView";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Jury Simulation ${id.slice(0, 8)} — LexOrchestrator` };
}

export default async function JurySimulationPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="appear pt-10 pb-32">

      {/* Breadcrumb */}
      <div className="mb-8 flex items-center justify-between">
        <Link
          href="/jury"
          style={{
            fontFamily: "var(--font-mono)", fontSize: "11px",
            color: "var(--text-3)", letterSpacing: "0.16em", textTransform: "uppercase",
          }}
          className="transition-opacity hover:opacity-70"
        >
          &larr; New Simulation
        </Link>
        <div className="flex items-center gap-3">
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)" }}>
            {id.slice(0, 8)}
          </span>
        </div>
      </div>

      {/* Title */}
      <div className="mb-8">
        <p className="label mb-3" style={{ letterSpacing: "0.28em" }}>Jury Simulation</p>
        <h1
          className="text-[clamp(1.4rem,3vw,2rem)] font-semibold"
          style={{ fontFamily: "var(--font-serif), Georgia, serif", color: "var(--text-1)" }}
        >
          Swarm Deliberation in Progress
        </h1>
      </div>

      <div className="rule mb-10" />

      {/* Simulation view — handles polling and result display */}
      <JurySimulationView
        id={id}
        initialNumAgents={12}
        initialRounds={3}
      />

    </div>
  );
}
