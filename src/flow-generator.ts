import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { DocClaim, GeneratedFlow } from "./types.js";

function findRoute(claim: string): string | undefined {
  return claim
    .match(/^\s*(?:open|go to|navigate to|visit)\s+(\/[A-Za-z0-9_?&=./-]+)/i)?.[1]
    ?.replace(/[.,;:]$/, "");
}

export function buildObjective(claim: DocClaim, targetUrl: string): string {
  const route = findRoute(claim.claim);
  const startUrl = route ? new URL(route, targetUrl).toString() : targetUrl;
  return `Open ${startUrl}. Verify this documented behavior exactly: ${claim.claim}`;
}

/** Writes official Kane testmd files, one traceable test per claim. */
export async function generateFlows(
  claims: DocClaim[],
  targetUrl: string,
  outputDirectory: string,
): Promise<GeneratedFlow[]> {
  await mkdir(outputDirectory, { recursive: true });
  const flows: GeneratedFlow[] = [];

  for (const claim of claims.filter((candidate) => candidate.verifiability === "testable")) {
    const objective = buildObjective(claim, targetUrl);
    const flowPath = path.join(outputDirectory, `${claim.id}_test.md`);
    const source = `${claim.sourceFile}:${claim.line}`.replace(/[\r\n]+/g, " ");
    const markdown = [
      "---",
      "mode: testing",
      "---",
      "",
      `# Documentation claim ${claim.id} — ${source}`,
      "",
      `## Verify ${claim.id} from ${source}`,
      objective,
      "",
    ].join("\n");
    await writeFile(flowPath, markdown, "utf8");
    flows.push({ claim, path: flowPath, objective });
  }
  return flows;
}
