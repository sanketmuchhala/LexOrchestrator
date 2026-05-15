// LLM provider configuration.
// Supports OPENROUTER_API_KEY or OPENAI_API_KEY.
// OpenRouter keys (prefix: sk-or-) are auto-detected regardless of which
// variable name is used, so no rename is required when switching providers.

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? null;
const OPENAI_KEY     = process.env.OPENAI_API_KEY     ?? null;

export const LLM_API_KEY = OPENROUTER_KEY ?? OPENAI_KEY;

// Treat the key as an OpenRouter key if:
//   - OPENROUTER_API_KEY is explicitly set, OR
//   - OPENAI_API_KEY contains an OpenRouter key (sk-or-... prefix)
export const USE_OPENROUTER =
  !!OPENROUTER_KEY || (!!OPENAI_KEY && OPENAI_KEY.startsWith("sk-or-"));

export const LLM_BASE_URL = USE_OPENROUTER
  ? "https://openrouter.ai/api/v1"
  : undefined; // undefined → OpenAI SDK default (api.openai.com)

// OpenRouter requires these two headers; harmless if sent to OpenAI.
export const LLM_EXTRA_HEADERS: Record<string, string> | undefined = USE_OPENROUTER
  ? {
      "HTTP-Referer": "https://github.com/sanketmuchhala/LexOrchestrator",
      "X-Title": "LexOrchestrator",
    }
  : undefined;

// Default model names differ by provider:
//   OpenRouter: "openai/gpt-4o-mini", "anthropic/claude-3-haiku", etc.
//   OpenAI:     "gpt-4o-mini"
export const DEFAULT_LLM_MODEL       = USE_OPENROUTER ? "openai/gpt-4o-mini"           : "gpt-4o-mini";
export const DEFAULT_EMBEDDING_MODEL = USE_OPENROUTER ? "openai/text-embedding-3-small" : "text-embedding-3-small";
