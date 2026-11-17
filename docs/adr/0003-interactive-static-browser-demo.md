# ADR-0003: Interactive static browser demo

- Date: 2026-11-17 UTC
- Status: accepted
- Supersedes: ADR-0002 presentation constraint
- Rule ids: R-BROWSER-DEMO-1, R-SECRET-1

## Context

The authenticated Kane verification loaded the production page but failed because the root URL exposed no repository input or visible way to start a documentation check. The public demo therefore did not express the product's primary interaction, even though the evidence page itself was accurate.

Running the local Docsworn/Kane pipeline inside Vercel remains outside the current architecture: it would require repository job isolation, process execution, Kane authentication, retention rules and defensive public-endpoint tests.

## Decision

Keep Vercel static and add a client-side browser demo at `/`. The hero contains a semantic form with a labelled GitHub repository URL input and a visible `Run documentation check` submit button. JavaScript validates HTTPS `github.com/<owner>/<repo>` URLs, announces invalid and loading states, and reveals the committed deterministic Documentation Truth Report after submission.

The result area names the submitted repository for continuity but explicitly states that the browser demo uses captured deterministic Kane evidence. It does not fetch, clone, inspect or make claims about the submitted repository. Real repository and Kane execution remain in the local CLI.

## Alternatives considered

- Preserve the static evidence page unchanged: rejected because it does not let a judge or browser agent exercise the core interaction.
- Call the GitHub API from the browser: rejected because it would still not execute Docsworn/Kane and would add rate limits and misleading partial behavior.
- Add a Vercel serverless runner: deferred until isolated jobs, authentication, timeouts, retention and abuse controls are designed and red-tested.

## Consequences

The root page now has accessible invalid, loading, disabled and success states that Kane can exercise. No Vercel environment variable, backend, credential, upload or persistent data is introduced. The demo is intentionally bounded and candid rather than a live audit of arbitrary repositories.

## Reversal condition

Replace captured browser evidence only after a hosted runner has an explicit security model, per-job isolation, authenticated Kane execution, retention controls and fault-injected public-endpoint tests.
