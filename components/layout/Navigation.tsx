"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "/demo",          label: "Demo"     },
  { href: "/draft",         label: "Draft"    },
  { href: "/matters",       label: "Matters"  },
  { href: "/traces",        label: "Traces"   },
  { href: "/observability", label: "Observe"  },
  { href: "/evals",         label: "Evals"    },
];

function useSession() {
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    setLoggedIn(document.cookie.includes("lex_session="));
  }, []);
  return loggedIn;
}

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();
  const loggedIn = useSession();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.96)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        className="mx-auto px-6"
        style={{
          maxWidth: "80rem",
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "center",
          gap: "2rem",
          height: "3.25rem",
        }}
      >
        {/* Wordmark */}
        <Link href="/" className="group flex items-baseline gap-2 shrink-0">
          <span
            className="text-base font-semibold leading-none tracking-tight transition-opacity group-hover:opacity-70"
            style={{ fontFamily: "var(--font-serif), Georgia, serif", color: "var(--text-1)" }}
          >
            LexOrchestrator
          </span>
          <span
            className="text-[9px] font-medium uppercase tracking-[0.18em]"
            style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-3)" }}
          >
            v3
          </span>
        </Link>

        {/* Nav links — center, never wraps */}
        <nav className="flex items-center justify-center gap-0.5 min-w-0 overflow-hidden">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className="shrink-0 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-80"
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  color: active ? "var(--text-1)" : "var(--text-2)",
                  borderBottom: active ? "1px solid var(--text-1)" : "1px solid transparent",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Auth — right, never wraps */}
        <div className="shrink-0">
          {loggedIn ? (
            <button
              onClick={logout}
              className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] transition-opacity hover:opacity-70"
              style={{
                fontFamily: "var(--font-mono), monospace",
                color: "var(--text-2)",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] transition-opacity hover:opacity-80"
              style={{
                fontFamily: "var(--font-mono), monospace",
                color: "var(--text-2)",
                border: "1px solid rgba(255,255,255,0.12)",
              }}
            >
              Login
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}
