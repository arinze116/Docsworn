import { spawn } from "node:child_process";

import { CommandTimeoutError, DocswornError } from "./errors.js";
import { sanitizeText } from "./sanitize.js";

const MAX_CAPTURE_BYTES = 2 * 1024 * 1024;

export interface CommandRequest {
  command: string;
  args: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs: number;
  faultDisableTimeout?: boolean;
}

export interface CommandResult {
  code: number;
  stdout: string;
  stderr: string;
  durationMs: number;
}

function appendBounded(current: string, chunk: Buffer): string {
  const next = current + chunk.toString("utf8");
  return next.length > MAX_CAPTURE_BYTES ? next.slice(-MAX_CAPTURE_BYTES) : next;
}

/** Runs a command without a shell and returns non-zero exits as data. */
export async function runCommand(request: CommandRequest): Promise<CommandResult> {
  const startedAt = performance.now();

  return await new Promise((resolve, reject) => {
    const child = spawn(request.command, request.args, {
      cwd: request.cwd,
      env: request.env ?? process.env,
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let didTimeOut = false;

    child.stdout.on("data", (chunk: Buffer) => {
      stdout = appendBounded(stdout, chunk);
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr = appendBounded(stderr, chunk);
    });

    const timeout = request.faultDisableTimeout
      ? undefined
      : setTimeout(() => {
          didTimeOut = true;
          child.kill("SIGTERM");
        }, request.timeoutMs);

    child.on("error", (error) => {
      if (timeout) clearTimeout(timeout);
      reject(new DocswornError(`Could not start ${request.command}: ${sanitizeText(error.message)}`));
    });

    child.on("close", (code) => {
      if (timeout) clearTimeout(timeout);
      if (didTimeOut) {
        reject(new CommandTimeoutError(`${request.command} exceeded ${request.timeoutMs} ms`));
        return;
      }
      resolve({
        code: code ?? 1,
        stdout: sanitizeText(stdout),
        stderr: sanitizeText(stderr),
        durationMs: Math.round(performance.now() - startedAt),
      });
    });
  });
}
