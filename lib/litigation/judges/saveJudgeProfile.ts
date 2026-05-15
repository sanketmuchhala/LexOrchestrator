import { insertJudgeProfile } from "@/lib/db/supabaseServer";

export interface JudgeProfileSaveData {
  judgeId: string;
  motionType?: string;
  jurisdiction?: string;
  styleNotes?: string;
  argumentGuidance?: string;
  sourceOpinionCount?: number;
}

export async function saveJudgeProfile(data: JudgeProfileSaveData): Promise<void> {
  await insertJudgeProfile({
    judgeId: data.judgeId,
    motionType: data.motionType,
    jurisdiction: data.jurisdiction,
    styleNotes: data.styleNotes,
    argumentGuidance: data.argumentGuidance,
    sourceOpinionCount: data.sourceOpinionCount ?? 0,
    generatedBy: "litigation-workflow",
    metadata: { generated: true, demo: false },
  });
}
