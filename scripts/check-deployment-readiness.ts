import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();

let passed = 0;
let warned = 0;
let failed = 0;

function exists(rel: string): boolean {
  return fs.existsSync(path.resolve(ROOT, rel));
}

function read(rel: string): string {
  return fs.readFileSync(path.resolve(ROOT, rel), "utf8");
}

function pass(name: string, detail: string) {
  console.log(`  [PASS] ${name}: ${detail}`);
  passed++;
}

function warn(name: string, detail: string) {
  console.warn(`  [WARN] ${name}: ${detail}`);
  warned++;
}

function fail(name: string, detail: string) {
  console.error(`  [FAIL] ${name}: ${detail}`);
  failed++;
}

function requireFile(name: string, rel: string) {
  if (exists(rel)) {
    pass(name, rel);
  } else {
    fail(name, `${rel} not found`);
  }
}

function requireFileContent(name: string, rel: string, needle: string) {
  if (!exists(rel)) {
    fail(name, `${rel} not found`);
    return;
  }
  const content = read(rel);
  if (content.includes(needle)) {
    pass(name, rel);
  } else {
    fail(name, `${rel} does not contain expected content: "${needle}"`);
  }
}

async function main() {
  console.log("=== Deployment Readiness Check ===\n");

  // ── 1. Safety gate ──────────────────────────────────────────────────────────

  console.log("--- Safety ---");
  try {
    execSync("npm run check:safety --silent", { stdio: "pipe" });
    pass("safety scan", "no forbidden terms or secrets");
  } catch {
    fail("safety scan", "npm run check:safety failed -- see output above");
  }

  // ── 2. .env files not committed ──────────────────────────────────────────────

  console.log("\n--- Env file tracking ---");
  try {
    const tracked = execSync("git ls-files", { encoding: "utf-8" }).trim().split("\n");
    const envLeak = tracked.filter((f) => f === ".env" || f === ".env.local");
    if (envLeak.length === 0) {
      pass(".env files untracked", "no .env or .env.local in git");
    } else {
      fail(".env files untracked", `Tracked by git: ${envLeak.join(", ")}`);
    }
  } catch {
    warn(".env tracking check", "could not run git ls-files");
  }

  // ── 3. Env example exists ────────────────────────────────────────────────────

  console.log("\n--- Env documentation ---");
  requireFile(".env.example", ".env.example");
  requireFile(".env.local.example (legacy)", ".env.local.example");

  // ── 4. Health routes ─────────────────────────────────────────────────────────

  console.log("\n--- Health routes ---");
  requireFile("app health route", "app/api/health/route.ts");
  requireFile("env health route", "app/api/health/env/route.ts");

  // ── 5. Core routes ───────────────────────────────────────────────────────────

  console.log("\n--- Core routes ---");
  for (const [name, rel] of [
    ["draft page", "app/draft/page.tsx"],
    ["draft workspace", "app/draft/[id]/page.tsx"],
    ["matters list", "app/matters/page.tsx"],
    ["matter workspace", "app/matters/[id]/page.tsx"],
    ["observability", "app/observability/page.tsx"],
    ["evals", "app/evals/page.tsx"],
    ["workflows", "app/workflows/page.tsx"],
    ["traces", "app/traces/[id]/page.tsx"],
  ] as const) {
    requireFile(name, rel);
  }

  // ── 6. API routes ─────────────────────────────────────────────────────────────

  console.log("\n--- API routes ---");
  for (const [name, rel] of [
    ["export route", "app/api/drafts/[id]/export/route.ts"],
    ["upload route", "app/api/uploads/case-file/route.ts"],
    ["matters API", "app/api/matters/route.ts"],
    ["litigation workflows API", "app/api/litigation/workflows/route.ts"],
  ] as const) {
    requireFile(name, rel);
  }

  // ── 7. Docs ───────────────────────────────────────────────────────────────────

  console.log("\n--- Documentation ---");
  requireFile("DEPLOYMENT.md", "docs/DEPLOYMENT.md");
  requireFile("ARCHITECTURE.md", "docs/ARCHITECTURE.md");
  requireFileContent("README deployment section", "readme.md", "Deployment");
  requireFileContent("README matters section", "readme.md", "matter");

  // ── 8. MCP README ─────────────────────────────────────────────────────────────

  console.log("\n--- Optional service docs ---");
  if (exists("mcp/server.ts")) {
    requireFile("MCP README", "mcp/README.md");
  } else {
    pass("MCP README check", "no MCP server found -- skipped");
  }

  if (exists("workers/citation/app.py")) {
    requireFile("citation worker README", "workers/citation/README.md");
  } else {
    pass("citation worker README check", "no citation worker found -- skipped");
  }

  // ── 9. Env validation module ──────────────────────────────────────────────────

  console.log("\n--- Deployment modules ---");
  requireFile("env validation module", "lib/env/validateEnv.ts");
  requireFile("logger utility", "lib/utils/logger.ts");

  // ── 10. Package scripts ───────────────────────────────────────────────────────

  console.log("\n--- Package scripts ---");
  if (exists("package.json")) {
    const pkg = JSON.parse(read("package.json")) as { scripts?: Record<string, string> };
    const scripts = pkg.scripts ?? {};
    for (const script of [
      "check:safety",
      "check:demo",
      "check:deployment",
      "build",
      "start",
    ]) {
      if (scripts[script]) {
        pass(`script ${script}`, scripts[script]);
      } else {
        fail(`script ${script}`, "missing from package.json scripts");
      }
    }
  }

  // ── 11. Migrations present ────────────────────────────────────────────────────

  console.log("\n--- Database migrations ---");
  for (const [name, rel] of [
    ["migration 004 (litigation foundation)", "supabase/migrations/004_litigation_workflow_foundation.sql"],
    ["migration 009 (matters)", "supabase/migrations/009_matters_workspaces.sql"],
  ] as const) {
    requireFile(name, rel);
  }

  // ── Summary ───────────────────────────────────────────────────────────────────

  console.log(`\n=== Results: ${failed === 0 ? "deployment-ready" : "not ready"} (${passed} passed, ${warned} warnings, ${failed} failed) ===`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Deployment readiness check crashed:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
