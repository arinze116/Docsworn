import { describe, expect, it } from "vitest";

import { GeminiClient } from "../src/gemini.js";

describe("R-SECRET-1 Gemini errors", () => {
  it("never includes the API key in a provider error", async () => {
    const apiKey = "AIzaTEST_SUPER_SECRET_TOKEN_123456";
    const client = new GeminiClient({
      apiKey,
      faultLeakSecrets: process.env.DOCSWORN_TEST_FAULT_LEAK_SECRETS === "1",
      fetchImpl: async () => new Response("upstream rejected request", { status: 500 }),
    });

    let message = "";
    try {
      await client.generateJson("return JSON");
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).not.toContain(apiKey);
    expect(message).toContain("Gemini returned 500");
  });
});
