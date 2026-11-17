import { describe, expect, it } from "vitest";

import { extractClaims } from "../src/claim-extractor.js";

describe("AT-2 claim extraction", () => {
  it("keeps source lines and classifies testable and vague behavior", () => {
    const claims = extractClaims([
      {
        relativePath: "README.md",
        content: [
          "# Demo",
          "",
          "Open /register and click Submit to create an account.",
          "Registration will always be fast and easy.",
          "```",
          "Click hidden-example.",
          "```",
        ].join("\n"),
      },
    ]);

    expect(claims).toHaveLength(2);
    expect(claims[0]).toMatchObject({ id: "claim-001", line: 3, flowType: "web", verifiability: "testable" });
    expect(claims[1]).toMatchObject({ id: "claim-002", line: 4, verifiability: "unverifiable" });
  });

  it("classifies API and mobile claims", () => {
    const claims = extractClaims([
      {
        relativePath: "docs/api.md",
        content: "The POST /users endpoint returns JSON.\nThe iOS app can upload a profile photo.",
      },
    ]);
    expect(claims.map((claim) => claim.flowType)).toEqual(["api", "mobile"]);
  });
});
