const INVALID_REPOSITORY_MESSAGE =
  "Enter a public repository URL in the form https://github.com/owner/repository.";

export function parseRepositoryUrl(value) {
  const candidate = String(value ?? "").trim();
  let url;

  try {
    url = new URL(candidate);
  } catch {
    return { ok: false, message: INVALID_REPOSITORY_MESSAGE };
  }

  const segments = url.pathname.split("/").filter(Boolean);
  const hasSafeOrigin =
    url.protocol === "https:" &&
    url.hostname.toLowerCase() === "github.com" &&
    url.port === "" &&
    url.username === "" &&
    url.password === "";
  const hasRepositoryPath = segments.length === 2;

  if (!hasSafeOrigin || !hasRepositoryPath || url.search || url.hash) {
    return { ok: false, message: INVALID_REPOSITORY_MESSAGE };
  }

  const owner = segments[0];
  const repositoryName = segments[1].replace(/\.git$/i, "");
  const validOwner = /^(?!-)[A-Za-z0-9-]{1,39}(?<!-)$/.test(owner);
  const validRepository = /^[A-Za-z0-9._-]+$/.test(repositoryName);

  if (!validOwner || !validRepository) {
    return { ok: false, message: INVALID_REPOSITORY_MESSAGE };
  }

  const repository = `${owner}/${repositoryName}`;
  return {
    ok: true,
    normalizedUrl: `https://github.com/${repository}`,
    repository,
  };
}

function delay(milliseconds) {
  return new Promise((resolve) => globalThis.setTimeout(resolve, milliseconds));
}

async function runBrowserDemo(form) {
  const input = form.elements.namedItem("repository");
  const button = document.querySelector("#run-button");
  const error = document.querySelector("#repo-error");
  const status = document.querySelector("#run-status");
  const report = document.querySelector("#report");
  const parsed = parseRepositoryUrl(input.value);

  error.hidden = true;
  error.textContent = "";
  input.removeAttribute("aria-invalid");

  if (!parsed.ok) {
    input.setAttribute("aria-invalid", "true");
    error.textContent = parsed.message;
    error.hidden = false;
    status.dataset.state = "error";
    status.textContent = parsed.message;
    input.focus();
    return;
  }

  input.value = parsed.normalizedUrl;
  report.hidden = true;
  form.setAttribute("aria-busy", "true");
  input.disabled = true;
  button.disabled = true;
  button.textContent = "Checking documentation…";

  const stages = [
    `Reading documentation claims from ${parsed.repository}…`,
    "Generating Kane verification flows…",
    "Assembling pass/fail truth report…",
  ];

  for (const stage of stages) {
    status.dataset.state = "loading";
    status.textContent = stage;
    await delay(450);
  }

  for (const target of document.querySelectorAll("[data-repository-name]")) {
    target.textContent = parsed.repository;
  }

  form.removeAttribute("aria-busy");
  input.disabled = false;
  button.disabled = false;
  button.textContent = button.dataset.idleLabel;
  status.dataset.state = "complete";
  status.textContent = "Documentation check complete. Truth report generated with pass, fail and unverifiable results.";
  report.hidden = false;
  report.focus();
  const behavior = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  report.scrollIntoView({ block: "start", behavior });
}

if (typeof document !== "undefined") {
  const form = document.querySelector("#audit-form");
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    void runBrowserDemo(form);
  });
}
