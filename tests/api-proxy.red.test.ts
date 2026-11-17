import { describe, expect, it } from "vitest";

import { proxyCheck } from "../api/check.mjs";

describe("Vercel live-check proxy", () => {
  it("R-HOSTED-AUTH-1 sends the worker token only in the server-side header", async () => {
    let capturedHeaders: HeadersInit | undefined;
    const result = await proxyCheck({
      body: { repositoryUrl: "https://github.com/a/b", targetUrl: "https://example.com" },
      clientIp: "203.0.113.8, 10.0.0.1",
      workerUrl: "https://worker.example/v1/check",
      workerToken: "canary-token",
      fetchImpl: async (_url: URL | RequestInfo, init?: RequestInit) => {
        capturedHeaders = init?.headers;
        return new Response('{"ok":true}', { status: 200, headers: { "Content-Type": "application/json" } });
      },
    });
    expect(result.statusCode).toBe(200);
    expect(capturedHeaders).toMatchObject({
      "X-Docsworn-Worker-Token": "canary-token",
      "X-Docsworn-Client-IP": "203.0.113.8",
    });
    expect(JSON.stringify(result.body)).not.toContain("canary-token");
  });

  it("R-TIMEOUT-1 aborts a hanging worker request", async () => {
    const timeoutMs = process.env.FAULT_DISABLE_PROXY_TIMEOUT === "1" ? 1_000 : 20;
    const result = await proxyCheck({
      body: { repositoryUrl: "https://github.com/a/b", targetUrl: "https://example.com" },
      clientIp: "203.0.113.8",
      workerUrl: "https://worker.example/v1/check",
      workerToken: "token",
      timeoutMs,
      fetchImpl: async (_url: URL | RequestInfo, init?: RequestInit) => await new Promise<Response>((resolve, reject) => {
        const timer = setTimeout(() => resolve(new Response('{"ok":true}', { status: 200 })), 100);
        init?.signal?.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new DOMException("Aborted", "AbortError"));
        }, { once: true });
      }),
    });
    expect(result).toMatchObject({ statusCode: 504, body: { code: "WORKER_TIMEOUT" } });
  });
});
