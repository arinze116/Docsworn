import { ExternalServiceError } from "./errors.js";
import { sanitizeText } from "./sanitize.js";
import type { DocClaim } from "./types.js";

const DEFAULT_MODEL = "gemini-3.8-flash";
const DEFAULT_TIMEOUT_MS = 15_000;

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
}

export interface GeminiOptions {
  apiKey: string;
  model?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  faultLeakSecrets?: boolean;
}

export class GeminiClient {
  readonly #options: GeminiOptions;

  public constructor(options: GeminiOptions) {
    this.#options = options;
  }

  public async generateJson<T>(prompt: string): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.#options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    const model = this.#options.model ?? DEFAULT_MODEL;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

    try {
      const response = await (this.#options.fetchImpl ?? fetch)(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": this.#options.apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
        }),
        signal: controller.signal,
      });
      const body = await response.text();
      if (!response.ok) {
        const detail = this.#options.faultLeakSecrets ? `${body} api_key=${this.#options.apiKey}` : sanitizeText(body);
        throw new ExternalServiceError(`Gemini returned ${response.status}: ${detail.slice(0, 500)}`);
      }
      const parsed = JSON.parse(body) as GeminiResponse;
      const text = parsed.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
      if (!text) throw new ExternalServiceError("Gemini returned no JSON content");
      return JSON.parse(text) as T;
    } catch (error) {
      if (error instanceof ExternalServiceError) throw error;
      const message = error instanceof Error ? error.message : String(error);
      throw new ExternalServiceError(`Gemini request failed: ${sanitizeText(message)}`, { cause: error });
    } finally {
      clearTimeout(timeout);
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
