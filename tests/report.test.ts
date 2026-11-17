import { describe, expect, it } from "vitest";

import { renderReport, summarizeClaims } from "../src/report.js";
import type { AuditedClaim } from "../src/types.js";

describe("AT-5 truth report", () => {
  it("calculates accuracy from executed pass/fail claims only", () => {
    const claims: AuditedClaim[] = [
      {
        claim: { id: "claim-001", claim: "A", sourceFile: "README.md", line: 1, flowType: "web", verifiability: "testable" },
        observation: { claimId: "claim-001", status: "passed", summary: "ok", source: "live-kane" },
      },
      {
        claim: { id: "claim-002", claim: "B", sourceFile: "README.md", line: 2, flowType: "web", verifiability: "testable" },
        observation: { claimId: "claim-002", status: "failed", summary: "no", source: "live-kane" },
        suggestedFix: "C",
      },
      {
        claim: { id: "claim-003", claim: "D", sourceFile: "README.md", line: 3, flowType: "web", verifiability: "unverifiable" },
        observation: { claimId: "claim-003", status: "unverifiable", summary: "vague", source: "not-run" },
      },
    ];
    const summary = summarizeClaims(claims);
    expect(summary.accuracyPercent).toBe(50);
    const report = renderReport({
      repository: "fixture",
      targetUrl: "http://localhost",
      generatedAt: "2026-11-17T00:00:00Z",
      aiMode: "offline",
      executionMode: "live-kane",
      summary,
      claims,
    });
    expect(report).toContain("Suggested documentation: **C**");
    expect(report).toContain("Captured fallback results are labelled");
  });
});
