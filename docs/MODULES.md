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
- **Promises:** bounded timeout, key sent only in a header, sanitized errors, deterministic fallback in auto mode.
- **Depends on:** Gemini Developer API.
- **Fails how:** timeout/error raises an external-service error; caller falls back unless strict Gemini mode.
- **Hard part:** useful enhancement without making the demo quota-dependent.
- **Red tests:** `R-SECRET-1 redacts API key from provider error` and Gemini timeout tests.

### Kane runner
- **Owns:** invocation, NDJSON parsing, exit-code mapping and observation summaries.
- **Promises:** one flow per process, no shell, 0=passed, 1=failed, 2/3=error, timeout distinct.
- **Depends on:** installed/authenticated Kane CLI and browser.
- **Fails how:** missing binary, timeout or infrastructure exit becomes an error observation; later claims still run.
- **Hard part:** keeping documentation falsity separate from runner failure.
- **Red tests:** `R-TIMEOUT-1 terminates a hung command`; `R-TIMEOUT-1 records a timed-out flow and continues the audit`; runner mapping unit tests.

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

### static evidence site
- **Owns:** public explanation, deterministic report rendering, quick start and deployment disclosure.
- **Promises:** no runtime API calls, forms, credentials or secret names; captured evidence remains visibly labelled (R-STATIC-1).
- **Depends on:** committed HTML/CSS and Vercel static hosting.
- **Fails how:** an unavailable host removes the optional web presentation but does not affect the CLI or report generation.
- **Hard part:** making the hackathon entry immediately understandable without pretending the server can execute Kane.
- **Red tests:** `R-STATIC-1 Vercel evidence site` checks semantics, disclosure, secret absence and payload budget.
