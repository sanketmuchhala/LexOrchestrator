"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { MatterFileRow } from "@/lib/matters/types";

interface Props {
  matterId: string;
  initialFiles: MatterFileRow[];
}

export default function MatterFilesPanel({ matterId, initialFiles }: Props) {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("matterId", matterId);
      formData.append("documentRole", "case_file");

      const res = await fetch("/api/uploads/case-file", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "Upload failed.");
      }

      router.refresh();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <label
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            padding: "0.375rem 0.875rem",
            border: "1px solid rgba(0,0,0,0.12)",
            color: uploading ? "var(--text-3)" : "var(--text-2)",
            background: "var(--s1)",
            cursor: uploading ? "default" : "pointer",
            display: "inline-block",
          }}
        >
          <input
            type="file"
            accept=".txt,.md"
            onChange={handleFileChange}
            disabled={uploading}
            style={{ display: "none" }}
          />
          {uploading ? "Uploading..." : "Upload .txt or .md"}
        </label>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)" }}>
          .txt and .md only. Max 5 MB.
        </span>
      </div>

      {uploadError && (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#f87171", marginBottom: "0.75rem" }}>
          {uploadError}
        </p>
      )}

      {initialFiles.length === 0 ? (
        <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-3)" }}>
          No files attached to this matter.
        </p>
      ) : (
        <div className="space-y-2">
          {initialFiles.map((f) => (
            <div key={f.id} style={{ border: "1px solid rgba(0,0,0,0.07)", padding: "0.875rem" }}>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-1)", fontWeight: 600 }}>
                  {f.title}
                </span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                  {f.file_role.replace(/_/g, " ")}
                </span>
              </div>
              {f.extracted_text_preview && (
                <p style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-3)", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                  {f.extracted_text_preview}
                  {f.extracted_text_preview.length >= 400 ? " ..." : ""}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
