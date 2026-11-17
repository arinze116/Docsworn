import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { auditDocumentation } from "../src/audit.js";

describe("AT-7 deterministic end-to-end audit", () => {
  it("turns fixture docs and captured Kane evidence into a truth report", async () => {
    const outputRoot = await mkdtemp(path.join(tmpdir(), "docsworn-e2e-"));
    const outputPath = path.join(outputRoot, "report.md");
    const result = await auditDocumentation({
      repo: path.resolve("demo/fixture-app"),
      targetUrl: "http://127.0.0.1:4173",
      outputPath,
      flowsDirectory: path.join(outputRoot, ".kane"),
      kaneBinary: "kane-cli",
      kaneTimeoutMs: 1_000,
      capturedResultsPath: path.resolve("demo/fixture-app/kane-results.json"),
      skipRun: false,
      aiMode: "off",
      maxClaims: 20,
    });
    expect(result.executionMode).toBe("captured-kane");
    expect(result.summary).toMatchObject({ total: 5, passed: 1, failed: 3, unverifiable: 1, accuracyPercent: 25 });
    const report = await readFile(outputPath, "utf8");
    expect(report).toContain("Documentation Truth Report");
    expect(report).toContain("Create account");
  });
});
