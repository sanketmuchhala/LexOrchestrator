import type { JurySimulationRecord } from "./types";

const MAX_ENTRIES = 100;
const store = new Map<string, JurySimulationRecord>();
const insertOrder: string[] = [];

export function setSimulation(id: string, record: JurySimulationRecord): void {
  if (!store.has(id)) {
    if (insertOrder.length >= MAX_ENTRIES) {
      const evict = insertOrder.shift();
      if (evict) store.delete(evict);
    }
    insertOrder.push(id);
  }
  store.set(id, record);
}

export function getSimulation(id: string): JurySimulationRecord | null {
  return store.get(id) ?? null;
}
