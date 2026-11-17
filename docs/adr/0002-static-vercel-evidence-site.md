# ADR-0002: Static Vercel evidence site

- Date: 2026-11-17 UTC
- Status: superseded by ADR-0003
- Rule ids: R-STATIC-1, R-SECRET-1

## Context

The owner requested a production Vercel deployment. Docsworn's executable product is a local CLI that reads repositories, invokes an installed/authenticated Kane binary and controls a browser. Vercel serverless functions do not provide that local repository/process/authentication environment, and exposing uploaded repositories or credentials would materially expand the security and product scope.

## Decision

Deploy a static judge-facing evidence site from `public/`. It explains the local CLI, renders the deterministic fixture's Documentation Truth Report, links every finding to its source line, and labels the results as captured Kane evidence. It contains no form, API handler, runtime model call, Kane credential, analytics or client JavaScript.

## Alternatives considered

- Host the CLI as a Vercel function: rejected because local Git/Kane/browser assumptions do not hold and execution duration/auth would be misleading or fragile.
- Deploy only the synthetic registration fixture: rejected because that is the test target, not Docsworn.
- Build a repository-upload dashboard: deferred because it requires storage, permissions, job execution, secret handling and a much larger threat model.

## Consequences

The public URL gives judges an immediate, truthful product overview and report. It does not replace live Kane evidence or the local CLI. No Vercel environment variables are required.

## Reversal condition

Revisit when Docsworn has a deliberately designed hosted runner with isolated repository jobs, first-class Kane authentication, explicit data retention and defensive public-endpoint tests.

## Supersession

The no-form/no-JavaScript presentation constraint was superseded on 2026-11-17 by ADR-0003. The security boundary remains: Vercel still does not clone repositories or execute Kane.
