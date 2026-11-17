const SECRET_PATTERNS = [
  /AIza[A-Za-z0-9_-]{12,}/g,
  /(?:api[_-]?key|access[_-]?key|token|authorization)\s*[:=]\s*["']?[^\s"']+/gi,
  /Bearer\s+[A-Za-z0-9._~+\/-]+=*/gi,
];

/** Removes common credential shapes before external errors reach reports or logs. */
export function sanitizeText(value: string): string {
  return SECRET_PATTERNS.reduce(
    (sanitized, pattern) => sanitized.replace(pattern, "[REDACTED]"),
    value,
  );
}
