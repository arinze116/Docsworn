import { describe, expect, it } from "vitest";

import { CommandTimeoutError } from "../src/errors.js";
import { runKaneFlows } from "../src/kane-runner.js";
import type { GeneratedFlow } from "../src/types.js";

const flow: GeneratedFlow = {
  claim: { id: "claim-001", claim: "Click Save.", sourceFile: "README.md", line: 2, flowType: "web", verifiability: "testable" },
  path: "/tmp/claim-001_test.md",
  objective: "Open the app and click Save.",
};

describe("AT-4 Kane result mapping", () => {
  it("maps a structured passing completion", async () => {
    const [result] = await runKaneFlows({
      flows: [flow],
      kaneBinary: "kane-cli",
      timeoutMs: 100,
      execute: async () => ({
        code: 0,
        stdout: '{"type":"test_md_done","overall_status":"passed","summary":"Save worked"}\n',
        stderr: "",
        durationMs: 12,
      }),
    });
    expect(result).toMatchObject({ status: "passed", summary: "Save worked", source: "live-kane" });
  });

  it("keeps product failures distinct from runner errors", async () => {
    const responses = [
      { code: 1, stdout: '{"type":"run_end","status":"failed","summary":"Button missing"}\n', stderr: "", durationMs: 10 },
      { code: 2, stdout: "", stderr: "Chrome unavailable", durationMs: 10 },
    ];
    const observations = await runKaneFlows({
      flows: [flow, { ...flow, claim: { ...flow.claim, id: "claim-002" } }],
      kaneBinary: "kane-cli",
      timeoutMs: 100,
      execute: async () => responses.shift()!,
    });
    expect(observations.map((result) => result.status)).toEqual(["failed", "error"]);
  });

  it("R-TIMEOUT-1 records a timed-out flow and continues the audit", async () => {
    const responses = [
      new CommandTimeoutError("kane-cli exceeded 100 ms"),
      { code: 0, stdout: '{"type":"test_md_done","overall_status":"passed","summary":"Second flow passed"}\n', stderr: "", durationMs: 10 },
    ];
    const observations = await runKaneFlows({
      flows: [flow, { ...flow, claim: { ...flow.claim, id: "claim-002" } }],
      kaneBinary: "kane-cli",
      timeoutMs: 100,
      execute: async () => {
        const response = responses.shift()!;
        if (response instanceof Error) throw response;
        return response;
      },
    });
    expect(observations).toHaveLength(2);
    expect(observations[0]).toMatchObject({ status: "error", summary: "kane-cli exceeded 100 ms" });
    expect(observations[1]).toMatchObject({ status: "passed", summary: "Second flow passed" });
  });
});
