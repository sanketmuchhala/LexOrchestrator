export default function EvalWarningsPanel({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#34d399" }}>
        No quality warnings detected.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {warnings.map((warning, i) => (
        <li
          key={i}
          style={{
            fontFamily: "var(--font-serif), Georgia, serif",
            fontSize: "14px",
            lineHeight: "1.7",
            color: "#fbbf24",
            paddingLeft: "1rem",
            borderLeft: "2px solid rgba(251,191,36,0.35)",
          }}
        >
          {warning}
        </li>
      ))}
    </ul>
  );
}
