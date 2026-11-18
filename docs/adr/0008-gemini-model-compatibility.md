# ADR-0008: Pin Gemini 3.5 Flash Lite from measured compatibility
- Date (with zone): 2026-11-18 Africa/Lagos
- Status: accepted
- Rule ids affected: R-TIMEOUT-1, R-FALLBACK-1, R-GEMINI-MODEL-1

## Context

The previously requested `gemini-1.5-flash` model returned HTTP 404 and was absent from the Gemini Developer API model catalogue available to the configured credential. Docsworn requires text generation, JSON response mode and a bounded request timeout; catalogue presence alone is insufficient evidence that a model works with those settings.

## Decision

Probe every model advertised for `generateContent` once with `@google/generative-ai` 0.24.1, JSON response mode, a deterministic prompt, 16 output tokens and a 12-second timeout. Pin `gemini-3.5-flash-lite`: it returned valid JSON in 1.926 seconds and has a versioned name. The only other success was the rolling `gemini-flash-lite-latest` alias, which took 6.173 seconds and can change without a code release.

## Consequences

Claim refinement and fix suggestions use `gemini-3.5-flash-lite`. The deterministic no-key and auto-mode fallback paths remain unchanged. Model compatibility is point-in-time external evidence and must be rechecked after a provider, SDK or model-availability change.

## Reversal condition

Repeat the compatibility matrix and select another versioned general text model when the pinned model fails, disappears from the catalogue or no longer returns valid JSON within the timeout budget.
