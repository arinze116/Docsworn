import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildObjective, generateFlows } from "../src/flow-generator.js";

describe("AT-3 Kane flow generation", () => {
  it("writes one official _test.md file per testable claim", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "docsworn-flow-"));
    const [flow] = await generateFlows(
      [{ id: "claim-001", claim: "Open /register and click Submit.", sourceFile: "README.md", line: 8, flowType: "web", verifiability: "testable" }],
      "https://example.test",
      root,
    );
    expect(flow?.path.endsWith("claim-001_test.md")).toBe(true);
    const markdown = await readFile(flow!.path, "utf8");
    expect(markdown).toContain("mode: testing");
    expect(markdown).toContain("Open https://example.test/register");
    expect(markdown).toContain("README.md:8");
    expect(markdown).not.toContain("docsworn_claim_id:");
    expect(markdown).not.toContain("docsworn_source:");
  });

  it("does not treat an expected destination as the starting route", () => {
    const objective = buildObjective(
      { id: "claim-002", claim: "Registration signs the user in and opens /dashboard.", sourceFile: "README.md", line: 9, flowType: "web", verifiability: "testable" },
      "https://example.test/register",
    );
    expect(objective).toContain("Open https://example.test/register.");
    expect(objective).not.toContain("Open https://example.test/dashboard.");
  });
});
