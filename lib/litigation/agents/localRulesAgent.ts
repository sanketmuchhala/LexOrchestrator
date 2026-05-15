import type { AgentContext, AgentResult, LocalRulesAgentOutput, IntakeAgentOutput } from "../types";
import { makeEvent } from "../logAgentEvent";

interface JurisdictionRules {
  formattingNotes: string[];
  ruleWarnings: string[];
}

const JURISDICTION_RULES: Record<string, JurisdictionRules> = {
  sdny: {
    formattingNotes: [
      "SDNY requires 12-point Times New Roman or equivalent proportionally spaced font (Local Rule 11.1).",
      "Briefs must be double-spaced with 1-inch margins on all sides (Local Rule 11.1).",
      "Individual judge rules may impose additional page limits -- always check the assigned judge's individual practices.",
      "Tables of contents and authorities are required for briefs exceeding 10 pages.",
    ],
    ruleWarnings: [
      "SDNY requires pre-motion conference letters before filing most dispositive motions (Local Rule 7.1(a)).",
      "Memoranda of law in support of motions are limited to 25 pages without court permission.",
      "Reply memoranda are limited to 10 pages without court permission.",
      "NOTE: This summary covers common SDNY local rules only. Always consult the current Local Rules and the assigned judge's individual rules before filing.",
    ],
  },
  federal: {
    formattingNotes: [
      "Federal court briefs must comply with applicable local rules for font, margins, and spacing.",
      "Citation format should follow The Bluebook: A Uniform System of Citation.",
      "Case names in citations should be italicized or underlined per Bluebook Rule 10.",
    ],
    ruleWarnings: [
      "Page and word limits vary by district -- confirm the specific court's local rules.",
      "Certificates of compliance are required for briefs subject to word limits (FRAP 32(g)).",
      "NOTE: This summary covers generic federal standards only. Always confirm court-specific local rules before filing.",
    ],
  },
  "new york": {
    formattingNotes: [
      "New York state court papers must comply with 22 NYCRR Part 202 (Uniform Civil Rules for Supreme Court).",
      "Affidavits and affirmations must be notarized or contain the required CPLR 2106 affirmation language.",
      "Briefs filed in the Appellate Division must comply with applicable Part 1000 rules.",
    ],
    ruleWarnings: [
      "Commercial Division rules apply in IAS Commercial Parts -- check Part 48 for additional requirements.",
      "E-filing through NYSCEF is required in most New York County Supreme Court matters.",
      "NOTE: This summary covers common New York state standards. Always confirm Part-specific and judge-specific rules before filing.",
    ],
  },
};

function matchJurisdiction(jurisdiction: string, court: string): JurisdictionRules {
  const combined = `${jurisdiction} ${court}`.toLowerCase();
  if (
    combined.includes("sdny") ||
    combined.includes("s.d.n.y") ||
    combined.includes("southern district of new york")
  ) {
    return JURISDICTION_RULES.sdny;
  }
  if (combined.includes("new york") && !combined.includes("federal")) {
    return JURISDICTION_RULES["new york"];
  }
  return JURISDICTION_RULES.federal;
}

export async function runLitigationLocalRulesAgent(
  ctx: AgentContext,
  intake: IntakeAgentOutput
): Promise<AgentResult> {
  const start = performance.now();
  const events = [makeEvent("LocalRulesAgent", "agent_started", `Applying local rules: ${ctx.input.court}`)];

  const rules = matchJurisdiction(intake.jurisdiction, ctx.input.court);

  const output: LocalRulesAgentOutput = {
    formattingNotes: rules.formattingNotes,
    ruleWarnings: rules.ruleWarnings,
  };

  const latencyMs = Math.round(performance.now() - start);
  events.push(
    makeEvent("LocalRulesAgent", "agent_completed", `${rules.ruleWarnings.length} rule warnings issued`, { latencyMs })
  );

  return {
    agentName: "LocalRulesAgent",
    status: "success",
    message: `Local rules applied for ${ctx.input.court}. ${rules.formattingNotes.length} formatting notes, ${rules.ruleWarnings.length} rule warnings.`,
    output: output as unknown as Record<string, unknown>,
    confidence: 0.7,
    events,
  };
}
