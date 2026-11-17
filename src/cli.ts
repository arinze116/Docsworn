#!/usr/bin/env node
import { Command, InvalidArgumentError } from "commander";

import { auditDocumentation } from "./audit.js";
import { DocswornError } from "./errors.js";

function positiveInteger(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) throw new InvalidArgumentError("must be a positive integer");
  return parsed;
}

function percentage(value: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) {
    throw new InvalidArgumentError("must be an integer from 0 to 100");
  }
  return parsed;
}

function aiMode(value: string): "auto" | "gemini" | "off" {
  if (value === "auto" || value === "gemini" || value === "off") return value;
  throw new InvalidArgumentError("must be auto, gemini or off");
}

const program = new Command();
program.name("docsworn").description("Verify documentation claims with Kane CLI").version("0.1.0");

program
  .command("audit", { isDefault: true })
  .requiredOption("--repo <path-or-github-url>", "repository containing Markdown documentation")
  .requiredOption("--url <live-url>", "live application base URL")
  .option("--output <path>", "Markdown truth report", "doctruth-report.md")
  .option("--flows-dir <path>", "generated Kane testmd directory", ".kane")
  .option("--kane-bin <path>", "Kane CLI executable", "kane-cli")
  .option("--kane-timeout-ms <number>", "timeout per Kane flow", positiveInteger, 300_000)
  .option("--results <path>", "captured Kane JSON fallback instead of a live run")
  .option("--skip-run", "generate flows/report without running Kane", false)
  .option("--ai <mode>", "auto, gemini or off", aiMode, "auto")
  .option("--max-claims <number>", "maximum extracted claims", positiveInteger, 40)
  .option("--fail-under <percent>", "exit 1 when truth score is lower or evidence is incomplete", percentage)
  .action(async (options) => {
    const result = await auditDocumentation({
      repo: options.repo as string,
      targetUrl: options.url as string,
      outputPath: options.output as string,
      flowsDirectory: options.flowsDir as string,
      kaneBinary: options.kaneBin as string,
      kaneTimeoutMs: options.kaneTimeoutMs as number,
      ...(options.results ? { capturedResultsPath: options.results as string } : {}),
      skipRun: options.skipRun as boolean,
      aiMode: options.ai as "auto" | "gemini" | "off",
      maxClaims: options.maxClaims as number,
    });
    const score = result.summary.accuracyPercent;
    console.log(`Docsworn audited ${result.summary.total} claims. Truth score: ${score === null ? "n/a" : `${score}%`}.`);
    console.log(`Report: ${options.output as string}`);
    const hasIncompleteEvidence = result.summary.error > 0 || result.summary.pending > 0;
    if (
      options.failUnder !== undefined &&
      (score === null || score < (options.failUnder as number) || hasIncompleteEvidence)
    ) {
      process.exitCode = 1;
    }
  });

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Docsworn: ${message}`);
  process.exitCode = error instanceof DocswornError ? 2 : 1;
});
