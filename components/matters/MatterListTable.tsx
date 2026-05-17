import Link from "next/link";
import type { MatterRow } from "@/lib/matters/types";

function statusBadge(status: string) {
  const cls =
    status === "active" ? "badge-pass" :
    status === "closed" ? "badge-neutral" :
    status === "on_hold" ? "badge-warn" :
    "badge-neutral";
  return <span className={`badge ${cls}`} style={{ fontFamily: "var(--font-mono)", fontSize: "9px" }}>{status.replace(/_/g, " ")}</span>;
}

function shortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso.slice(0, 10);
  }
}

interface Props {
  matters: MatterRow[];
}

export default function MatterListTable({ matters }: Props) {
  if (matters.length === 0) {
    return (
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#404040" }}>
        No matters yet.{" "}
        <Link href="/matters/new" style={{ color: "#737373" }} className="transition-colors hover:text-white">
          Create one &rarr;
        </Link>
      </p>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {["Title", "Client", "Type", "Jurisdiction", "Status", "Created", ""].map((h) => (
              <th
                key={h}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  color: "#404040",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  padding: "0.5rem 0.75rem",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  textAlign: "left",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matters.map((m) => (
            <tr key={m.id}>
              <td style={{ fontFamily: "var(--font-serif), Georgia, serif", fontSize: "13px", color: "#f4f4f4", padding: "0.625rem 0.75rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <Link href={`/matters/${m.id}`} className="transition-colors hover:text-white" style={{ color: "#f4f4f4" }}>
                  {m.title}
                </Link>
              </td>
              <td style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#737373", padding: "0.625rem 0.75rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                {m.client_name ?? "—"}
              </td>
              <td style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#737373", padding: "0.625rem 0.75rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                {m.matter_type?.replace(/_/g, " ") ?? "—"}
              </td>
              <td style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#737373", padding: "0.625rem 0.75rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                {m.jurisdiction ?? "—"}
              </td>
              <td style={{ padding: "0.625rem 0.75rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                {statusBadge(m.status)}
              </td>
              <td style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#404040", padding: "0.625rem 0.75rem", borderBottom: "1px solid rgba(255,255,255,0.04)", whiteSpace: "nowrap" }}>
                {shortDate(m.created_at)}
              </td>
              <td style={{ padding: "0.625rem 0.75rem", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <Link
                  href={`/matters/${m.id}`}
                  style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "#404040", letterSpacing: "0.1em" }}
                  className="transition-colors hover:text-white"
                >
                  Open &rarr;
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
