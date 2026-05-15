import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getWorkflowArtifacts } from "@/lib/litigation/getWorkflowArtifacts";

export function register(server: McpServer): void {
  server.registerTool(
    "get_draft_artifacts",
    {
      description:
        "Retrieve all draft artifacts for a litigation workflow run. Artifacts include the motion outline, adversarial red-team memo, local rules check, judge brief, and eval summary. Returns empty array when the database is unavailable.",
      inputSchema: {
        workflowRunId: z
          .string()
          .min(1)
          .describe("The workflow run ID returned by run_litigation_workflow"),
      },
    },
    async ({ workflowRunId }) => {
      try {
        const artifacts = await getWorkflowArtifacts(workflowRunId);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ artifacts }, null, 2),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: `get_draft_artifacts error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
