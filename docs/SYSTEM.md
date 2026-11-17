# Docsworn system decisions

## Purpose and users

- What it does: converts Markdown behavior claims into Kane CLI tests and a truth report.
- Users: solo developers, OSS maintainers and small teams — initial user count unknown (GUESS).

## Load and data

| Item | Value | Label | Source |
|---|---:|---|---|
| Repositories per process | 1 | TARGET | CLI design |
| Markdown files per audit | <= 200 | TARGET | memory safety bound |
| Markdown bytes per audit | <= 5 MB | TARGET | memory safety bound |
| Kane concurrency | 1 | TARGET | avoid browser/auth lock conflicts |
| Kane timeout per claim | 300 s | TARGET | configurable CLI default |
| Gemini timeout | 15 s | TARGET | fallback must remain responsive |
| Persistent server data | 0 bytes | MEASURED-by-design | local CLI only |
| Public static pages | 1 | TARGET | Vercel browser demo |
| Public dynamic/API requests | 0 | MEASURED-by-design | client-only captured-evidence demo |
| Public HTML + CSS + JS | < 45 KB | TARGET | fast judge-facing load |
| RPO / RTO | not applicable | MEASURED-by-design | no service/database |

## Rules

- R-TIMEOUT-1: Git, Gemini and Kane calls have bounded timeouts; timeout is reported distinctly.
- R-SECRET-1: credentials never enter prompts, reports or logs; external error text is redacted.
- R-INPUT-1: remote repositories are HTTPS GitHub owner/repo URLs and commands never use a shell.
- R-BOUNDS-1: document count and bytes are bounded before model or flow generation.
- R-FALLBACK-1: Gemini failure falls back to deterministic extraction/fix logic in auto mode.
- R-KANE-FORMAT-1: generated `_test.md` files use only documented Kane frontmatter keys and keep source traceability in ordinary Markdown.
- R-BROWSER-DEMO-1: the Vercel root exposes a labelled GitHub repository URL form, validates the input locally, and renders a pass/fail/unverifiable truth report from visibly labelled captured evidence without secrets or runtime API calls.

## Architecture

A modular local Node CLI reads one repository, extracts traceable claims, writes Kane Markdown tests, runs them sequentially, and writes a report. GitHub cloning uses a scoped temporary directory. Gemini is optional. A separate Vercel deployment serves an interactive static HTML/CSS/JavaScript demo: it accepts and validates a public GitHub repository URL, shows a bounded loading state, then renders the committed deterministic report. It cannot run Kane, clone repositories or receive credentials. There is no database, queue, cache, dynamic public endpoint or background worker.

## Known limits

- Heuristic extraction favors explicit English behavioral sentences.
- A failed Kane flow can mean stale docs, a flaky target or a bad generated objective; the report preserves the observation rather than claiming causality.
- Captured results are a labelled fallback and do not count as current live execution.
- The hosted form demonstrates the browser workflow but does not inspect the submitted repository; arbitrary live audits continue to run through the local CLI.
