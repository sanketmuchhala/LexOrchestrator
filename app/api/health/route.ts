import { NextResponse } from "next/server";
import { getEnvStatus } from "@/lib/env/validateEnv";

const APP_VERSION = process.env.npm_package_version ?? "0.1.0";
const HEALTH_TIMEOUT_MS = 2000;

async function checkDatabaseReachable(configured: boolean): Promise<boolean | "not_configured"> {
  if (!configured) return "not_configured";
  try {
    const { listLitigationWorkflowRuns } = await import("@/lib/db/supabaseServer");
    const timer = setTimeout(() => { /* timeout handled by caller */ }, HEALTH_TIMEOUT_MS);
    try {
      const rows = await listLitigationWorkflowRuns(1);
      return Array.isArray(rows);
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return false;
  }
}

async function checkCitationWorkerReachable(configured: boolean): Promise<boolean | "not_configured"> {
  if (!configured) return "not_configured";
  const workerUrl = process.env.CITATION_WORKER_URL;
  if (!workerUrl) return "not_configured";

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
    try {
      const res = await fetch(`${workerUrl}/health`, { signal: controller.signal });
      return res.ok;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return false;
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const envStatus = getEnvStatus();

    const [databaseReachable, citationWorkerReachable] = await Promise.all([
      checkDatabaseReachable(envStatus.database.configured),
      checkCitationWorkerReachable(envStatus.citationWorker.configured),
    ]);

    const allOk =
      (databaseReachable === true || databaseReachable === "not_configured") &&
      (citationWorkerReachable === true || citationWorkerReachable === "not_configured");

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      app: "LexOrchestrator",
      version: APP_VERSION,
      checks: {
        env: envStatus.warnings.length === 0 ? "ok" : "warn",
        databaseReachable,
        citationWorkerReachable,
      },
      degraded: !allOk,
    });
  } catch {
    return NextResponse.json({ status: "error", message: "Health check failed." }, { status: 500 });
  }
}
