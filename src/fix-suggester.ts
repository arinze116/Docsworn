import type { DocClaim, KaneObservation } from "./types.js";
import { GeminiClient } from "./gemini.js";

function observedReplacement(claim: string, summary: string): string | undefined {
  const pair = summary.match(/expected\s+["']([^"']+)["'].*?actual(?:ly)?\s+["']([^"']+)["']/i);
  if (!pair?.[1] || !pair[2] || !claim.includes(pair[1])) return undefined;
  if (/remained on/i.test(summary) && pair[2].startsWith("/")) {
    return `After registration, the user remains on ${pair[2]}.`;
  }
  return claim
    .replace(pair[1], pair[2])
    .replace(/([.!?])(['"])\./g, "$1$2");
}

export async function suggestFix(options: {
  claim: DocClaim;
  observation: KaneObservation;
  gemini?: GeminiClient;
}): Promise<string | undefined> {
  if (options.observation.status !== "failed") return undefined;
  if (options.gemini) {
    try {
      const result = await options.gemini.generateJson<{ replacement: string }>([
        "Return JSON with one field named replacement.",
        "Rewrite the documentation claim so it truthfully matches the observed live behavior.",
        "Use one concise sentence. Do not invent facts.",
        `Claim: ${options.claim.claim}`,
        `Kane observation: ${options.observation.summary}`,
      ].join("\n"));
      if (result.replacement?.trim()) return result.replacement.trim();
    } catch {
      // The deterministic closed loop remains available when Gemini is unavailable.
    }
  }
  return (
    observedReplacement(options.claim.claim, options.observation.summary) ??
    `Review this claim. Kane observed: ${options.observation.summary}`
  );
}
