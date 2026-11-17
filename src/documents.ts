import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

import { InputError } from "./errors.js";
import type { DocFile } from "./types.js";

const IGNORED_DIRECTORIES = new Set([
  ".git",
  ".kane",
  ".kane-demo",
  ".testmuai",
  "node_modules",
  "dist",
  "coverage",
]);
const MAX_FILES = 200;
const MAX_FILE_BYTES = 1_000_000;
const MAX_TOTAL_BYTES = 5_000_000;

async function walk(root: string, directory: string, paths: string[]): Promise<void> {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (paths.length >= MAX_FILES) return;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory() && !IGNORED_DIRECTORIES.has(entry.name)) {
      await walk(root, absolutePath, paths);
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      paths.push(path.relative(root, absolutePath));
    }
  }
}

/** Finds bounded Markdown input so a repository cannot exhaust memory accidentally. */
export async function discoverDocuments(root: string): Promise<DocFile[]> {
  const paths: string[] = [];
  await walk(root, root, paths);
  paths.sort((left, right) => {
    const leftRank = left.toLowerCase() === "readme.md" ? 0 : 1;
    const rightRank = right.toLowerCase() === "readme.md" ? 0 : 1;
    return leftRank - rightRank || left.localeCompare(right);
  });
  const documents: DocFile[] = [];
  let totalBytes = 0;

  for (const relativePath of paths) {
    const absolutePath = path.join(root, relativePath);
    const fileStat = await stat(absolutePath);
    if (fileStat.size > MAX_FILE_BYTES) continue;
    totalBytes += fileStat.size;
    if (totalBytes > MAX_TOTAL_BYTES) break;
    documents.push({ relativePath, content: await readFile(absolutePath, "utf8") });
  }

  if (documents.length === 0) throw new InputError("No Markdown files were found in the repository");
  return documents;
}
