import type {
  AgentContext,
  AgentResult,
  JudgeBriefResult,
  JudgeMatchStatus,
} from "../types";
import { makeEvent } from "../logAgentEvent";
import { findJudge } from "../judges/findJudge";
import { getJudgeProfile } from "../judges/getJudgeProfile";

const DEMO_DISCLAIMER =
  "[DEMO FIXTURE DATA] This brief is prepared from demo data only. Not real judicial analysis.";

const MOTION_TYPE_GUIDANCE: Record<string, string[]> = {
  motion_to_dismiss: [
    "Cite controlling circuit authority on the plausibility standard (Twombly, Iqbal).",
    "Address all elements of each challenged claim directly.",
    "Distinguish any analogous decisions granting leave to amend.",
    "Avoid over-relying on procedural arguments alone when substantive grounds exist.",
  ],
  motion_for_summary_judgment: [
    "Marshal undisputed material facts methodically before the legal argument.",
    "Anticipate Rule 56(d) continuance requests from opposing counsel.",
    "Address credibility-based disputes directly and explain why they do not create genuine issues.",
  ],
  motion_in_limine: [
    "Lead with the governing admissibility standard before the facts.",
    "Cite Daubert/Kumho for expert evidence; FRE 403 for prejudice arguments.",
    "Address any prior rulings on the same or related evidence in this matter.",
  ],
  general: [
    "Identify the controlling legal standard at the outset.",
    "Ground every factual assertion in the record.",
    "Address anticipated counterarguments before opposing counsel can raise them.",
  ],
};

function buildNotRequestedResult(): JudgeBriefResult {
  return {
    judgeName: null,
    court: null,
    jurisdiction: null,
    matchStatus: "not_requested",
    profileAvailable: false,
    sourceOpinionCount: 0,
    styleNotes: [],
    citationPreferences: [],
    argumentGuidance: [],
    motionTypeGuidance: [],
    riskNotes: [],
    confidence: 0,
    limitations: ["No judge was specified for this workflow run."],
    artifactContent: "",
  };
}

function buildNotFoundResult(judgeName: string): JudgeBriefResult {
  const content = [
    `JUDGE BRIEF -- ${judgeName}`,
    "",
    "LOOKUP RESULT",
    `Judge "${judgeName}" was not found in the indexed judge database.`,
    "The workflow continued without judge-specific guidance.",
    "",
    "LIMITATIONS",
    "No indexed profile is available for this judge.",
    "Consider running npm run seed:litigation-demo to populate demo judge data.",
  ].join("\n");

  return {
    judgeName,
    court: null,
    jurisdiction: null,
    matchStatus: "not_found",
    profileAvailable: false,
    sourceOpinionCount: 0,
    styleNotes: [],
    citationPreferences: [],
    argumentGuidance: [],
    motionTypeGuidance: [],
    riskNotes: ["Judge not found in indexed database. No profile-based guidance available."],
    confidence: 0,
    limitations: [`Judge "${judgeName}" was not found in the indexed judge database.`],
    artifactContent: content,
  };
}

function buildFromProfile(
  judgeName: string,
  profile: NonNullable<Awaited<ReturnType<typeof getJudgeProfile>>>,
  motionType: string,
  matchStatus: JudgeMatchStatus
): JudgeBriefResult {
  const styleNotes = profile.styleNotes
    ? profile.styleNotes.split("\n").filter(Boolean)
    : ["No style notes available in cached profile."];

  const argumentGuidance = profile.argumentGuidance
    ? profile.argumentGuidance.split("\n").filter(Boolean)
    : ["No argument guidance available in cached profile."];

  const motionTypeGuidance =
    MOTION_TYPE_GUIDANCE[motionType] ?? MOTION_TYPE_GUIDANCE.general;

  const citationPreferences = buildCitationPreferences(profile.jurisdiction, profile.court);

  const limitations = buildLimitations(
    profile.sourceOpinionCount,
    profile.motionType,
    motionType
  );

  const riskNotes = [
    "Profile-based guidance is preparation only, not outcome prediction.",
    "Validate all guidance against current docket entries and recent opinions.",
  ];

  const artifactContent = formatBriefContent({
    judgeName: profile.judgeName ?? judgeName,
    court: profile.court,
    jurisdiction: profile.jurisdiction,
    sourceOpinionCount: profile.sourceOpinionCount,
    styleNotes,
    citationPreferences,
    argumentGuidance,
    motionTypeGuidance,
    motionType,
    riskNotes,
    limitations,
  });

  return {
    judgeName: profile.judgeName ?? judgeName,
    court: profile.court,
    jurisdiction: profile.jurisdiction,
    matchStatus,
    profileAvailable: true,
    sourceOpinionCount: profile.sourceOpinionCount,
    styleNotes,
    citationPreferences,
    argumentGuidance,
    motionTypeGuidance,
    riskNotes,
    confidence: profile.sourceOpinionCount > 0 ? 0.7 : 0.4,
    limitations,
    artifactContent,
  };
}

function buildDeterministicResult(
  judge: { id: string; full_name: string; court: string | null; jurisdiction: string | null; biography: string | null },
  motionType: string,
  matchStatus: JudgeMatchStatus
): JudgeBriefResult {
  const motionTypeGuidance =
    MOTION_TYPE_GUIDANCE[motionType] ?? MOTION_TYPE_GUIDANCE.general;

  const citationPreferences = buildCitationPreferences(judge.jurisdiction, judge.court);

  const styleNotes = [
    "No cached opinion-derived profile is available for this judge.",
    "Style notes below are generic guidance for this court and jurisdiction.",
  ];

  const argumentGuidance = [
    "Identify the controlling legal standard and cite it precisely.",
    "Ground every factual assertion in the evidentiary record.",
    "Address anticipated counterarguments proactively.",
  ];

  const limitations = [
    "No cached opinion-derived profile found for this judge.",
    "Style and argument notes reflect generic court-level guidance only.",
    "Run npm run seed:litigation-demo to populate demo judge profiles.",
  ];

  const artifactContent = formatBriefContent({
    judgeName: judge.full_name,
    court: judge.court,
    jurisdiction: judge.jurisdiction,
    sourceOpinionCount: 0,
    styleNotes,
    citationPreferences,
    argumentGuidance,
    motionTypeGuidance,
    motionType,
    riskNotes: ["No opinion-based profile available. Guidance is generic."],
    limitations,
  });

  return {
    judgeName: judge.full_name,
    court: judge.court,
    jurisdiction: judge.jurisdiction,
    matchStatus,
    profileAvailable: false,
    sourceOpinionCount: 0,
    styleNotes,
    citationPreferences,
    argumentGuidance,
    motionTypeGuidance,
    riskNotes: ["No opinion-based profile available. Guidance is generic."],
    confidence: 0.2,
    limitations,
    artifactContent,
  };
}

function buildCitationPreferences(
  jurisdiction: string | null,
  court: string | null
): string[] {
  const prefs: string[] = [];
  const jLower = (jurisdiction ?? "").toLowerCase();
  const cLower = (court ?? "").toLowerCase();

  if (jLower.includes("federal") || cLower.includes("sdny") || cLower.includes("s.d.n.y")) {
    prefs.push("Second Circuit controlling authority is binding in this court.");
    prefs.push("SCOTUS precedent carries strong weight.");
    prefs.push("Cite sister-circuit decisions only when Second Circuit has not addressed the issue.");
  } else {
    prefs.push("Cite controlling authority from the applicable appellate court.");
    prefs.push("SCOTUS precedent applies where controlling.");
  }

  prefs.push("Bluebook citation format is the standard for federal court filings.");
  return prefs;
}

function buildLimitations(
  sourceOpinionCount: number,
  profileMotionType: string | null,
  requestedMotionType: string
): string[] {
  const lims: string[] = [];

  if (sourceOpinionCount === 0) {
    lims.push("Profile was generated without opinion-derived data.");
  } else {
    lims.push(
      `Profile derived from ${sourceOpinionCount} indexed opinion(s). Sample size may be limited.`
    );
  }

  if (profileMotionType && profileMotionType !== requestedMotionType) {
    lims.push(
      `Cached profile is for "${profileMotionType}" motions. Some guidance may not apply to "${requestedMotionType}".`
    );
  }

  lims.push(
    "This brief is argument preparation only. It does not predict judicial outcome or behavior."
  );
  lims.push(
    "Validate all guidance against current docket entries and recent published opinions."
  );

  return lims;
}

function formatBriefContent(opts: {
  judgeName: string;
  court: string | null;
  jurisdiction: string | null;
  sourceOpinionCount: number;
  styleNotes: string[];
  citationPreferences: string[];
  argumentGuidance: string[];
  motionTypeGuidance: string[];
  motionType: string;
  riskNotes: string[];
  limitations: string[];
}): string {
  const lines: string[] = [
    `JUDGE BRIEF -- ${opts.judgeName}${opts.court ? ` (${opts.court})` : ""}`,
    `${DEMO_DISCLAIMER}`,
    "",
    "PREPARATION SUMMARY",
    `Argument preparation signals derived from ${opts.sourceOpinionCount} indexed opinion(s).`,
    "Use for preparation and argument tailoring only. Not a prediction of outcome.",
    "",
    "STYLE NOTES",
    ...opts.styleNotes.map((n, i) => `${i + 1}. ${n}`),
    "",
    "CITATION PREFERENCES",
    ...opts.citationPreferences.map((p, i) => `${i + 1}. ${p}`),
    "",
    "ARGUMENT GUIDANCE",
    ...opts.argumentGuidance.map((g, i) => `${i + 1}. ${g}`),
    "",
    `MOTION-TYPE GUIDANCE (${opts.motionType.replace(/_/g, " ")})`,
    ...opts.motionTypeGuidance.map((g, i) => `${i + 1}. ${g}`),
    "",
    "RISK NOTES",
    ...opts.riskNotes.map((r, i) => `${i + 1}. ${r}`),
    "",
    "LIMITATIONS",
    ...opts.limitations.map((l) => `- ${l}`),
  ];

  return lines.join("\n");
}

export async function runLitigationJudgeBriefAgent(
  ctx: AgentContext
): Promise<AgentResult> {
  const start = performance.now();
  const events = [makeEvent("JudgeBriefAgent", "agent_started", "Resolving judge profile")];

  const { judgeId, judgeName, court, jurisdiction, motionType } = ctx.input;

  if (!judgeId && !judgeName) {
    const result = buildNotRequestedResult();
    const latencyMs = Math.round(performance.now() - start);
    events.push(makeEvent("JudgeBriefAgent", "agent_completed", "No judge specified", { latencyMs }));
    return {
      agentName: "JudgeBriefAgent",
      status: "success",
      message: "No judge specified. Skipping judge brief.",
      output: result as unknown as Record<string, unknown>,
      confidence: 0,
      events,
    };
  }

  // Find the judge
  events.push(
    makeEvent("JudgeBriefAgent", "tool_call", judgeName ?? judgeId, {
      toolName: "findJudge",
    })
  );

  const { judge, matchStatus, candidates } = await findJudge({
    judgeId,
    judgeName,
    court,
    jurisdiction,
  });

  events.push(
    makeEvent(
      "JudgeBriefAgent",
      "tool_result",
      `matchStatus: ${matchStatus}, candidates: ${candidates.length}`,
      { toolName: "findJudge" }
    )
  );

  if (!judge || matchStatus === "not_found") {
    const result = buildNotFoundResult(judgeName ?? judgeId ?? "Unknown");
    const latencyMs = Math.round(performance.now() - start);
    events.push(
      makeEvent("JudgeBriefAgent", "agent_completed", "Judge not found", { latencyMs })
    );
    return {
      agentName: "JudgeBriefAgent",
      status: "fallback",
      message: `Judge not found: ${judgeName ?? judgeId}`,
      output: result as unknown as Record<string, unknown>,
      confidence: 0,
      events,
    };
  }

  // Load profile
  events.push(
    makeEvent("JudgeBriefAgent", "tool_call", `profile for ${judge.full_name}`, {
      toolName: "getJudgeProfile",
    })
  );

  const profile = await getJudgeProfile(judge.id, motionType);

  events.push(
    makeEvent(
      "JudgeBriefAgent",
      "tool_result",
      `profileAvailable: ${!!profile}, sourceOpinions: ${profile?.sourceOpinionCount ?? 0}`,
      { toolName: "getJudgeProfile" }
    )
  );

  const mt = motionType ?? "general";
  const ms: JudgeMatchStatus = matchStatus as JudgeMatchStatus;

  const result = profile
    ? buildFromProfile(judge.full_name, profile, mt, ms)
    : buildDeterministicResult(judge, mt, ms);

  const latencyMs = Math.round(performance.now() - start);
  events.push(
    makeEvent(
      "JudgeBriefAgent",
      "agent_completed",
      `Judge: ${result.judgeName} | Profile: ${result.profileAvailable} | Confidence: ${Math.round(result.confidence * 100)}%`,
      { latencyMs }
    )
  );

  return {
    agentName: "JudgeBriefAgent",
    status: "success",
    message: `Judge Brief prepared for ${result.judgeName ?? "unknown"}. Profile available: ${result.profileAvailable}. Source opinions: ${result.sourceOpinionCount}.`,
    output: result as unknown as Record<string, unknown>,
    confidence: result.confidence,
    events,
  };
}
