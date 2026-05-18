import { NextRequest, NextResponse } from "next/server";
import { startSimulation } from "@/lib/jury/startSimulation";
import type { JurySimulationInput } from "@/lib/jury/types";

function apiError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body.", 400);
  }

  const caseSummary = typeof body.caseSummary === "string" ? body.caseSummary.trim() : "";
  if (!caseSummary || caseSummary.length < 10) {
    return apiError("caseSummary is required (minimum 10 characters).", 400);
  }
  if (caseSummary.length > 2000) {
    return apiError("caseSummary must be under 2000 characters.", 400);
  }

  const legalQuestion = typeof body.legalQuestion === "string" ? body.legalQuestion.trim() : "";
  if (!legalQuestion || legalQuestion.length < 5) {
    return apiError("legalQuestion is required (minimum 5 characters).", 400);
  }
  if (legalQuestion.length > 500) {
    return apiError("legalQuestion must be under 500 characters.", 400);
  }

  const rawAgents = typeof body.numAgents === "number" ? body.numAgents : 12;
  const numAgents = Math.max(10, Math.min(20, Math.round(rawAgents)));

  const rawRounds = typeof body.rounds === "number" ? body.rounds : 3;
  const rounds = Math.max(1, Math.min(5, Math.round(rawRounds)));

  const input: JurySimulationInput = {
    caseSummary,
    legalQuestion,
    jurisdiction: typeof body.jurisdiction === "string" ? body.jurisdiction.trim() : undefined,
    motionType: typeof body.motionType === "string" ? body.motionType.trim() : undefined,
    confidenceHint: typeof body.confidenceHint === "string" ? body.confidenceHint.trim() : undefined,
    numAgents,
    rounds,
  };

  const id = crypto.randomUUID();
  startSimulation(id, input);

  return NextResponse.json({
    id,
    status: "running",
    estimatedSeconds: numAgents >= 15 ? 120 : 60,
  });
}
