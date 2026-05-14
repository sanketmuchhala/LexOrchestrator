import type { Metadata } from "next";
import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const firaCode = Fira_Code({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-fira-code" });

export const metadata: Metadata = {
  title: "LexOrchestrator — Multi-Agent Litigation Reliability Engine",
  description:
    "A multi-agent legal AI orchestration system for litigation reliability. Demonstrates RAG retrieval, citation validation, adversarial review, and eval-driven development.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${firaCode.variable}`}>
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen" style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
