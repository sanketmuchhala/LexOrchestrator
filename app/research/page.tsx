import type { Metadata } from "next";
import ResearchWorkspace from "@/components/research/ResearchWorkspace";

export const metadata: Metadata = {
  title: "Research - LexOrchestrator",
};

export default function ResearchPage() {
  return (
    <div className="pt-14">

      {/* Page header */}
      <div className="mb-8">
        <p
          className="label mb-2"
          style={{ letterSpacing: "0.28em" }}
        >
          Docket No. LEX-2025
        </p>
        <h1
          className="text-3xl font-semibold tracking-tight text-[var(--text-1)]"
          style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
        >
          Legal Research
        </h1>
        <p
          className="mt-2 text-xs text-[var(--text-2)]"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          Submit a query. Seven agents will retrieve, validate, and score the response.
          Results open at a permanent URL.
        </p>
      </div>

      <div className="rule mb-8" />

      <ResearchWorkspace />
    </div>
  );
}
