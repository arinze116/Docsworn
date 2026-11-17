# Contributing

Docsworn accepts focused fixes and features that preserve the local, no-required-model-key workflow.

## Development setup

```bash
npm ci
npm run ci
npm run demo
```

Add or update tests with behavior changes. Changes to Git, Gemini, Kane, process execution, or credential handling must include a fault-injected test that is observed failing before the implementation is restored and the full suite passes.

Keep generated artifacts, credentials, `.env` files, Kane recordings, and local reports out of commits. Update `README.md`, the module contract, and an ADR when a public command or architectural decision changes.

## Pull requests

Describe the user-visible outcome, verification commands, known limits, and any external behavior that was not verified. Keep unrelated refactors out of the same change.
