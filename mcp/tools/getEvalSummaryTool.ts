import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getWorkflowRun } from "@/lib/litigation/getWorkflowRun";
import { computeWorkflowEval } from "@/lib/litigation/evals/computeWorkflowEval";

export function register(server: McpServer): void {
  server.registerTool(
    "get_eval_summary",
    {
      description:
        "Compute and return the full quality evaluation for a completed litigation workflow run. Includes confidence score, citation pass rate, retrieval coverage, local rules completeness, and adversarial risk. Internal quality signal only -- not legal advice.",
      inputSchema: {
        workflowRunId: z
          .string()
          .min(1)
          .describe("The workflow run ID to evaluate"),
      },
    },
    async ({ workflowRunId }) => {
      try {
        const { workflow, events, artifacts, citationReports } =
          await getWorkflowRun(workflowRunId);

        if (!workflow) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  { evalSummary: null, message: "Workflow run not found" },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const fullEval = computeWorkflowEval(workflow, events, artifacts, citationReports);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  evalSummary: fullEval,
                  disclaimer:
                    "Internal quality signal only. Not legal advice, not a compliance certification.",
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: `get_eval_summary error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
