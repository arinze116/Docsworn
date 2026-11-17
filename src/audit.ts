import path from "node:path";

import { extractClaims } from "./claim-extractor.js";
import { discoverDocuments } from "./documents.js";
import { InputError } from "./errors.js";
import { suggestFix } from "./fix-suggester.js";
import { generateFlows } from "./flow-generator.js";
import { GeminiClient, refineClaimsWithGemini } from "./gemini.js";
import { loadCapturedResults, runKaneFlows } from "./kane-runner.js";
import { writeReport, summarizeClaims } from "./report.js";
import { resolveRepository } from "./repository.js";
import type { AuditedClaim, AuditOutput, KaneObservation } from "./types.js";

export interface AuditOptions {
  repo: string;
  targetUrl: string;
  outputPath: string;
  flowsDirectory: string;
  kaneBinary: string;
  kaneTimeoutMs: number;
  kaneExecutionMode?: "testmd" | "inline";
  capturedResultsPath?: string;
  skipRun: boolean;
  aiMode: "auto" | "gemini" | "off";
  maxClaims: number;
}

function validateTargetUrl(targetUrl: string): void {
  let url: URL;
  try {
    url = new URL(targetUrl);
  } catch {
    throw new InputError("--url must be a valid absolute URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new InputError("--url must use http or https");
  }
}

function pendingObservation(claimId: string, summary = "Kane was not run"): KaneObservation {
  return { claimId, status: "pending", summary, source: "not-run" };
}

export async function auditDocumentation(options: AuditOptions): Promise<AuditOutput> {
  validateTargetUrl(options.targetUrl);
  const source = await resolveRepository(options.repo);
  try {
    const documents = await discoverDocuments(source.root);
    let claims = extractClaims(documents, options.maxClaims);
    if (claims.length === 0) throw new InputError("No behavioral documentation claims were found");

    const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
    const wantsGemini = options.aiMode === "gemini" || (options.aiMode === "auto" && Boolean(apiKey));
    const gemini = wantsGemini && apiKey
      ? new GeminiClient({ apiKey, ...(process.env.GEMINI_MODEL ? { model: process.env.GEMINI_MODEL } : {}) })
      : undefined;
    let usedGemini = false;
    if (options.aiMode === "gemini" && !gemini) throw new InputError("Gemini mode requires GEMINI_API_KEY or GOOGLE_API_KEY");
    if (gemini) {
      try {
        claims = await refineClaimsWithGemini(gemini, claims);
        usedGemini = true;
      } catch {
        if (options.aiMode === "gemini") throw new InputError("Gemini claim refinement failed");
      }
    }

    const flowDirectory = path.resolve(options.flowsDirectory);
    const flows = await generateFlows(claims, options.targetUrl, flowDirectory);
    let observations: KaneObservation[];
    if (options.capturedResultsPath) {
      observations = await loadCapturedResults(path.resolve(options.capturedResultsPath), claims);
    } else if (options.skipRun) {
      observations = claims.map((claim) => pendingObservation(claim.id));
    } else {
      observations = await runKaneFlows({
        flows,
        kaneBinary: options.kaneBinary,
        timeoutMs: options.kaneTimeoutMs,
        executionMode: options.kaneExecutionMode ?? "testmd",
        startUrl: options.targetUrl,
      });
    }

    const flowByClaim = new Map(flows.map((flow) => [flow.claim.id, flow]));
    const observationByClaim = new Map(observations.map((observation) => [observation.claimId, observation]));
    const auditedClaims: AuditedClaim[] = [];
    for (const claim of claims) {
      const observation = claim.verifiability === "unverifiable"
        ? { claimId: claim.id, status: "unverifiable" as const, summary: claim.reason ?? "No objective pass condition", source: "not-run" as const }
        : (observationByClaim.get(claim.id) ?? pendingObservation(claim.id));
      const suggestedFix = await suggestFix({ claim, observation, ...(usedGemini && gemini ? { gemini } : {}) });
      const flow = flowByClaim.get(claim.id);
      auditedClaims.push({ claim, ...(flow ? { flowPath: path.relative(process.cwd(), flow.path) } : {}), observation, ...(suggestedFix ? { suggestedFix } : {}) });
    }

    const executionMode = options.capturedResultsPath ? "captured-kane" : options.skipRun ? "not-run" : "live-kane";
    const output: AuditOutput = {
      repository: source.label,
      targetUrl: options.targetUrl,
      generatedAt: new Date().toISOString(),
      aiMode: usedGemini ? "gemini" : "offline",
      executionMode,
      summary: summarizeClaims(auditedClaims),
      claims: auditedClaims,
    };
    await writeReport(output, path.resolve(options.outputPath));
    return output;
  } finally {
    await source.cleanup();
  }
}
