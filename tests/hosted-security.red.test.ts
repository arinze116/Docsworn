import { describe, expect, it } from "vitest";

import { isWorkerAuthorized } from "../src/hosted/auth.js";
import { SingleFlightGate } from "../src/hosted/single-flight.js";
import { checkPublicGitHubRepository, validateHostedCheckRequest } from "../src/hosted/validation.js";

describe("hosted audit security rules", () => {
  it("R-HOSTED-AUTH-1 rejects an invalid worker token", () => {
    const authorize = process.env.FAULT_ACCEPT_ANY_WORKER_TOKEN === "1"
      ? () => true
      : isWorkerAuthorized;
    expect(authorize("wrong-token", "expected-token")).toBe(false);
  });

  it("R-HOSTED-INPUT-1 rejects a target resolving to a private address", async () => {
    const isAddressAllowed = process.env.FAULT_ALLOW_PRIVATE_TARGET === "1"
      ? () => true
      : undefined;
    await expect(validateHostedCheckRequest(
      {
        repositoryUrl: "https://github.com/arinze116/Docsworn",
        targetUrl: "https://internal.example.test",
      },
      {
        resolveHostname: async () => [{ address: "10.0.0.8", family: 4 }],
        ...(isAddressAllowed ? { isAddressAllowed } : {}),
      },
    )).rejects.toMatchObject({ code: "PRIVATE_TARGET", statusCode: 400 });
  });

  it("R-HOSTED-INPUT-1 rejects a GitHub repository that is not publicly accessible", async () => {
    const repositoryIsPublic = process.env.FAULT_ASSUME_PRIVATE_REPOSITORY_PUBLIC === "1"
      ? async () => true
      : async () => false;
    await expect(validateHostedCheckRequest(
      {
        repositoryUrl: "https://github.com/arinze116/Docsworn",
        targetUrl: "https://docsworn.vercel.app",
      },
      {
        resolveHostname: async () => [{ address: "76.76.21.21", family: 4 }],
        repositoryIsPublic,
      },
    )).rejects.toMatchObject({ code: "PRIVATE_REPOSITORY", statusCode: 400 });
  });

  it("R-TIMEOUT-1 bounds the public GitHub repository check", async () => {
    const timeoutMs = process.env.FAULT_DISABLE_REPOSITORY_CHECK_TIMEOUT === "1" ? 1_000 : 20;
    await expect(checkPublicGitHubRepository(
      new URL("https://github.com/owner/repository"),
      {
        timeoutMs,
        fetchImpl: async (_input, init) => await new Promise<Response>((resolve, reject) => {
          const timer = setTimeout(() => resolve(new Response(null, { status: 200 })), 100);
          init?.signal?.addEventListener("abort", () => {
            clearTimeout(timer);
            reject(new DOMException("Aborted", "AbortError"));
          }, { once: true });
        }),
      },
    )).rejects.toMatchObject({ code: "REPOSITORY_CHECK_TIMEOUT", statusCode: 503 });
  });

  it("R-HOSTED-BOUNDS-1 rejects a second concurrent audit", async () => {
    const gate = new SingleFlightGate(process.env.FAULT_ALLOW_TWO_AUDITS === "1" ? 2 : 1);
    let releaseFirst!: () => void;
    const firstBlocker = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const first = gate.run(async () => await firstBlocker);
    await expect(gate.run(async () => "second")).rejects.toMatchObject({ code: "WORKER_BUSY", statusCode: 503 });
    releaseFirst();
    await first;
  });
});
