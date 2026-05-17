"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_LINKS = [
  { href: "/demo",          label: "Demo"       },
  { href: "/matters",       label: "Matters"    },
  { href: "/draft",         label: "Draft"      },
  { href: "/evals",         label: "Evals"      },
  { href: "/observability", label: "Observe"    },
  { href: "/research",      label: "Research"   },
  { href: "/runs",          label: "History"    },
  { href: "/workflows",     label: "Workflows"  },
  { href: "/traces",        label: "Traces"     },
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
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-8 px-6 py-4">

        {/* Wordmark */}
        <Link href="/" className="group flex items-baseline gap-3">
          <span
            className="text-lg font-semibold leading-none tracking-tight transition-opacity group-hover:opacity-70"
            style={{ fontFamily: "var(--font-serif), Georgia, serif", color: "var(--text-1)" }}
          >
            LexOrchestrator
          </span>
          <span
            className="hidden text-[10px] font-medium uppercase tracking-[0.18em] sm:inline"
            style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-3)" }}
          >
            v3
          </span>
        </Link>

        {/* Nav links */}
        <nav className="flex flex-wrap items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className="px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition-opacity hover:opacity-80"
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  color: active ? "var(--text-1)" : "var(--text-2)",
                  borderBottom: active ? "1px solid var(--text-1)" : "1px solid transparent",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Auth */}
        {loggedIn ? (
          <button
            onClick={logout}
            className="hidden sm:inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] transition-opacity hover:opacity-70"
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
            className="hidden sm:inline-block px-4 py-1.5 text-xs font-bold uppercase tracking-[0.16em] transition-opacity hover:opacity-80"
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
    </header>
  );
}
