import { mkdtemp, realpath, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { InputError } from "./errors.js";
import { runCommand } from "./process-runner.js";

export interface RepositorySource {
  root: string;
  label: string;
  cleanup: () => Promise<void>;
}

/** Accepts only a public, repository-shaped GitHub HTTPS URL. */
export function parseGitHubUrl(input: string): URL | null {
  try {
    const url = new URL(input);
    if (url.protocol !== "https:" || url.hostname !== "github.com") return null;
    if (url.username || url.password || url.port || url.search || url.hash) return null;
    if (url.pathname.split("/").filter(Boolean).length !== 2) return null;
    return url;
  } catch {
    return null;
  }
}

/** Resolves a local directory or clones one public GitHub repository into a scoped temp dir. */
export async function resolveRepository(input: string): Promise<RepositorySource> {
  const githubUrl = parseGitHubUrl(input);
  if (githubUrl) {
    const tempRoot = await mkdtemp(path.join(tmpdir(), "docsworn-"));
    const cloneRoot = path.join(tempRoot, "repository");
    const result = await runCommand({
      command: "git",
      args: ["clone", "--depth", "1", githubUrl.toString(), cloneRoot],
      timeoutMs: 60_000,
    });
    if (result.code !== 0) {
      await rm(tempRoot, { recursive: true, force: true });
      throw new InputError(`Git clone failed: ${result.stderr || result.stdout}`);
    }
    return {
      root: cloneRoot,
      label: githubUrl.toString(),
      cleanup: async () => await rm(tempRoot, { recursive: true, force: true }),
    };
  }

  const root = await realpath(path.resolve(input)).catch(() => undefined);
  if (!root || !(await stat(root)).isDirectory()) {
    throw new InputError("--repo must be an existing directory or an https://github.com/owner/repo URL");
  }
  return { root, label: root, cleanup: async () => undefined };
}
