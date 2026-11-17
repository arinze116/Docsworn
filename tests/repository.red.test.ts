import { describe, expect, it } from "vitest";

import { parseGitHubUrl } from "../src/repository.js";

describe("R-INPUT-1 public GitHub URLs", () => {
  it("rejects embedded credentials, query strings, and fragments", () => {
    expect(parseGitHubUrl("https://user:fake-password@github.com/owner/repository")).toBeNull();
    expect(parseGitHubUrl("https://github.com/owner/repository?token=fake")).toBeNull();
    expect(parseGitHubUrl("https://github.com/owner/repository#readme")).toBeNull();
  });

  it("accepts a public owner/repository URL", () => {
    expect(parseGitHubUrl("https://github.com/owner/repository")?.toString()).toBe(
      "https://github.com/owner/repository",
    );
  });
});
