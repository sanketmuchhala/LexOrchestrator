import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { searchLegalOpinions } from "@/lib/retrieval/searchLegalOpinions";

export function register(server: McpServer): void {
  server.registerTool(
    "search_legal_opinions",
    {
      description:
        "Search indexed court opinions using hybrid RAG (keyword + vector similarity). Returns ranked opinion chunks with case metadata, citation, and relevance scores.",
      inputSchema: {
        query: z.string().min(1).describe("Legal query to search for"),
        jurisdiction: z
          .string()
          .optional()
          .describe("Jurisdiction filter (e.g. 'Federal', 'New York')"),
        court: z
          .string()
          .optional()
          .describe("Court filter (e.g. 'SDNY', 'S.D.N.Y.', '2d Cir.')"),
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe("Maximum results to return (1-20, default 5)"),
      },
    },
    async ({ query, jurisdiction, court, limit }) => {
      try {
        const response = await searchLegalOpinions({
          query,
          jurisdiction,
          court,
          limit: Math.min(Math.max(limit ?? 5, 1), 20),
        });
        return {
          content: [{ type: "text" as const, text: JSON.stringify(response, null, 2) }],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: `search_legal_opinions error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
