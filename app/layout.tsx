import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LexOrchestrator — Multi-Agent Litigation Reliability Engine",
  description:
    "A multi-agent legal AI orchestration system for litigation reliability. Demonstrates RAG retrieval, citation validation, adversarial review, and eval-driven development.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
