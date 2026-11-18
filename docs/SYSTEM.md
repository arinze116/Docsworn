# Docsworn system decisions

## Purpose and users

- What it does: converts Markdown behavior claims into Kane CLI tests and a truth report.
- Users: solo developers, OSS maintainers and small teams — initial user count unknown (GUESS).

## Load and data

| Item | Value | Label | Source |
|---|---:|---|---|
| Repositories per process | 1 | TARGET | CLI design |
| Markdown files per audit | <= 200 | TARGET | memory safety bound |
| Markdown bytes per audit | <= 5 MB | TARGET | memory safety bound |
| Kane concurrency | 1 | TARGET | avoid browser/auth lock conflicts |
| Kane timeout per claim | 300 s | TARGET | configurable CLI default |
| Gemini timeout | 15 s | TARGET | fallback must remain responsive |
| Hosted audit users per day | <= 8 | TARGET | Kane credit and abuse budget |
| Hosted audit request body | <= 8 KB | TARGET | repository URL + target URL only |
| Hosted audit claims per request | 1 | TARGET | public edge duration and Kane credit bound |
| Hosted audit concurrency | 1 | TARGET | browser/auth lock and cost bound |
| Hosted audit duration | <= 280 s | TARGET | below Vercel's 300 s function ceiling |
| Hosted audit average arrival rate | 0.000093 req/s | TARGET | 8 requests / 86,400 seconds |
| Hosted audit expected service time | 180 s | GUESS | validate from production runs |
| Hosted audit requests in flight | 0.017 | GUESS | Little's law: 0.000093 x 180 |
| Persistent server data | < 32 KB | TARGET | rolling rate/daily usage counters only |
| Public static pages | 1 | TARGET | Vercel browser application |
| Public dynamic/API routes | 1 | TARGET | Vercel `/api/check` proxy |
| Public HTML + CSS + JS | < 55 KB | TARGET | fast judge-facing load |
| Hosted usage RPO / RTO | 24 h / 15 min | TARGET | losing counters may admit extra work, never lose audit truth |

## Rules

- R-TIMEOUT-1: Git, Gemini and Kane calls have bounded timeouts; timeout is reported distinctly.
- R-SECRET-1: credentials never enter prompts, reports or logs; external error text is redacted.
- R-INPUT-1: remote repositories are HTTPS GitHub owner/repo URLs and commands never use a shell.
- R-BOUNDS-1: document count and bytes are bounded before model or flow generation.
- R-FALLBACK-1: Gemini SDK failure falls back to deterministic extraction/fix logic in auto mode.
- R-GEMINI-MODEL-1: the pinned Gemini model must be advertised for `generateContent` and return valid JSON under Docsworn's production SDK configuration before release.
- R-KANE-FORMAT-1: generated `_test.md` files use only documented Kane frontmatter keys and keep source traceability in ordinary Markdown.
- R-HOSTED-AUTH-1: only the Vercel proxy can invoke the VPS worker; the shared secret is timing-safe compared, never returned and never logged.
- R-HOSTED-INPUT-1: hosted audits accept only canonical GitHub repositories that are either reachable without credentials or exactly match the one server-configured read-only mirror; target URLs must be public HTTPS with no credentials, fragments or non-standard ports.
- R-HOSTED-ISOLATION-1: every hosted audit runs in a disposable, read-only Docker container on a restricted bridge network; repository code is never executed.
- R-HOSTED-BOUNDS-1: request bytes, claims, per-IP frequency, daily jobs, concurrency, subprocess time and response bytes are bounded before Kane runs.
- R-HOSTED-TRUTH-1: hosted results are returned only from `live-kane` observations; each executed claim retains its exact observation, source line, suggested correction and validated LambdaTest session URL.
- R-HOSTED-DURATION-1: hosted checks use Kane's direct `run` surface while the local CLI keeps authored `testmd` execution; the hosted path must complete within the public edge deadline.
- R-HOSTED-AVAILABILITY-1: restarting the worker or Nginx must not restart the accountless quick tunnel and invalidate Vercel's configured worker URL.
- R-HOSTED-PATH-1: worker, network and trusted-mirror deployment paths must resolve to the current repository root before a worker restart or hosted audit.
- R-BROWSER-DEMO-1: the Vercel root exposes labelled repository and live-target URL fields, calls `/api/check`, announces live progress/failures, and renders only the returned live result.

## Architecture

A modular local Node CLI reads one repository, extracts traceable claims, writes Kane Markdown tests, runs them sequentially, and writes a report. GitHub cloning uses a scoped temporary directory. Gemini is optional and uses `@google/generative-ai` with the compatibility-tested `gemini-3.5-flash-lite` model when `GEMINI_API_KEY` is present.

The hosted path is deliberately split. Vercel serves the interface and a same-origin `/api/check` function. That function validates and bounds the request, adds the authenticated worker header and proxies it over TLS. Before admission, the VPS worker either uses a bounded unauthenticated `HEAD` request to confirm that GitHub exposes the submitted repository publicly or matches the URL to one owner-configured repository mirror. It then applies global and per-IP limits and starts one disposable Docker audit container. Public repositories are cloned inside the container; the configured mirror is mounted read-only at `/work/repository`. The container receives the public target URL, a bounded workspace and the existing Kane profile mount, runs Docsworn with Kane, returns structured JSON and is removed. The worker retains only rolling usage counters. No report is persisted by the service, and no GitHub credential enters the container.

## Known limits

- Heuristic extraction favors explicit English behavioral sentences.
- A failed Kane flow can mean stale docs, a flaky target or a bad generated objective; the report preserves the observation rather than claiming causality.
- Hosted capacity is intentionally one audit at a time and eight accepted jobs per UTC day; excess requests receive a retryable error.
- An unverifiable claim has no Kane session because it has no executable pass condition; the UI states that instead of linking unrelated evidence.
- Docker network rules reduce access to host/private networks. They are not a substitute for a separately owned multi-tenant sandbox; raise the isolation boundary before increasing traffic or claim limits.
- Kane/LambdaTest availability and remaining credits are external dependencies. The UI reports those failures without falling back to fixture evidence.
- The hosted browser surface accepts publicly cloneable GitHub repositories plus one exact owner-configured read-only mirror. All other private repositories remain a local CLI workflow.
