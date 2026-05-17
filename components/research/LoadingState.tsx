"use client";

import { useEffect, useState } from "react";

const STEPS = [
  { n: "01", name: "Intake Agent",         desc: "Classifying query, extracting legal terms and jurisdiction" },
  { n: "02", name: "Hybrid Retrieval",     desc: "pgvector cosine search + keyword overlap across corpus" },
  { n: "03", name: "Citation Validator",   desc: "Matching claims against retrieved source chunks" },
  { n: "04", name: "Adversarial Review",   desc: "Generating opposing counsel challenges and gaps" },
  { n: "05", name: "Hallucination Monitor",desc: "Scoring unsupported citation risk, factor analysis" },
  { n: "06", name: "Final Synthesis",      desc: "Producing cited legal analysis with confidence score" },
  { n: "07", name: "Eval Engine",          desc: "Computing groundedness, accuracy, and reliability metrics" },
];

export default function LoadingState() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="appear">
      <div
        className="mb-6 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", paddingBottom: "1rem" }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-1)]"
          style={{ fontFamily: "var(--font-mono), monospace" }}
        >
          Pipeline Running
        </p>
        <div className="flex items-center gap-2">
          <span
            className="h-1.5 w-1.5 rounded-full pulse-dot"
            style={{ background: "#34d399" }}
          />
          <span
            className="text-[10px] text-[var(--text-2)] uppercase tracking-[0.16em]"
            style={{ fontFamily: "var(--font-mono), monospace" }}
          >
            Processing
          </span>
        </div>
      </div>

      <div className="space-y-px">
        {STEPS.map(({ n, name, desc }, i) => {
          const isDone    = i < activeStep;
          const isActive  = i === activeStep;
          const isPending = i > activeStep;

          return (
            <div
              key={n}
              className="flex items-start gap-5 px-4 py-4 transition-colors"
              style={{
                background: isActive ? "#0d0d0d" : "transparent",
                borderLeft: isActive
                  ? "2px solid #34d399"
                  : "2px solid transparent",
                opacity: isPending ? 0.35 : 1,
              }}
            >
              <span
                className="shrink-0 text-[11px] font-bold tabular-nums"
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  color: isDone ? "var(--emerald)" : isActive ? "var(--text-1)" : "var(--text-3)",
                  width: "1.75rem",
                  paddingTop: "1px",
                }}
              >
                {isDone ? "OK" : n}
              </span>
              <div className="flex-1">
                <p
                  className="text-[13px] font-semibold"
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    color: isDone ? "var(--text-2)" : isActive ? "var(--text-1)" : "var(--text-3)",
                    textDecoration: isDone ? "line-through" : "none",
                  }}
                >
                  {name}
                </p>
                <p
                  className="mt-0.5 text-xs"
                  style={{
                    fontFamily: "var(--font-mono), monospace",
                    color: isActive ? "var(--text-2)" : "var(--text-3)",
                  }}
                >
                  {desc}
                </p>
              </div>
              {isActive && (
                <div className="flex items-center gap-1 pt-1">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="h-1 w-1 rounded-full pulse-dot"
                      style={{
                        background: "#34d399",
                        animationDelay: `${dot * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p
        className="mt-6 text-[10px] text-[var(--text-3)]"
        style={{ fontFamily: "var(--font-mono), monospace" }}
      >
        Results will open automatically upon completion.
      </p>
    </div>
  );
}
