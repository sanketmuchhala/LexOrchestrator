import {
  searchJudgesByName,
  getJudgeById,
  DB_AVAILABLE,
  type JudgeRow,
} from "@/lib/db/supabaseServer";

export type { JudgeRow };

export type JudgeFindMatchStatus = "exact" | "partial" | "not_found" | "ambiguous";

export interface JudgeLookupInput {
  judgeId?: string;
  judgeName?: string;
  court?: string;
  jurisdiction?: string;
}

export interface JudgeLookupResult {
  judge: JudgeRow | null;
  matchStatus: JudgeFindMatchStatus;
  candidates: JudgeRow[];
}

export async function findJudge(
  input: JudgeLookupInput
): Promise<JudgeLookupResult> {
  if (!DB_AVAILABLE) {
    return { judge: null, matchStatus: "not_found", candidates: [] };
  }

  if (input.judgeId) {
    const judge = await getJudgeById(input.judgeId);
    return {
      judge,
      matchStatus: judge ? "exact" : "not_found",
      candidates: judge ? [judge] : [],
    };
  }

  if (!input.judgeName) {
    return { judge: null, matchStatus: "not_found", candidates: [] };
  }

  const candidates = await searchJudgesByName(input.judgeName, 5);
  if (candidates.length === 0) {
    return { judge: null, matchStatus: "not_found", candidates: [] };
  }

  // Apply optional court/jurisdiction filters if candidates exceed 1
  const filtered =
    candidates.length > 1
      ? candidates.filter((j) => {
          if (
            input.court &&
            j.court &&
            !j.court.toLowerCase().includes(input.court.toLowerCase())
          )
            return false;
          if (
            input.jurisdiction &&
            j.jurisdiction &&
            !j.jurisdiction.toLowerCase().includes(input.jurisdiction.toLowerCase())
          )
            return false;
          return true;
        })
      : candidates;

  const pool = filtered.length > 0 ? filtered : candidates;

  if (pool.length === 1) {
    return { judge: pool[0], matchStatus: "partial", candidates: pool };
  }

  const exactName = pool.find(
    (j) => j.full_name.toLowerCase() === input.judgeName!.toLowerCase()
  );
  if (exactName) {
    return { judge: exactName, matchStatus: "exact", candidates: pool };
  }

  return { judge: pool[0], matchStatus: "ambiguous", candidates: pool };
}
