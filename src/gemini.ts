import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";

import { ExternalServiceError } from "./errors.js";
import { sanitizeText } from "./sanitize.js";
import type { DocClaim } from "./types.js";

const DEFAULT_MODEL = "gemini-1.5-flash";
const DEFAULT_TIMEOUT_MS = 15_000;

export interface GeminiOptions {
  apiKey: string;
  timeoutMs?: number;
  faultLeakSecrets?: boolean;
}

export class GeminiClient {
  readonly #options: GeminiOptions;
  readonly #model: Pick<GenerativeModel, "generateContent">;

  /** Creates a bounded Gemini JSON client for Docsworn's refinement steps. */
  public constructor(options: GeminiOptions) {
    this.#options = options;
    const client = new GoogleGenerativeAI(options.apiKey);
    this.#model = client.getGenerativeModel(
      {
        model: DEFAULT_MODEL,
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
      },
      { timeout: options.timeoutMs ?? DEFAULT_TIMEOUT_MS },
    );
  }

  /** Generates and parses a JSON response from Gemini. */
  public async generateJson<T>(prompt: string): Promise<T> {
    try {
      const result = await this.#model.generateContent(prompt);
      const text = result.response.text();
      if (!text) throw new ExternalServiceError("Gemini returned no JSON content");
      return JSON.parse(text) as T;
    } catch (error) {
      if (error instanceof ExternalServiceError) throw error;
      const message = error instanceof Error ? error.message : String(error);
      const detail = this.#options.faultLeakSecrets
        ? `${message} api_key=${this.#options.apiKey}`
        : sanitizeText(message);
      throw new ExternalServiceError(`Gemini request failed: ${detail.slice(0, 500)}`, { cause: error });
    }
  }
}

interface RefinedClaim {
  id: string;
  claim?: string;
  testable?: boolean;
  flow_type?: "web" | "api" | "mobile";
  reason?: string;
}

/** Lets Gemini filter/refine candidates while preserving deterministic source locations and ids. */
export async function refineClaimsWithGemini(client: GeminiClient, claims: DocClaim[]): Promise<DocClaim[]> {
  const prompt = [
    "You audit software documentation. Return only a JSON array.",
    "For each candidate keep its id and decide whether it is objectively testable against a live app.",
    "Fields: id, claim, testable, flow_type (web|api|mobile), reason.",
    "Do not invent behavior or source locations.",
    JSON.stringify(claims.map(({ id, claim, flowType }) => ({ id, claim, flow_type: flowType }))),
  ].join("\n");
  const refined = await client.generateJson<RefinedClaim[]>(prompt);
  const byId = new Map(refined.map((item) => [item.id, item]));
  return claims.map((claim) => {
    const item = byId.get(claim.id);
    if (!item) return claim;
    return {
      ...claim,
      claim: item.claim?.trim() || claim.claim,
      flowType: item.flow_type ?? claim.flowType,
      verifiability: item.testable === false ? "unverifiable" : "testable",
      ...(item.reason ? { reason: item.reason } : {}),
    };
  });
}
