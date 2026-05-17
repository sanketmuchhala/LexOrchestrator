import { updateMatterRecord } from "@/lib/db/supabaseServer";
import type { UpdateMatterInput } from "./types";

export async function updateMatter(id: string, input: UpdateMatterInput): Promise<void> {
  await updateMatterRecord(id, {
    title: input.title,
    clientName: input.clientName,
    matterType: input.matterType,
    jurisdiction: input.jurisdiction,
    court: input.court,
    status: input.status,
    description: input.description,
  });
}
