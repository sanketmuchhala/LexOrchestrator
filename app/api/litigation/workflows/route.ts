import { NextRequest, NextResponse } from "next/server";
import { runLitigationWorkflow } from "@/lib/litigation/runLitigationWorkflow";
import type { LitigationWorkflowInput } from "@/lib/litigation/types";

function apiError(message: string, status: number, code: string) {
  return NextResponse.json({ error: message, code }, { status });
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return apiError("Invalid JSON body.", 400, "INVALID_JSON");
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query || query.length < 5) {
    return apiError("query is required (minimum 5 characters).", 400, "INVALID_QUERY");
  }
  if (query.length > 5000) {
    return apiError("query must be under 5000 characters.", 400, "QUERY_TOO_LONG");
  }

  const jurisdiction =
    typeof body.jurisdiction === "string" ? body.jurisdiction.trim() : "Federal";
  const court =
    typeof body.court === "string" ? body.court.trim() : "U.S. District Court";

  const validWorkflowTypes = ["motion_draft", "memo", "brief", "red_team", "eval"] as const;
  type WFType = (typeof validWorkflowTypes)[number];
  const rawType = typeof body.workflowType === "string" ? body.workflowType : "motion_draft";
  const workflowType: WFType = validWorkflowTypes.includes(rawType as WFType)
    ? (rawType as WFType)
    : "motion_draft";

  const input: LitigationWorkflowInput = {
    query,
    jurisdiction,
    court,
    workflowType,
    judgeName: typeof body.judgeName === "string" ? body.judgeName : undefined,
    judgeId: typeof body.judgeId === "string" ? body.judgeId : undefined,
    motionType: typeof body.motionType === "string" ? body.motionType : undefined,
    uploadedText: typeof body.uploadedText === "string" ? body.uploadedText : undefined,
    facts: typeof body.facts === "string" ? body.facts : undefined,
    desiredOutput: typeof body.desiredOutput === "string" ? body.desiredOutput : undefined,
    userId: typeof body.userId === "string" ? body.userId : undefined,
    organizationId: typeof body.organizationId === "string" ? body.organizationId : undefined,
    matterId: typeof body.matterId === "string" ? body.matterId : undefined,
    metadata:
      body.metadata !== null && typeof body.metadata === "object"
        ? (body.metadata as Record<string, unknown>)
        : undefined,
  };

  try {
    const result = await runLitigationWorkflow(input);
    return NextResponse.json(result);
  } catch (err) {
    console.warn(
      "[/api/litigation/workflows] Workflow failed:",
      err instanceof Error ? err.message : String(err)
    );
    return apiError("Litigation workflow failed. Check server logs.", 500, "WORKFLOW_FAILED");
  }
}
