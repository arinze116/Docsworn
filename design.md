# Docsworn web design system

## Product context

Docsworn is a local-first CLI that turns behavioral documentation claims into Kane CLI tests and a Documentation Truth Report. The Vercel site is an interactive static browser demo, not a hosted audit runner. Its first job is to expose the product's repository-to-report interaction at the root URL; its second is to show a real labelled captured report and route developers to the live CLI without inventing runtime capabilities.

Audience: KaneCLI hackathon judges, OSS maintainers, solo developers and technical writers. Primary device contexts: judge laptop at 1440 px, tablet at 768 px and phone at 390 px.

## Direction: the evidence docket

Emotional character: rigorous, candid and quietly memorable. The page should feel like a technical document placed under oath—cool paper, dark ink, source-line annotations, stamped statuses and concise findings. Boldness is spent on the opening statement and the truth score; everything else serves evidence readability.

Reference-informed patterns:

- Cursor: editorial headline plus a large technical proof surface.
- Incident/root-cause dashboard: observations, cause and resolution arranged as a readable narrative.
- SEO audit report: compact score summary and grouped textual statuses.
- AlphaOS: thesis and code artefact share the opening viewport.

See `docs/design-references/reference-notes.md` for the full source record.

## Layout

```text
┌──────────────────────────────────────────────────────────────┐
│ Docsworn                         Report · Method · Quickstart │
├──────────────────────────────────────────────────────────────┤
│ YOUR DOCS MADE CLAIMS.          ┌───────────────────────────┐│
│ WE BROUGHT RECEIPTS.            │ Repository URL            ││
│ short explanation               │ [github.com/owner/repo   ]││
│                                 │ [Run documentation check] ││
│                                 └───────────────────────────┘│
├──────────────────────────────────────────────────────────────┤
│ Live status → submitted repository → captured truth score   │
├──────────────────────────────────────────────────────────────┤
│ docs → claims → Kane → observations → suggested wording     │
├──────────────────────────────────────────────────────────────┤
│ Evidence docket: five source-linked claim records            │
├──────────────────────────────────────────────────────────────┤
│ Quickstart terminal                 Limits / exact status     │
└──────────────────────────────────────────────────────────────┘
```

- Content max width: 1180 px; outer gutters 24 px desktop, 16 px mobile.
- Desktop hero: 7/5 split; audit form aligns to the opening statement and stays in the first viewport.
- Claim records: single readable column, not a dense admin dashboard.
- Breakpoints: 900 px collapses hero; 640 px stacks metadata and actions.
- Body measure: 60–76 characters; evidence observations may run to 85 in monospace blocks.

## Tokens

### Colour

- `--paper: #F2F3EF` — page background, cool document stock.
- `--sheet: #FFFFFF` — report surfaces.
- `--ink: #111318` — primary text.
- `--muted: #5D625F` — secondary explanation.
- `--line: #C9CDC6` — borders and ruled separators.
- `--oath: #163A5F` — brand/action blue.
- `--verified: #176B47` / pale `#E7F4EC` — passed evidence.
- `--contradicted: #A9252E` / pale `#FBEAEC` — failed evidence.
- `--uncertain: #7A5700` / pale `#FFF3CE` — unverifiable/captured caveats.
- Focus: `#0B63CE` with 3 px outer ring. Status never relies on colour alone.

All normal text targets WCAG 2.1 AA contrast (4.5:1); large display text targets at least 3:1. Ratios are verified during browser QA, not assumed from this file.

### Typography

- Display/body: `Arial`, `Helvetica Neue`, system sans-serif. No network font dependency.
- Evidence/code: `ui-monospace`, `SFMono-Regular`, `Consolas`, monospace.
- Display: clamp(2.8rem, 7vw, 6.5rem), 0.92 line height, -0.055em tracking.
- H2: clamp(1.8rem, 3vw, 3rem), 1.0 line height, -0.035em.
- H3: 1.15rem / 1.3, -0.01em.
- Body: 1rem / 1.65; lead 1.15rem / 1.6.
- Meta/evidence labels: 0.75rem / 1.3, 0.08em uppercase.
- Numeric truth score uses tabular figures.

### Spacing and structure

- Scale: 4, 8, 12, 16, 24, 32, 48, 72, 104 px.
- Border radius: 0 for docket rules; 8 px for functional controls; 16 px for the score seal only.
- Borders: 1 px solid `--line`; key section rules 2 px solid `--ink`.
- Shadow: none on normal cards; score seal uses `0 12px 32px rgba(17,19,24,.08)`.
- Z-index: header 10; skip link 100. No modal layer.

## Components and states

- Header: wordmark, three anchor links, method action. Mobile wraps without a menu dependency.
- Hero: evidence-first statement, truthful description and the primary audit form.
- Audit form: visible label, HTTPS GitHub URL input, one primary submit button, example/validation copy and a clear disclosure that the hosted result uses captured evidence.
- Run status: a polite live region for validation/loading text; submit button is disabled and relabelled while checking.
- Truth seal: hidden until a valid submission completes; then shows the submitted repository name, score, numerator/denominator, captured-evidence warning and counts.
- Method rail: five ordered stages with arrows/text; horizontal desktop, vertical mobile.
- Claim record: status word/icon, source path/line, documented claim, Kane observation and optional suggested wording. Variants: verified, contradicted, unverifiable.
- Quickstart: selectable terminal block with command; no fake copy success interaction.
- Disclosure: clear limitation that the hosted site is static and Kane runs in the CLI.
- Footer: report, method and quick-start anchors plus the licence disclosure.

Browser demo states:

- Empty: labelled URL field and enabled submit button; result docket remains hidden.
- Invalid: input keeps its value, sets `aria-invalid`, and receives a specific inline error plus live announcement.
- Loading/disabled: button is disabled and reads `Checking documentation…`; a three-stage progress line is announced without looping animation.
- Success: result heading receives focus, the submitted repository is named, and the captured report reveals verified, contradicted and unverifiable variants.
- No-JavaScript: the product explanation, local CLI disclosure and quick-start remain readable; the form explains that JavaScript is required for the browser demo.

## Interaction and motion

- Navigation uses in-page anchors with visible focus and scroll margin.
- Links underline on hover/focus; action buttons shift colour only, 140 ms ease-out.
- The submitted result reveals without transform motion. Loading uses changing text rather than a spinner.
- No entrance animation, parallax or looping decoration. Evidence should not move.
- `prefers-reduced-motion: reduce` disables smooth scrolling and transitions.
- Hover rules are gated behind `(hover: hover) and (pointer: fine)`.

## Accessibility

- `lang="en"`, skip link, semantic header/nav/main/section/article/footer and one H1.
- Logical heading hierarchy and source order identical to visual order.
- Status includes visible words and symbols; colour is supplementary.
- Minimum 44 px targets for primary links/actions on mobile.
- Focus ring is never removed; anchored sections use `scroll-margin-top`.
- Text remains usable at 200% zoom and at 390 px without horizontal overflow.
- Decorative marks use `aria-hidden="true"`; no unnecessary ARIA.

## Performance and deployment

- Original static HTML, CSS and a small ES module only; no framework, analytics, external fonts or production images.
- Target: under 45 KB transferred before compression, excluding platform headers.
- Vercel serves only the static proof surface. No Gemini/Kane/Anthropic secret is required or exposed.
- Security headers: nosniff, frame deny, strict referrer policy and restrictive permissions policy.

## Product-specific anti-patterns

- Never imply the Vercel page can execute Kane, clone repositories or inspect the submitted URL.
- Never call captured fixture evidence a live run.
- Never make the submitted repository name look like proof that its contents were audited.
- Never hide failed claims behind an aggregate score.
- Never add synthetic customer logos, testimonials or adoption metrics.
- Never use generic AI gradients, glowing agents, glass cards or decorative dashboards.
- Never turn evidence into a dense chart when plain observations are clearer.
