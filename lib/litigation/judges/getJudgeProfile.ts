import {
  getJudgeProfileWithFallback,
  type JudgeProfileRow,
} from "@/lib/db/supabaseServer";

export type { JudgeProfileRow };

export async function getJudgeProfile(
  judgeId: string,
  motionType?: string
): Promise<JudgeProfileRow | null> {
  return getJudgeProfileWithFallback(judgeId, motionType);
}
