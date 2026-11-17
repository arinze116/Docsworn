import { readFile, stat } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { parseRepositoryUrl } from "../public/app.js";

describe("R-BROWSER-DEMO-1 Vercel browser demo", () => {
  it("ships the semantic repository-to-report interaction at the root", async () => {
    const [html, css, javascript] = await Promise.all([
      readFile("public/index.html", "utf8"),
      readFile("public/styles.css", "utf8"),
      readFile("public/app.js", "utf8"),
    ]);

    expect(html).toContain('<html lang="en">');
    expect(html).toContain('class="skip-link"');
    expect(html).toContain('<form id="audit-form"');
    expect(html).toContain('<label for="repo-url"');
    expect(html).toContain('id="repo-url"');
    expect(html).toContain('name="repository"');
    expect(html).toContain('type="url"');
    expect(html).toContain('type="submit"');
    expect(html).toContain("Run documentation check");
    expect(html).toContain('id="run-status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('id="report"');
    expect(html).toContain("Captured deterministic Kane evidence");
    expect(html).toContain("Real repository and Kane execution remain in the local CLI");
    expect(html).toContain('<script type="module" src="/app.js"></script>');
    expect(html).not.toMatch(/ANTHROPIC_API_KEY|KANE_API_KEY|GEMINI_API_KEY|LT_ACCESS_KEY/);
    expect(javascript).not.toMatch(/fetch\s*\(|XMLHttpRequest|WebSocket/);
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(":focus-visible");
  });

  it("accepts only canonical public HTTPS GitHub repository URLs", () => {
    expect(parseRepositoryUrl("https://github.com/arinze116/Docsworn")).toEqual({
      ok: true,
      normalizedUrl: "https://github.com/arinze116/Docsworn",
      repository: "arinze116/Docsworn",
    });
    expect(parseRepositoryUrl("  https://github.com/arinze116/Docsworn/  ")).toEqual({
      ok: true,
      normalizedUrl: "https://github.com/arinze116/Docsworn",
      repository: "arinze116/Docsworn",
    });
    expect(parseRepositoryUrl("http://github.com/arinze116/Docsworn")).toMatchObject({ ok: false });
    expect(parseRepositoryUrl("https://gitlab.com/arinze116/Docsworn")).toMatchObject({ ok: false });
    expect(parseRepositoryUrl("https://github.com/arinze116")).toMatchObject({ ok: false });
    expect(parseRepositoryUrl("https://github.com/arinze116/Docsworn/issues")).toMatchObject({ ok: false });
    expect(parseRepositoryUrl("not a url")).toMatchObject({ ok: false });
  });

  it("keeps the browser payload within the documented budget", async () => {
    const files = await Promise.all([
      stat("public/index.html"),
      stat("public/styles.css"),
      stat("public/app.js"),
    ]);
    expect(files.reduce((total, file) => total + file.size, 0)).toBeLessThan(45_000);
  });
});
