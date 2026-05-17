"use client";

import { useRouter } from "next/navigation";

interface RunCardProps {
  id: string;
  query: string;
  status: string;
  model: string | null;
  confidence: number | null;
  hallucination_risk: number | null;
  created_at: string;
}

function riskLevel(score: number | null): { label: string; cls: string } {
  if (score === null) return { label: "N/A", cls: "badge-neutral" };
  const pct = Math.round(score * 100);
  if (pct <= 20) return { label: "LOW",    cls: "badge-pass" };
  if (pct <= 50) return { label: "MED",    cls: "badge-warn" };
  return             { label: "HIGH",   cls: "badge-fail" };
}

function passFailClass(confidence: number | null): string {
  if (confidence === null) return "badge-neutral";
  return confidence >= 0.6 ? "badge-pass" : "badge-fail";
}

function passFailLabel(confidence: number | null): string {
  if (confidence === null) return "UNKNOWN";
  return confidence >= 0.6 ? "PASS" : "FAIL";
}

function confColor(v: number): string {
  if (v >= 0.7) return "#34d399";
  if (v >= 0.4) return "#fbbf24";
  return "#f87171";
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function RunCard({
  id,
  query,
  confidence,
  hallucination_risk,
  created_at,
}: RunCardProps) {
  const router = useRouter();
  const risk = riskLevel(hallucination_risk);
  const confPct = confidence != null ? Math.round(confidence * 100) : null;

  return (
    <tr
      onClick={() => router.push(`/runs/${id}`)}
      className="cursor-pointer transition-colors"
      style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--s1)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Date */}
      <td
        className="py-4 pr-6 align-top"
        style={{ fontFamily: "var(--font-mono), monospace", fontSize: "11px", color: "var(--text-2)", whiteSpace: "nowrap" }}
      >
        {shortDate(created_at)}
      </td>

      {/* Query */}
      <td className="py-4 pr-6 align-top" style={{ maxWidth: "32rem" }}>
        <p
          className="line-clamp-2 text-sm leading-6 text-[var(--text-2)]"
          style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
        >
          {query}
        </p>
        <p
          className="mt-1 text-[10px] text-[var(--text-3)]"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          {id.slice(0, 8)}
        </p>
      </td>

      {/* Confidence */}
      <td className="hidden py-4 pr-6 text-right align-top md:table-cell">
        {confPct != null ? (
          <span
            className="text-sm font-bold tabular-nums"
            style={{ fontFamily: "var(--font-mono), monospace", color: confColor(confidence!) }}
          >
            {confPct}%
          </span>
        ) : (
          <span className="text-xs text-[var(--text-3)]" style={{ fontFamily: "var(--font-mono), monospace" }}>N/A</span>
        )}
      </td>

      {/* Risk */}
      <td className="hidden py-4 pr-6 text-center align-top lg:table-cell">
        <span className={`badge ${risk.cls}`}>{risk.label}</span>
      </td>

      {/* Pass/Fail */}
      <td className="py-4 text-center align-top">
        <span className={`badge ${passFailClass(confidence)}`}>
          {passFailLabel(confidence)}
        </span>
      </td>
    </tr>
  );
}
