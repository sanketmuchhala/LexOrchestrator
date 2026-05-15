import type { AgentContext, AgentResult, LocalRulesAgentOutput, IntakeAgentOutput } from "../types";
import { makeEvent } from "../logAgentEvent";
import { getLocalRules } from "../localRules/getLocalRules";
import { checkDraftAgainstRules, getMissingSections } from "../localRules/checkDraftAgainstRules";
import type { LocalRuleProfile } from "../localRules/types";

function buildWarnings(
  profile: LocalRuleProfile,
  missingSections: string[],
  motionType: string
): string[] {
  const warnings: string[] = [];

  if (missingSections.length > 0) {
    warnings.push(
      `${missingSections.length} required section(s) not detected: ${missingSections.join(", ")}.`
    );
  }

  if (profile.id === "sdny") {
    if (motionType === "motion_to_dismiss" || motionType === "motion_for_summary_judgment") {
      warnings.push(
        "SDNY dispositive motions typically require a pre-motion conference letter to the assigned judge before filing (Local Rule 7.1(a))."
      );
    }
    warnings.push(
      "Individual judge practices in SDNY vary significantly. Verify the assigned judge's individual rules."
    );
  }

  if (profile.id === "new_york_state_generic") {
    warnings.push(
      "New York state motion papers typically require affirmation or affidavit support for factual assertions."
    );
    warnings.push(
      "Verify e-filing requirements via NYSCEF for the applicable county and part."
    );
  }

  return warnings;
}

function formatArtifactContent(
  profile: LocalRuleProfile,
  sectionChecks: LocalRulesAgentOutput["sectionChecks"],
  missingSections: string[],
  warnings: string[]
): string {
  const lines: string[] = [
    `LOCAL RULES REVIEW -- ${profile.label}`,
    "[DRAFTING REMINDER] This review contains formatting checks and reminders only.",
    "It does not constitute a compliance certification or legal advice.",
    "",
    "PROFILE",
    `Profile: ${profile.label}`,
    `Jurisdiction: ${profile.jurisdiction}${profile.court ? ` / ${profile.court}` : ""}`,
    "",
    "SECTION ANALYSIS",
    `Required sections detected: ${sectionChecks.filter((s) => s.detected && s.required).length} of ${sectionChecks.filter((s) => s.required).length}`,
    ...sectionChecks
      .filter((s) => s.required)
      .map((s) => `  [${s.detected ? "DETECTED" : "MISSING"}] ${s.label}`),
  ];

  if (missingSections.length > 0) {
    lines.push("", "MISSING SECTIONS");
    missingSections.forEach((sec) => lines.push(`- ${sec}`));
  }

  if (profile.formattingNotes.length > 0) {
    lines.push("", "FORMATTING NOTES");
    profile.formattingNotes.forEach((n, i) => lines.push(`${i + 1}. ${n}`));
  }

  if (profile.citationNotes.length > 0) {
    lines.push("", "CITATION NOTES");
    profile.citationNotes.forEach((n, i) => lines.push(`${i + 1}. ${n}`));
  }

  if (profile.filingNotes.length > 0) {
    lines.push("", "FILING NOTES");
    profile.filingNotes.forEach((n, i) => lines.push(`${i + 1}. ${n}`));
  }

  if (warnings.length > 0) {
    lines.push("", "WARNINGS");
    warnings.forEach((w, i) => lines.push(`${i + 1}. ${w}`));
  }

  if (profile.limitations.length > 0) {
    lines.push("", "LIMITATIONS");
    profile.limitations.forEach((l) => lines.push(`- ${l}`));
  }

  return lines.join("\n");
}

export async function runLitigationLocalRulesAgent(
  ctx: AgentContext,
  intake: IntakeAgentOutput,
  draftText?: string
): Promise<AgentResult> {
  const start = performance.now();
  const events = [
    makeEvent("LocalRulesAgent", "agent_started", `Applying local rules: ${ctx.input.court}`),
  ];

  const profile = getLocalRules(intake.jurisdiction, ctx.input.court);

  events.push(
    makeEvent("LocalRulesAgent", "tool_call", `Profile: ${profile.label}`, {
      toolName: "getLocalRules",
    })
  );

  const sectionChecks = checkDraftAgainstRules(draftText ?? "", profile);
  const missingSections = getMissingSections(sectionChecks);

  events.push(
    makeEvent(
      "LocalRulesAgent",
      "tool_result",
      `${sectionChecks.filter((s) => s.detected && s.required).length}/${sectionChecks.filter((s) => s.required).length} sections detected`,
      { toolName: "checkDraftAgainstRules" }
    )
  );

  const warnings = buildWarnings(profile, missingSections, intake.motionType);

  const confidence =
    missingSections.length === 0 ? 0.8 : missingSections.length <= 2 ? 0.6 : 0.4;

  const artifactContent = formatArtifactContent(profile, sectionChecks, missingSections, warnings);

  const output: LocalRulesAgentOutput = {
    profileId: profile.id,
    profileLabel: profile.label,
    formattingNotes: profile.formattingNotes,
    requiredSections: profile.requiredSections,
    missingSections,
    citationNotes: profile.citationNotes,
    filingNotes: profile.filingNotes,
    warnings,
    confidence,
    limitations: profile.limitations,
    artifactContent,
    sectionChecks,
  };

  const latencyMs = Math.round(performance.now() - start);
  events.push(
    makeEvent(
      "LocalRulesAgent",
      "agent_completed",
      `Profile: ${profile.label} | Missing sections: ${missingSections.length} | Warnings: ${warnings.length}`,
      { latencyMs }
    )
  );

  return {
    agentName: "LocalRulesAgent",
    status: "success",
    message: `Local rules applied (${profile.label}). ${missingSections.length} missing section(s). ${warnings.length} warning(s).`,
    output: output as unknown as Record<string, unknown>,
    confidence,
    events,
  };
}
