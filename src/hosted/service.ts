import { randomUUID } from "node:crypto";

import { sanitizeText } from "../sanitize.js";
import type { HostedCheckRequest, HostedCheckResponse } from "../types.js";
import { isWorkerAuthorized } from "./auth.js";
import { DockerAuditRunner } from "./docker-runner.js";
import { HostedRequestError } from "./errors.js";
import { SingleFlightGate } from "./single-flight.js";
import { FileUsageStore } from "./usage-store.js";
import { validateHostedCheckRequest, type HostedValidationOptions } from "./validation.js";

export interface HostedServiceRequest {
  token?: string;
  clientIp: string;
  body: unknown;
}

export interface HostedServiceResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: Record<string, unknown> | HostedCheckResponse;
}

export interface HostedServiceOptions {
  workerToken: string;
  runner: Pick<DockerAuditRunner, "run">;
  usageStore: Pick<FileUsageStore, "admit">;
  gate?: SingleFlightGate;
  validation?: HostedValidationOptions;
  log?: (message: string) => void;
}

function errorResponse(error: HostedRequestError, requestId: string): HostedServiceResponse {
  return {
    statusCode: error.statusCode,
    ...(error.retryAfterSeconds ? { headers: { "Retry-After": String(error.retryAfterSeconds) } } : {}),
    body: { ok: false, requestId, code: error.code, message: error.message },
  };
}

export function createHostedCheckService(options: HostedServiceOptions) {
  const gate = options.gate ?? new SingleFlightGate();
  const log = options.log ?? (() => undefined);

  return async (request: HostedServiceRequest): Promise<HostedServiceResponse> => {
    const requestId = randomUUID();
    if (!isWorkerAuthorized(request.token, options.workerToken)) {
      return errorResponse(new HostedRequestError("Worker authentication failed", 401, "UNAUTHORIZED"), requestId);
    }
    try {
      const input: HostedCheckRequest = await validateHostedCheckRequest(request.body, options.validation);
      await options.usageStore.admit(request.clientIp);
      log(`hosted audit accepted request=${requestId} repo=${new URL(input.repositoryUrl).pathname.slice(1)}`);
      const result = await gate.run(async () => await options.runner.run(input, requestId));
      log(`hosted audit completed request=${requestId} claims=${result.summary.total}`);
      return { statusCode: 200, body: { ok: true, ...result } };
    } catch (error) {
      const hostedError = error instanceof HostedRequestError
        ? error
        : new HostedRequestError("The hosted audit failed unexpectedly", 500, "INTERNAL_ERROR");
      log(`hosted audit failed request=${requestId} code=${hostedError.code} message=${sanitizeText(hostedError.message)}`);
      return errorResponse(hostedError, requestId);
    }
  };
}
