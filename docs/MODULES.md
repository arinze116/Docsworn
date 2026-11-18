# Module contracts

### repository and document source
- **Owns:** local path validation, temporary GitHub clone, Markdown discovery bounds.
- **Promises:** no shell interpolation or credential-bearing/query GitHub URLs (R-INPUT-1); clone timeout (R-TIMEOUT-1); bounded files/bytes (R-BOUNDS-1).
- **Depends on:** local filesystem and `git`.
- **Fails how:** invalid input or clone error becomes a user-facing input error; scoped temp clone is removed.
- **Hard part:** accepting useful inputs without executing repository-controlled commands.
- **Red tests:** `R-INPUT-1 public GitHub URLs` and timeout coverage.

### Gemini client
- **Owns:** optional model request and JSON response parsing.
- **Promises:** compatibility-tested `gemini-3.5-flash-lite` model, bounded timeout, `GEMINI_API_KEY` authentication through the SDK, sanitized errors, deterministic fallback in auto mode.
- **Depends on:** Gemini Developer API through `@google/generative-ai`.
- **Fails how:** timeout/error raises an external-service error; caller falls back unless strict Gemini mode.
- **Hard part:** useful enhancement without making the demo quota-dependent.
- **Red tests:** `R-SECRET-1 redacts API key from provider error`, `R-GEMINI-MODEL-1` SDK model/JSON configuration, timeout configuration and `R-FALLBACK-1` pipeline fallback tests.

### Kane runner
- **Owns:** invocation, NDJSON parsing, exit-code mapping and observation summaries.
- **Promises:** one flow per process, no shell, 0=passed, 1=failed, 2/3=error, timeout distinct; local audits use authored `testmd`, while hosted audits use direct `run` objectives to remain inside the public edge deadline.
- **Depends on:** installed/authenticated Kane CLI and browser.
- **Fails how:** missing binary, timeout or infrastructure exit becomes an error observation; later claims still run.
- **Hard part:** keeping documentation falsity separate from runner failure.
- **Red tests:** `R-TIMEOUT-1 terminates a hung command`; `R-TIMEOUT-1 records a timed-out flow and continues the audit`; `R-HOSTED-DURATION-1 uses Kane's direct run surface for hosted objectives`; runner mapping unit tests.

### Flow generator
- **Owns:** one Kane `_test.md` file per testable claim and source-to-flow traceability.
- **Promises:** only documented Kane frontmatter is emitted (R-KANE-FORMAT-1); expected destination URLs are not mistaken for start URLs.
- **Depends on:** extracted claims and the validated live target URL.
- **Fails how:** filesystem write errors abort before Kane runs.
- **Hard part:** producing objectives that start from the right page without inventing undocumented setup.
- **Red tests:** `AT-3 Kane flow generation` rejects custom frontmatter and expected-destination start routes.

### report and fix loop
- **Owns:** score, status sections and replacement suggestion.
- **Promises:** source file/line retained; captured results labelled; only failed claims receive fixes.
- **Depends on:** claim, flow and Kane result modules; optional Gemini.
- **Fails how:** unwritable output aborts without changing docs.
- **Hard part:** honest wording when evidence is incomplete.
- **Red tests:** report acceptance snapshots and deterministic replacement tests.

### browser evidence demo
- **Owns:** repository/live-target inputs, client validation, progress/error announcements and dynamic live-result cards.
- **Promises:** calls only same-origin `/api/check`; never receives credentials; renders claim, exact observation, correction, source line and a validated Kane session reference for every result (R-BROWSER-DEMO-1, R-HOSTED-TRUTH-1).
- **Depends on:** committed HTML/CSS/ES-module JavaScript and the Vercel proxy.
- **Fails how:** invalid input focuses the first field; busy/rate/provider errors remain visible in both the form and report state and never reveal stale fixture results.
- **Hard part:** making a multi-minute real audit understandable without inventing progress or evidence.
- **Red tests:** browser contract and DOM rendering tests; empty, loading, result and endpoint-failure states remain honest and navigable.

### Vercel check proxy
- **Owns:** public HTTP method/body boundary, client-IP derivation, worker authentication header, upstream timeout and safe response mapping.
- **Promises:** no secret in client JavaScript, responses or logs; 8 KB request limit; no-store responses; only configured HTTPS worker origin (R-HOSTED-AUTH-1, R-HOSTED-BOUNDS-1).
- **Depends on:** Vercel Node runtime and the authenticated HTTPS worker edge.
- **Fails how:** malformed/large requests return 400/413; missing configuration or upstream failures return a bounded 503/504 JSON error.
- **Hard part:** holding one request open without allowing an unbounded serverless execution.
- **Red tests:** invalid worker token is never client-visible; hanging upstream aborts at the configured deadline.

### hosted Kane worker
- **Owns:** authenticated admission, public URL resolution, per-IP/daily limits, single-flight execution, container lifecycle and structured result validation.
- **Promises:** repository visibility is checked without credentials and within a five-second deadline before admission, unless the URL exactly matches the one configured read-only mirror; only one bounded disposable audit container runs; public clones and results are deleted with the container; the configured mirror is mounted read-only; session URLs must be LambdaTest HTTPS URLs (R-TIMEOUT-1, R-HOSTED-INPUT-1, R-HOSTED-ISOLATION-1, R-HOSTED-BOUNDS-1, R-HOSTED-TRUTH-1).
- **Depends on:** Docker, GitHub, the target app, Kane/LambdaTest, the mounted Kane profile and a restricted Docker network.
- **Fails how:** unauthorized=401, invalid=400, rate/daily=429, busy=503, job timeout/provider/container failure=502/504; all are sanitized.
- **Hard part:** exposing useful live execution without turning Kane credits or the VPS browser into an unbounded public resource.
- **Red tests:** bad auth, private target, unconfigured private repository, configured mirror admission and read-only mount, repository-check timeout, oversized body, full worker, rate limit, daily cap, container timeout, secret-log canary and invalid session URL.

### hosted service deployment
- **Owns:** worker, loopback Nginx and outbound quick-tunnel lifecycle.
- **Promises:** worker or Nginx restarts do not rotate the quick-tunnel hostname; an intentional tunnel restart is followed by a Vercel worker-URL update and deployment (R-HOSTED-AVAILABILITY-1).
- **Depends on:** systemd, Nginx, cloudflared and the Vercel production environment.
- **Fails how:** a stale tunnel hostname returns a non-JSON Cloudflare response that the Vercel proxy safely maps to `INVALID_WORKER_RESPONSE`.
- **Hard part:** accountless quick tunnels have generated hostnames and no uptime guarantee.
- **Red tests:** the tunnel unit uses `Wants`, not `Requires`, for the worker and Nginx services.
