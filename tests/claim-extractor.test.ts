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

describe("AT-2 extraction precision on real-world READMEs", () => {
  it("skips badge image lines and link-pointer sentences", () => {
    const claims = extractClaims([
      {
        relativePath: "README.md",
        content: [
          "[![Downloads](https://img.shields.io/npm/dt/zustand.svg?style=flat)](https://www.npmjs.com/package/zustand)",
          "You can read more about JSON5 format here.",
          "You can try a live demo and read the docs.",
          "Select your state and the component will re-render on changes.",
        ].join("\n"),
      },
    ]);

    expect(claims).toHaveLength(1);
    expect(claims[0]).toMatchObject({
      claim: "Select your state and the component will re-render on changes.",
      line: 4,
      verifiability: "testable",
    });
  });

  it("demotes setup instructions instead of treating them as behaviour claims", () => {
    const claims = extractClaims([
      {
        relativePath: "README.md",
        content: "Create a db.json or db.json5 file",
      },
    ]);

    expect(claims).toHaveLength(1);
    expect(claims[0].verifiability).toBe("unverifiable");
    expect(claims[0].reason).toMatch(/Setup instruction/);
  });

  it("types API behaviour as api and skips colon-terminated fragments", () => {
    const claims = extractClaims([
      {
        relativePath: "README.md",
        content: [
          "JSON Server supports advanced querying out of the box:",
          "Invalid page or perpage values are automatically normalized to valid ranges.",
          "ID handling: id is always a string and will be auto-generated if not provided.",
          "Static files are served with standard MIME types and can include HTML, CSS, JavaScript, images, and other assets.",
        ].join("\n"),
      },
    ]);

    expect(claims).toHaveLength(3);
    expect(claims.map((claim) => claim.claim)).not.toContain("JSON Server supports advanced querying out of the box:");
    expect(claims.every((claim) => claim.flowType === "api")).toBe(true);
  });
});
