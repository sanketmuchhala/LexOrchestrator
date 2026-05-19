import type { JurySimulationInput } from "./types";
import { startMiroFishJob, consumeMiroFishStream } from "./mirofish";
import { buildSeedText } from "./buildSeedText";
import { setSimulation, pushAction } from "./simulationStore";

export function startSimulation(id: string, input: JurySimulationInput): void {
  const now = new Date().toISOString();

  setSimulation(id, {
    id,
    input,
    status: "running",
    actionsReceivedSoFar: [],
    result: null,
    error: null,
    createdAt: now,
    completedAt: null,
  });

  const seedText = buildSeedText(input);

  // Fire-and-forget: start job then stream results into the store
  (async () => {
    let jobId: string;
    try {
      jobId = await startMiroFishJob(seedText, input.numAgents, input.rounds);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setSimulation(id, {
        id, input,
        status: "failed",
        actionsReceivedSoFar: [],
        result: null,
        error: message,
        createdAt: now,
        completedAt: new Date().toISOString(),
      });
      return;
    }

    await consumeMiroFishStream(
      jobId,
      (action) => {
        // Each action arrives in real time — push it into the store immediately
        pushAction(id, action);
      },
      (result) => {
        // Stream complete — store final result
        setSimulation(id, {
          id, input,
          status: "completed",
          actionsReceivedSoFar: result.sampleActions,
          result,
          error: null,
          createdAt: now,
          completedAt: new Date().toISOString(),
        });
      },
      (errorMessage) => {
        const current = { id, input, status: "failed" as const, result: null, error: errorMessage, createdAt: now, completedAt: new Date().toISOString() };
        setSimulation(id, { ...current, actionsReceivedSoFar: [] });
      }
    );
  })();
}
