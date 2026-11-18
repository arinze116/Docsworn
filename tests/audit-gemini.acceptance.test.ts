import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sdk = vi.hoisted(() => {
  const generateContent = vi.fn();
  const getGenerativeModel = vi.fn(() => ({ generateContent }));
  const GoogleGenerativeAI = vi.fn(function GoogleGenerativeAI() {
    return { getGenerativeModel };
  });
  return { generateContent, getGenerativeModel, GoogleGenerativeAI };
});

vi.mock("@google/generative-ai", () => ({ GoogleGenerativeAI: sdk.GoogleGenerativeAI }));

import { auditDocumentation } from "../src/audit.js";

const cleanupPaths: string[] = [];
const ORIGINAL_GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function createAuditFixture(): Promise<{ capturedResultsPath: string; repositoryPath: string }> {
  const repositoryPath = await mkdtemp(path.join(tmpdir(), "docsworn-gemini-pipeline-"));
  cleanupPaths.push(repositoryPath);
  await writeFile(
    path.join(repositoryPath, "README.md"),
    "Click 'Submit' to create an account.\n",
    "utf8",
  );
  const capturedResultsPath = path.join(repositoryPath, "kane-results.json");
  await writeFile(
    capturedResultsPath,
    JSON.stringify([
      {
        sourceFile: "README.md",
        line: 1,
        status: "failed",
        summary: "Expected 'Submit'; actual 'Create account'.",
      },
    ]),
    "utf8",
  );
  return { capturedResultsPath, repositoryPath };
}

beforeEach(() => {
  process.env.GEMINI_API_KEY = "test-gemini-key";
  sdk.generateContent.mockReset();
  sdk.getGenerativeModel.mockClear();
  sdk.GoogleGenerativeAI.mockClear();
});

afterEach(async () => {
  if (ORIGINAL_GEMINI_API_KEY === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = ORIGINAL_GEMINI_API_KEY;
  await Promise.all(cleanupPaths.splice(0).map(async (directory) => await rm(directory, { recursive: true, force: true })));
});

describe("Gemini audit pipeline", () => {
  it("refines extracted claims and uses Gemini for failed-claim suggestions", async () => {
    sdk.generateContent
      .mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify([
            {
              id: "claim-001",
              claim: "Click 'Submit' to register an account.",
              testable: true,
              flow_type: "web",
            },
          ]),
        },
      })
      .mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify({ replacement: "Click 'Create account' to register an account." }),
        },
      });
    const { capturedResultsPath, repositoryPath } = await createAuditFixture();

    const result = await auditDocumentation({
      repo: repositoryPath,
      targetUrl: "https://example.com",
      outputPath: path.join(repositoryPath, "report.md"),
      flowsDirectory: path.join(repositoryPath, ".kane"),
      kaneBinary: "kane-cli",
      kaneTimeoutMs: 1_000,
      capturedResultsPath,
      skipRun: false,
      aiMode: "gemini",
      maxClaims: 10,
    });

    expect(result.aiMode).toBe("gemini");
    expect(result.claims[0]?.claim.claim).toBe("Click 'Submit' to register an account.");
    expect(result.claims[0]?.suggestedFix).toBe("Click 'Create account' to register an account.");
    expect(sdk.generateContent).toHaveBeenCalledTimes(2);
  });

  it("R-FALLBACK-1 keeps the deterministic pipeline available when Gemini fails in auto mode", async () => {
    sdk.generateContent.mockRejectedValue(new Error("provider unavailable"));
    const { capturedResultsPath, repositoryPath } = await createAuditFixture();

    const result = await auditDocumentation({
      repo: repositoryPath,
      targetUrl: "https://example.com",
      outputPath: path.join(repositoryPath, "report.md"),
      flowsDirectory: path.join(repositoryPath, ".kane"),
      kaneBinary: "kane-cli",
      kaneTimeoutMs: 1_000,
      capturedResultsPath,
      skipRun: false,
      aiMode: "auto",
      maxClaims: 10,
    });

    expect(result.aiMode).toBe("offline");
    expect(result.claims[0]?.claim.claim).toBe("Click 'Submit' to create an account.");
    expect(result.claims[0]?.suggestedFix).toBe("Click 'Create account' to create an account.");
    expect(sdk.generateContent).toHaveBeenCalledTimes(1);
  });
});
