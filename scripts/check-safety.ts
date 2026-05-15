import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// ── Configuration ────────────────────────────────────────────────────────────

const FORBIDDEN_TERMS = [
  "ourfirm",
  "ourfirm.ai",
  "our firm ai",
];

const SCANNED_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx",
  ".md", ".mdx",
  ".json",
  ".css",
  ".sql",
  ".yml", ".yaml",
]);

const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "coverage",
]);

const EXCLUDED_FILES = new Set([
  "package-lock.json",
]);

const SELF_BASENAME = "check-safety.ts";

const SECRET_PATTERNS: Array<{ label: string; pattern: RegExp }> = [
  { label: "OpenAI key",         pattern: /OPENAI_API_KEY\s*=\s*sk-[a-zA-Z0-9_-]{20,}/     },
  { label: "OpenRouter key",     pattern: /OPENROUTER_API_KEY\s*=\s*sk-or-[a-zA-Z0-9_-]{20,}/ },
  { label: "Supabase svc key",   pattern: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*eyJ[a-zA-Z0-9._-]{20,}/ },
  { label: "Supabase JWT",       pattern: /SUPABASE_JWT_SECRET\s*=\s*[a-zA-Z0-9._-]{20,}/  },
  { label: "Database URL",       pattern: /DATABASE_URL\s*=\s*postgres:\/\/[^\s]{10,}/      },
  { label: "Anthropic key",      pattern: /ANTHROPIC_API_KEY\s*=\s*sk-ant-[a-zA-Z0-9_-]{20,}/ },
  { label: "JWT secret",         pattern: /JWT_SECRET\s*=\s*[a-zA-Z0-9._-]{20,}/           },
  { label: "Bare sk- key value", pattern: /["']sk-[a-zA-Z0-9_-]{20,}["']/                  },
  { label: "Bare sk-or- key",    pattern: /["']sk-or-[a-zA-Z0-9_-]{20,}["']/               },
];

const ENV_FILES_THAT_MUST_NOT_BE_TRACKED = [".env", ".env.local"];

// ── Helpers ──────────────────────────────────────────────────────────────────

function getTrackedFiles(): string[] {
  try {
    const out = execSync("git ls-files", { encoding: "utf-8" });
    return out.trim().split("\n").filter(Boolean);
  } catch {
    console.warn("[check-safety] git ls-files failed; scanning filesystem instead");
    return [];
  }
}

function collectFiles(dir: string, root: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(full, root));
    } else if (entry.isFile()) {
      const rel = path.relative(root, full);
      if (EXCLUDED_FILES.has(path.basename(rel))) continue;
      if (SCANNED_EXTENSIONS.has(path.extname(entry.name))) {
        results.push(rel);
      }
    }
  }
  return results;
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main(): void {
  const root = path.resolve(__dirname, "..");
  const failures: string[] = [];

  // 1. Determine files to scan
  let files = getTrackedFiles();
  if (files.length === 0) {
    files = collectFiles(root, root);
  } else {
    files = files.filter((f) => {
      if (EXCLUDED_FILES.has(path.basename(f))) return false;
      return SCANNED_EXTENSIONS.has(path.extname(f));
    });
  }

  console.log(`[check-safety] Scanning ${files.length} files...`);

  // 2. Forbidden term scan
  let forbiddenCount = 0;
  for (const rel of files) {
    if (path.basename(rel) === SELF_BASENAME) continue;
    const full = path.join(root, rel);
    if (!fs.existsSync(full)) continue;
    const content = fs.readFileSync(full, "utf-8").toLowerCase();
    for (const term of FORBIDDEN_TERMS) {
      if (content.includes(term.toLowerCase())) {
        failures.push(`FORBIDDEN TERM "${term}" found in: ${rel}`);
        forbiddenCount++;
      }
    }
  }

  // 3. Secret pattern scan
  let secretCount = 0;
  for (const rel of files) {
    const ext = path.extname(rel);
    if (ext === ".json" && path.basename(rel) === "package.json") continue;
    const full = path.join(root, rel);
    if (!fs.existsSync(full)) continue;
    const content = fs.readFileSync(full, "utf-8");
    for (const { label, pattern } of SECRET_PATTERNS) {
      if (pattern.test(content)) {
        failures.push(`SECRET LEAKED (${label}) in: ${rel}`);
        secretCount++;
      }
    }
  }

  // 4. Check that .env / .env.local are not tracked
  const trackedFiles = new Set(getTrackedFiles());
  for (const envFile of ENV_FILES_THAT_MUST_NOT_BE_TRACKED) {
    if (trackedFiles.has(envFile)) {
      failures.push(`ENV FILE TRACKED: ${envFile} is committed to git -- remove it immediately`);
    }
  }

  // 5. Report
  console.log("");
  if (failures.length === 0) {
    console.log("[check-safety] PASS -- no forbidden terms, no leaked secrets, env files safe");
    process.exit(0);
  } else {
    console.log(`[check-safety] FAIL -- ${failures.length} issue(s) found:\n`);
    for (const f of failures) {
      console.log(`  ✗ ${f}`);
    }
    console.log("");
    console.log(`  Forbidden terms: ${forbiddenCount}`);
    console.log(`  Leaked secrets:  ${secretCount}`);
    console.log(`  Tracked env:     ${failures.length - forbiddenCount - secretCount}`);
    console.log("");
    process.exit(1);
  }
}

main();
