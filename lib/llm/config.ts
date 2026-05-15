// LLM provider configuration.
// Priority: OPENROUTER_API_KEY > OPENAI_API_KEY
// When OPENROUTER_API_KEY is set the OpenAI SDK is pointed at OpenRouter's
// OpenAI-compatible endpoint and the required headers are injected automatically.

export const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? null;
export const OPENAI_KEY     = process.env.OPENAI_API_KEY     ?? null;

export const LLM_API_KEY     = OPENROUTER_KEY ?? OPENAI_KEY;
export const USE_OPENROUTER  = !!OPENROUTER_KEY;
export const LLM_BASE_URL    = USE_OPENROUTER
  ? "https://openrouter.ai/api/v1"
  : undefined; // undefined → OpenAI SDK default

// OpenRouter requires these two headers; ignored by OpenAI's endpoint.
export const LLM_EXTRA_HEADERS: Record<string, string> | undefined = USE_OPENROUTER
  ? {
      "HTTP-Referer": "https://github.com/sanketmuchhala/LexOrchestrator",
      "X-Title": "LexOrchestrator",
    }
  : undefined;

// Default model names differ by provider:
//   OpenRouter format: "openai/gpt-4o-mini", "anthropic/claude-3-haiku", etc.
//   OpenAI format:     "gpt-4o-mini"
export const DEFAULT_LLM_MODEL       = USE_OPENROUTER ? "openai/gpt-4o-mini"          : "gpt-4o-mini";
export const DEFAULT_EMBEDDING_MODEL = USE_OPENROUTER ? "openai/text-embedding-3-small" : "text-embedding-3-small";
