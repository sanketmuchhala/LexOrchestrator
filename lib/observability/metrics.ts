export function sumNumbers(values: number[]): number {
  return values.reduce((sum, v) => sum + v, 0);
}

export function average(values: number[]): number {
  if (values.length === 0) return 0;
  return sumNumbers(values) / values.length;
}

export function percentile(sortedValues: number[], p: number): number {
  if (sortedValues.length === 0) return 0;
  const idx = Math.ceil((p / 100) * sortedValues.length) - 1;
  return sortedValues[Math.max(0, Math.min(idx, sortedValues.length - 1))];
}

export function clampNumber(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function safeMs(start: string, end: string | null | undefined): number | null {
  if (!end) return null;
  try {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return diff >= 0 ? diff : null;
  } catch {
    return null;
  }
}

export function formatDurationMs(ms: number | null | undefined): string {
  if (ms == null) return "N/A";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

export function formatCost(usd: number | null | undefined, isEstimated: boolean): string {
  if (usd == null || usd === 0) return "N/A";
  const base = `$${usd.toFixed(4)}`;
  return isEstimated ? `~${base} (est.)` : base;
}

export function formatTokens(count: number | null | undefined): string {
  if (count == null || count === 0) return "N/A";
  return count.toLocaleString();
}

// Conservative illustrative pricing used only when actual cost_usd is missing.
// Not guaranteed to match any provider's actual pricing. Values derived from estimates
// are labeled as estimates to distinguish them from recorded actuals.
const ESTIMATED_COST_PER_1K_TOKENS = 0.002;

export function estimateCostFromTokens(tokenCount: number | null | undefined): number | null {
  if (tokenCount == null || tokenCount === 0) return null;
  return (tokenCount / 1000) * ESTIMATED_COST_PER_1K_TOKENS;
}
