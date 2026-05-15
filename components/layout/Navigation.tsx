"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/draft",      label: "Draft"      },
  { href: "/research",   label: "Research"   },
  { href: "/runs",       label: "History"    },
  { href: "/workflows",  label: "Workflows"  },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <header
      className="sticky top-0 z-50"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.96)", backdropFilter: "blur(8px)" }}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-8 px-6 py-4">

        {/* Wordmark */}
        <Link href="/" className="group flex items-baseline gap-3">
          <span
            className="text-lg font-semibold leading-none tracking-tight text-[#f4f4f4] transition-colors group-hover:text-white"
            style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
          >
            LexOrchestrator
          </span>
          <span
            className="hidden text-[10px] font-medium uppercase tracking-[0.18em] text-[#404040] sm:inline"
            style={{ fontFamily: "var(--font-mono), monospace" }}
          >
            v2
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className="px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors"
                style={{
                  fontFamily: "var(--font-mono), monospace",
                  color: active ? "#f4f4f4" : "#737373",
                  borderBottom: active ? "1px solid #f4f4f4" : "1px solid transparent",
                }}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* DB indicator */}
        <div
          className="hidden items-center gap-2 sm:flex"
          style={{ fontFamily: "var(--font-mono), monospace", fontSize: "10px", color: "#404040" }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{
              background: process.env.NEXT_PUBLIC_SUPABASE_URL ? "#34d399" : "#404040",
            }}
          />
          {process.env.NEXT_PUBLIC_SUPABASE_URL ? "DB" : "MOCK"}
        </div>

      </div>
    </header>
  );
}
