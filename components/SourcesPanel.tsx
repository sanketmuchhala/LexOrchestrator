"use client";

import { useState } from "react";
import type { RetrievedSource } from "@/lib/types";

interface SourcesPanelProps {
  sources: RetrievedSource[];
}

function SourceItem({ source }: { source: RetrievedSource }) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round(source.relevanceScore * 100);
  const barColor = source.relevanceScore >= 0.5 ? "bg-indigo-500" : source.relevanceScore >= 0.3 ? "bg-violet-500" : "bg-slate-600";

  return (
    <div className="flex flex-col gap-2 p-3 bg-slate-800/60 rounded-lg border border-slate-700/50">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-1.5 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-mono shrink-0">
            {source.id}
          </span>
          <span className="text-sm text-slate-200 font-medium">{source.title}</span>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors shrink-0 mt-0.5"
        >
          {expanded ? "hide ↑" : "show ↓"}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-700 rounded-full h-1">
          <div className={`h-1 rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-mono text-slate-400 w-10 text-right">{pct}%</span>
        <span className="text-xs text-slate-600">{source.docType}</span>
      </div>

      {expanded && (
        <div className="mt-1 pt-2 border-t border-slate-700">
          <p className="text-xs text-slate-400 leading-relaxed">{source.text}</p>
          <p className="text-xs text-slate-600 mt-1.5">Jurisdiction: {source.jurisdiction}</p>
        </div>
      )}
    </div>
  );
}

export default function SourcesPanel({ sources }: SourcesPanelProps) {
  return (
    <div className="agent-card-enter bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4" style={{ animationDelay: "960ms" }}>
      <div className="flex items-center gap-2">
        <span className="text-base">📋</span>
        <h2 className="text-sm font-semibold text-slate-200">Retrieved Sources</h2>
        <span className="ml-auto text-xs text-slate-500 font-mono">{sources.length} results</span>
      </div>

      {sources.length === 0 ? (
        <p className="text-sm text-slate-500">No sources matched the retrieval threshold.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sources.map((source) => (
            <SourceItem key={source.id} source={source} />
          ))}
        </div>
      )}

      <p className="text-xs text-slate-600 border-t border-slate-800 pt-3">
        ⚠ Sample educational content only - not real legal authority.
      </p>
    </div>
  );
}
