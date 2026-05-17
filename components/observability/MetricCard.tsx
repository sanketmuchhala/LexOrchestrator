interface Props {
  label: string;
  value: string | number;
  sub?: string;
  dim?: boolean;
}

export default function MetricCard({ label, value, sub, dim = false }: Props) {
  return (
    <div style={{ border: "1px solid rgba(0,0,0,0.07)", padding: "1rem" }}>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          color: "var(--text-3)",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          marginBottom: "0.5rem",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "22px",
          fontWeight: 700,
          color: dim ? "var(--text-3)" : "var(--text-1)",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            color: "var(--text-3)",
            marginTop: "0.375rem",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
