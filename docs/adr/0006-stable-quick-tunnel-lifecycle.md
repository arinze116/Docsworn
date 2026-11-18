# ADR-0006: Keep the quick tunnel alive across origin restarts
- Date (with zone): 2026-11-18 Africa/Lagos
- Status: accepted
- Rule ids affected: R-HOSTED-AVAILABILITY-1

## Context

The initial tunnel unit used `Requires=docsworn-worker.service nginx.service`. Restarting the worker during deployment also stopped and recreated the accountless Cloudflare quick tunnel. The new tunnel received a different hostname while Vercel retained the old `DOCSWORN_WORKER_URL`, so valid checks returned HTTP 502 with `INVALID_WORKER_RESPONSE`.

## Decision

Use `Wants=docsworn-worker.service nginx.service network-online.target` plus the existing ordering constraint. This starts the origin dependencies when the tunnel starts without coupling the tunnel lifecycle to routine worker or Nginx restarts.

## Consequences

Routine origin deployments preserve the configured tunnel hostname. The accountless tunnel can still restart independently or disappear because it has no uptime guarantee; that event still requires updating Vercel and deploying again.

## Reversal condition

Replace the quick tunnel with a stable named tunnel or another durable HTTPS origin when production availability matters beyond the current demo scope.
