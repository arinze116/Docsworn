# ADR-0001: Local TypeScript CLI with optional Gemini

- Date: 2026-11-17 UTC
- Status: accepted
- Rule ids: R-TIMEOUT-1, R-SECRET-1, R-INPUT-1, R-FALLBACK-1, R-KANE-FORMAT-1

## Context

The event requires a runnable Kane loop by Nov 19. Judges must be able to install the project. The owner selected Gemini as the optional runtime AI API, but model availability and quota are external risks.

## Decision

Build one Node 20+ TypeScript CLI. Use deterministic local claim extraction and fix heuristics as the baseline. If a Gemini key is present, refine candidates and failure wording through the Gemini Developer API. Generate official Kane `_test.md` files and parse `--agent` NDJSON/exit codes.

Kane metadata is limited to documented frontmatter keys. Docsworn-specific claim ids and source locations remain in Markdown headings because Kane 0.10.5 rejects unknown frontmatter before browser execution.

## Alternatives considered

- Hosted web service: rejected because deployment, credentials and uptime add no required scoring benefit.
- Gemini-only pipeline: rejected because it makes the end-to-end demo quota-dependent.
- Python CLI: viable, but Node aligns with Kane's npm distribution and keeps one toolchain.
- Invented `.flow` format: rejected after checking Kane v0.10.5 official docs; `_test.md` is the supported committed format.

## Consequences

The CLI is easy to clone and audit, but deterministic extraction is deliberately conservative. External calls need timeout and secret-redaction tests. A dashboard stays stretch scope.

## Reversal condition

Revisit if the installed Kane version lacks `testmd run --agent`, or if offline extraction cannot reach three useful claims in the demo fixture.
