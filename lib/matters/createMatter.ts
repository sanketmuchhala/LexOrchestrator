import { insertMatterRecord, DB_AVAILABLE } from "@/lib/db/supabaseServer";
import type { CreateMatterInput, MatterRow } from "./types";

export async function createMatter(input: CreateMatterInput): Promise<{ id: string; persisted: boolean }> {
  const id = await insertMatterRecord({
    title: input.title,
    clientName: input.clientName,
    matterType: input.matterType,
    jurisdiction: input.jurisdiction,
    court: input.court,
    description: input.description,
    organizationId: input.organizationId,
    userId: input.userId,
  });

  return { id, persisted: DB_AVAILABLE };
}

export function buildEphemeralMatter(input: CreateMatterInput): MatterRow {
  return {
    id: "demo-matter-" + Date.now(),
    organization_id: null,
    user_id: null,
    title: input.title,
    client_name: input.clientName ?? null,
    matter_type: input.matterType ?? null,
    jurisdiction: input.jurisdiction ?? null,
    court: input.court ?? null,
    judge_id: null,
    status: "active",
    description: input.description ?? null,
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
