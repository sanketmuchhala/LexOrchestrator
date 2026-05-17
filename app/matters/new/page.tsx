import type { Metadata } from "next";
import Link from "next/link";
import MatterForm from "@/components/matters/MatterForm";

export const metadata: Metadata = {
  title: "New Matter — LexOrchestrator",
};

export default function NewMatterPage() {
  return (
    <div className="pt-14 appear">

      <div className="mb-6">
        <Link
          href="/matters"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            color: "var(--text-3)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
          className="transition-colors hover:text-black"
        >
          &larr; Matters
        </Link>
      </div>

      <div className="mb-8">
        <p className="label mb-2" style={{ letterSpacing: "0.28em" }}>New</p>
        <h1
          className="text-3xl font-semibold tracking-tight text-[var(--text-1)]"
          style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
        >
          Create Matter
        </h1>
        <p
          className="mt-2 text-xs text-[var(--text-2)]"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          Create a matter workspace to organize workflows, uploads, and drafts for a legal matter.
        </p>
      </div>

      <div className="rule mb-8" />

      <MatterForm />

    </div>
  );
}
