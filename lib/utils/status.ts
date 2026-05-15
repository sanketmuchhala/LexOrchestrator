export type NormalizedStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "pass"
  | "warn"
  | "unknown";

export function normalizeStatus(status: string | null | undefined): NormalizedStatus {
  const s = String(status ?? "").trim().toLowerCase();
  if (s === "queued" || s === "pending") return "queued";
  if (s === "running" || s === "in_progress" || s === "processing") return "running";
  if (s === "completed" || s === "complete" || s === "success" || s === "verified") {
    return "completed";
  }
  if (s === "failed" || s === "error" || s === "fail" || s === "not_found") return "failed";
  if (s === "pass") return "pass";
  if (s === "warn" || s === "warning") return "warn";
  return "unknown";
}

export function getStatusBadgeClass(status: string | null | undefined): string {
  const normalized = normalizeStatus(status);
  if (normalized === "completed" || normalized === "pass") return "badge-pass";
  if (normalized === "failed") return "badge-fail";
  if (normalized === "running" || normalized === "queued" || normalized === "warn") {
    return "badge-warn";
  }
  return "badge-neutral";
}

export function formatPercent(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return `${Math.round(value * 100)}%`;
}

export function formatScore(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) return "-";
  return value.toFixed(2);
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
