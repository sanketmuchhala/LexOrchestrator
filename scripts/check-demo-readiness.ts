import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

type CheckLevel = "pass" | "warn" | "fail";

let failed = 0;
let warned = 0;

function exists(relPath: string): boolean {
  return fs.existsSync(path.resolve(process.cwd(), relPath));
}

function read(relPath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), relPath), "utf8");
}

function report(level: CheckLevel, name: string, detail: string) {
  const label = level.toUpperCase().padEnd(4);
  const line = `[${label}] ${name}: ${detail}`;
  if (level === "fail") {
    failed++;
    console.error(line);
  } else {
    if (level === "warn") warned++;
    console.log(line);
  }
}

function requireFile(name: string, relPath: string) {
  report(exists(relPath) ? "pass" : "fail", name, relPath);
}

async function main() {
  console.log("=== Demo Readiness Check ===\n");

  if (!exists("package.json")) {
    report("fail", "package.json", "missing");
  } else {
    const pkg = JSON.parse(read("package.json")) as { scripts?: Record<string, string> };
    const scripts = pkg.scripts ?? {};
    for (const script of [
      "check:safety",
      "lint",
      "build",
      "seed:litigation-demo",
      "smoke:mcp",
      "mcp:server",
      "check:demo",
      "smoke:demo-path",
      "smoke:draft-export",
      "smoke:trace-builder",
      "smoke:observability",
    ]) {
      report(scripts[script] ? "pass" : "fail", `script ${script}`, scripts[script] ?? "missing");
    }
  }

  requireFile("canonical demo fixture", "lib/demo/litigationDemoFixture.ts");
  requireFile("seed litigation demo script", "scripts/seed-litigation-demo.ts");
  requireFile("judge profile lookup", "lib/litigation/judges/getJudgeProfile.ts");
  requireFile("citation verifier", "lib/citations/verifyCitation.ts");
  requireFile("citation text verifier", "lib/citations/verifyCitationsInText.ts");
  requireFile("eval computation", "lib/litigation/evals/computeWorkflowEval.ts");
  requireFile("MCP server entrypoint", "mcp/server.ts");
  requireFile("PDF export module", "lib/exports/exportPdf.ts");
  requireFile("DOCX export module", "lib/exports/exportDocx.ts");
  requireFile("export API route", "app/api/drafts/[id]/export/route.ts");
  requireFile("DraftExportControls", "components/draft/DraftExportControls.tsx");
  requireFile("trace page", "app/traces/[id]/page.tsx");
  requireFile("trace API route", "app/api/traces/[id]/route.ts");
  requireFile("buildWorkflowTrace", "lib/traces/buildWorkflowTrace.ts");
  requireFile("TraceSummaryPanel", "components/traces/TraceSummaryPanel.tsx");
  requireFile("observability page", "app/observability/page.tsx");
  requireFile("observability metrics", "lib/observability/metrics.ts");
  requireFile("buildWorkflowPerformance", "lib/observability/buildWorkflowPerformance.ts");

  if (exists("lib/litigation/localRules/rules.ts")) {
    const rules = read("lib/litigation/localRules/rules.ts");
    report(
      rules.includes("S.D.N.Y.") || rules.toLowerCase().includes("sdny") ? "pass" : "fail",
      "SDNY local rules profile",
      "lib/litigation/localRules/rules.ts"
    );
  } else {
    report("fail", "SDNY local rules profile", "missing rules module");
  }

  for (const route of [
    "app/draft/page.tsx",
    "app/draft/[id]/page.tsx",
    "app/workflows/page.tsx",
    "app/workflows/[id]/page.tsx",
    "app/evals/page.tsx",
    "app/evals/[id]/page.tsx",
  ]) {
    requireFile(`route ${route}`, route);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    report("warn", "Supabase demo rows", "Supabase env vars not configured; skipping database row checks");
  } else {
    report("pass", "Supabase configuration", "env vars present; seed rows can be checked with npm run seed:litigation-demo");
  }

  console.log(`\n=== Results: ${failed === 0 ? "ready" : "not ready"} (${failed} failed, ${warned} warnings) ===`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Demo readiness check crashed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
