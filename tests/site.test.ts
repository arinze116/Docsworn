import { readFile, stat } from "node:fs/promises";

import { describe, expect, it } from "vitest";

describe("R-STATIC-1 Vercel evidence site", () => {
  it("ships a semantic, candid report without secret or runtime API hooks", async () => {
    const [html, css] = await Promise.all([
      readFile("public/index.html", "utf8"),
      readFile("public/styles.css", "utf8"),
    ]);

    expect(html).toContain('<html lang="en">');
    expect(html).toContain('class="skip-link"');
    expect(html).toContain("<main");
    expect(html).toContain("Captured Kane evidence");
    expect(html).toContain("README.md:7");
    expect(html).toContain("The hosted page is static");
    expect(html).not.toMatch(/ANTHROPIC_API_KEY|KANE_API_KEY|GEMINI_API_KEY/);
    expect(html).not.toContain("<form");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(":focus-visible");
  });

  it("keeps the static payload within the documented budget", async () => {
    const files = await Promise.all([stat("public/index.html"), stat("public/styles.css")]);
    expect(files.reduce((total, file) => total + file.size, 0)).toBeLessThan(35_000);
  });
});
