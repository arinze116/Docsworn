import { describe, expect, it } from "vitest";

import { CommandTimeoutError } from "../src/errors.js";
import { runCommand } from "../src/process-runner.js";

describe("R-TIMEOUT-1 command boundaries", () => {
  it("terminates a command that outlives its budget", async () => {
    const faultDisableTimeout = process.env.DOCSWORN_TEST_FAULT_NO_TIMEOUT === "1";
    await expect(
      runCommand({
        command: process.execPath,
        args: ["-e", "setTimeout(() => process.exit(0), 180)"],
        timeoutMs: 30,
        faultDisableTimeout,
      }),
    ).rejects.toBeInstanceOf(CommandTimeoutError);
  });
});
