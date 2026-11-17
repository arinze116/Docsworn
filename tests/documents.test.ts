import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { discoverDocuments } from "../src/documents.js";

describe("AT-1 document discovery", () => {
  it("finds Markdown recursively and ignores generated/dependency directories", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "docsworn-docs-"));
    await mkdir(path.join(root, "docs"));
    await mkdir(path.join(root, "node_modules", "ignored"), { recursive: true });
    await writeFile(path.join(root, "README.md"), "Click Save to continue.");
    await writeFile(path.join(root, "docs", "guide.md"), "Open /guide to begin.");
    await writeFile(path.join(root, "node_modules", "ignored", "README.md"), "Ignore me.");

    const documents = await discoverDocuments(root);
    expect(documents.map((document) => document.relativePath)).toEqual(["README.md", path.join("docs", "guide.md")]);
  });
});
