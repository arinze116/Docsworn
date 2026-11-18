import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

describe("hosted service deployment", () => {
  it("R-HOSTED-AVAILABILITY-1 keeps the quick tunnel alive across worker restarts", async () => {
    const unit = await readFile("deploy/docsworn-tunnel.service", "utf8");

    expect(unit).toContain("Wants=docsworn-worker.service nginx.service network-online.target");
    expect(unit).not.toContain("Requires=docsworn-worker.service");
  });

  it("R-HOSTED-PATH-1 keeps service and mirror paths on the deployed repository root", async () => {
    const files = await Promise.all([
      readFile("deploy/docsworn-network.service", "utf8"),
      readFile("deploy/docsworn-worker.service", "utf8"),
      readFile("deploy/docsworn-worker-mirror.env.example", "utf8"),
    ]);
    const deployment = files.join("\n");

    expect(deployment).toContain("/home/ubuntu/projects/Docsworn");
    expect(deployment).not.toContain("/home/ubuntu/Docsworn");
  });
});
