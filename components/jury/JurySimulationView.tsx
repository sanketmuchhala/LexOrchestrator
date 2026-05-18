"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { JurySimulationResult } from "@/lib/jury/types";
import JurorGrid from "./JurorGrid";
import SentimentBar from "./SentimentBar";
import NarrativePanel from "./NarrativePanel";
import InfluentialVoices from "./InfluentialVoices";

interface PollResponse {
  id: string;
  status: "running" | "completed" | "failed";
  result: JurySimulationResult | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
  numAgents: number;
  rounds: number;
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

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

interface JurySimulationViewProps {
  id: string;
  initialNumAgents: number;
  initialRounds: number;
}

export default function JurySimulationView({ id, initialNumAgents, initialRounds }: JurySimulationViewProps) {
  const [data, setData] = useState<PollResponse | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  const poll = useCallback(async () => {
    try {
      const res = await fetch(`/api/jury-simulation/${id}`);
      if (!res.ok) return;
      const json = (await res.json()) as PollResponse;
      setData(json);
    } catch {
      // silent retry
    }
  }, [id]);

  useEffect(() => {
    poll();
    const pollInterval = setInterval(() => {
      setData((prev) => {
        if (prev?.status === "completed" || prev?.status === "failed") {
          clearInterval(pollInterval);
          return prev;
        }
        return prev;
      });
      poll();
    }, 3000);

    const elapsedInterval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);

    return () => {
      clearInterval(pollInterval);
      clearInterval(elapsedInterval);
    };
  }, [poll]);

  const status = data?.status ?? "running";
  const result = data?.result ?? null;
  const numAgents = data?.numAgents ?? initialNumAgents;
  const rounds = data?.rounds ?? initialRounds;

  return (
    <div>
      {/* ── Juror Grid ─────────────────────────────────────────────── */}
      <section className="mb-12">
        <SectionTitle n="01" label="Jury Panel" />

        {status === "running" && (
          <div className="mb-6 flex items-center gap-3">
            <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-2)", letterSpacing: "0.14em" }}>
              Deliberating · {formatElapsed(elapsed)} elapsed
            </span>
          </div>
        )}

        {status === "completed" && result && (
          <div className="mb-4 flex items-center gap-3">
            <span className="badge badge-pass">Verdict reached</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)" }}>
              {numAgents} jurors · {rounds} rounds · {result.durationSeconds.toFixed(1)}s
            </span>
          </div>
        )}

        <JurorGrid
          numAgents={numAgents}
          mode={status === "completed" ? "verdict" : "deliberating"}
          sentimentDistribution={result?.sentimentDistribution}
          sampleActions={result?.sampleActions}
        />
      </section>

      {/* ── Running state ──────────────────────────────────────────── */}
      {status === "running" && (
        <div className="py-12 text-center" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="relative flex items-center justify-center mx-auto mb-6" style={{ width: 72, height: 72 }}>
            <div className="agent-orb" style={{ width: 48, height: 48 }} aria-hidden="true" />
            <div className="agent-orb-ring" style={{ inset: "-12px", animationDelay: "0s" }} aria-hidden="true" />
            <div className="agent-orb-ring" style={{ inset: "-12px", animationDelay: "0.6s" }} aria-hidden="true" />
            <div className="agent-orb-ring" style={{ inset: "-12px", animationDelay: "1.2s" }} aria-hidden="true" />
          </div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-2)", letterSpacing: "0.18em", textTransform: "uppercase" }}>
            Swarm deliberating...
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", marginTop: "0.5rem" }}>
            This takes {numAgents >= 15 ? "90-120" : "40-60"} seconds. The page updates automatically.
          </p>
        </div>
      )}

      {/* ── Failed state ───────────────────────────────────────────── */}
      {status === "failed" && (
        <div style={{ border: "1px solid rgba(248,113,113,0.3)", padding: "1.25rem", marginTop: "1rem" }}>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--red)", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Simulation failed
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-2)" }}>
            {data?.error ?? "Unknown error. Check that MIROFISH_URL and MIROFISH_KEY are set."}
          </p>
        </div>
      )}

      {/* ── Completed results ──────────────────────────────────────── */}
      {status === "completed" && result && (
        <div className="space-y-10" style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "2.5rem" }}>

          {/* Sentiment */}
          <section>
            <SectionTitle n="02" label="Verdict Distribution" />
            <SentimentBar
              positive={result.sentimentDistribution.positive}
              negative={result.sentimentDistribution.negative}
              neutral={result.sentimentDistribution.neutral}
            />
          </section>

          {/* Narratives */}
          <section>
            <SectionTitle n="03" label="Swarm Consensus" />
            <NarrativePanel
              narratives={result.topNarratives}
              trends={result.emergingTrends}
            />
          </section>

          {/* Influential voices */}
          <section>
            <SectionTitle n="04" label="Influential Voices" />
            <InfluentialVoices actions={result.sampleActions} />
          </section>

          {/* Full report */}
          <section>
            <SectionTitle n="05" label="Full Report" />
            <details>
              <summary
                style={{
                  fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-2)",
                  letterSpacing: "0.16em", textTransform: "uppercase", cursor: "pointer",
                  padding: "0.75rem 0", listStyle: "none",
                }}
              >
                Expand full simulation report &darr;
              </summary>
              <div style={{ marginTop: "1rem", border: "1px solid rgba(255,255,255,0.06)", padding: "1.5rem" }}>
                <pre style={{
                  fontFamily: "var(--font-serif), Georgia, serif",
                  fontSize: "13px", lineHeight: "1.85", color: "var(--text-1)",
                  whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0,
                }}>
                  {result.report}
                </pre>
              </div>
            </details>
          </section>

          {/* Meta */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)" }}>
              Simulation ID: {result.predictionId} · {result.totalActions} total actions ·{" "}
              {result.durationSeconds.toFixed(1)}s
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", marginTop: "0.25rem" }}>
              Swarm intelligence output only. Not legal advice. Not a prediction of actual jury behavior.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
