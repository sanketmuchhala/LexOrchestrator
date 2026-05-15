import type { Metadata } from "next";
import ResearchWorkspace from "@/components/research/ResearchWorkspace";

export const metadata: Metadata = {
  title: "Research - LexOrchestrator",
};

export default function ResearchPage() {
  return (
    <div className="pt-10">
      <div className="mb-8">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-600">
          Multi-Agent Pipeline
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold text-slate-100">Legal Research</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
          Enter a legal research question. The pipeline runs intake classification, hybrid RAG
          retrieval, citation validation, adversarial review, and eval scoring - then produces a
          cited answer with reliability metrics.
        </p>
      </div>

      <ResearchWorkspace />
    </div>
  );
}
