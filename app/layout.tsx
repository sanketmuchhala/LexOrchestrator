import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import Navigation from "@/components/layout/Navigation";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const firaCode = Fira_Code({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-fira-code" });

export const metadata: Metadata = {
  title: "LexOrchestrator - Multi-Agent Litigation Reliability Engine",
  description:
    "A multi-agent legal AI orchestration system for litigation reliability. Routes legal queries through intake, hybrid RAG retrieval, citation validation, adversarial review, hallucination scoring, and eval reporting.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${firaCode.variable}`}>
      <body
        className="min-h-screen bg-slate-950 text-slate-100 antialiased"
        style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
      >
        <Navigation />
        <div className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
          {children}
        </div>
      </body>
    </html>
  );
}
