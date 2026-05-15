export interface LocalRuleProfile {
  id: string;
  label: string;
  jurisdiction: string;
  court: string | null;
  supportedMotionTypes: string[];
  formattingNotes: string[];
  requiredSections: string[];
  citationNotes: string[];
  filingNotes: string[];
  limitations: string[];
}

export interface SectionCheckResult {
  sectionId: string;
  label: string;
  required: boolean;
  detected: boolean;
}

export interface LocalRulesResult {
  profileId: string;
  profileLabel: string;
  formattingNotes: string[];
  requiredSections: string[];
  missingSections: string[];
  citationNotes: string[];
  filingNotes: string[];
  warnings: string[];
  revisedDraftText?: string;
  confidence: number;
  limitations: string[];
  artifactContent: string;
  sectionChecks: SectionCheckResult[];
}
