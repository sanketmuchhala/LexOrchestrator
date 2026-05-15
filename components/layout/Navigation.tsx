"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/research", label: "Research" },
  { href: "/runs",     label: "History" },
];

const DB_CONFIGURED = !!(
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_SUPABASE_URL
);

export default function Navigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6">

        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-cyan-400/30 bg-cyan-400/10 font-mono text-xs font-bold text-cyan-200 transition group-hover:border-cyan-400/50 group-hover:bg-cyan-400/15">
            LX
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-none text-slate-100">LexOrchestrator</p>
            <p className="mt-0.5 text-[11px] leading-none text-slate-500">Litigation Reliability Engine</p>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-cyan-400/10 text-cyan-200"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Status indicator */}
        <div className="hidden items-center gap-2 text-xs text-slate-600 sm:flex">
          <span className={`h-1.5 w-1.5 rounded-full ${DB_CONFIGURED ? "bg-emerald-400" : "bg-slate-600"}`} />
          <span>{DB_CONFIGURED ? "DB connected" : "Mock mode"}</span>
        </div>
      </div>
    </header>
  );
}
