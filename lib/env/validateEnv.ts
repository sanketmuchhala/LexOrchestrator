// Environment validation and status reporting.
// Never prints secret values. Returns masked availability only.
// The app runs in demo/fallback mode without any env vars set.

export type EnvTier =
  | "recommended_production"  // needed for persistence or AI features
  | "optional_ai"             // enables LLM agents; deterministic fallback when absent
  | "optional_db"             // enables Supabase persistence; ephemeral when absent
  | "optional_worker"         // enables eyecite citation worker; regex fallback when absent
  | "optional_mcp";           // local tool integrations

export interface EnvVarStatus {
  name: string;
  tier: EnvTier;
  configured: boolean;
  isPublic: boolean;
  purpose: string;
}

export interface EnvStatus {
  environment: "development" | "production" | "test" | "unknown";
  database: {
    configured: boolean;
    url_present: boolean;
    service_role_present: boolean;
  };
  ai: {
    openrouter_configured: boolean;
    openai_configured: boolean;
    any_llm_configured: boolean;
  };
  citationWorker: {
    configured: boolean;
  };
  persistenceMode: "supabase" | "memory";
  vars: EnvVarStatus[];
  warnings: string[];
}

function isSet(key: string): boolean {
  const val = process.env[key];
  return typeof val === "string" && val.trim().length > 0;
}

function nodeEnv(): EnvStatus["environment"] {
  const raw = process.env.NODE_ENV;
  if (raw === "production") return "production";
  if (raw === "development") return "development";
  if (raw === "test") return "test";
  return "unknown";
}

export function getEnvStatus(): EnvStatus {
  const dbUrl = isSet("NEXT_PUBLIC_SUPABASE_URL");
  const svcKey = isSet("SUPABASE_SERVICE_ROLE_KEY");
  const dbConfigured = dbUrl && svcKey;

  const openrouter = isSet("OPENROUTER_API_KEY");
  const openai = isSet("OPENAI_API_KEY");
  const anyLlm = openrouter || openai;

  const workerConfigured = isSet("CITATION_WORKER_URL");

  const warnings: string[] = [];
  if (!dbConfigured) {
    warnings.push("Supabase not configured. Workflow runs will not persist. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  }
  if (!anyLlm) {
    warnings.push("No LLM API key configured. Agents will use deterministic fallback outputs. Set OPENROUTER_API_KEY or OPENAI_API_KEY.");
  }
  if (nodeEnv() === "production" && !isSet("NEXT_PUBLIC_APP_URL")) {
    warnings.push("NEXT_PUBLIC_APP_URL is not set. Some features may produce incorrect absolute URLs in production.");
  }

  const vars: EnvVarStatus[] = [
    {
      name: "NEXT_PUBLIC_SUPABASE_URL",
      tier: "optional_db",
      configured: dbUrl,
      isPublic: true,
      purpose: "Supabase project URL for DB and vector search",
    },
    {
      name: "SUPABASE_SERVICE_ROLE_KEY",
      tier: "optional_db",
      configured: svcKey,
      isPublic: false,
      purpose: "Supabase service role key for server-side DB writes (bypasses RLS)",
    },
    {
      name: "SUPABASE_ANON_KEY",
      tier: "optional_db",
      configured: isSet("SUPABASE_ANON_KEY"),
      isPublic: false,
      purpose: "Supabase anon key (currently unused; reserved for future client auth)",
    },
    {
      name: "OPENROUTER_API_KEY",
      tier: "optional_ai",
      configured: openrouter,
      isPublic: false,
      purpose: "OpenRouter API key for LLM access (recommended over direct OpenAI)",
    },
    {
      name: "OPENAI_API_KEY",
      tier: "optional_ai",
      configured: openai,
      isPublic: false,
      purpose: "OpenAI API key for LLM access (used only if OPENROUTER_API_KEY is absent)",
    },
    {
      name: "CITATION_WORKER_URL",
      tier: "optional_worker",
      configured: workerConfigured,
      isPublic: false,
      purpose: "URL of the optional Python eyecite citation worker (regex fallback when absent)",
    },
    {
      name: "NEXT_PUBLIC_APP_URL",
      tier: "recommended_production",
      configured: isSet("NEXT_PUBLIC_APP_URL"),
      isPublic: true,
      purpose: "Absolute base URL of the deployed app (e.g. https://your-app.vercel.app)",
    },
  ];

  return {
    environment: nodeEnv(),
    database: {
      configured: dbConfigured,
      url_present: dbUrl,
      service_role_present: svcKey,
    },
    ai: {
      openrouter_configured: openrouter,
      openai_configured: openai,
      any_llm_configured: anyLlm,
    },
    citationWorker: {
      configured: workerConfigured,
    },
    persistenceMode: dbConfigured ? "supabase" : "memory",
    vars,
    warnings,
  };
}

// Throws only if a configuration is actively broken in production.
// Missing optional env vars generate warnings but do not throw
// (the app degrades gracefully in demo/fallback mode).
export function assertProductionEnvSafe(): void {
  const status = getEnvStatus();
  if (status.environment !== "production") return;

  const errors: string[] = [];

  // Detect partial Supabase config (URL without key is broken, not just missing)
  if (status.database.url_present && !status.database.service_role_present) {
    errors.push("NEXT_PUBLIC_SUPABASE_URL is set but SUPABASE_SERVICE_ROLE_KEY is missing. DB writes will fail.");
  }
  if (!status.database.url_present && status.database.service_role_present) {
    errors.push("SUPABASE_SERVICE_ROLE_KEY is set but NEXT_PUBLIC_SUPABASE_URL is missing. DB connection will fail.");
  }

  if (errors.length > 0) {
    throw new Error(`Production environment check failed:\n${errors.map((e) => `  - ${e}`).join("\n")}`);
  }
}
