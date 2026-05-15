// Shared display utilities for rendering API response data across pages.
// All functions are defensive - they handle missing keys, null values, and
// both camelCase and snake_case field names from the API.

export type ApiRecord = Record<string, unknown>;

// ─── Type coercion ────────────────────────────────────────────────────────────

export function asRecord(value: unknown): ApiRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as ApiRecord) : {};
}

export function firstRecord(...values: unknown[]): ApiRecord {
  for (const value of values) {
    const record = asRecord(value);
    if (Object.keys(record).length > 0) return record;
  }
  return {};
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function firstArray(...values: unknown[]): unknown[] {
  for (const value of values) {
    const array = asArray(value);
    if (array.length > 0) return array;
  }
  return [];
}

// ─── Scalar extraction ────────────────────────────────────────────────────────

export function text(value: unknown, fallback = "Not reported"): string {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

export function optionalText(value: unknown): string | null {
  const rendered = text(value, "");
  return rendered || null;
}

export function extractNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

export function normalizedScore(value: unknown, fallback = 0): number {
  const raw = extractNumber(value, fallback);
  const normalized = raw > 1 ? raw / 100 : raw;
  return Math.max(0, Math.min(1, normalized));
}

export function percent(value: unknown, fallback = 0): string {
  return `${Math.round(normalizedScore(value, fallback) * 100)}%`;
}

export function hasScore(value: unknown): boolean {
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value === "string" && value.trim()) return Number.isFinite(Number.parseFloat(value));
  return false;
}

export function formatScore(value: unknown): string {
  if (!hasScore(value)) return "N/A";
  return `${Math.round(normalizedScore(value) * 100)}%`;
}

export function formatMethod(value: unknown): string {
  const m = text(value, "");
  return m ? m.toLowerCase().replace(/\s+/g, "_") : "N/A";
}

export function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((item) => text(item, "")).filter(Boolean);
  if (typeof value === "string" && value.trim()) return [value];
  return [];
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Styling ──────────────────────────────────────────────────────────────────

export const STATUS_STYLES: Record<string, string> = {
  verified:    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  supported:   "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  strong:      "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  complete:    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  pass:        "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  low:         "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  partial:     "border-amber-500/30 bg-amber-500/10 text-amber-300",
  weak:        "border-amber-500/30 bg-amber-500/10 text-amber-300",
  medium:      "border-amber-500/30 bg-amber-500/10 text-amber-300",
  unsupported: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  failed:      "border-rose-500/30 bg-rose-500/10 text-rose-300",
  fail:        "border-rose-500/30 bg-rose-500/10 text-rose-300",
  high:        "border-rose-500/30 bg-rose-500/10 text-rose-300",
  error:       "border-rose-500/30 bg-rose-500/10 text-rose-300",
};

export function styleForStatus(status: string): string {
  return STATUS_STYLES[status.toLowerCase()] ?? "border-slate-600 bg-slate-800 text-slate-300";
}

export function riskFromLevel(level: string): number {
  const n = level.toLowerCase();
  if (n === "low") return 0.18;
  if (n === "medium") return 0.48;
  if (n === "high") return 0.82;
  return 0.35;
}

export function metricTone(value: number, invert = false): string {
  const effective = invert ? 1 - value : value;
  if (effective >= 0.72) return "text-emerald-300";
  if (effective >= 0.45) return "text-amber-300";
  return "text-rose-300";
}

export function methodBadgeStyles(method: string): string {
  if (method.includes("hybrid")) return "border-cyan-400/30 bg-cyan-400/10 text-cyan-200";
  if (method.includes("keyword_fallback")) return "border-amber-400/30 bg-amber-400/10 text-amber-200";
  if (method.includes("vector")) return "border-violet-400/30 bg-violet-400/10 text-violet-200";
  if (method.includes("memory")) return "border-rose-400/30 bg-rose-400/10 text-rose-200";
  return "border-slate-700 bg-slate-800 text-slate-300";
}

// ─── API data extraction helpers ──────────────────────────────────────────────

export function getEvalPayload(result: ApiRecord): ApiRecord {
  const evalReport = asRecord(result.evalReport);
  return firstRecord(evalReport.payload, evalReport.metricsPayload, result.evalPayload);
}

export function getSources(result: ApiRecord): unknown[] {
  const retrieval = asRecord(result.retrieval);
  return firstArray(result.retrievedSources, retrieval.sources, result.sources);
}

export function getRetrievalMethod(result: ApiRecord): unknown {
  const evalPayload = getEvalPayload(result);
  const retrieval = asRecord(result.retrieval);
  const topSource = asRecord(getSources(result)[0]);
  return (
    evalPayload.retrievalMethod ??
    evalPayload.retrieval_method ??
    retrieval.retrievalMethod ??
    retrieval.retrieval_method ??
    topSource.retrievalMethod ??
    topSource.retrieval_method
  );
}
