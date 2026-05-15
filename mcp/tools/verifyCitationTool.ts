import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { verifyCitation } from "@/lib/citations/verifyCitation";

export function register(server: McpServer): void {
  server.registerTool(
    "verify_citation",
    {
      description:
        "Verify a single U.S. legal citation against indexed court opinions. Checks existence, quote accuracy, pin cite, proposition support, and treatment. Results are limited to locally indexed opinions.",
      inputSchema: {
        citationText: z
          .string()
          .min(1)
          .describe("The citation to verify (e.g. '509 U.S. 579 (1993)')"),
        proposition: z
          .string()
          .optional()
          .describe("The legal proposition this citation is offered for"),
        quoteText: z
          .string()
          .optional()
          .describe("Exact quote attributed to this citation, if any"),
        pinCite: z
          .string()
          .optional()
          .describe("Specific page or section pinpoint (e.g. '579, 585')"),
        jurisdiction: z
          .string()
          .optional()
          .describe("Jurisdiction context for the verification"),
        court: z.string().optional().describe("Court context for the verification"),
      },
    },
    async ({ citationText, proposition, quoteText, pinCite, jurisdiction, court }) => {
      try {
        const result = await verifyCitation({
          citationText,
          proposition,
          quoteText,
          pinCite,
          jurisdiction,
          court,
        });
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ result }, null, 2) }],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: `verify_citation error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
