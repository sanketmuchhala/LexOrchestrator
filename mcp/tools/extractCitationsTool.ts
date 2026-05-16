import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { extractCitationsWithBestAvailableProvider } from "@/lib/citations/citationExtractorAdapter";

export function register(server: McpServer): void {
  server.registerTool(
    "extract_citations",
    {
      description:
        "Extract U.S. legal citations from freeform text. Uses the eyecite worker when available (set CITATION_WORKER_URL), falls back to the built-in regex extractor. Each result includes extractorSource indicating which provider was used.",
      inputSchema: {
        text: z.string().min(1).describe("Legal text to extract citations from"),
      },
    },
    async ({ text }) => {
      try {
        const citations = await extractCitationsWithBestAvailableProvider(text);
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
