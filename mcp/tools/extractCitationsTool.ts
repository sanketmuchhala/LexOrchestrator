import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { extractCitations } from "@/lib/citations/extractCitations";

export function register(server: McpServer): void {
  server.registerTool(
    "extract_citations",
    {
      description:
        "Extract U.S. legal citations from freeform text using regex patterns. Handles U.S., S. Ct., F.2d/3d/4th, F. Supp., N.Y., A.D., and Misc. reporters.",
      inputSchema: {
        text: z.string().min(1).describe("Legal text to extract citations from"),
      },
    },
    async ({ text }) => {
      try {
        const citations = extractCitations(text);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ citations }, null, 2),
            },
          ],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: `extract_citations error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
