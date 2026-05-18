"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { JurySimulationResult } from "@/lib/jury/types";
import JurorGrid from "./JurorGrid";
import JuryDiscussionFeed from "./JuryDiscussionFeed";
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

function SectionTitle({ n, label, live }: { n: string; label: string; live?: boolean }) {
  return (
    <div className="mb-5 flex items-center gap-4">
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", letterSpacing: "0.2em" }}>
        § {n}
      </span>
      <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
      <div className="flex items-center gap-2">
        {live && (
          <span
            style={{
              display: "inline-block",
              width: 6, height: 6,
              borderRadius: "50%",
              background: "#6366f1",
              animation: "pulse-dot 1.4s ease-in-out infinite",
            }}
          />
        )}
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-2)", letterSpacing: "0.24em", textTransform: "uppercase" }}>
          {label}
        </span>
      </div>
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
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
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
    const pollInterval = setInterval(poll, 3000);
    const elapsedInterval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);
    return () => {
      clearInterval(pollInterval);
      clearInterval(elapsedInterval);
    };
  }, [poll]);

  // Cycle through jurors while deliberating to show who's "speaking"
  const numAgents = data?.numAgents ?? initialNumAgents;
  const status = data?.status ?? "running";

  useEffect(() => {
    if (status !== "running") {
      setSpeakingIndex(null);
      return;
    }
    // Each juror "speaks" for ~2.5s before passing to next
    const cycle = setInterval(() => {
      setSpeakingIndex((prev) => {
        const next = prev === null ? 0 : (prev + 1) % numAgents;
        return next;
      });
    }, 2500);
    return () => clearInterval(cycle);
  }, [status, numAgents]);

  const result = data?.result ?? null;
  const rounds = data?.rounds ?? initialRounds;

  return (
    <div>

      {/* ── Jury Panel ─────────────────────────────────────────────────── */}
      <section className="mb-10">
        <SectionTitle n="01" label="Jury Panel" live={status === "running"} />

        {status === "running" && (
          <div className="mb-5 flex items-center gap-3">
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-2)", letterSpacing: "0.14em" }}>
              {numAgents} jurors deliberating · {formatElapsed(elapsed)} elapsed
            </span>
          </div>
        )}

        {status === "completed" && result && (
          <div className="mb-5 flex items-center gap-3 flex-wrap">
            <span className="badge badge-pass">Verdict reached</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)" }}>
              {numAgents} jurors · {rounds} rounds · {result.durationSeconds.toFixed(1)}s · {result.totalActions} actions
            </span>
          </div>
        )}

        <JurorGrid
          numAgents={numAgents}
          mode={status === "completed" ? "verdict" : "deliberating"}
          sentimentDistribution={result?.sentimentDistribution}
          sampleActions={result?.sampleActions}
          speakingIndex={status === "running" ? speakingIndex : null}
        />
      </section>

      {/* ── Discussion ─────────────────────────────────────────────────── */}
      {status !== "failed" && (
        <section className="mb-10">
          <SectionTitle n="02" label={status === "running" ? "Jury Room" : "Full Deliberation"} live={status === "running"} />

          {status === "running" && (
            <div
              className="mb-4 px-4 py-3"
              style={{
                border: "1px solid rgba(99,102,241,0.2)",
                background: "rgba(99,102,241,0.04)",
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--text-3)",
                letterSpacing: "0.12em",
              }}
            >
              Simulation in progress — results arrive all at once after {numAgents >= 15 ? "90-120" : "40-60"}s.
              Discussion below is a preview of deliberation activity.
            </div>
          )}

          <div
            style={{
              border: "1px solid rgba(255,255,255,0.06)",
              padding: "1.25rem",
              minHeight: "12rem",
            }}
          >
            <JuryDiscussionFeed
              status={status}
              actions={result?.sampleActions ?? []}
              numAgents={numAgents}
              elapsed={elapsed}
            />
          </div>
        </section>
      )}

      {/* ── Failed ─────────────────────────────────────────────────────── */}
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

      {/* ── Completed results ──────────────────────────────────────────── */}
      {status === "completed" && result && (
        <div className="space-y-10">

          <section>
            <SectionTitle n="03" label="Verdict Distribution" />
            <SentimentBar
              positive={result.sentimentDistribution.positive}
              negative={result.sentimentDistribution.negative}
              neutral={result.sentimentDistribution.neutral}
            />
          </section>

          <section>
            <SectionTitle n="04" label="Swarm Consensus" />
            <NarrativePanel
              narratives={result.topNarratives}
              trends={result.emergingTrends}
            />
          </section>

          <section>
            <SectionTitle n="05" label="Influential Voices" />
            <InfluentialVoices actions={result.sampleActions} />
          </section>

          <section>
            <SectionTitle n="06" label="Full Report" />
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

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem" }}>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)" }}>
              Simulation ID: {result.predictionId} · {result.totalActions} actions · {result.durationSeconds.toFixed(1)}s
            </p>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", marginTop: "0.25rem" }}>
              Swarm intelligence only. Not legal advice. Not a prediction of actual jury behavior.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
