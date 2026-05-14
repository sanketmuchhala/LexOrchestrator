// OpenAI-compatible LLM wrapper.
// If OPENAI_API_KEY is set: makes real API calls.
// If absent: returns the provided fallback immediately so the app still works.

import OpenAI from "openai";

const API_KEY = process.env.OPENAI_API_KEY;
export const LLM_MODEL = process.env.LLM_MODEL ?? "gpt-4o-mini";
export const LLM_AVAILABLE = !!API_KEY;

let _client: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (!API_KEY) return null;
  if (!_client) _client = new OpenAI({ apiKey: API_KEY });
  return _client;
}

interface GenerateOptions<T> {
  system: string;
  prompt: string;
  schemaName: string; // used only for logging
  fallback: T;
}

export async function generateStructuredOutput<T>(opts: GenerateOptions<T>): Promise<T> {
  const client = getClient();

  if (!client) {
    return opts.fallback;
  }

  try {
    const response = await client.chat.completions.create({
      model: LLM_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: opts.system },
        { role: "user", content: opts.prompt },
      ],
      temperature: 0.2,
      max_tokens: 2048,
    });

    const content = response.choices[0]?.message?.content ?? "";
    const parsed = JSON.parse(content) as T;
    return parsed;
  } catch (err) {
    console.warn(`[LLM] ${opts.schemaName} failed, using fallback:`, err instanceof Error ? err.message : String(err));
    return opts.fallback;
  }
}
