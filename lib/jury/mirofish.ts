import type { JurorAction, JurySimulationResult } from "./types";

function toSentiment(raw: string | undefined): "positive" | "negative" | "neutral" {
  if (raw === "positive") return "positive";
  if (raw === "negative") return "negative";
  return "neutral";
}

function parseAction(data: Record<string, unknown>): JurorAction {
  return {
    agentId:        typeof data.agent_id        === "number" ? data.agent_id        : 0,
    agentName:      typeof data.agent_name      === "string" ? data.agent_name      : "Agent",
    agentRole:      typeof data.agent_role      === "string" ? data.agent_role      : "Citizen",
    round:          typeof data.round           === "number" ? data.round           : 1,
    actionType:     typeof data.action_type     === "string" ? data.action_type     : "CREATE_POST",
    content:        typeof data.content         === "string" ? data.content         : "",
    sentiment:      toSentiment(typeof data.sentiment === "string" ? data.sentiment : undefined),
    influenceScore: typeof data.influence_score === "number" ? data.influence_score : 0,
    keySignals:     Array.isArray(data.key_signals)
      ? (data.key_signals as unknown[]).filter((s): s is string => typeof s === "string")
      : [],
  };
}

function parseResult(data: Record<string, unknown>, actions: JurorAction[]): JurySimulationResult {
  const dist = (data.sentiment_distribution ?? {}) as Record<string, unknown>;
  return {
    predictionId:    typeof data.prediction_id    === "string" ? data.prediction_id    : "unknown",
    durationSeconds: typeof data.duration_seconds === "number" ? data.duration_seconds : 0,
    totalActions:    typeof data.total_actions    === "number" ? data.total_actions    : actions.length,
    sentimentDistribution: {
      positive: typeof dist.positive === "number" ? dist.positive : 0,
      negative: typeof dist.negative === "number" ? dist.negative : 0,
      neutral:  typeof dist.neutral  === "number" ? dist.neutral  : 0,
    },
    topNarratives:  Array.isArray(data.top_narratives)
      ? (data.top_narratives as unknown[]).filter((s): s is string => typeof s === "string")
      : [],
    emergingTrends: Array.isArray(data.emerging_trends)
      ? (data.emerging_trends as unknown[]).filter((s): s is string => typeof s === "string")
      : [],
    report:      typeof data.report      === "string" ? data.report      : "",
    sampleActions: actions,
    numAgents:   typeof data.num_agents  === "number" ? data.num_agents  : 0,
    rounds:      typeof data.rounds      === "number" ? data.rounds      : 0,
  };
}

function getEnv(): { url: string; key: string } {
  const url = process.env.MIROFISH_URL;
  const key = process.env.MIROFISH_KEY;
  if (!url || !key) throw new Error("MIROFISH_URL and MIROFISH_KEY must be set.");
  return { url, key };
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Start a job ─────────────────────────────────────────────────────────────

export async function startMiroFishJob(
  seedText: string,
  numAgents: number,
  rounds: number
): Promise<string> {
  const { url, key } = getEnv();

  const res = await fetch(`${url}/api/predict/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-payment": key },
    body: JSON.stringify({ seed_text: seedText, num_agents: numAgents, rounds }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`MiroFish /start returned ${res.status}: ${text.slice(0, 300)}`);
  }

  // Accept any of: job_id, id, prediction_id
  const data = (await res.json()) as Record<string, unknown>;
  const jobId =
    typeof data.job_id        === "string" ? data.job_id        :
    typeof data.id            === "string" ? data.id            :
    typeof data.prediction_id === "string" ? data.prediction_id :
    null;

  if (!jobId) {
    throw new Error(
      `MiroFish /start did not return a job_id. Got: ${JSON.stringify(data).slice(0, 200)}`
    );
  }

  console.warn(`[MiroFish] Job started: ${jobId}`);
  return jobId;
}

// ── Consume SSE stream ──────────────────────────────────────────────────────

export async function consumeMiroFishStream(
  jobId: string,
  onAction: (action: JurorAction) => void,
  onComplete: (result: JurySimulationResult) => void,
  onError: (message: string) => void
): Promise<void> {
  const { url, key } = getEnv();
  const streamUrl = `${url}/api/predict/${jobId}/stream?token=${encodeURIComponent(key)}`;

  // Retry up to 4 times with growing delays to handle race condition on MiroFish side
  const DELAYS = [800, 1500, 2500, 4000];
  let lastError = "";

  for (let attempt = 0; attempt <= DELAYS.length; attempt++) {
    if (attempt > 0) {
      console.warn(`[MiroFish] Stream attempt ${attempt + 1}, waiting ${DELAYS[attempt - 1]}ms...`);
      await sleep(DELAYS[attempt - 1]);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 180_000);

    let res: Response;
    try {
      res = await fetch(streamUrl, {
        headers: { Accept: "text/event-stream" },
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeout);
      if ((err as { name?: string }).name === "AbortError") {
        onError("Simulation timed out after 180 seconds.");
        return;
      }
      lastError = err instanceof Error ? err.message : String(err);
      continue;
    }

    // 404 "Job not found" → retry (race condition on MiroFish side)
    if (res.status === 404) {
      clearTimeout(timeout);
      const body = await res.text().catch(() => "");
      lastError = `404: ${body.slice(0, 100)}`;
      console.warn(`[MiroFish] Stream 404 on attempt ${attempt + 1}: ${lastError}`);
      continue;
    }

    if (!res.ok || !res.body) {
      clearTimeout(timeout);
      const text = await res.text().catch(() => "");
      onError(`MiroFish stream returned ${res.status}: ${text.slice(0, 200)}`);
      return;
    }

    // Connected — consume the stream
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    const collectedActions: JurorAction[] = [];
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;
          const json = line.slice(5).trim();
          if (!json) continue;

          let event: Record<string, unknown>;
          try {
            event = JSON.parse(json) as Record<string, unknown>;
          } catch {
            continue;
          }

          const type = event.type;
          if (type === "action") {
            const action = parseAction(event);
            collectedActions.push(action);
            onAction(action);
          } else if (type === "complete") {
            onComplete(parseResult(event, collectedActions));
            return;
          } else if (type === "error") {
            const msg = typeof event.message === "string" ? event.message : "Unknown error from MiroFish";
            onError(msg);
            return;
          }
          // "heartbeat" — ignore
        }
      }
      // Stream ended without a "complete" event — treat collected actions as the result
      if (collectedActions.length > 0) {
        onComplete(parseResult({}, collectedActions));
      } else {
        onError("Stream closed without completing.");
      }
      return;
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") {
        onError("Simulation timed out after 180 seconds.");
      } else {
        onError(err instanceof Error ? err.message : String(err));
      }
      return;
    } finally {
      clearTimeout(timeout);
      reader.releaseLock();
    }
  }

  // All retries exhausted
  onError(`MiroFish stream unavailable after ${DELAYS.length + 1} attempts. Last error: ${lastError}`);
}
