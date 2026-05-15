import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { runLitigationWorkflow } from "@/lib/litigation/runLitigationWorkflow";

export function register(server: McpServer): void {
  server.registerTool(
    "run_litigation_workflow",
    {
      description:
        "Run the full eight-agent litigation drafting workflow: intake, retrieval, drafting, citation verification, adversarial review, local rules check, judge brief, and eval. Returns a workflow run ID and full results. Degrades gracefully without API keys or database.",
      inputSchema: {
        query: z
          .string()
          .min(1)
          .describe("The litigation query or motion description"),
        jurisdiction: z
          .string()
          .optional()
          .describe("Jurisdiction (e.g. 'Federal', 'SDNY', 'New York')"),
        court: z
          .string()
          .optional()
          .describe("Specific court (e.g. 'S.D.N.Y.', '2d Cir.')"),
        judgeName: z
          .string()
          .optional()
          .describe("Judge name for judge-brief preparation"),
        motionType: z
          .string()
          .optional()
          .describe(
            "Motion type (e.g. 'motion_to_dismiss', 'motion_for_summary_judgment', 'motion_in_limine')"
          ),
        uploadedText: z
          .string()
          .optional()
          .describe("Full text of an uploaded document to incorporate"),
        facts: z
          .string()
          .optional()
          .describe("Key facts for the motion"),
        desiredOutput: z
          .string()
          .optional()
          .describe("Description of the desired output format or focus"),
      },
    },
    async ({
      query,
      jurisdiction,
      court,
      judgeName,
      motionType,
      uploadedText,
      facts,
      desiredOutput,
    }) => {
      try {
        const result = await runLitigationWorkflow({
          query,
          jurisdiction: jurisdiction ?? "Federal",
          court: court ?? "Federal Court",
          judgeName,
          motionType,
          uploadedText,
          facts,
          desiredOutput,
        });

        const output = {
          workflowRunId: result.workflowRunId,
          status: result.status,
          finalOutput: result.finalOutput,
          citationSummary: result.citationSummary,
          evalSummary: result.evalSummary,
          artifactCount: result.artifacts.length,
          eventCount: result.events.length,
        };

        return {
          content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: `run_litigation_workflow error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
