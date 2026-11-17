import { describe, expect, it } from "vitest";

import { isWorkerAuthorized } from "../src/hosted/auth.js";
import { SingleFlightGate } from "../src/hosted/single-flight.js";
import { validateHostedCheckRequest } from "../src/hosted/validation.js";

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
