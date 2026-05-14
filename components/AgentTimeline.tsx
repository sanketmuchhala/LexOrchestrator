"use client";

import type { OrchestratorResult } from "@/lib/types";
import AgentCard from "./AgentCard";

interface AgentTimelineProps {
  result: OrchestratorResult;
}

export default function AgentTimeline({ result }: AgentTimelineProps) {
  const { intake, citationValidation, adversarialReview, finalAnswer, evalReport, executionTrace } = result;

  const getStep = (agent: string) => executionTrace.find((s) => s.agent === agent);

  const agents = [
    {
      agentName: "Intake Agent",
      icon: "🔍",
      summary: `Classified as "${intake.queryClassification}" · Jurisdiction: ${intake.jurisdiction} · Risk: ${intake.riskLevel.toUpperCase()} · Extracted ${intake.keyTerms.length} key terms.`,
      score: intake.confidence,
      scoreLabel: "confidence",
      executionStep: getStep("Intake Agent"),
    },
    {
      agentName: "Retrieval Agent",
      icon: "📚",
      summary: `Retrieved ${result.retrievedSources.length} of ${12} corpus entries. Top hit: "${result.retrievedSources[0]?.title ?? "none"}" (${((result.retrievedSources[0]?.relevanceScore ?? 0) * 100).toFixed(0)}% relevance).`,
      score: evalReport.retrievalCoverage,
      scoreLabel: "coverage",
      executionStep: getStep("Retrieval Agent"),
    },
    {
      agentName: "Citation Validator",
      icon: "✅",
      summary: `Validated ${citationValidation.claims.length} claims — ${citationValidation.supportedCount} supported, ${citationValidation.unsupportedCount} unsupported. ${citationValidation.flags.length > 0 ? citationValidation.flags[0] : "No critical flags."}`,
      score: citationValidation.overallScore,
      scoreLabel: "citation support",
      executionStep: getStep("Citation Validator"),
    },
    {
      agentName: "Adversarial Review",
      icon: "⚔️",
      summary: `${adversarialReview.summary}`,
      riskLevel: adversarialReview.overallRisk,
      executionStep: getStep("Adversarial Review"),
    },
    {
      agentName: "Final Synthesis",
      icon: "📝",
      summary: `Generated legal analysis citing ${finalAnswer.citations.length} source(s). ${finalAnswer.riskFlags.length} risk flag(s) included. ${finalAnswer.unresolvedQuestions.length} unresolved question(s) flagged.`,
      score: finalAnswer.confidenceScore,
      scoreLabel: "confidence",
      executionStep: getStep("Final Synthesis"),
    },
    {
      agentName: "Eval Engine",
      icon: "📊",
      summary: `Overall reliability: ${Math.round(evalReport.overallReliability * 100)}% · Groundedness: ${Math.round(evalReport.groundednessScore * 100)}% · Hallucination risk: ${evalReport.hallucinationRisk.toUpperCase()}`,
      score: evalReport.overallReliability,
      scoreLabel: "reliability",
      riskLevel: evalReport.hallucinationRisk,
      executionStep: getStep("Eval Engine"),
    },
  ];

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">
        Agent Pipeline
      </h2>
      {agents.map((agent, i) => (
        <AgentCard
          key={agent.agentName}
          status="complete"
          animationDelay={i * 120}
          {...agent}
        />
      ))}
    </div>
  );
}
