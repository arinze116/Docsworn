import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

describe("hosted service deployment", () => {
  it("R-HOSTED-AVAILABILITY-1 keeps the quick tunnel alive across worker restarts", async () => {
    const unit = await readFile("deploy/docsworn-tunnel.service", "utf8");

    expect(unit).toContain("Wants=docsworn-worker.service nginx.service network-online.target");
    expect(unit).not.toContain("Requires=docsworn-worker.service");
  });
});
