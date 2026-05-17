"use client";

import { useState } from "react";
import type { DraftRevision } from "@/lib/drafts/types";

function verificationBadge(status: string | null): string {
  if (status === "verified") return "badge-pass";
  if (status === "failed") return "badge-fail";
  if (status === "partial") return "badge-warn";
  return "badge-neutral";
}

function passRateLabel(citationSummary: DraftRevision["citationSummary"]): string {
  if (citationSummary.total === 0) return "";
  const rate = Math.round((citationSummary.pass / citationSummary.total) * 100);
  return `${rate}% pass`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

interface Props {
  initialRevisions: DraftRevision[];
}

const COLLAPSE_THRESHOLD = 3;

export default function DraftRevisionHistory({ initialRevisions }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (initialRevisions.length === 0) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-3)" }}>
        No manual revisions yet. Save a change to create the first revision.
      </p>
    );
  }

  const visible =
    expanded || initialRevisions.length <= COLLAPSE_THRESHOLD
      ? initialRevisions
      : initialRevisions.slice(0, COLLAPSE_THRESHOLD);

  return (
    <div className="space-y-2">
      {visible.map((rev, idx) => {
        const isLast = idx === visible.length - 1;
        return (
          <div
            key={rev.id}
            style={{
              paddingBottom: isLast ? 0 : "0.75rem",
              borderBottom: isLast ? "none" : "1px solid rgba(0,0,0,0.05)",
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
            }}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  color: "var(--text-1)",
                  fontWeight: 600,
                }}
              >
                v{rev.version}
              </span>
              {rev.verificationStatus && (
                <span className={`badge ${verificationBadge(rev.verificationStatus)}`}>
                  {rev.verificationStatus}
                </span>
              )}
              {rev.citationSummary.total > 0 && (
                <span
                  style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-2)" }}
                >
                  {passRateLabel(rev.citationSummary)}
                </span>
              )}
            </div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--text-3)",
              }}
            >
              {formatDate(rev.createdAt)} &middot; {rev.createdBy}
            </div>
            {rev.editSummary && (
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "10px",
                  color: "var(--text-2)",
                  fontStyle: "italic",
                }}
              >
                {rev.editSummary}
              </p>
            )}
          </div>
        );
      })}

      {initialRevisions.length > COLLAPSE_THRESHOLD && (
        <button
          onClick={() => setExpanded((e) => !e)}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            color: "var(--text-2)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {expanded
            ? "Show fewer"
            : `Show all ${initialRevisions.length} revisions`}
        </button>
      )}
    </div>
  );
}
