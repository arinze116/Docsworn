import { describe, expect, it } from "vitest";

import { suggestFix } from "../src/fix-suggester.js";

describe("AT-6 closed-loop suggestions", () => {
  it("replaces an expected token with Kane's observed token", async () => {
    const replacement = await suggestFix({
      claim: { id: "claim-001", claim: "Click 'Submit' to create an account.", sourceFile: "README.md", line: 1, flowType: "web", verifiability: "testable" },
      observation: { claimId: "claim-001", status: "failed", summary: "Expected 'Submit'; actual 'Create account'.", source: "captured-kane" },
    });
    expect(replacement).toBe("Click 'Create account' to create an account.");
  });

  it("drops unsupported sign-in language when Kane observed no redirect", async () => {
    const replacement = await suggestFix({
      claim: { id: "claim-002", claim: "Registration signs the user in and opens /dashboard.", sourceFile: "README.md", line: 2, flowType: "web", verifiability: "testable" },
      observation: { claimId: "claim-002", status: "failed", summary: "Expected '/dashboard'; actual '/register'. The user remained on the registration page.", source: "captured-kane" },
    });
    expect(replacement).toBe("After registration, the user remains on /register.");
  });
});
