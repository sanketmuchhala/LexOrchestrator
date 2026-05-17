"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import type { WorkflowRunRow } from "@/lib/litigation/getWorkflowRun";

interface CitationSummary {
  total: number;
  pass: number;
  warn: number;
  fail: number;
  unknown: number;
}

interface Props {
  initialContent: string;
  draftArtifactId: string;
  workflowRunId: string;
  workflow: WorkflowRunRow;
}

const RUNNING_STATUSES = new Set(["queued", "running"]);

export default function EditableMotionEditor({
  initialContent,
  draftArtifactId,
  workflowRunId,
  workflow,
}: Props) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [lastSavedVersion, setLastSavedVersion] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verificationSummary, setVerificationSummary] = useState<CitationSummary | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const isReadOnly = RUNNING_STATUSES.has(workflow.status);
  const contentRef = useRef(content);
  contentRef.current = content;

  useEffect(() => {
    setIsDirty(content !== initialContent);
  }, [content, initialContent]);

  const save = useCallback(
    async (verify: boolean) => {
      if (isSaving || isVerifying) return;
      const currentContent = contentRef.current;
      if (!currentContent.trim()) {
        setError("Draft content cannot be empty.");
        return;
      }

      if (verify) {
        setIsVerifying(true);
      } else {
        setIsSaving(true);
      }
      setError(null);

      try {
        const res = await fetch(`/api/drafts/${workflowRunId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: currentContent,
            verifyAfterSave: verify,
          }),
        });

        const data = (await res.json()) as {
          revision?: { version: number };
          citationSummary?: CitationSummary;
          verificationStatus?: string;
          error?: string;
        };

        if (!res.ok) {
          setError(data.error ?? "Save failed.");
          return;
        }

        setLastSavedAt(new Date());
        setLastSavedVersion(data.revision?.version ?? null);
        setIsDirty(false);

        if (verify && data.citationSummary) {
          setVerificationSummary(data.citationSummary);
          setVerificationStatus(data.verificationStatus ?? null);
        }

        // Refresh server component data (updates Verification Inspector)
        router.refresh();
      } catch {
        setError("Network error. Check that the server is running.");
      } finally {
        setIsSaving(false);
        setIsVerifying(false);
      }
    },
    [isSaving, isVerifying, workflowRunId, router]
  );

  // Cmd/Ctrl+S keyboard shortcut
  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (!isReadOnly) save(false);
      }
    }
    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [save, isReadOnly]);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {/* Toolbar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", paddingBottom: "0.75rem" }}
      >
        <div className="flex items-center gap-3">
          {isDirty && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "#fbbf24",
                letterSpacing: "0.12em",
              }}
            >
              unsaved changes
            </span>
          )}
          {lastSavedAt && !isDirty && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--text-3)",
                letterSpacing: "0.12em",
              }}
            >
              saved {formatTime(lastSavedAt)}
              {lastSavedVersion != null ? ` · v${lastSavedVersion}` : ""}
            </span>
          )}
          {isReadOnly && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                color: "var(--text-2)",
                letterSpacing: "0.12em",
              }}
            >
              workflow running -- editing disabled
            </span>
          )}
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => save(false)}
              disabled={isSaving || isVerifying || !isDirty}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: isSaving || !isDirty ? "var(--text-3)" : "var(--text-2)",
                background: "var(--s1)",
                border: "1px solid rgba(0,0,0,0.09)",
                padding: "0.375rem 0.875rem",
                cursor: isSaving || !isDirty ? "default" : "pointer",
              }}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => save(true)}
              disabled={isSaving || isVerifying}
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: isSaving || isVerifying ? "var(--text-3)" : "#000000",
                background: isSaving || isVerifying ? "var(--s2)" : "var(--text-1)",
                border: "1px solid rgba(0,0,0,0.09)",
                padding: "0.375rem 0.875rem",
                cursor: isSaving || isVerifying ? "default" : "pointer",
              }}
            >
              {isVerifying ? "Verifying..." : "Save + Verify"}
            </button>
          </div>
        )}
      </div>

      {/* Editor */}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        readOnly={isReadOnly}
        style={{
          fontFamily: "var(--font-serif), Georgia, serif",
          fontSize: "14px",
          lineHeight: "1.85",
          color: isReadOnly ? "var(--text-2)" : "var(--text-1)",
          background: "var(--s1)",
          border: "1px solid rgba(0,0,0,0.09)",
          padding: "1.25rem",
          width: "100%",
          minHeight: "28rem",
          resize: "vertical",
          outline: "none",
          borderRadius: 0,
        }}
        placeholder="Draft content will appear here after the workflow completes."
        spellCheck={false}
      />

      {/* Status messages */}
      {error && (
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "#f87171",
          }}
        >
          {error}
        </p>
      )}

      {verificationSummary && (
        <div
          style={{
            border: "1px solid rgba(0,0,0,0.07)",
            padding: "0.75rem",
            display: "flex",
            flexWrap: "wrap",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          <span className="label">Verification result</span>
          {verificationStatus && (
            <span
              className={`badge ${
                verificationStatus === "verified"
                  ? "badge-pass"
                  : verificationStatus === "failed"
                  ? "badge-fail"
                  : "badge-warn"
              }`}
            >
              {verificationStatus}
            </span>
          )}
          <span
            style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-2)" }}
          >
            {verificationSummary.total} citations &middot; {verificationSummary.pass} pass &middot;{" "}
            {verificationSummary.warn} warn &middot; {verificationSummary.fail} fail
          </span>
          <span
            style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)" }}
          >
            Reload page to update Verification Inspector.
          </span>
        </div>
      )}

      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "var(--text-3)",
        }}
      >
        Artifact ID: {draftArtifactId.slice(0, 8)} &middot; Cmd/Ctrl+S to save
      </p>
    </div>
  );
}
