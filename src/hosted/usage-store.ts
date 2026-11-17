import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import { HostedRequestError } from "./errors.js";

interface UsageState {
  date: string;
  accepted: number;
  lastAcceptedByIp: Record<string, string>;
}

export interface UsageLimits {
  daily: number;
  cooldownMs: number;
}

function emptyState(date: string): UsageState {
  return { date, accepted: 0, lastAcceptedByIp: {} };
}

export class FileUsageStore {
  private queue = Promise.resolve();

  constructor(
    private readonly filePath: string,
    private readonly limits: UsageLimits,
  ) {}

  async admit(clientIp: string, now = new Date()): Promise<void> {
    const operation = this.queue.then(async () => await this.admitLocked(clientIp, now));
    this.queue = operation.catch(() => undefined);
    return await operation;
  }

  private async admitLocked(clientIp: string, now: Date): Promise<void> {
    const date = now.toISOString().slice(0, 10);
    const state = await this.readState(date);
    if (state.accepted >= this.limits.daily) {
      throw new HostedRequestError("The hosted Kane budget is exhausted for today. Use the local CLI or try tomorrow.", 429, "DAILY_LIMIT", 3_600);
    }
    const lastAccepted = state.lastAcceptedByIp[clientIp];
    if (lastAccepted) {
      const remainingMs = this.limits.cooldownMs - (now.getTime() - Date.parse(lastAccepted));
      if (remainingMs > 0) {
        throw new HostedRequestError("This address recently started an audit. Try again later.", 429, "RATE_LIMIT", Math.ceil(remainingMs / 1_000));
      }
    }
    state.accepted += 1;
    state.lastAcceptedByIp[clientIp] = now.toISOString();
    await this.writeState(state);
  }

  private async readState(date: string): Promise<UsageState> {
    try {
      const parsed = JSON.parse(await readFile(this.filePath, "utf8")) as UsageState;
      if (parsed.date === date && Number.isInteger(parsed.accepted) && parsed.lastAcceptedByIp) return parsed;
    } catch {
      // A missing or invalid counter file starts a fresh bounded day.
    }
    return emptyState(date);
  }

  private async writeState(state: UsageState): Promise<void> {
    await mkdir(path.dirname(this.filePath), { recursive: true, mode: 0o700 });
    const temporaryPath = `${this.filePath}.${process.pid}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(state), { encoding: "utf8", mode: 0o600 });
    await rename(temporaryPath, this.filePath);
  }
}
