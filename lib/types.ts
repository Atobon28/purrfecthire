export type Score = 1 | 2 | 3 | 4 | 5 | null;
export type Decision = "Present" | "Hold" | "Reject";
export type Priority = "critical" | "high" | "medium" | "bonus";
export type ScoreArea = "technical" | "operating";

export type Criterion = {
  id: string;
  label: string;
  area: ScoreArea;
  weight: number;
  priority: Priority;
  hardGate?: boolean;
  minimumScore?: 1 | 2 | 3 | 4 | 5;
  question: string;
  followUps?: string[];
  strongSignals?: string[];
  redFlags?: string[];
};

export type LogisticCheck = {
  id: string;
  label: string;
  type: "boolean" | "text";
  requiredForPresent: boolean;
  rejectIfFalse?: boolean;
  placeholder?: string;
};

export type RoleDefinition = {
  slug: string;
  client: string;
  role: string;
  summary: string;
  technical: Criterion[];
  operating: Criterion[];
  logistics: LogisticCheck[];
};

export type Candidate = {
  id: string;
  name: string;
  roleSlug: string;
  linkedin?: string;
  email?: string;
  location?: string;
  currentRole?: string;
  currentCompany?: string;
  notes?: string;
  scores: Record<string, Score>;
  logistics: Record<string, string | boolean | null>;
};

export type EvaluationResult = {
  technicalScore: number | null;
  operatingScore: number | null;
  overallScore: number | null;
  technicalCoverage: number;
  operatingCoverage: number;
  decision: Decision;
  reasons: string[];
  failedGates: string[];
  unknownGates: string[];
};
