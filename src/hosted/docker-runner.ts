import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { runCommand } from "../process-runner.js";
import type { HostedCheckRequest, HostedCheckResponse } from "../types.js";
import { HostedRequestError } from "./errors.js";

const MAX_RESULT_BYTES = 1024 * 1024;

export interface DockerRunnerOptions {
  image: string;
  network: string;
  kaneProfilePath: string;
  runnerCachePath: string;
  timeoutMs: number;
  maxClaims: number;
  kaneTimeoutMs: number;
  jobsRoot?: string;
  execute?: typeof runCommand;
}

function containerName(requestId: string): string {
  return `docsworn-audit-${requestId.replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 48)}`;
}

export class DockerAuditRunner {
  constructor(private readonly options: DockerRunnerOptions) {}

  async run(request: HostedCheckRequest, requestId = randomUUID()): Promise<HostedCheckResponse> {
    const execute = this.options.execute ?? runCommand;
    const jobsRoot = this.options.jobsRoot ?? "/var/lib/docsworn-worker/jobs";
    await mkdir(jobsRoot, { recursive: true, mode: 0o700 });
    const jobRoot = await mkdtemp(path.join(jobsRoot, "audit-"));
    const outputPath = path.join(jobRoot, "result.json");
    const name = containerName(requestId);
    try {
      const result = await execute({
        command: "docker",
        args: this.dockerArguments({ request, requestId, name, jobRoot }),
        timeoutMs: this.options.timeoutMs,
      });
      if (result.code !== 0) {
        throw new HostedRequestError("The isolated Kane job did not complete successfully", 502, "AUDIT_FAILED");
      }
      const file = await readFile(outputPath);
      if (file.byteLength > MAX_RESULT_BYTES) {
        throw new HostedRequestError("The Kane result exceeded the hosted response limit", 502, "RESULT_TOO_LARGE");
      }
      const parsed = JSON.parse(file.toString("utf8")) as HostedCheckResponse;
      if (parsed.requestId !== requestId || parsed.executionMode !== "live-kane") {
        throw new HostedRequestError("The isolated Kane job returned invalid evidence", 502, "INVALID_AUDIT_RESULT");
      }
      return parsed;
    } catch (error) {
      await execute({ command: "docker", args: ["rm", "-f", name], timeoutMs: 15_000 }).catch(() => undefined);
      if (error instanceof HostedRequestError) throw error;
      throw new HostedRequestError("The isolated Kane job timed out or became unavailable", 504, "AUDIT_TIMEOUT");
    } finally {
      await rm(jobRoot, { recursive: true, force: true });
    }
  }

  private dockerArguments(input: {
    request: HostedCheckRequest;
    requestId: string;
    name: string;
    jobRoot: string;
  }): string[] {
    return [
      "run", "--rm", "--init", "--name", input.name,
      "--network", this.options.network,
      "--read-only", "--cap-drop=ALL", "--security-opt=no-new-privileges",
      "--memory=3g", "--cpus=2", "--pids-limit=512", "--shm-size=1g",
      "--workdir", "/tmp",
      "--tmpfs", "/tmp:rw,exec,nosuid,nodev,size=768m",
      "--tmpfs", "/home/ubuntu/.cache:rw,exec,nosuid,nodev,size=2g",
      "--tmpfs", "/home/ubuntu/.config:rw,nosuid,nodev,size=128m",
      "--tmpfs", "/home/ubuntu/.local:rw,nosuid,nodev,size=128m",
      "--mount", `type=bind,src=${input.jobRoot},dst=/work/output`,
      "--mount", `type=bind,src=${this.options.kaneProfilePath},dst=/home/ubuntu/.testmuai`,
      "--mount", `type=bind,src=${this.options.runnerCachePath},dst=/home/ubuntu/.cache/v16-runner,readonly`,
      "--env", `DOCSWORN_REQUEST_ID=${input.requestId}`,
      "--env", `DOCSWORN_REPOSITORY_URL=${input.request.repositoryUrl}`,
      "--env", `DOCSWORN_TARGET_URL=${input.request.targetUrl}`,
      "--env", `DOCSWORN_MAX_CLAIMS=${this.options.maxClaims}`,
      "--env", `DOCSWORN_KANE_TIMEOUT_MS=${this.options.kaneTimeoutMs}`,
      this.options.image,
    ];
  }
}
