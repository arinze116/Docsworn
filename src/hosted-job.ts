#!/usr/bin/env node
import { writeFile } from "node:fs/promises";
import path from "node:path";

import { auditDocumentation } from "./audit.js";
import { sanitizeText } from "./sanitize.js";
import type { HostedCheckResponse } from "./types.js";

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function boundedInteger(name: string, fallback: number, minimum: number, maximum: number): number {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < minimum || value > maximum) throw new Error(`${name} is outside its allowed range`);
  return value;
}

async function main(): Promise<void> {
  const requestId = requiredEnvironment("DOCSWORN_REQUEST_ID");
  const outputRoot = "/work/output";
  const result = await auditDocumentation({
    repo: requiredEnvironment("DOCSWORN_REPOSITORY_URL"),
    targetUrl: requiredEnvironment("DOCSWORN_TARGET_URL"),
    outputPath: path.join(outputRoot, "report.md"),
    flowsDirectory: path.join("/tmp", "flows"),
    kaneBinary: "kane-cli",
    kaneTimeoutMs: boundedInteger("DOCSWORN_KANE_TIMEOUT_MS", 70_000, 10_000, 120_000),
    skipRun: false,
    aiMode: "off",
    maxClaims: boundedInteger("DOCSWORN_MAX_CLAIMS", 3, 1, 3),
  });
  const response: HostedCheckResponse = { ...result, requestId };
  await writeFile(path.join(outputRoot, "result.json"), JSON.stringify(response), "utf8");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Docsworn hosted job: ${sanitizeText(message)}`);
  process.exitCode = 1;
});
