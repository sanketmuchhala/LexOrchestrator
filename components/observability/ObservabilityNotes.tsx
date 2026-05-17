export default function ObservabilityNotes() {
  return (
    <div
      style={{
        border: "1px solid rgba(0,0,0,0.07)",
        padding: "1.25rem",
        borderLeft: "2px solid rgba(0,0,0,0.09)",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-serif), Georgia, serif",
          fontSize: "14px",
          color: "var(--text-2)",
          lineHeight: 1.75,
          maxWidth: "52rem",
        }}
      >
        Token counts and cost figures depend on provider response data. When a provider does not
        return token usage or cost in its API response, those fields will show N/A. Estimated cost
        values (labeled with ~) are derived from a conservative placeholder rate and are not
        guaranteed to match any provider&apos;s actual pricing.
      </p>
      <p
        style={{
          fontFamily: "var(--font-serif), Georgia, serif",
          fontSize: "14px",
          color: "var(--text-2)",
          lineHeight: 1.75,
          maxWidth: "52rem",
          marginTop: "0.75rem",
        }}
      >
        Latency figures reflect individual agent step durations recorded at runtime. Total duration
        is computed from the workflow run record&apos;s created_at and updated_at timestamps. No external
        tracing or telemetry integration is active in this phase.
      </p>
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          color: "var(--text-3)",
          letterSpacing: "0.12em",
          marginTop: "1rem",
        }}
      >
        Internal quality signal only. Not a performance guarantee.
      </p>
    </div>
  );
}
