import { readFile } from "node:fs/promises";

import { DocswornError, InputError } from "./errors.js";
import { runCommand, type CommandRequest } from "./process-runner.js";
import { sanitizeText } from "./sanitize.js";
import type { DocClaim, GeneratedFlow, KaneObservation, ResultStatus } from "./types.js";

type CommandExecutor = (request: CommandRequest) => ReturnType<typeof runCommand>;

interface KaneEvent {
  type?: string;
  status?: string;
  overall_status?: string;
  summary?: string;
  remark?: string;
}

function parseEvents(stdout: string): KaneEvent[] {
  return stdout
    .split(/\r?\n/)
    .map((line) => {
      try {
        return JSON.parse(line) as KaneEvent;
      } catch {
        return undefined;
      }
    })
    .filter((event): event is KaneEvent => event !== undefined);
}

function summarize(events: KaneEvent[], stderr: string): string {
  const completion = [...events].reverse().find((event) => event.type === "test_md_done" || event.type === "run_end");
  if (completion?.summary) return completion.summary;
  const failed = [...events].reverse().find((event) => event.status === "failed");
  return failed?.remark || stderr.trim() || "Kane returned no textual summary";
}

function statusFrom(code: number, events: KaneEvent[]): ResultStatus {
  const finalStatus = [...events].reverse().find((event) => event.overall_status)?.overall_status;
  if (finalStatus === "passed") return "passed";
  if (finalStatus === "failed") return "failed";
  if (code === 0) return "passed";
  if (code === 1) return "failed";
  return "error";
}

export async function runKaneFlows(options: {
  flows: GeneratedFlow[];
  kaneBinary: string;
  timeoutMs: number;
  execute?: CommandExecutor;
}): Promise<KaneObservation[]> {
  const execute = options.execute ?? runCommand;
  const observations: KaneObservation[] = [];
  for (const flow of options.flows) {
    const startedAt = performance.now();
    try {
      const result = await execute({
        command: options.kaneBinary,
        args: ["testmd", "run", flow.path, "--agent", "--headless", "--on-lock-conflict", "wait"],
        timeoutMs: options.timeoutMs,
      });
      const events = parseEvents(result.stdout);
      observations.push({
        claimId: flow.claim.id,
        status: statusFrom(result.code, events),
        summary: summarize(events, result.stderr),
        exitCode: result.code,
        durationMs: result.durationMs,
        source: "live-kane",
      });
    } catch (error) {
      if (!(error instanceof DocswornError)) throw error;
      observations.push({
        claimId: flow.claim.id,
        status: "error",
        summary: sanitizeText(error.message),
        durationMs: Math.round(performance.now() - startedAt),
        source: "live-kane",
      });
    }
  }
  return observations;
}

interface CapturedResult {
  claimId?: string;
  sourceFile?: string;
  line?: number;
  status: ResultStatus;
  summary: string;
}

/** Loads a recorded Kane fallback and maps it to current source locations. */
export async function loadCapturedResults(filePath: string, claims: DocClaim[]): Promise<KaneObservation[]> {
  const parsed = JSON.parse(await readFile(filePath, "utf8")) as CapturedResult[];
  if (!Array.isArray(parsed)) throw new InputError("Captured Kane results must be a JSON array");
  const allowed = new Set<ResultStatus>(["passed", "failed", "unverifiable", "error", "pending"]);

  return claims.map((claim) => {
    const match = parsed.find(
      (result) => result.claimId === claim.id || (result.sourceFile === claim.sourceFile && result.line === claim.line),
    );
    if (!match) {
      return { claimId: claim.id, status: "pending", summary: "No captured Kane result", source: "not-run" };
    }
    if (!allowed.has(match.status) || typeof match.summary !== "string") {
      throw new InputError(`Invalid captured result for ${claim.id}`);
    }
    return { claimId: claim.id, status: match.status, summary: match.summary, source: "captured-kane" };
  });
}
