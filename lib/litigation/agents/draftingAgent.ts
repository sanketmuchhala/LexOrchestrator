import type {
  AgentContext,
  AgentResult,
  DraftingAgentOutput,
  IntakeAgentOutput,
  RetrievalAgentOutput,
  DraftSection,
} from "../types";
import { makeEvent } from "../logAgentEvent";
import { generateStructuredOutput } from "@/lib/llm/llmClient";
import type { LegalOpinionSearchResult } from "@/lib/types";

function buildCitationList(authority: LegalOpinionSearchResult[]): string[] {
  return authority
    .filter((r) => r.citation)
    .map((r) => r.citation!)
    .filter((c, i, arr) => arr.indexOf(c) === i)
    .slice(0, 6);
}

function buildAuthoritySnippets(authority: LegalOpinionSearchResult[], limit: number): string {
  return authority
    .slice(0, limit)
    .map((r) => `${r.caseName}${r.citation ? ` (${r.citation})` : ""}: "${r.chunkText.slice(0, 180)}"`)
    .join("\n\n");
}

function deterministicDraft(
  ctx: AgentContext,
  intake: IntakeAgentOutput,
  citations: string[]
): DraftingAgentOutput {
  const hasCitations = citations.length > 0;
  const noCiteNotice = hasCitations
    ? ""
    : "\n\nNOTE: No verified legal citations were retrieved. This draft contains no verified legal citations and must be supplemented with properly researched authority before use.";

  const authorityBlock = hasCitations
    ? ctx.retrievedAuthority
        .slice(0, 3)
        .map((r) => `${r.caseName}${r.citation ? `, ${r.citation}` : ""}: ${r.chunkText.slice(0, 150)}...`)
        .join("\n\n")
    : "No authority retrieved.";

  const sections: DraftSection[] = [
    {
      heading: "PRELIMINARY STATEMENT",
      content: `Pursuant to ${intake.motionType.replace(/_/g, " ")}, ${ctx.input.query}${noCiteNotice}`,
      citations: [],
    },
    {
      heading: "STATEMENT OF RELEVANT FACTS",
      content: ctx.input.facts ?? "The underlying facts are as set forth in the record.",
      citations: [],
    },
    {
      heading: "LEGAL STANDARD",
      content: `The applicable standard in ${intake.jurisdiction} requires the following analysis.\n\n${authorityBlock}`,
      citations: citations.slice(0, 2),
    },
    {
      heading: "ARGUMENT",
      content: `Based on the retrieved authority and the facts stated above, the movant respectfully submits that ${ctx.input.query}`,
      citations,
    },
    {
      heading: "CONCLUSION",
      content: "For the foregoing reasons, the Court should grant the relief requested.",
      citations: [],
    },
  ];

  const draftText = sections.map((s) => `${s.heading}\n\n${s.content}`).join("\n\n");

  return {
    title: `${intake.motionType.replace(/_/g, " ").toUpperCase()} -- ${ctx.input.court}`,
    sections,
    draftText,
    citations,
    artifactType: "outline",
  };
}

export async function runLitigationDraftingAgent(
  ctx: AgentContext,
  intake: IntakeAgentOutput,
  retrieval: RetrievalAgentOutput
): Promise<AgentResult> {
  const start = performance.now();
  const events = [makeEvent("DraftingAgent", "agent_started", "Generating motion outline")];

  const citations = buildCitationList(retrieval.retrievedAuthority);
  const fallback = deterministicDraft(ctx, intake, citations);

  const result = await generateStructuredOutput<DraftingAgentOutput>({
    system: `You are a litigation drafting assistant. Generate a structured motion outline as JSON with these exact keys:
- title: string (motion title including court)
- sections: array of { heading: string, content: string, citations: string[] }
  Use these exact section headings in order:
  1. PRELIMINARY STATEMENT
  2. STATEMENT OF RELEVANT FACTS
  3. LEGAL STANDARD
  4. ARGUMENT
  5. CONCLUSION
- draftText: string (all sections concatenated as a single coherent draft, headings followed by content)
- citations: string[] (only citations from the authority provided -- do not invent citations)
- artifactType: "outline"

CRITICAL: Only use citations from the authority provided below.
If no authority is available, include in LEGAL STANDARD: "NOTE: No verified legal citations were retrieved. This draft must be supplemented with properly researched authority before use."
Return JSON only.`,
    prompt: `Motion type: ${intake.motionType}
Jurisdiction: ${intake.jurisdiction} | Court: ${intake.court}
Query: ${ctx.input.query}
Facts: ${ctx.input.facts ?? "Not provided"}
Retrieved authority:\n${buildAuthoritySnippets(retrieval.retrievedAuthority, 4) || "None"}
Available citations: ${citations.join(", ") || "none"}`,
    schemaName: "DraftingAgentOutput",
    fallback,
  });

  const validated =
    Array.isArray(result.sections) && result.draftText && result.sections.length > 0
      ? result
      : fallback;

  const latencyMs = Math.round(performance.now() - start);
  events.push(makeEvent("DraftingAgent", "draft_chunk", validated.title, { latencyMs }));
  events.push(
    makeEvent(
      "DraftingAgent",
      "agent_completed",
      `Draft: ${validated.sections.length} sections, ${validated.citations.length} citations`
    )
  );

  return {
    agentName: "DraftingAgent",
    status: "success",
    message: `Draft generated: ${validated.sections.length} sections, ${validated.citations.length} citations`,
    output: validated as unknown as Record<string, unknown>,
    confidence: validated.citations.length > 0 ? 0.75 : 0.5,
    events,
  };
}
