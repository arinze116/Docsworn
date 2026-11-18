# ADR-0007: Use the Google Gemini SDK for optional AI refinement
- Date (with zone): 2026-11-18 Africa/Lagos
- Status: accepted
- Rule ids affected: R-TIMEOUT-1, R-SECRET-1, R-FALLBACK-1

## Context

Docsworn's committed Gemini adapter called the Developer API directly and allowed the model and credential variable to vary. The requested application provider identity is Google Gemini Developer API, `@google/generative-ai` 0.24.1, model `gemini-1.5-flash`, authenticated only by `GEMINI_API_KEY`. The CLI must remain usable without a paid or quota-limited model API.

## Decision

Use `@google/generative-ai` for optional claim refinement and failed-claim fix suggestions. Construct one `GenerativeModel` for `gemini-1.5-flash`, request JSON responses with a 15-second SDK timeout, and read only `process.env.GEMINI_API_KEY`. Keep deterministic extraction and suggestion logic as the default no-key path and as the fallback when `--ai auto` encounters a Gemini failure.

## Consequences

The provider client now follows the installed SDK interface instead of maintaining a local HTTP request shape. Strict `--ai gemini` mode still fails when the key or provider is unavailable. Auto and off modes remain usable without Gemini quota. Provider error text remains sanitized before it reaches user-facing errors.

## Reversal condition

Revisit the SDK or model only when Google retires the requested model/API surface or measured reliability requires a supported replacement; preserve the deterministic fallback and provider-state isolation during any future migration.
