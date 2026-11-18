import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { DockerAuditRunner } from "../src/hosted/docker-runner.js";
import type { HostedCheckResponse } from "../src/types.js";

const cleanupPaths: string[] = [];

afterEach(async () => {
  await Promise.all(cleanupPaths.splice(0).map(async (directory) => await rm(directory, { recursive: true, force: true })));
});

describe("hosted Docker runner", () => {
  it("R-HOSTED-ISOLATION-1 mounts the configured private repository mirror read-only", async () => {
    const jobsRoot = await mkdtemp(path.join(tmpdir(), "docsworn-runner-test-"));
    cleanupPaths.push(jobsRoot);
    let dockerArguments: string[] = [];
    const requestId = "request-1";
    const response: HostedCheckResponse = {
      requestId,
      repository: "https://github.com/arinze116/Docsworn",
      targetUrl: "https://docsworn.vercel.app/",
      generatedAt: "2026-11-18T00:00:00.000Z",
      aiMode: "offline",
      executionMode: "live-kane",
      summary: { total: 0, passed: 0, failed: 0, unverifiable: 0, error: 0, pending: 0, accuracyPercent: null },
      claims: [],
    };
    const runner = new DockerAuditRunner({
      image: "docsworn-runner:test",
      network: "docsworn-audit",
      kaneProfilePath: "/home/ubuntu/.testmuai",
      runnerCachePath: "/home/ubuntu/.cache/v16-runner",
      timeoutMs: 1_000,
      maxClaims: 1,
      kaneTimeoutMs: 70_000,
      jobsRoot,
      repositoryMirror: {
        repositoryUrl: "https://github.com/arinze116/Docsworn",
        sourcePath: "/home/ubuntu/projects/Docsworn",
      },
      execute: async (request) => {
        dockerArguments = request.args;
        const outputMount = request.args.find((argument) => argument.includes("dst=/work/output"));
        const outputRoot = outputMount?.match(/src=([^,]+)/)?.[1];
        if (outputRoot) await writeFile(path.join(outputRoot, "result.json"), JSON.stringify(response), "utf8");
        return { code: 0, stdout: "", stderr: "", durationMs: 1 };
      },
    });

    await runner.run(
      { repositoryUrl: "https://github.com/arinze116/Docsworn", targetUrl: "https://docsworn.vercel.app" },
      requestId,
    );

    expect(dockerArguments).toContain("type=bind,src=/home/ubuntu/projects/Docsworn,dst=/work/repository,readonly");
    expect(dockerArguments).toContain("DOCSWORN_REPOSITORY_PATH=/work/repository");
  });
});
