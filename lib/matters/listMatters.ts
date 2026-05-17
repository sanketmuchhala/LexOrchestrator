import { listMatterRecords } from "@/lib/db/supabaseServer";
import type { MatterRow } from "./types";

export async function listMatters(limit = 50): Promise<MatterRow[]> {
  return listMatterRecords(limit);
}
