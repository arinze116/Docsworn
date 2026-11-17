#!/usr/bin/env node
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { rm } from "node:fs/promises";

import { DockerAuditRunner } from "./hosted/docker-runner.js";
import { createHostedCheckService } from "./hosted/service.js";
import { FileUsageStore } from "./hosted/usage-store.js";

const MAX_BODY_BYTES = 8 * 1024;
const RESPONSE_HEADERS = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8",
  "X-Content-Type-Options": "nosniff",
};

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function integerEnvironment(name: string, fallback: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);
  return value;
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  let body = "";
  for await (const chunk of request) {
    body += String(chunk);
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) throw Object.assign(new Error("Request body is too large"), { statusCode: 413 });
  }
  try {
    return JSON.parse(body);
  } catch {
    throw Object.assign(new Error("Request body must be valid JSON"), { statusCode: 400 });
  }
}

function send(response: ServerResponse, statusCode: number, body: object, headers: Record<string, string> = {}): void {
  response.writeHead(statusCode, { ...RESPONSE_HEADERS, ...headers });
  response.end(JSON.stringify(body));
}

async function main(): Promise<void> {
  const socketPath = process.env.DOCSWORN_WORKER_SOCKET ?? "/run/docsworn-worker/api.sock";
  const service = createHostedCheckService({
    workerToken: requiredEnvironment("DOCSWORN_WORKER_TOKEN"),
    runner: new DockerAuditRunner({
      image: process.env.DOCSWORN_RUNNER_IMAGE ?? "docsworn-runner:current",
      network: process.env.DOCSWORN_DOCKER_NETWORK ?? "docsworn-audit",
      kaneProfilePath: process.env.DOCSWORN_KANE_PROFILE ?? "/home/ubuntu/.testmuai",
      runnerCachePath: process.env.DOCSWORN_RUNNER_CACHE ?? "/home/ubuntu/.cache/v16-runner",
      timeoutMs: integerEnvironment("DOCSWORN_JOB_TIMEOUT_MS", 250_000),
      maxClaims: integerEnvironment("DOCSWORN_MAX_CLAIMS", 3),
      kaneTimeoutMs: integerEnvironment("DOCSWORN_KANE_TIMEOUT_MS", 70_000),
      jobsRoot: process.env.DOCSWORN_JOBS_ROOT ?? "/var/lib/docsworn-worker/jobs",
    }),
    usageStore: new FileUsageStore(
      process.env.DOCSWORN_USAGE_FILE ?? "/var/lib/docsworn-worker/usage.json",
      {
        daily: integerEnvironment("DOCSWORN_DAILY_LIMIT", 8),
        cooldownMs: integerEnvironment("DOCSWORN_IP_COOLDOWN_MS", 900_000),
      },
    ),
    log: (message) => console.log(message),
  });

  await rm(socketPath, { force: true });
  const server = createServer(async (request, response) => {
    if (request.method === "GET" && request.url === "/health") {
      send(response, 200, { ok: true, service: "docsworn-worker" });
      return;
    }
    if (request.method !== "POST" || request.url !== "/v1/check") {
      send(response, 404, { ok: false, code: "NOT_FOUND", message: "Route not found" });
      return;
    }
    try {
      const body = await readJsonBody(request);
      const token = request.headers["x-docsworn-worker-token"] as string | undefined;
      const result = await service({
        ...(token ? { token } : {}),
        clientIp: String(request.headers["x-docsworn-client-ip"] ?? "unknown").slice(0, 64),
        body,
      });
      send(response, result.statusCode, result.body, result.headers);
    } catch (error) {
      const statusCode = typeof error === "object" && error && "statusCode" in error ? Number(error.statusCode) : 500;
      send(response, statusCode, {
        ok: false,
        code: statusCode === 413 ? "BODY_TOO_LARGE" : "INVALID_JSON",
        message: statusCode === 413 ? "Request body is too large" : "Request body must be valid JSON",
      });
    }
  });
  server.requestTimeout = 290_000;
  server.headersTimeout = 10_000;
  server.listen(socketPath, () => console.log(`Docsworn worker listening on ${socketPath}`));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
