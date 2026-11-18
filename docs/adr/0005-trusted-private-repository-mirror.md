# ADR-0005: One configured read-only private repository mirror
- Date (with zone): 2026-11-18 Africa/Lagos
- Status: accepted
- Rule ids affected: R-HOSTED-INPUT-1, R-HOSTED-ISOLATION-1, R-SECRET-1

## Context

The production acceptance repository, `https://github.com/arinze116/Docsworn`, is private. The hosted worker correctly rejected it because its public-repository probe received HTTP 404, so the required real browser audit could not start. Making the repository public would be an external publishing decision, and passing a GitHub credential into an untrusted audit container would unnecessarily expand the secret boundary.

## Decision

Allow one exact repository URL to map to one operator-configured host path. The worker accepts that URL without the unauthenticated GitHub reachability probe and mounts the configured path read-only at `/work/repository` inside the existing disposable audit container. The job audits that local path but reports the submitted GitHub URL. No GitHub credential is added to the worker, container, browser, logs or response. All other private repositories remain rejected.

## Consequences

Production must keep the mirrored path on the deployed main revision before restarting the worker. The configured repository is readable by the container but cannot be modified there. This is a narrow owner-authorized exception rather than general private-repository support; supporting arbitrary private repositories would require a separate authorization, consent and secret-isolation design.

## Reversal condition

Replace the mirror with an authenticated repository integration when users need multiple private repositories, per-user authorization or revision pinning independent of the worker checkout.
