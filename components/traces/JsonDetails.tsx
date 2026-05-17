const MAX_CHARS = 2000;

function safeStringify(value: Record<string, unknown>): string {
  try {
    const raw = JSON.stringify(value, null, 2);
    if (raw.length > MAX_CHARS) {
      return raw.slice(0, MAX_CHARS) + `\n\n... [truncated ${(raw.length - MAX_CHARS).toLocaleString()} chars]`;
    }
    return raw;
  } catch {
    return "[unserializable value]";
  }
}

interface Props {
  label: string;
  value: Record<string, unknown> | null | undefined;
}

export default function JsonDetails({ label, value }: Props) {
  if (!value || Object.keys(value).length === 0) return null;
  const text = safeStringify(value);

  return (
    <details style={{ marginTop: "0.5rem" }}>
      <summary
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "9px",
          color: "#404040",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          cursor: "pointer",
          userSelect: "none",
          listStyle: "none",
        }}
      >
        {label}
      </summary>
      <pre
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "10px",
          color: "#737373",
          background: "#0a0a0a",
          border: "1px solid rgba(255,255,255,0.04)",
          padding: "0.75rem",
          marginTop: "0.375rem",
          overflowX: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-all",
          lineHeight: 1.5,
        }}
      >
        {text}
      </pre>
    </details>
  );
}
