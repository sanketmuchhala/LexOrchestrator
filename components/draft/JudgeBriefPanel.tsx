import type { WorkflowArtifactRow } from "@/lib/litigation/getWorkflowRun";
import type { JudgeBriefResult } from "@/lib/litigation/types";

function matchStatusBadge(status: string): string {
  if (status === "exact") return "badge-pass";
  if (status === "partial") return "badge-warn";
  if (status === "not_found" || status === "not_requested") return "badge-neutral";
  if (status === "ambiguous") return "badge-warn";
  return "badge-neutral";
}

function GuidanceList({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li
          key={i}
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: "13px",
            lineHeight: "1.7",
            color: "#a3a3a3",
            paddingLeft: "1rem",
            borderLeft: "2px solid rgba(255,255,255,0.06)",
          }}
        >
          {item.replace(/^\[DEMO FIXTURE DATA\]\s*/i, "")}
        </li>
      ))}
    </ul>
  );
}

function SubHeading({ children }: { children: string }) {
  return (
    <p
      className="label mb-2"
      style={{ marginTop: "1rem", letterSpacing: "0.16em" }}
    >
      {children}
    </p>
  );
}

function JudgeBriefContent({ brief }: { brief: JudgeBriefResult }) {
  const hasGuidance =
    brief.styleNotes.length > 0 ||
    brief.argumentGuidance.length > 0 ||
    brief.citationPreferences.length > 0 ||
    brief.motionTypeGuidance.length > 0;

  return (
    <div>
      {/* Judge identity */}
      <div
        className="mb-4 pb-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className={`badge ${matchStatusBadge(brief.matchStatus)}`}>
            {brief.matchStatus.replace(/_/g, " ")}
          </span>
          {brief.profileAvailable && (
            <span className="badge badge-pass">profile loaded</span>
          )}
          {brief.sourceOpinionCount > 0 && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "#404040",
              }}
            >
              {brief.sourceOpinionCount} opinion
              {brief.sourceOpinionCount !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {brief.judgeName && (
          <p
            style={{
              fontFamily: "var(--font-serif), Georgia, serif",
              fontSize: "15px",
              fontWeight: 500,
              color: "#f4f4f4",
            }}
          >
            {brief.judgeName}
          </p>
        )}
        {(brief.court || brief.jurisdiction) && (
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              color: "#737373",
              marginTop: "2px",
            }}
          >
            {[brief.court, brief.jurisdiction].filter(Boolean).join(" / ")}
          </p>
        )}

        {brief.confidence > 0 && (
          <p
            className="mt-2"
            style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#404040" }}
          >
            Confidence: {Math.round(brief.confidence * 100)}%
          </p>
        )}
      </div>

      {/* Not found / not requested */}
      {(brief.matchStatus === "not_found" || brief.matchStatus === "not_requested") && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#404040" }}>
          {brief.matchStatus === "not_requested"
            ? "No judge was specified for this workflow run."
            : `Judge profile unavailable. The workflow continued without judge-specific guidance.`}
        </p>
      )}

      {/* Guidance sections */}
      {hasGuidance && (
        <div>
          {brief.styleNotes.length > 0 && (
            <>
              <SubHeading>Style Notes</SubHeading>
              <GuidanceList items={brief.styleNotes} />
            </>
          )}

          {brief.citationPreferences.length > 0 && (
            <>
              <SubHeading>Citation Preferences</SubHeading>
              <GuidanceList items={brief.citationPreferences} />
            </>
          )}

          {brief.argumentGuidance.length > 0 && (
            <>
              <SubHeading>Argument Guidance</SubHeading>
              <GuidanceList items={brief.argumentGuidance} />
            </>
          )}

          {brief.motionTypeGuidance.length > 0 && (
            <>
              <SubHeading>Motion-Type Guidance</SubHeading>
              <GuidanceList items={brief.motionTypeGuidance} />
            </>
          )}

          {brief.riskNotes.length > 0 && (
            <>
              <SubHeading>Risk Notes</SubHeading>
              <GuidanceList items={brief.riskNotes} />
            </>
          )}
        </div>
      )}

      {/* Limitations */}
      {brief.limitations.length > 0 && (
        <div
          className="mt-4 pt-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <p className="label mb-1" style={{ fontSize: "9px" }}>
            Limitations
          </p>
          {brief.limitations.map((lim, i) => (
            <p
              key={i}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "#404040",
                lineHeight: "1.6",
              }}
            >
              {lim.replace(/^\[DEMO FIXTURE DATA\]\s*/i, "")}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function JudgeBriefPanel({
  artifact,
}: {
  artifact: WorkflowArtifactRow | null;
}) {
  if (!artifact) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#404040" }}>
        No Judge Brief was generated for this workflow. Provide a judge name or ID when
        launching the draft to enable judge-specific preparation.
      </p>
    );
  }

  const brief =
    artifact.metadata && typeof artifact.metadata.judgeBrief === "object"
      ? (artifact.metadata.judgeBrief as JudgeBriefResult)
      : null;

  if (!brief) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#404040" }}>
        Judge Brief artifact exists but structured data is unavailable.
      </p>
    );
  }

  return <JudgeBriefContent brief={brief} />;
}
