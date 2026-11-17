const INVALID_REPOSITORY_MESSAGE =
  "Enter a public repository URL in the form https://github.com/owner/repository.";
const INVALID_TARGET_MESSAGE = "Enter a public HTTPS live application URL.";
const HOSTED_TIMEOUT_MS = 285_000;

export function parseRepositoryUrl(value) {
  const candidate = String(value ?? "").trim();
  let url;
  try {
    url = new URL(candidate);
  } catch {
    return { ok: false, message: INVALID_REPOSITORY_MESSAGE };
  }
  const segments = url.pathname.split("/").filter(Boolean);
  const hasSafeOrigin = url.protocol === "https:" && url.hostname.toLowerCase() === "github.com" &&
    !url.port && !url.username && !url.password;
  const owner = segments[0];
  const repositoryName = segments[1]?.replace(/\.git$/i, "");
  const validOwner = owner && /^(?!-)[A-Za-z0-9-]{1,39}(?<!-)$/.test(owner);
  const validRepository = repositoryName && /^[A-Za-z0-9._-]+$/.test(repositoryName);
  if (!hasSafeOrigin || segments.length !== 2 || url.search || url.hash || !validOwner || !validRepository) {
    return { ok: false, message: INVALID_REPOSITORY_MESSAGE };
  }
  const repository = `${owner}/${repositoryName}`;
  return { ok: true, normalizedUrl: `https://github.com/${repository}`, repository };
}

export function parseTargetUrl(value) {
  const candidate = String(value ?? "").trim();
  let url;
  try {
    url = new URL(candidate);
  } catch {
    return { ok: false, message: INVALID_TARGET_MESSAGE };
  }
  const looksLikeIpAddress = /^[\d.]+$/.test(url.hostname) || url.hostname.includes(":");
  if (
    url.protocol !== "https:" || !url.hostname || url.hostname.toLowerCase() === "localhost" ||
    looksLikeIpAddress || url.port || url.username || url.password || url.hash
  ) {
    return { ok: false, message: INVALID_TARGET_MESSAGE };
  }
  return { ok: true, normalizedUrl: url.toString() };
}

function setFieldError(input, error, message) {
  input.toggleAttribute("aria-invalid", Boolean(message));
  error.textContent = message ?? "";
  error.hidden = !message;
}

function appendText(parent, tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function statusPresentation(status) {
  return {
    passed: { label: "Passed", icon: "✓", className: "claim-passed" },
    failed: { label: "Failed", icon: "×", className: "claim-failed" },
    unverifiable: { label: "Unverifiable", icon: "!", className: "claim-warning" },
    error: { label: "Runner error", icon: "!", className: "claim-warning" },
    pending: { label: "Pending", icon: "…", className: "claim-warning" },
  }[status] ?? { label: "Unknown", icon: "?", className: "claim-warning" };
}

function correctionText(audited) {
  if (audited.suggestedFix) return audited.suggestedFix;
  if (audited.observation.status === "passed") return "No correction needed; the documented behavior matched the live product.";
  if (audited.observation.status === "unverifiable") return "Rewrite this claim with an observable outcome and a measurable pass condition.";
  return "No correction can be suggested until Kane returns product evidence.";
}

function createEvidenceCard(audited, index) {
  const presentation = statusPresentation(audited.observation.status);
  const article = document.createElement("article");
  article.className = `evidence-card ${index === 0 ? "evidence-featured " : ""}${presentation.className}`;
  const titleId = `live-${audited.claim.id}-title`;
  article.setAttribute("aria-labelledby", titleId);

  const header = appendText(article, "header", "evidence-card-header", "");
  const status = appendText(header, "p", "claim-status", presentation.label);
  const icon = document.createElement("span");
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = presentation.icon;
  status.prepend(icon);
  appendText(header, "code", "", `${audited.claim.sourceFile}:${audited.claim.line}`);

  const title = appendText(article, "h3", "", audited.claim.claim);
  title.id = titleId;
  const comparison = appendText(article, "div", "evidence-comparison", "");
  const docs = appendText(comparison, "div", "", "");
  appendText(docs, "span", "", "Docs say");
  appendText(docs, "blockquote", "", audited.claim.claim);
  const observed = appendText(comparison, "div", "", "");
  appendText(observed, "span", "", audited.observation.status === "unverifiable" ? "Docsworn classified" : "Kane observed");
  appendText(observed, "p", "", audited.observation.summary);

  const suggestion = appendText(article, "p", "suggestion", correctionText(audited));
  const suggestionLabel = appendText(suggestion, "strong", "", "Corrected wording");
  suggestion.prepend(suggestionLabel);

  const session = appendText(article, "p", "session-link", "");
  appendText(session, "strong", "", "Kane session");
  if (audited.observation.sessionUrl) {
    const link = appendText(session, "a", "", "Open LambdaTest evidence ↗");
    link.href = audited.observation.sessionUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
  } else {
    appendText(session, "span", "", "Not created — this claim had no executable Kane pass condition.");
  }
  return article;
}

function renderLiveReport(result) {
  const score = result.summary.accuracyPercent;
  document.querySelector("[data-score-value]").textContent = score === null ? "—" : String(score);
  const executed = result.summary.passed + result.summary.failed;
  document.querySelector("[data-score-summary]").textContent =
    `${result.summary.passed} of ${executed} executable claims verified.`;
  document.querySelector("[data-count-passed]").textContent = String(result.summary.passed).padStart(2, "0");
  document.querySelector("[data-count-failed]").textContent = String(result.summary.failed).padStart(2, "0");
  document.querySelector("[data-count-unverifiable]").textContent = String(result.summary.unverifiable).padStart(2, "0");
  document.querySelector("[data-claim-count-title]").textContent =
    `${result.summary.total} ${result.summary.total === 1 ? "promise" : "promises"}. ${result.summary.total} ${result.summary.total === 1 ? "receipt" : "receipts"}.`;
  for (const target of document.querySelectorAll("[data-repository-name]")) {
    target.textContent = result.repository.replace("https://github.com/", "");
  }
  for (const target of document.querySelectorAll("[data-target-url]")) target.textContent = result.targetUrl;
  document.querySelector("#evidence-grid").replaceChildren(...result.claims.map(createEvidenceCard));
}

async function requestLiveAudit(payload, fetchImpl = fetch) {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), HOSTED_TIMEOUT_MS);
  try {
    const response = await fetchImpl("/api/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const result = await response.json().catch(() => undefined);
    if (!response.ok || !result?.ok) throw new Error(result?.message ?? "The live Kane check failed. Try again later.");
    return result;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("The hosted Kane check exceeded the time limit. Try the local CLI for a longer audit.");
    }
    throw error;
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

async function runBrowserAudit(form) {
  const repositoryInput = form.elements.namedItem("repository");
  const targetInput = form.elements.namedItem("target");
  const button = document.querySelector("#run-button");
  const status = document.querySelector("#run-status");
  const runError = document.querySelector("#run-error");
  const report = document.querySelector("#report");
  const repository = parseRepositoryUrl(repositoryInput.value);
  const target = parseTargetUrl(targetInput.value);

  setFieldError(repositoryInput, document.querySelector("#repo-error"), repository.ok ? undefined : repository.message);
  setFieldError(targetInput, document.querySelector("#target-error"), target.ok ? undefined : target.message);
  runError.hidden = true;
  report.hidden = true;
  if (!repository.ok || !target.ok) {
    status.dataset.state = "error";
    status.textContent = "Correct the highlighted URL before starting the live audit.";
    (repository.ok ? targetInput : repositoryInput).focus();
    return;
  }

  repositoryInput.value = repository.normalizedUrl;
  targetInput.value = target.normalizedUrl;
  form.setAttribute("aria-busy", "true");
  repositoryInput.disabled = true;
  targetInput.disabled = true;
  button.disabled = true;
  button.textContent = "Running live Kane check…";
  status.dataset.state = "loading";
  status.textContent = "Cloning the documentation and running a real browser check. This can take one to two minutes.";

  try {
    const result = await requestLiveAudit({
      repositoryUrl: repository.normalizedUrl,
      targetUrl: target.normalizedUrl,
    });
    renderLiveReport(result);
    status.dataset.state = "complete";
    status.textContent = "Live Kane check complete. The truth report and session evidence are ready.";
    report.hidden = false;
    report.focus();
    const behavior = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
    report.scrollIntoView({ block: "start", behavior });
  } catch (error) {
    runError.textContent = error instanceof Error ? error.message : "The live Kane check failed.";
    runError.hidden = false;
    status.dataset.state = "error";
    status.textContent = "Live audit did not complete.";
  } finally {
    form.removeAttribute("aria-busy");
    repositoryInput.disabled = false;
    targetInput.disabled = false;
    button.disabled = false;
    button.textContent = button.dataset.idleLabel;
  }
}

if (typeof document !== "undefined") {
  const form = document.querySelector("#audit-form");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    void runBrowserAudit(form);
  });
}
