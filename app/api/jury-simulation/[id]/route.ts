import { NextRequest, NextResponse } from "next/server";
import { getSimulation } from "@/lib/jury/simulationStore";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const record = getSimulation(id);

  if (!record) {
    return NextResponse.json({ error: "Simulation not found." }, { status: 404 });
  }

  return NextResponse.json({
    id: record.id,
    status: record.status,
    result: record.result,
    error: record.error,
    createdAt: record.createdAt,
    completedAt: record.completedAt,
    numAgents: record.input.numAgents,
    rounds: record.input.rounds,
  });
}
