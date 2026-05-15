import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { findJudge } from "@/lib/litigation/judges/findJudge";
import { getJudgeProfile } from "@/lib/litigation/judges/getJudgeProfile";

const MOTION_TYPE_GUIDANCE: Record<string, string[]> = {
  motion_to_dismiss: [
    "Cite controlling circuit authority on the plausibility standard (Twombly, Iqbal).",
    "Address all elements of each challenged claim directly.",
    "Distinguish analogous decisions granting leave to amend.",
  ],
  motion_for_summary_judgment: [
    "Marshal undisputed material facts methodically before the legal argument.",
    "Anticipate Rule 56(d) continuance requests.",
    "Address credibility-based disputes and explain why they do not create genuine issues.",
  ],
  motion_in_limine: [
    "Lead with the governing admissibility standard before the facts.",
    "Cite Daubert/Kumho for expert evidence; FRE 403 for prejudice arguments.",
    "Address any prior rulings on the same or related evidence.",
  ],
  general: [
    "Identify the controlling legal standard at the outset.",
    "Ground every factual assertion in the record.",
    "Address anticipated counterarguments before opposing counsel raises them.",
  ],
};

export function register(server: McpServer): void {
  server.registerTool(
    "get_judge_brief",
    {
      description:
        "Look up a judge by name or ID and retrieve cached preparation guidance derived from indexed opinions. Returns style notes, argument guidance, and motion-type signals. This is argument preparation signal only, not outcome prediction.",
      inputSchema: {
        judgeName: z
          .string()
          .optional()
          .describe("Judge name to look up (fuzzy match)"),
        judgeId: z
          .string()
          .optional()
          .describe("Exact judge ID for precise lookup"),
        court: z
          .string()
          .optional()
          .describe("Court filter to narrow name-based lookup"),
        jurisdiction: z
          .string()
          .optional()
          .describe("Jurisdiction filter to narrow name-based lookup"),
        motionType: z
          .string()
          .optional()
          .describe("Motion type to select the most relevant cached profile"),
      },
    },
    async ({ judgeName, judgeId, court, jurisdiction, motionType }) => {
      try {
        if (!judgeName && !judgeId) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    judgeBrief: null,
                    message: "Provide either judgeName or judgeId.",
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const lookup = await findJudge({ judgeId, judgeName, court, jurisdiction });

        if (!lookup.judge || lookup.matchStatus === "not_found") {
          const name = judgeName ?? judgeId ?? "unknown";
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify(
                  {
                    judgeBrief: {
                      matchStatus: "not_found",
                      profileAvailable: false,
                      judgeName: name,
                      limitations: [
                        `Judge "${name}" was not found in the indexed judge database.`,
                        "Only judges with indexed opinions and cached profiles are available.",
                      ],
                    },
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        const judge = lookup.judge;
        const profile = await getJudgeProfile(judge.id, motionType);
        const guidance =
          MOTION_TYPE_GUIDANCE[motionType ?? "general"] ?? MOTION_TYPE_GUIDANCE.general;

        const judgeBrief = {
          matchStatus: lookup.matchStatus,
          profileAvailable: !!profile,
          judgeName: judge.full_name,
          court: judge.court,
          jurisdiction: judge.jurisdiction,
          sourceOpinionCount: profile?.sourceOpinionCount ?? 0,
          motionType: profile?.motionType ?? motionType ?? null,
          styleNotes: profile?.styleNotes ? [profile.styleNotes] : [],
          argumentGuidance: profile?.argumentGuidance ? [profile.argumentGuidance] : guidance,
          motionTypeGuidance: guidance,
          limitations: [
            "Profile derived from indexed opinions only. May not reflect current judicial preferences.",
            "Argument preparation signal only. Not outcome prediction.",
            ...(profile
              ? []
              : ["No cached profile found for this judge. Generic guidance provided."]),
          ],
        };

        return {
          content: [{ type: "text" as const, text: JSON.stringify({ judgeBrief }, null, 2) }],
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text" as const,
              text: `get_judge_brief error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
