import type { DocClaim, DocFile, FlowType } from "./types.js";

const BEHAVIOR_PATTERN = /\b(click|select|open|go to|navigate|submit|create|return(?:s)?|display(?:s)?|show(?:s)?|validate(?:s)?|reject(?:s)?|accept(?:s)?|redirect(?:s)?|signs? in|logs? in|send(?:s)?|download(?:s)?|upload(?:s)?|support(?:s)?|allow(?:s)?|prevent(?:s)?|require(?:s)?|automatically|will|can)\b/i;
const VAGUE_PATTERN = /\b(fast|easy|simple|secure|seamless|best|powerful|intuitive|reliable)\b/i;
const API_PATTERN = /\b(GET|POST|PUT|PATCH|DELETE|endpoint|API|JSON|response|status code)\b/;
const API_BEHAVIOR_PATTERN = /\b(query|queries|parameters?|pagination|per[-_ ]?page|normali[sz]\w*|auto[- ]?generat\w*|static files?|mime types?|content[- ]type|serves? (?:files?|static)|request body|response body)\b/i;
const MOBILE_PATTERN = /\b(Android|iOS|mobile app|simulator|emulator)\b/i;
const LINKED_IMAGE_PATTERN = /\[!\[[^\]]*\]\([^)]*\)\]\([^)]*\)/g;
const IMAGE_PATTERN = /!\[[^\]]*\]\([^)]*\)/g;
const HTML_IMAGE_PATTERN = /<img\b[^>]*>/gi;
const LINK_POINTER_PATTERN = /^(?:you can\s+|please\s+)?(?:read|learn|find|see|check|try|explore|browse|discover)\b[^.!?]*\b(?:here|docs|documentation|demo|examples?|guide|wiki|tutorial)\b[^.!?]*\.?$/i;
const SETUP_INSTRUCTION_PATTERN = /^(?:create|add|make|write|edit|update|modify|install|run|start|set up|setup|configure|copy|rename|delete|remove|generate)\b[^.!?]*\b(?:[\w./-]+\.(?:json5?|ya?ml|toml|env|xml|csv|mjs|cjs|jsx?|tsx?|html?|css|md|txt)\b|files?|folders?|directory|packages?|dependenc\w*|server|commands?|scripts?)\b/i;

function stripImages(value: string): string {
  return value.replace(LINKED_IMAGE_PATTERN, "").replace(IMAGE_PATTERN, "").replace(HTML_IMAGE_PATTERN, "");
}

function cleanMarkdown(value: string): string {
  return value
    .replace(/^\s*(?:[-*+] |\d+\. )/, "")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[*_`>#]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function classifyFlowType(claim: string): FlowType {
  if (API_PATTERN.test(claim) || API_BEHAVIOR_PATTERN.test(claim)) return "api";
  if (MOBILE_PATTERN.test(claim)) return "mobile";
  return "web";
}

/** Extracts deterministic candidate claims with exact source line traceability. */
export function extractClaims(documents: DocFile[], maxClaims = 40): DocClaim[] {
  const candidates: Omit<DocClaim, "id">[] = [];

  for (const document of documents) {
    let isCodeFence = false;
    const lines = document.content.split(/\r?\n/);
    for (const [index, rawLine] of lines.entries()) {
      if (rawLine.trim().startsWith("```")) {
        isCodeFence = !isCodeFence;
        continue;
      }
      if (isCodeFence || /^\s*#/.test(rawLine)) continue;
      const textLine = stripImages(rawLine);
      if (!cleanMarkdown(textLine)) continue;
      for (const sentence of cleanMarkdown(textLine).split(/(?<=[.!?])\s+/)) {
        if (sentence.length < 20 || sentence.length > 500 || !BEHAVIOR_PATTERN.test(sentence)) continue;
        if (sentence.endsWith(":") || LINK_POINTER_PATTERN.test(sentence)) continue;
        const isSetup = SETUP_INSTRUCTION_PATTERN.test(sentence);
        const isVague = !isSetup && VAGUE_PATTERN.test(sentence) && !/["'`/]|\b(button|field|page|form|endpoint|message)\b/i.test(sentence);
        candidates.push({
          claim: sentence,
          sourceFile: document.relativePath,
          line: index + 1,
          flowType: classifyFlowType(sentence),
          verifiability: isSetup || isVague ? "unverifiable" : "testable",
          ...(isSetup
            ? { reason: "Setup instruction for the reader, not an observable product behaviour" }
            : isVague
              ? { reason: "Subjective wording has no observable pass condition" }
              : {}),
        });
        if (candidates.length >= maxClaims) break;
      }
      if (candidates.length >= maxClaims) break;
    }
    if (candidates.length >= maxClaims) break;
  }

  return candidates.map((claim, index) => ({
    id: `claim-${String(index + 1).padStart(3, "0")}`,
    ...claim,
  }));
}
