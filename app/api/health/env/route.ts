import { NextResponse } from "next/server";
import { getEnvStatus } from "@/lib/env/validateEnv";

// Internal env status endpoint. Returns env configuration availability
// without exposing any secret values.
export async function GET(): Promise<NextResponse> {
  try {
    const status = getEnvStatus();

    return NextResponse.json({
      status: status.warnings.length === 0 ? "ok" : "warn",
      environment: status.environment,
      database: {
        configured: status.database.configured,
      },
      ai: {
        openrouterConfigured: status.ai.openrouter_configured,
        openaiConfigured: status.ai.openai_configured,
        anyLlmConfigured: status.ai.any_llm_configured,
      },
      citationWorker: {
        configured: status.citationWorker.configured,
      },
      persistenceMode: status.persistenceMode,
      warnings: status.warnings,
    });
  } catch {
    return NextResponse.json({ status: "error", message: "Env status check failed." }, { status: 500 });
  }
}
