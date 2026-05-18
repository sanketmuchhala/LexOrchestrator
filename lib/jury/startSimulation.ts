import type { JurySimulationInput } from "./types";
import { callMiroFish } from "./mirofish";
import { buildSeedText } from "./buildSeedText";
import { setSimulation } from "./simulationStore";

export function startSimulation(id: string, input: JurySimulationInput): void {
  const now = new Date().toISOString();

  setSimulation(id, {
    id,
    input,
    status: "running",
    result: null,
    error: null,
    createdAt: now,
    completedAt: null,
  });

  const seedText = buildSeedText(input);

  callMiroFish(seedText, input.numAgents, input.rounds)
    .then((result) => {
      setSimulation(id, {
        id,
        input,
        status: "completed",
        result,
        error: null,
        createdAt: now,
        completedAt: new Date().toISOString(),
      });
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      setSimulation(id, {
        id,
        input,
        status: "failed",
        result: null,
        error: message,
        createdAt: now,
        completedAt: new Date().toISOString(),
      });
    });
}
