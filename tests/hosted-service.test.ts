import { describe, expect, it } from "vitest";

import { createHostedCheckService } from "../src/hosted/service.js";
import type { HostedCheckResponse } from "../src/types.js";

const liveResponse: HostedCheckResponse = {
  requestId: "request-1",
  repository: "https://github.com/vercel/next-learn",
  targetUrl: "https://docsworn.vercel.app/",
  generatedAt: "2026-11-17T00:00:00.000Z",
  aiMode: "offline",
  executionMode: "live-kane",
  summary: { total: 1, passed: 1, failed: 0, unverifiable: 0, error: 0, pending: 0, accuracyPercent: 100 },
  claims: [],
};

describe("hosted check service", () => {
  it("does not call admission or the runner when authentication fails", async () => {
    let calls = 0;
    const service = createHostedCheckService({
      workerToken: "expected",
      runner: { run: async () => { calls += 1; return liveResponse; } },
      usageStore: { admit: async () => { calls += 1; } },
    });
    const result = await service({ token: "wrong", clientIp: "203.0.113.8", body: {} });
    expect(result.statusCode).toBe(401);
    expect(calls).toBe(0);
  });

  it("returns only a live Kane result after admission", async () => {
    const service = createHostedCheckService({
      workerToken: "expected",
      runner: { run: async (_request, requestId) => ({ ...liveResponse, requestId }) },
      usageStore: { admit: async () => undefined },
      validation: {
        resolveHostname: async () => [{ address: "76.76.21.21", family: 4 }],
        repositoryIsPublic: async () => true,
      },
    });
    const result = await service({
      token: "expected",
      clientIp: "203.0.113.8",
      body: {
        repositoryUrl: "https://github.com/vercel/next-learn",
        targetUrl: "https://docsworn.vercel.app",
      },
    });
    expect(result.statusCode).toBe(200);
    expect(result.body).toMatchObject({ ok: true, executionMode: "live-kane" });
  });

  it("R-SECRET-1 never logs the worker token", async () => {
    const logs: string[] = [];
    const token = "canary-worker-secret";
    const service = createHostedCheckService({
      workerToken: token,
      runner: { run: async () => { throw new Error(`provider echoed ${token}`); } },
      usageStore: { admit: async () => undefined },
      validation: {
        resolveHostname: async () => [{ address: "76.76.21.21", family: 4 }],
        repositoryIsPublic: async () => true,
      },
      log: (message) => logs.push(message),
    });
    await service({
      token,
      clientIp: "203.0.113.8",
      body: {
        repositoryUrl: "https://github.com/vercel/next-learn",
        targetUrl: "https://docsworn.vercel.app",
      },
    });
    expect(logs.join("\n")).not.toContain(token);
  });
});
