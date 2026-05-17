import { NextRequest, NextResponse } from "next/server";
import { exportDraft } from "@/lib/exports/exportDraft";
import type { ExportFormat, DraftExportOptions } from "@/lib/exports/types";

const VALID_FORMATS = new Set<string>(["pdf", "docx", "txt"]);

function parseBool(val: string | null, defaultVal: boolean): boolean {
  if (val === null) return defaultVal;
  return val !== "false" && val !== "0";
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams): Promise<Response> {
  const { id: workflowRunId } = await params;
  const { searchParams } = req.nextUrl;

  const format = searchParams.get("format");
  if (!format || !VALID_FORMATS.has(format)) {
    return NextResponse.json(
      { error: `format is required and must be one of: pdf, docx, txt` },
      { status: 400 }
    );
  }

  const options: DraftExportOptions = {
    includeMetadata: parseBool(searchParams.get("includeMetadata"), true),
    includeVerificationSummary: parseBool(searchParams.get("includeVerificationSummary"), true),
    includeJudgeBrief: parseBool(searchParams.get("includeJudgeBrief"), false),
    includeLocalRulesReview: parseBool(searchParams.get("includeLocalRulesReview"), false),
    includeAdversarialReview: parseBool(searchParams.get("includeAdversarialReview"), false),
  };

  let result;
  try {
    result = await exportDraft({
      workflowRunId,
      format: format as ExportFormat,
      options,
    });
  } catch {
    return NextResponse.json(
      { error: "Export failed. The draft may not be available." },
      { status: 500 }
    );
  }

  if (!result.buffer || result.buffer.length === 0) {
    return NextResponse.json(
      { error: "Export produced an empty file." },
      { status: 500 }
    );
  }

  return new Response(result.buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": result.mimeType,
      "Content-Disposition": `attachment; filename="${result.fileName}"`,
      "Cache-Control": "no-store",
      "Content-Length": String(result.buffer.length),
    },
  });
}
