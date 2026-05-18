export interface JurySimulationInput {
  caseSummary: string;
  legalQuestion: string;
  jurisdiction?: string;
  motionType?: string;
  confidenceHint?: string;
  numAgents: number;
  rounds: number;
}

export interface JurorAction {
  agentId: number;
  agentName: string;
  agentRole: string;
  round: number;
  actionType: string;
  content: string;
  sentiment: "positive" | "negative" | "neutral";
  influenceScore: number;
  keySignals: string[];
}

export interface JurySimulationResult {
  predictionId: string;
  durationSeconds: number;
  totalActions: number;
  sentimentDistribution: { positive: number; negative: number; neutral: number };
  topNarratives: string[];
  emergingTrends: string[];
  report: string;
  sampleActions: JurorAction[];
  numAgents: number;
  rounds: number;
}

export type JurySimulationStatus = "running" | "completed" | "failed";

export interface JurySimulationRecord {
  id: string;
  input: JurySimulationInput;
  status: JurySimulationStatus;
  result: JurySimulationResult | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}
