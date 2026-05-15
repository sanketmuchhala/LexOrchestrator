import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getWorkflowRun } from "@/lib/litigation/getWorkflowRun";

export function register(server: McpServer): void {
  server.registerTool(
    "get_workflow_status",
    {
      description:
        "Retrieve the status and agent event feed for a litigation workflow run by ID. Returns the workflow row and all agent events. Returns empty results when the database is unavailable.",
      inputSchema: {
        workflowRunId: z
          .string()
          .min(1)
          .describe("The workflow run ID returned by run_litigation_workflow"),
      },
    },
    async ({ workflowRunId }) => {
      try {
        const { workflow, events } = await getWorkflowRun(workflowRunId);

        if (!workflow) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  { workflow: null, events: [], message: "Workflow run not found" },
                  null,
                  2
                ),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ workflow, events }, null, 2),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: `get_workflow_status error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
