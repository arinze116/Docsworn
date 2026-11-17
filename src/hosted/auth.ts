import { timingSafeEqual } from "node:crypto";

export function isWorkerAuthorized(provided: string | undefined, expected: string): boolean {
  if (!provided || !expected) return false;
  const providedBytes = Buffer.from(provided);
  const expectedBytes = Buffer.from(expected);
  return providedBytes.length === expectedBytes.length && timingSafeEqual(providedBytes, expectedBytes);
}
