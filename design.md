# Docsworn web and identity system

## Product truth

Docsworn is a local-first CLI that turns behavioral documentation claims into Kane CLI tests and a Documentation Truth Report. The Vercel site is an interactive static demonstration. It must make the repository URL input obvious at the root URL, preserve invalid/loading/success states, show a real labelled captured report and direct people to the local CLI without implying that Vercel clones repositories or executes Kane.

Audience: KaneCLI hackathon judges, OSS maintainers, solo developers and technical writers. Priority viewports: 1440 px laptop, 768 px tablet and 390 px phone.

## Direction: the sworn record

Character: forensic, editorial, candid and slightly confrontational. The page should feel like a developer tool crossed with a sworn statement: warm paper outside, hard black evidence surfaces inside, and affidavit red marking the exact claim under scrutiny.

The opening promise is direct: **“Documentation is not evidence. Until it survives the product.”** The visible verification desk sits beside it in the first viewport. Below, a compact pipeline leads directly into the result rather than a generic feature grid.

Reference synthesis and source metadata live in `docs/design-references/reference-notes.md`.

## Identity

### Witness mark

Two square brackets frame a red evidence point. The brackets mean source/code context; the point is the isolated behavioral claim. The mark intentionally avoids checkmarks, shields, magic sparkles, document sheets and robot heads.

Logo family:

- Primary: witness mark + Docsworn wordmark + “Documentation under oath”.
- Compact: witness mark + wordmark.
- Wordmark: lowercase `docsworn` in a heavy technical sans.
- Symbol: witness mark alone.
- Variants: ink-on-paper, paper-on-ink, monochrome.

Minimum symbol size: 16 px digital. Minimum compact lockup width: 112 px. Keep clear space equal to the central evidence-point width on every side.

### Colour

- `--paper: #F3EFE5` — warm document field.
- `--sheet: #FFFCF5` — report and form surfaces.
- `--ink: #101012` — primary type and black evidence surfaces.
- `--ink-soft: #26252A` — secondary dark surface.
- `--muted: #66625B` — explanatory text on paper.
- `--line: #CFC8BA` — document rules.
- `--seal: #D4382C` — affidavit red; evidence point and primary emphasis.
- `--seal-dark: #A9231C` — red text on pale backgrounds.
- `--verified: #17633D` / pale `#E6F2EA`.
- `--uncertain: #765400` / pale `#FFF0C2`.
- `--focus: #1769E0` — 3 px keyboard focus ring.

Status always includes a word and a symbol. Red is not used as the only failure cue. All normal text must meet WCAG 2.1 AA contrast.

### Typography

- Display and controls: `Arial`, `Helvetica Neue`, system sans-serif.
- Editorial accent: `Georgia`, `Times New Roman`, serif; used sparingly for sworn-language contrast.
- Evidence and source metadata: `ui-monospace`, `SFMono-Regular`, `Consolas`, monospace.
- H1: clamp(3.4rem, 7.6vw, 7.2rem), 0.88 line height, -0.065em tracking.
- H2: clamp(2.25rem, 4.5vw, 4.6rem), 0.96 line height, -0.045em.
- Body: 1rem / 1.6; lead 1.12rem / 1.55.
- Labels: 0.72–0.78rem, monospace, uppercase, 0.08em tracking.
- Scores use tabular figures.

## Page architecture

```text
┌─────────────────────────────────────────────────────────────┐
│ witness mark / Docsworn      Report  Method  CLI  [Run]    │
├─────────────────────────────────────────────────────────────┤
│ DOCUMENTATION IS NOT       ┌ VERIFICATION DESK ───────────┐ │
│ EVIDENCE.                  │ Repository URL               │ │
│ Until it survives          │ [github.com/owner/repo     ] │ │
│ the product.               │ [Put the docs under oath]   │ │
│                            └ captured evidence disclosure ┘ │
├─────────────────────────────────────────────────────────────┤
│ README → claims → Kane → observations → corrected wording  │
├─────────────────────────────────────────────────────────────┤
│ Generated report: score, counts, source-linked claim rows   │
├─────────────────────────────────────────────────────────────┤
│ Method statement                 Local CLI / exact limits    │
└─────────────────────────────────────────────────────────────┘
```

- Maximum content width: 1280 px.
- Gutters: 28 px desktop, 20 px tablet, 16 px mobile.
- Hero: 7/5 split above 940 px; form remains visible without scrolling at 1440 × 900.
- Report: one evidence table/list, not a dense analytics dashboard.
- Breakpoints: 940 px collapses hero; 680 px simplifies navigation and stacks claim comparison; 420 px tightens score layout.
- No horizontal overflow at 390 px or 200% zoom.

## Components and states

- Header: compact logo, three anchors and a high-contrast action. Mobile navigation wraps; no hidden hamburger dependency.
- Hero statement: oversized thesis with one editorial serif line and no invented proof.
- Verification desk: visible label, strict GitHub URL field, primary submit button, constraints and candid captured-evidence disclosure.
- Run status: polite live region. Button and input disable while checking; progress is text, not a spinner.
- Pipeline rail: five labelled stages connected by rules; horizontal desktop, stacked mobile.
- Truth report: submitted repository, giant score, passed/failed/unverifiable counts and a prominent captured-evidence label.
- Claim row: status, source line, documented claim, Kane observation and optional corrected wording.
- CLI block: selectable command and deterministic output.
- Exact status: explicit “is / uses / is not” wording.

Browser states:

- Empty: result hidden; input and submit action visible.
- Invalid: value retained, `aria-invalid` set, specific inline error and live announcement.
- Loading: form `aria-busy`; input/button disabled; three status messages.
- Success: submitted repository is echoed, report reveals, report heading receives focus.
- No JavaScript: explanation, deployment limits and CLI remain readable.

## Motion

- 140 ms colour/border transitions on interactive controls.
- Result reveal has no transform or entrance choreography.
- Loading changes text only.
- No parallax, looping decoration, cursor theatre or ambient particle effects.
- `prefers-reduced-motion: reduce` removes smooth scroll and transitions.
- Hover treatments are gated behind `(hover: hover) and (pointer: fine)`.

## Accessibility

- `lang="en"`, skip link, semantic landmarks, one H1 and logical heading order.
- Visible labels; no placeholder-only fields.
- Status uses visible words and symbols.
- Minimum 44 px actions on mobile.
- Focus ring is never removed; anchored sections use scroll margin.
- Decorative SVG is hidden from assistive technology; logo links have an accessible name.
- Interface must work by keyboard and remain readable in forced/reduced-motion contexts.

## Performance and deployment

- Static HTML, CSS, small ES module and original SVG/raster identity assets only.
- No framework, analytics, external font or production reference imagery.
- HTML + CSS + JavaScript target: under 52 KB uncompressed. Identity files are cached static assets.
- Vercel exposes no Gemini, Anthropic or Kane credential.
- Existing restrictive security headers remain.

## Anti-patterns

- Never imply the hosted page executed Kane or inspected the submitted repository.
- Never call captured fixture evidence a current live run.
- Never hide contradicted claims behind the aggregate score.
- Never invent customers, adoption metrics, testimonials or trust badges.
- Never use generic AI gradients, glass cards, robots, shields, checkmark logos or decorative dashboards.
- Never copy a reference layout, logo, artwork or template code.
