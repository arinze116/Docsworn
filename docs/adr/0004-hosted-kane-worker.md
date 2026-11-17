# ADR-0004: Vercel proxy with an isolated VPS Kane worker
- Date (with zone): 2026-11-17 Africa/Lagos
- Status: accepted
- Rule ids affected: R-SECRET-1, R-TIMEOUT-1, R-HOSTED-AUTH-1, R-HOSTED-INPUT-1, R-HOSTED-ISOLATION-1, R-HOSTED-BOUNDS-1, R-HOSTED-TRUTH-1, R-HOSTED-DURATION-1, R-BROWSER-DEMO-1

## Context

The submission requires the browser result to come from a current Docsworn/Kane execution rather than committed fixture evidence. The existing CLI needs Git, a writable temporary workspace, authenticated Kane CLI state and a browser. A hosted request also needs both the public GitHub repository and the public live application URL; a repository URL alone cannot identify the product Kane must observe.

The initial public budget is one concurrent job, one extracted claim per hosted run, at most eight accepted jobs per UTC day and at most 280 seconds end to end (TARGET). Traffic is unknown (GUESS). The code supports a three-claim bound, but the deployed outbound HTTPS edge timed out during a sequential three-claim audit; one claim keeps the live demo inside that measured edge limit. The unrestricted local CLI remains the multi-claim path.

## Decision

Keep the public origin on Vercel. Add a same-origin `POST /api/check` function that validates an 8 KB JSON request, derives the client IP, and forwards it to an HTTPS VPS worker with a server-only shared token.

The worker accepts one job at a time. Before consuming an admission slot, it confirms through a bounded unauthenticated GitHub request that the submitted repository is public. It then applies per-IP and daily limits and starts a disposable Docker container on a dedicated restricted bridge network. The container has a read-only root, bounded CPU/memory/PIDs, temporary output, the installed Kane browser cache and the Kane profile mount. It runs the existing `auditDocumentation` pipeline with AI disabled, one claim in the hosted deployment and a bounded Kane timeout. The hosted path invokes Kane's direct `run` surface with the generated objective and live target URL; the local CLI continues to execute authored `testmd` files so its inspectable flow artefacts remain the source of truth. The response contains structured live results, including exact observations and validated `test-manager.lambdatest.com` session URLs. No automatic captured-data fallback is used.

## Alternatives considered

- Run Kane entirely in a Vercel function: rejected because the current authenticated browser/Kane profile and process environment are not present, and packaging a browser plus Git inside the function would be fragile against the 300-second ceiling.
- Call a public VPS endpoint directly from the browser: rejected because it would expose the worker authentication boundary, require browser CORS and make secret rotation impossible without a client release.
- Run the worker directly on the host: rejected because a malicious target could redirect the browser toward host-local services. A disposable Docker network namespace materially narrows that boundary.
- Keep fixture evidence: rejected because it does not satisfy the requested live execution requirement.
- Use hosted `testmd run` unchanged: rejected after a measured production audit exceeded the 70-second Kane budget before the public edge could return a verdict. Direct `run` preserves the same generated objective while avoiding the extra authored-suite lifecycle on the latency-sensitive hosted path.

## Consequences

The hosted demo now consumes Kane credits and depends on GitHub, the target application, LambdaTest, Vercel and the VPS. Admission limits can reject legitimate bursts. Deployment adds a Docker image, a systemd worker service, a loopback Nginx origin, an outbound HTTPS tunnel and two coordinated environment variables. The current VPS provider blocks inbound 80/443, so the hackathon deployment uses a Cloudflare quick tunnel; its hostname must be refreshed in Vercel after a tunnel restart. Hosted and local execution now intentionally use different Kane entry points, protected by `R-HOSTED-DURATION-1` tests. The UI must present rate, busy, timeout and provider errors as real states and must never relabel them as documentation failures.

## Reversal condition

Move to a managed job queue and stronger multi-tenant sandbox when measured traffic exceeds one concurrent audit, daily demand exceeds the credit budget, or untrusted targets require a formally isolated browser network.
