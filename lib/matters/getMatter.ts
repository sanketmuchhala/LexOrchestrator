import { getMatterById } from "@/lib/db/supabaseServer";
import type { MatterRow } from "./types";

export async function getMatter(id: string): Promise<MatterRow | null> {
  return getMatterById(id);
}
