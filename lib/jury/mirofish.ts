import type { JurorAction, JurySimulationResult } from "./types";

interface RawAction {
  agent_id?: number;
  agent_name?: string;
  agent_role?: string;
  round?: number;
  action_type?: string;
  content?: string;
  sentiment?: string;
  influence_score?: number;
  key_signals?: string[];
}

interface RawResponse {
  prediction_id?: string;
  duration_seconds?: number;
  total_actions?: number;
  sentiment_distribution?: { positive?: number; negative?: number; neutral?: number };
  top_narratives?: string[];
  emerging_trends?: string[];
  report?: string;
  sample_actions?: RawAction[];
  num_agents?: number;
  rounds?: number;
}

function toSentiment(raw: string | undefined): "positive" | "negative" | "neutral" {
  if (raw === "positive") return "positive";
  if (raw === "negative") return "negative";
  return "neutral";
}

export async function callMiroFish(
  seedText: string,
  numAgents: number,
  rounds: number
): Promise<JurySimulationResult> {
  const url = process.env.MIROFISH_URL;
  const key = process.env.MIROFISH_KEY;

  if (!url || !key) {
    throw new Error("MIROFISH_URL and MIROFISH_KEY must be set in environment.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180_000);

  let res: Response;
  try {
    res = await fetch(`${url}/api/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-payment": key,
      },
      body: JSON.stringify({ seed_text: seedText, num_agents: numAgents, rounds }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`MiroFish returned ${res.status}: ${text.slice(0, 200)}`);
  }

  const raw: RawResponse = await res.json();

  const sampleActions: JurorAction[] = (raw.sample_actions ?? []).map((a) => ({
    agentId: a.agent_id ?? 0,
    agentName: a.agent_name ?? "Agent",
    agentRole: a.agent_role ?? "Citizen",
    round: a.round ?? 1,
    actionType: a.action_type ?? "CREATE_POST",
    content: a.content ?? "",
    sentiment: toSentiment(a.sentiment),
    influenceScore: a.influence_score ?? 0,
    keySignals: a.key_signals ?? [],
  }));

  return {
    predictionId: raw.prediction_id ?? "unknown",
    durationSeconds: raw.duration_seconds ?? 0,
    totalActions: raw.total_actions ?? 0,
    sentimentDistribution: {
      positive: raw.sentiment_distribution?.positive ?? 0,
      negative: raw.sentiment_distribution?.negative ?? 0,
      neutral:  raw.sentiment_distribution?.neutral  ?? 0,
    },
    topNarratives: raw.top_narratives ?? [],
    emergingTrends: raw.emerging_trends ?? [],
    report: raw.report ?? "",
    sampleActions,
    numAgents: raw.num_agents ?? numAgents,
    rounds: raw.rounds ?? rounds,
  };
}
