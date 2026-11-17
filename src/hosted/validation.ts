import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

import { parseGitHubUrl } from "../repository.js";
import type { HostedCheckRequest } from "../types.js";
import { HostedRequestError } from "./errors.js";

const MAX_URL_LENGTH = 2_048;
const DEFAULT_REPOSITORY_CHECK_TIMEOUT_MS = 5_000;

export interface AddressRecord {
  address: string;
  family: number;
}

export interface HostedValidationOptions {
  resolveHostname?: (hostname: string) => Promise<AddressRecord[]>;
  isAddressAllowed?: (address: string) => boolean;
  repositoryIsPublic?: (repositoryUrl: URL) => Promise<boolean>;
}

export interface GitHubRepositoryCheckOptions {
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

function isPrivateIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  const [first, second] = octets;
  if (octets.length !== 4 || first === undefined || second === undefined) return true;
  return first === 0 || first === 10 || first === 127 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 100 && second >= 64 && second <= 127) ||
    first >= 224;
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase();
  return normalized === "::" || normalized === "::1" || normalized.startsWith("fc") ||
    normalized.startsWith("fd") || normalized.startsWith("fe8") || normalized.startsWith("fe9") ||
    normalized.startsWith("fea") || normalized.startsWith("feb") || normalized.startsWith("::ffff:127.") ||
    normalized.startsWith("::ffff:10.") || normalized.startsWith("::ffff:192.168.");
}

export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return !isPrivateIpv4(address);
  if (family === 6) return !isPrivateIpv6(address);
  return false;
}

/** Confirms that an unauthenticated visitor can reach a GitHub repository within a bounded deadline. */
export async function checkPublicGitHubRepository(
  repositoryUrl: URL,
  options: GitHubRepositoryCheckOptions = {},
): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_REPOSITORY_CHECK_TIMEOUT_MS,
  );
  try {
    const response = await (options.fetchImpl ?? fetch)(repositoryUrl, {
      method: "HEAD",
      redirect: "manual",
      signal: controller.signal,
      headers: { "User-Agent": "Docsworn/0.1 public-repository-check" },
    });
    if (response.status === 404) return false;
    if (response.status >= 200 && response.status < 400) return true;
    throw new HostedRequestError("GitHub repository availability could not be confirmed", 503, "REPOSITORY_CHECK_UNAVAILABLE");
  } catch (error) {
    if (error instanceof HostedRequestError) throw error;
    const didTimeOut = error instanceof Error && error.name === "AbortError";
    throw new HostedRequestError(
      didTimeOut ? "GitHub repository check timed out" : "GitHub repository availability could not be confirmed",
      503,
      didTimeOut ? "REPOSITORY_CHECK_TIMEOUT" : "REPOSITORY_CHECK_UNAVAILABLE",
    );
  } finally {
    clearTimeout(timeout);
  }
}

function parseTargetUrl(input: string): URL {
  if (input.length > MAX_URL_LENGTH) throw new HostedRequestError("Live application URL is too long", 400, "INVALID_TARGET_URL");
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new HostedRequestError("Enter a valid public HTTPS live application URL", 400, "INVALID_TARGET_URL");
  }
  if (
    url.protocol !== "https:" || url.username || url.password || url.port || url.hash ||
    url.hostname === "localhost" || isIP(url.hostname) !== 0
  ) {
    throw new HostedRequestError("Live application URL must be a public HTTPS hostname", 400, "INVALID_TARGET_URL");
  }
  return url;
}

async function resolvePublicTarget(
  url: URL,
  options: HostedValidationOptions,
): Promise<void> {
  const resolveHostname = options.resolveHostname ?? (async (hostname: string) =>
    await lookup(hostname, { all: true, verbatim: true }));
  const records = await resolveHostname(url.hostname).catch(() => []);
  const addressAllowed = options.isAddressAllowed ?? isPublicAddress;
  if (records.length === 0 || records.some((record) => !addressAllowed(record.address))) {
    throw new HostedRequestError("Live application hostname must resolve only to public addresses", 400, "PRIVATE_TARGET");
  }
}

export async function validateHostedCheckRequest(
  input: unknown,
  options: HostedValidationOptions = {},
): Promise<HostedCheckRequest> {
  if (!input || typeof input !== "object") {
    throw new HostedRequestError("Request body must be a JSON object", 400, "INVALID_REQUEST");
  }
  const body = input as Record<string, unknown>;
  if (typeof body.repositoryUrl !== "string" || typeof body.targetUrl !== "string") {
    throw new HostedRequestError("repositoryUrl and targetUrl are required", 400, "INVALID_REQUEST");
  }
  const repositoryUrl = parseGitHubUrl(body.repositoryUrl.trim());
  if (!repositoryUrl) {
    throw new HostedRequestError("Enter a public GitHub repository URL", 400, "INVALID_REPOSITORY_URL");
  }
  const targetUrl = parseTargetUrl(body.targetUrl.trim());
  await resolvePublicTarget(targetUrl, options);
  const repositoryIsPublic = options.repositoryIsPublic ?? checkPublicGitHubRepository;
  if (!await repositoryIsPublic(repositoryUrl)) {
    throw new HostedRequestError(
      "GitHub repository must exist and be publicly accessible",
      400,
      "PRIVATE_REPOSITORY",
    );
  }
  return { repositoryUrl: repositoryUrl.toString(), targetUrl: targetUrl.toString() };
}
