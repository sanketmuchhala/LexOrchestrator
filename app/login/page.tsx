"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Login failed.");
      } else {
        router.push("/draft");
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="appear flex min-h-[70vh] flex-col items-center justify-center">
      <div style={{ width: "100%", maxWidth: "22rem" }}>

        <div className="mb-8 text-center">
          <p className="label mb-3">Access</p>
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-serif), Georgia, serif", color: "var(--text-1)" }}
          >
            LexOrchestrator
          </h1>
          <p
            className="mt-2 text-xs uppercase tracking-[0.2em]"
            style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-3)" }}
          >
            Demo login
          </p>
        </div>

        <div className="rule mb-6" />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="label mb-2">Username</p>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              style={{
                width: "100%",
                fontFamily: "var(--font-mono), monospace",
                fontSize: "13px",
                color: "var(--text-1)",
                background: "var(--s1)",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "0.625rem 0.875rem",
                outline: "none",
                borderRadius: 0,
              }}
            />
          </div>

          <div>
            <p className="label mb-2">Password</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={{
                width: "100%",
                fontFamily: "var(--font-mono), monospace",
                fontSize: "13px",
                color: "var(--text-1)",
                background: "var(--s1)",
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "0.625rem 0.875rem",
                outline: "none",
                borderRadius: 0,
              }}
            />
          </div>

          {error && (
            <p
              style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--red)" }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              fontFamily: "var(--font-mono), monospace",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: loading ? "var(--text-3)" : "#000",
              background: loading ? "var(--s2)" : "var(--text-1)",
              border: "none",
              padding: "0.75rem",
              cursor: loading ? "default" : "pointer",
              marginTop: "0.5rem",
            }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="rule mt-6 mb-4" />
        <p
          className="text-center text-[10px] leading-5"
          style={{ fontFamily: "var(--font-mono), monospace", color: "var(--text-3)" }}
        >
          Demo credentials: demo / lexorchestrator
        </p>
      </div>
    </div>
  );
}
