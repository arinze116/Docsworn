const MAX_BODY_BYTES = 8 * 1024;
const MAX_RESPONSE_BYTES = 1024 * 1024;
const DEFAULT_TIMEOUT_MS = 280_000;

function jsonResponse(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      ...headers,
    },
    body,
  };
}

function normalizedClientIp(value) {
  return String(value ?? "unknown").split(",")[0].trim().slice(0, 64) || "unknown";
}

export async function proxyCheck({ body, clientIp, workerUrl, workerToken, timeoutMs = DEFAULT_TIMEOUT_MS, fetchImpl = fetch }) {
  if (!workerUrl || !workerToken) {
    return jsonResponse(503, { ok: false, code: "HOSTED_CHECK_UNAVAILABLE", message: "Live Kane checks are temporarily unavailable." });
  }
  const payload = JSON.stringify(body);
  if (Buffer.byteLength(payload) > MAX_BODY_BYTES) {
    return jsonResponse(413, { ok: false, code: "BODY_TOO_LARGE", message: "Request body is too large." });
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const upstream = await fetchImpl(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Docsworn-Worker-Token": workerToken,
        "X-Docsworn-Client-IP": normalizedClientIp(clientIp),
      },
      body: payload,
      signal: controller.signal,
    });
    const text = await upstream.text();
    if (Buffer.byteLength(text) > MAX_RESPONSE_BYTES) {
      return jsonResponse(502, { ok: false, code: "RESULT_TOO_LARGE", message: "The live Kane result was too large." });
    }
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return jsonResponse(502, { ok: false, code: "INVALID_WORKER_RESPONSE", message: "The live Kane worker returned an invalid response." });
    }
    return jsonResponse(upstream.status, parsed, upstream.headers.get("retry-after")
      ? { "Retry-After": upstream.headers.get("retry-after") }
      : {});
  } catch (error) {
    const didTimeOut = error instanceof Error && error.name === "AbortError";
    return jsonResponse(didTimeOut ? 504 : 503, {
      ok: false,
      code: didTimeOut ? "WORKER_TIMEOUT" : "WORKER_UNAVAILABLE",
      message: didTimeOut
        ? "The live Kane check exceeded the hosted time limit."
        : "The live Kane worker is temporarily unavailable.",
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function requestBody(request) {
  if (request.body && typeof request.body === "object") return request.body;
  let body = "";
  for await (const chunk of request) {
    body += String(chunk);
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) return undefined;
  }
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ ok: false, code: "METHOD_NOT_ALLOWED", message: "Use POST /api/check." });
    return;
  }
  const body = await requestBody(request);
  if (body === undefined) {
    response.status(413).json({ ok: false, code: "BODY_TOO_LARGE", message: "Request body is too large." });
    return;
  }
  if (body === null) {
    response.status(400).json({ ok: false, code: "INVALID_JSON", message: "Request body must be valid JSON." });
    return;
  }
  const result = await proxyCheck({
    body,
    clientIp: request.headers["x-forwarded-for"] ?? request.socket?.remoteAddress,
    workerUrl: process.env.DOCSWORN_WORKER_URL,
    workerToken: process.env.DOCSWORN_WORKER_TOKEN,
  });
  for (const [name, value] of Object.entries(result.headers)) response.setHeader(name, value);
  response.status(result.statusCode).send(JSON.stringify(result.body));
}
