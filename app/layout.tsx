import type { Metadata } from "next";
import { IBM_Plex_Mono, EB_Garamond } from "next/font/google";
import Navigation from "@/components/layout/Navigation";
import "./globals.css";

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-serif",
});

export const metadata: Metadata = {
  title: "LexOrchestrator - Multi-Agent Litigation Reliability Engine",
  description:
    "A multi-agent legal AI system for litigation reliability. Hybrid RAG retrieval, citation validation, adversarial review, hallucination scoring, and eval reporting.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${ibmPlexMono.variable} ${ebGaramond.variable}`}
    >
      <body
        className="antialiased"
        style={{ background: "var(--bg)", color: "var(--text-1)", fontFamily: "var(--font-mono), 'Courier New', monospace" }}
      >
        <Navigation />
        <main className="mx-auto max-w-5xl px-6 pb-32 pt-0">
          {children}
        </main>
      </body>
    </html>
  );
}
