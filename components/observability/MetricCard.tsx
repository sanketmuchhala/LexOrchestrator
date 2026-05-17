interface Props {
  label: string;
  value: string | number;
  sub?: string;
  dim?: boolean;
}

export default function MetricCard({ label, value, sub, dim = false }: Props) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "1rem" }}>
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          color: "#404040",
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
          color: dim ? "#404040" : "#f4f4f4",
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
            color: "#404040",
            marginTop: "0.375rem",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}
