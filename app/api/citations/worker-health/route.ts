import { NextResponse } from "next/server";

const HEALTH_TIMEOUT_MS = 3000;

export async function GET(): Promise<NextResponse> {
  const workerUrl = process.env.CITATION_WORKER_URL;

  if (!workerUrl) {
    return NextResponse.json({
      configured: false,
      healthy: false,
      workerUrlConfigured: false,
      extractor: "regex_fallback",
      message: "CITATION_WORKER_URL is not set. Using built-in regex extractor.",
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  try {
    const res = await fetch(`${workerUrl}/health`, {
      signal: controller.signal,
    });

    if (!res.ok) {
      return NextResponse.json({
        configured: true,
        healthy: false,
        workerUrlConfigured: true,
        extractor: "regex_fallback",
        message: `Worker returned HTTP ${res.status}. Falling back to regex extractor.`,
      });
    }

    const data = (await res.json()) as Record<string, unknown>;

    return NextResponse.json({
      configured: true,
      healthy: true,
      workerUrlConfigured: true,
      extractor: data.extractor === "eyecite" ? "eyecite" : "unknown",
      message: `Worker healthy. Extractor: ${data.extractor ?? "unknown"}.`,
      workerResponse: data,
    });
  } catch {
    return NextResponse.json({
      configured: true,
      healthy: false,
      workerUrlConfigured: true,
      extractor: "regex_fallback",
      message: "Worker did not respond within timeout. Falling back to regex extractor.",
    });
  } finally {
    clearTimeout(timer);
  }
}
