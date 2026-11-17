import { readFile, stat } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { parseRepositoryUrl, parseTargetUrl } from "../public/app.js";

function readPngDimensions(buffer: Buffer) {
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  expect(buffer.subarray(0, 8)).toEqual(pngSignature);
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

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
    expect(html).toContain('<label for="target-url"');
    expect(html).toContain('id="target-url"');
    expect(html).toContain('name="target"');
    expect(html).toContain('type="url"');
    expect(html).toContain('type="submit"');
    expect(html).toContain("Run live Kane check");
    expect(html).toContain('id="run-status"');
    expect(html).toContain('id="run-error"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('id="report"');
    expect(html).toContain('id="evidence-grid"');
    expect(html).toContain("Live Kane evidence");
    expect(html).toContain("LambdaTest session");
    expect(html).toContain('href="/brand/favicon.svg"');
    expect(html).toContain('href="/brand/apple-touch-icon.png"');
    expect(html).toContain('src="/brand/mark-light.svg"');
    expect(html).toContain('<script type="module" src="/app.js"></script>');
    expect(html).not.toMatch(/ANTHROPIC_API_KEY|KANE_API_KEY|GEMINI_API_KEY|LT_ACCESS_KEY/);
    expect(javascript).toContain('fetchImpl("/api/check"');
    expect(javascript).toContain("audited.claim.sourceFile");
    expect(javascript).toContain("audited.claim.line");
    expect(javascript).toContain("audited.observation.summary");
    expect(javascript).toContain("audited.suggestedFix");
    expect(javascript).toContain("audited.observation.sessionUrl");
    expect(javascript).not.toMatch(/XMLHttpRequest|WebSocket/);
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(":focus-visible");
  });

  it("ships the complete witness-mark identity family", async () => {
    const svgAssets = [
      "public/brand/logo-primary.svg",
      "public/brand/logo-primary-dark.svg",
      "public/brand/logo-primary-mono.svg",
      "public/brand/logo-compact.svg",
      "public/brand/logo-compact-dark.svg",
      "public/brand/logo-wordmark.svg",
      "public/brand/logo-wordmark-dark.svg",
      "public/brand/mark-light.svg",
      "public/brand/mark-dark.svg",
      "public/brand/mark-mono.svg",
      "public/brand/favicon.svg",
    ];
    const svgContents = await Promise.all(svgAssets.map((asset) => readFile(asset, "utf8")));

    for (const svg of svgContents) {
      expect(svg).toContain("<svg");
      expect(svg).toContain("viewBox=");
      expect(svg).not.toMatch(/checkmark|shield|sparkle/i);
    }

    const rasterAssets = [
      ["public/brand/favicon-16.png", 16, 16],
      ["public/brand/favicon-32.png", 32, 32],
      ["public/brand/apple-touch-icon.png", 180, 180],
      ["public/brand/app-icon-512.png", 512, 512],
      ["public/brand/social-avatar.png", 1200, 1200],
      ["public/brand/logo-primary.png", 1200, 264],
      ["public/brand/logo-compact.png", 800, 170],
    ] as const;

    for (const [asset, expectedWidth, expectedHeight] of rasterAssets) {
      const dimensions = readPngDimensions(await readFile(asset));
      expect(dimensions.width).toBe(expectedWidth);
      expect(dimensions.height).toBe(expectedHeight);
    }
  });

  it("ships the Portfolite-informed evidence layout without template runtime dependencies", async () => {
    const [html, css, design] = await Promise.all([
      readFile("public/index.html", "utf8"),
      readFile("public/styles.css", "utf8"),
      readFile("design.md", "utf8"),
    ]);

    expect(html).toContain("Put your docs");
    expect(html).toContain("on the record.");
    expect(html).toContain('class="repository-control"');
    expect(html).toContain('class="evidence-grid"');
    expect(html).toContain('class="ambient-field"');
    expect(css).toContain("--void: #050505");
    expect(css).toContain("border-radius: 999px");
    expect(css).toContain(".evidence-grid");
    expect(design).toContain("https://www.framer.com/marketplace/templates/portfolite/");
    expect(html + css).not.toMatch(/framer-motion|framer\.website|Satoshi|i\.pinimg\.com/);
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

  it("accepts only public HTTPS live application URLs", () => {
    expect(parseTargetUrl("https://docsworn.vercel.app")).toEqual({
      ok: true,
      normalizedUrl: "https://docsworn.vercel.app/",
    });
    expect(parseTargetUrl(" https://example.com/path?demo=1 ")).toEqual({
      ok: true,
      normalizedUrl: "https://example.com/path?demo=1",
    });
    expect(parseTargetUrl("http://example.com")).toMatchObject({ ok: false });
    expect(parseTargetUrl("https://localhost")).toMatchObject({ ok: false });
    expect(parseTargetUrl("https://127.0.0.1")).toMatchObject({ ok: false });
    expect(parseTargetUrl("https://example.com:8443")).toMatchObject({ ok: false });
    expect(parseTargetUrl("not a url")).toMatchObject({ ok: false });
  });

  it("keeps the browser payload within the documented budget", async () => {
    const files = await Promise.all([
      stat("public/index.html"),
      stat("public/styles.css"),
      stat("public/app.js"),
    ]);
    expect(files.reduce((total, file) => total + file.size, 0)).toBeLessThan(55_000);
  });
});
