import { beforeEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => {
  const generateContent = vi.fn();
  const getGenerativeModel = vi.fn(() => ({ generateContent }));
  const GoogleGenerativeAI = vi.fn(function GoogleGenerativeAI() {
    return { getGenerativeModel };
  });
  return { generateContent, getGenerativeModel, GoogleGenerativeAI };
});

vi.mock("@google/generative-ai", () => ({ GoogleGenerativeAI: sdk.GoogleGenerativeAI }));

import { GeminiClient } from "../src/gemini.js";

beforeEach(() => {
  sdk.generateContent.mockReset();
  sdk.getGenerativeModel.mockClear();
  sdk.GoogleGenerativeAI.mockClear();
});

describe("Gemini SDK client", () => {
  it("uses the Google SDK with gemini-1.5-flash and JSON output", async () => {
    sdk.generateContent.mockResolvedValue({ response: { text: () => '{"ok":true}' } });

    const result = await new GeminiClient({ apiKey: "test-key" }).generateJson<{ ok: boolean }>("return JSON");

    expect(result).toEqual({ ok: true });
    expect(sdk.GoogleGenerativeAI).toHaveBeenCalledWith("test-key");
    expect(sdk.getGenerativeModel).toHaveBeenCalledWith(
      {
        model: "gemini-1.5-flash",
        generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
      },
      { timeout: 15_000 },
    );
    expect(sdk.generateContent).toHaveBeenCalledWith("return JSON");
  });
});

describe("R-SECRET-1 Gemini errors", () => {
  it("never includes the API key in a provider error", async () => {
    const apiKey = "AIzaTEST_SUPER_SECRET_TOKEN_123456";
    sdk.generateContent.mockRejectedValue(new Error(`Gemini returned 500: api_key=${apiKey}`));
    const client = new GeminiClient({
      apiKey,
      faultLeakSecrets: process.env.DOCSWORN_TEST_FAULT_LEAK_SECRETS === "1",
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
