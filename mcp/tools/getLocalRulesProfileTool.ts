import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getLocalRules } from "@/lib/litigation/localRules/getLocalRules";

export function register(server: McpServer): void {
  server.registerTool(
    "get_local_rules_profile",
    {
      description:
        "Return the local rules profile for a jurisdiction and court. Profiles include required sections, formatting notes, citation notes, and filing notes. Supported profiles: SDNY, Federal (generic), New York State (generic). These are drafting reminders only, not a compliance certification.",
      inputSchema: {
        jurisdiction: z
          .string()
          .optional()
          .describe("Jurisdiction (e.g. 'Federal', 'SDNY', 'New York')"),
        court: z
          .string()
          .optional()
          .describe("Court (e.g. 'S.D.N.Y.', 'SDNY', 'New York Supreme Court')"),
        motionType: z
          .string()
          .optional()
          .describe("Motion type for context (does not filter profiles)"),
      },
    },
    async ({ jurisdiction, court, motionType }) => {
      try {
        const profile = getLocalRules(jurisdiction ?? "", court ?? "");
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  profile,
                  motionType: motionType ?? null,
                  disclaimer:
                    "Drafting reminders only. Does not constitute a compliance certification or legal advice.",
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
              text: `get_local_rules_profile error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
