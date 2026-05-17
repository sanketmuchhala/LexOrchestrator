import type { CitationQualityMetrics } from "@/lib/litigation/evals/types";
import EvalScoreBar from "./EvalScoreBar";

export default function CitationQualityPanel({ metrics }: { metrics: CitationQualityMetrics }) {
  if (metrics.total === 0) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "13px", color: "var(--text-3)" }}>
        No citations were extracted from this draft.
        Citation verification runs when the draft contains recognizable legal citation patterns.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap gap-3 px-4 py-3 mb-4"
        style={{ background: "var(--s1)", borderBottom: "1px solid rgba(0,0,0,0.07)" }}
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-2)" }}>
          {metrics.total} citation{metrics.total !== 1 ? "s" : ""} checked
        </span>
        {metrics.pass > 0 && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#34d399" }}>
            {metrics.pass} pass
          </span>
        )}
        {metrics.warn > 0 && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#fbbf24" }}>
            {metrics.warn} warn
          </span>
        )}
        {metrics.fail > 0 && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#f87171" }}>
            {metrics.fail} fail
          </span>
        )}
        {metrics.unknown > 0 && (
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-3)" }}>
            {metrics.unknown} unknown
          </span>
        )}
      </div>

      <EvalScoreBar label="Pass Rate" value={metrics.passRate} />
      <EvalScoreBar label="Fail Rate" value={metrics.failRate} invert />

      <p
        className="pt-2"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "var(--text-3)",
          borderTop: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        Citation pass rate depends on the size and coverage of the indexed opinion corpus.
        Unverified citations may still be valid but cannot be confirmed from local data.
      </p>
    </div>
  );
}
