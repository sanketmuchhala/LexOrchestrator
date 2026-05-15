import type { AgentContext, AgentResult, IntakeAgentOutput } from "../types";
import { makeEvent } from "../logAgentEvent";
import { generateStructuredOutput } from "@/lib/llm/llmClient";

const MOTION_PATTERNS: Record<string, string[]> = {
  motion_to_dismiss: ["motion to dismiss", "12(b)(6)", "failure to state", "12(b)"],
  motion_for_summary_judgment: ["summary judgment", "no genuine dispute", "as a matter of law"],
  motion_in_limine: ["in limine", "exclude evidence", "exclude testimony"],
  motion_to_compel: ["compel", "interrogatories", "production of documents"],
  preliminary_injunction: ["preliminary injunction", "injunctive relief", "irreparable harm"],
};

const LEGAL_ISSUE_TERMS: Record<string, string[]> = {
  "breach of contract": ["contract", "breach", "agreement", "performance", "damages"],
  "negligence": ["negligence", "duty", "care", "proximate cause", "injury"],
  "civil procedure": ["motion", "dismiss", "pleading", "summary judgment", "standing"],
  "evidence / admissibility": ["evidence", "admissib", "expert", "hearsay", "privilege"],
  "discovery": ["discovery", "deposition", "interrogator", "production"],
};

function detectMotionType(text: string): string {
  const lower = text.toLowerCase();
  for (const [type, terms] of Object.entries(MOTION_PATTERNS)) {
    if (terms.some((t) => lower.includes(t))) return type;
  }
  return "general";
}

function detectLegalIssues(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.entries(LEGAL_ISSUE_TERMS)
    .filter(([, terms]) => terms.some((t) => lower.includes(t)))
    .map(([issue]) => issue)
    .slice(0, 4);
}

function extractKeyFacts(facts: string | undefined, query: string): string[] {
  const source = facts ?? query;
  return source
    .split(/[.;]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 15)
    .slice(0, 5);
}

function deterministicIntake(input: AgentContext["input"]): IntakeAgentOutput {
  const fullText = [input.query, input.facts ?? ""].join(" ");
  const motionType = input.motionType ?? detectMotionType(fullText);
  const legalIssues = detectLegalIssues(fullText);
  const missingInputs: string[] = [];
  if (!input.facts) missingInputs.push("facts");
  if (!input.motionType) missingInputs.push("motionType");
  if (!input.uploadedText) missingInputs.push("uploadedText");

  return {
    motionType,
    jurisdiction: input.jurisdiction,
    court: input.court,
    keyFacts: extractKeyFacts(input.facts, input.query),
    legalIssues: legalIssues.length > 0 ? legalIssues : ["general legal issue"],
    requestedDraftType: input.desiredOutput ?? motionType,
    missingInputs,
  };
}

export async function runLitigationIntakeAgent(ctx: AgentContext): Promise<AgentResult> {
  const start = performance.now();
  const events = [makeEvent("IntakeAgent", "agent_started", "Normalizing litigation request")];

  const fallback = deterministicIntake(ctx.input);

  const result = await generateStructuredOutput<IntakeAgentOutput>({
    system: `You are a litigation intake specialist. Given the user's litigation request, normalize it and return JSON with these exact keys:
- motionType: string (e.g. "motion_to_dismiss", "motion_for_summary_judgment", "general")
- jurisdiction: string
- court: string
- keyFacts: string[] (up to 5 key facts from the facts/query field)
- legalIssues: string[] (up to 4 specific legal issues present)
- requestedDraftType: string (what type of draft the user wants)
- missingInputs: string[] (names of inputs that would improve the analysis but are absent)
Return JSON only. No prose.`,
    prompt: `Query: ${ctx.input.query}
Jurisdiction: ${ctx.input.jurisdiction}
Court: ${ctx.input.court}
Motion type: ${ctx.input.motionType ?? "not specified"}
Facts: ${ctx.input.facts ?? "not provided"}
Desired output: ${ctx.input.desiredOutput ?? "not specified"}`,
    schemaName: "IntakeAgentOutput",
    fallback,
  });

  const validated =
    Array.isArray(result.legalIssues) && result.motionType ? result : fallback;

  const latencyMs = Math.round(performance.now() - start);
  events.push(makeEvent("IntakeAgent", "agent_completed", `Motion type: ${validated.motionType}`, { latencyMs }));

  return {
    agentName: "IntakeAgent",
    status: "success",
    message: `Intake complete. Motion type: ${validated.motionType}. Issues: ${validated.legalIssues.join(", ")}`,
    output: validated as unknown as Record<string, unknown>,
    confidence: 0.85,
    events,
  };
}
