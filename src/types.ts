export type FlowType = "web" | "api" | "mobile";
export type Verifiability = "testable" | "unverifiable";
export type ResultStatus = "passed" | "failed" | "unverifiable" | "error" | "pending";

export interface DocFile {
  relativePath: string;
  content: string;
}

export interface DocClaim {
  id: string;
  claim: string;
  sourceFile: string;
  line: number;
  flowType: FlowType;
  verifiability: Verifiability;
  reason?: string;
}

export interface GeneratedFlow {
  claim: DocClaim;
  path: string;
  objective: string;
}

export interface KaneObservation {
  claimId: string;
  status: ResultStatus;
  summary: string;
  exitCode?: number;
  durationMs?: number;
  source: "live-kane" | "captured-kane" | "not-run";
}

export interface AuditedClaim {
  claim: DocClaim;
  flowPath?: string;
  observation: KaneObservation;
  suggestedFix?: string;
}

export interface AuditSummary {
  total: number;
  passed: number;
  failed: number;
  unverifiable: number;
  error: number;
  pending: number;
  accuracyPercent: number | null;
}

export interface AuditOutput {
  repository: string;
  targetUrl: string;
  generatedAt: string;
  aiMode: "gemini" | "offline";
  executionMode: "live-kane" | "captured-kane" | "not-run";
  summary: AuditSummary;
  claims: AuditedClaim[];
}
