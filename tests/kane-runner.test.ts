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
  it("R-HOSTED-DURATION-1 uses Kane's direct run surface for hosted objectives", async () => {
    let executedArgs: string[] = [];
    await runKaneFlows({
      flows: [flow],
      kaneBinary: "kane-cli",
      timeoutMs: 100,
      executionMode: "inline",
      startUrl: "https://app.example",
      execute: async (request) => {
        executedArgs = request.args;
        return {
          code: 0,
          stdout: '{"type":"run_end","status":"passed","summary":"Save worked","test_url":"https://test-manager.lambdatest.com/projects/project/test-cases/case/dashboard/share/token"}\n',
          stderr: "",
          durationMs: 12,
        };
      },
    } as Parameters<typeof runKaneFlows>[0]);

    expect(executedArgs.slice(0, 4)).toEqual([
      "run",
      flow.objective,
      "--url",
      "https://app.example",
    ]);
  });

  it("maps a structured passing completion", async () => {
    const [result] = await runKaneFlows({
      flows: [flow],
      kaneBinary: "kane-cli",
      timeoutMs: 100,
      execute: async () => ({
        code: 0,
        stdout: [
          '{"type":"run_end","status":"passed","summary":"Save worked"}',
          '{"type":"test_md_done","overall_status":"passed","share_url":"https://test-manager.lambdatest.com/projects/project/test-cases/case/dashboard/share/token?type=summary"}',
        ].join("\n"),
        stderr: "A harmless Kane advisory",
        durationMs: 12,
      }),
    });
    expect(result).toMatchObject({
      status: "passed",
      summary: "Save worked",
      source: "live-kane",
      sessionUrl: "https://test-manager.lambdatest.com/projects/project/test-cases/case/dashboard/share/token?type=summary",
    });
  });

  it("prefers the exact run observation over a later summary event without text", async () => {
    const [result] = await runKaneFlows({
      flows: [flow],
      kaneBinary: "kane-cli",
      timeoutMs: 100,
      execute: async () => ({
        code: 1,
        stdout: [
          '{"type":"run_end","status":"failed","summary":"Kane saw the Save button remain disabled."}',
          '{"type":"test_md_done","overall_status":"failed","share_url":"https://test-manager.lambdatest.com/projects/project/test-cases/case/dashboard/share/token"}',
        ].join("\n"),
        stderr: "A non-result advisory",
        durationMs: 12,
      }),
    });
    expect(result).toMatchObject({
      status: "failed",
      summary: "Kane saw the Save button remain disabled.",
    });
  });

  it("R-HOSTED-TRUTH-1 rejects a non-LambdaTest session URL", async () => {
    const [result] = await runKaneFlows({
      flows: [flow],
      kaneBinary: "kane-cli",
      timeoutMs: 100,
      execute: async () => ({
        code: 0,
        stdout: '{"type":"test_md_done","overall_status":"passed","summary":"Save worked","test_url":"https://example.com/not-evidence"}\n',
        stderr: "",
        durationMs: 12,
      }),
    });
    expect(result?.sessionUrl).toBeUndefined();
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
