import { LOCAL_RULE_PROFILES } from "./rules";
import type { LocalRuleProfile } from "./types";

export type { LocalRuleProfile };

export function getLocalRules(jurisdiction: string, court: string): LocalRuleProfile {
  const j = jurisdiction.toLowerCase();
  const c = court.toLowerCase();
  const combined = `${j} ${c}`;

  if (
    combined.includes("sdny") ||
    combined.includes("s.d.n.y") ||
    combined.includes("southern district of new york")
  ) {
    return LOCAL_RULE_PROFILES.find((p) => p.id === "sdny")!;
  }

  if (
    (j.includes("new york") || j.includes("n.y")) &&
    !j.includes("federal") &&
    !c.includes("federal") &&
    !c.includes("sdny") &&
    !c.includes("edny") &&
    !c.includes("wdny") &&
    !c.includes("ndny")
  ) {
    return LOCAL_RULE_PROFILES.find((p) => p.id === "new_york_state_generic")!;
  }

  return LOCAL_RULE_PROFILES.find((p) => p.id === "federal_generic")!;
}

export function getProfileById(id: string): LocalRuleProfile | null {
  return LOCAL_RULE_PROFILES.find((p) => p.id === id) ?? null;
}
