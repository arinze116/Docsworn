import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { FileUsageStore } from "../src/hosted/usage-store.js";

const cleanupPaths: string[] = [];

afterEach(async () => {
  await Promise.all(cleanupPaths.splice(0).map(async (directory) => await rm(directory, { recursive: true, force: true })));
});

async function usageFile(): Promise<string> {
  const directory = await mkdtemp(path.join(tmpdir(), "docsworn-usage-test-"));
  cleanupPaths.push(directory);
  return path.join(directory, "usage.json");
}

describe("hosted usage admission", () => {
  it("R-RATE-1 rejects a repeated address inside the cooldown", async () => {
    const store = new FileUsageStore(await usageFile(), {
      daily: 8,
      cooldownMs: process.env.FAULT_DISABLE_IP_COOLDOWN === "1" ? 0 : 900_000,
    });
    const now = new Date("2026-11-17T12:00:00.000Z");
    await store.admit("203.0.113.8", now);
    await expect(store.admit("203.0.113.8", new Date(now.getTime() + 1_000)))
      .rejects.toMatchObject({ code: "RATE_LIMIT", statusCode: 429 });
  });

  it("R-HOSTED-BOUNDS-1 rejects work after the daily budget", async () => {
    const daily = process.env.FAULT_DISABLE_DAILY_LIMIT === "1" ? 2 : 1;
    const store = new FileUsageStore(await usageFile(), { daily, cooldownMs: 0 });
    const now = new Date("2026-11-17T12:00:00.000Z");
    await store.admit("203.0.113.8", now);
    await expect(store.admit("203.0.113.9", now)).rejects.toMatchObject({ code: "DAILY_LIMIT", statusCode: 429 });
  });
});
