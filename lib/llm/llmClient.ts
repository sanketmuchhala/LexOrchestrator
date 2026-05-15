// LLM chat completions wrapper — supports OpenRouter and OpenAI.
// Set OPENROUTER_API_KEY to route through OpenRouter (recommended).
// Set OPENAI_API_KEY to use OpenAI directly.
// If neither key is set, generateStructuredOutput returns the provided fallback.

import OpenAI from "openai";
import {
  LLM_API_KEY,
  LLM_BASE_URL,
  LLM_EXTRA_HEADERS,
  DEFAULT_LLM_MODEL,
} from "@/lib/llm/config";

export const LLM_MODEL = process.env.LLM_MODEL ?? DEFAULT_LLM_MODEL;
export const LLM_AVAILABLE = !!LLM_API_KEY;

let _client: OpenAI | null = null;

function getClient(): OpenAI | null {
  if (!LLM_API_KEY) return null;
  if (!_client) {
    _client = new OpenAI({
      apiKey: LLM_API_KEY,
      baseURL: LLM_BASE_URL,
      defaultHeaders: LLM_EXTRA_HEADERS,
    });
  }
  return _client;
}

interface GenerateOptions<T> {
  system: string;
  prompt: string;
  schemaName: string;
  fallback: T;
}

export async function generateStructuredOutput<T>(opts: GenerateOptions<T>): Promise<T> {
  const client = getClient();
  if (!client) return opts.fallback;

  try {
    const response = await client.chat.completions.create({
      model: LLM_MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: opts.system },
        { role: "user",   content: opts.prompt },
      ],
      temperature: 0.2,
      max_tokens: 2048,
    });

    const content = response.choices[0]?.message?.content ?? "";
    return JSON.parse(content) as T;
  } catch (err) {
    console.warn(
      `[LLM] ${opts.schemaName} failed, using fallback:`,
      err instanceof Error ? err.message : String(err)
    );
    return opts.fallback;
  }
}
