# Docsworn web and identity system

## Product and screen job

Docsworn turns behavioral documentation claims into Kane CLI checks and a Documentation Truth Report. The public site serves KaneCLI hackathon judges, OSS maintainers, solo developers and technical writers. Its primary job is to let a visitor enter a public GitHub repository URL and visibly experience the repository-to-report flow. It is a static demonstration using labelled captured evidence; local CLI execution remains the real audit path.

Priority viewports: 1440 px laptop, 768 px tablet and 390 px phone.

## Direction: Evidence in Focus

Owner-selected reference: [Portfolite](https://www.framer.com/marketplace/templates/portfolite/), inspected through its [live presentation](https://portfolite.framer.website/).

The page behaves like a monochrome creative portfolio for verification evidence. A centered full-viewport hero places the repository field where a portfolio would place its primary commission action. Soft silver fields frame the proposition. The truth report is treated as selected work: a readable mosaic of source-linked claims, observations and corrected language.

Supporting references:

- [Finn](https://finn.framer.media/): decisive display type and whitespace.
- [Slab](https://slabtemplate.framer.website/): precise work grid and adjacent metadata.
- Full source record: `docs/design-references/reference-notes.md`.

### Brief-specific principles

1. **The form is the hero.** A judge must see the repository field and `Run documentation check` action without scrolling.
2. **Evidence replaces imagery.** Every portfolio-like surface contains a real claim, source line, observation or deployment boundary—never decorative fake product shots.
3. **Atmosphere frames truth.** Silver blur, soft borders and rounded surfaces establish the Portfolite mood but never communicate status or obscure text.

## First screen

```text
┌ witness mark + docsworn             Report  Method  CLI  [GitHub] ┐
│                                                                  │
│               ● Documentation integrity agent                    │
│                                                                  │
│                 Put your docs                                    │
│                 on the record.                                   │
│                                                                  │
│        Find every promise. Test the product. Keep receipts.      │
│                                                                  │
│  [ https://github.com/owner/repository       ][Run doc check →]  │
│        Captured evidence disclosure · public GitHub only         │
│                                                                  │
│   README ─── Claims ─── Kane ─── Observations ─── Doc fix        │
└──────────────────────────────────────────────────────────────────┘
```

## Tokens

### Colour

Core palette:

- `--void: #050505` — page and hero background.
- `--surface: #111214` — evidence cards and controls.
- `--fog: #F1F1EE` — primary type and light section surface.
- `--smoke: #A7A8AA` — secondary type on dark.
- `--line: #303236` — dark dividers and control borders.
- `--witness: #EF5148` — original Docsworn evidence point; used sparingly.

Semantic additions:

- `--verified: #72D6A0` / dark surface `#10261C`.
- `--contradicted: #FF7A71` / dark surface `#2A1515`.
- `--uncertain: #E6BF63` / dark surface `#2A2312`.
- `--focus: #7EB0FF` — keyboard focus ring.

Status always includes visible text and a symbol. All normal text targets WCAG 2.1 AA; measured combinations must meet 4.5:1.

### Typography

- Display and body: `Arial`, `Helvetica Neue`, system sans-serif. Portfolite uses Satoshi; Docsworn does not copy or load that font.
- Evidence metadata: `ui-monospace`, `SFMono-Regular`, `Consolas`, monospace because source paths, scores and runner observations benefit from fixed-width alignment.
- Hero: clamp(3.4rem, 7vw, 6.8rem), weight 400, 0.92 line height, -0.055em tracking.
- Section title: clamp(2.25rem, 4.6vw, 4.8rem), weight 400, 0.98 line height.
- Card title: clamp(1.35rem, 2.3vw, 2rem), weight 500.
- Body: 1rem / 1.6; lead 1.05rem / 1.6; lines under 76 characters.
- Meta: 0.72–0.78rem, monospace, 0.04em tracking; uppercase only for true labels.
- Scores use tabular figures.

### Spacing, shape and elevation

- Spacing scale: 4, 8, 12, 16, 24, 32, 48, 72, 104, 144 px.
- Content width: 1320 px; desktop gutter 32 px, tablet 22 px, mobile 16 px.
- Control radius: 999 px for Portfolite-inspired high-intent actions; inputs and evidence cards use 18 px.
- Evidence-card radius: 20 px desktop, 14 px mobile.
- Borders: 1 px solid `--line`; active control border `--fog`.
- Shadow: only subtle black depth and a narrow silver inset. No floating white-card shadows.
- Z-index: header 20, skip link 100. No modal layer.

## Layout and components

- Header: dark, compact witness mark/wordmark, four anchors. At 390 px it keeps the brand and action visible; secondary links occupy a second row rather than hiding behind a menu.
- Hero: at least 760 px desktop and auto-height mobile; centered proposition, badge, lead and form. Original CSS gradients create two soft silver evidence fields behind the content.
- Repository form: a wide combined control on desktop; label remains visible to assistive technology and visually present above the field. Input and action stack under 700 px.
- Disclosure: directly under the form, explicit that captured fixture evidence is displayed and the URL is not inspected.
- Pipeline: five stages, centered near the hero floor; horizontal desktop, wrapped/stacked mobile.
- Truth report: dark section with a light summary surface, score and three counts; followed by an evidence mosaic.
- Evidence mosaic: first failed claim spans two columns, remaining claims fill a responsive two-column grid. DOM order stays linear. Each card includes status, title, source, docs statement, observed behavior and optional corrected wording.
- Method: a light section inspired by an editorial portfolio biography; clear explanation plus five verification phases.
- CLI: dark terminal surface with the exact local execution boundary.
- Footer: compact brand, status links and MIT disclosure.

Breakpoints:

- `980px`: report summary and method split collapse.
- `700px`: combined form stacks; evidence mosaic becomes one column.
- `480px`: navigation wraps, display scale tightens, cards reduce padding.

## States

- Empty: input and action are visible; report is hidden.
- Invalid: value remains, input gets `aria-invalid`, inline error explains the required GitHub format, focus returns to the input and the live region announces it without duplicate visible text.
- Loading: form uses `aria-busy`; input and button disable; the button says `Checking documentation…`; status text progresses through reading, Kane-flow generation and report assembly without layout shift.
- Success: submitted repository is echoed, report reveals, report receives focus and the action language resolves to a generated truth report.
- No JavaScript: proposition, disclosure, method and CLI remain readable; the form explains the limitation.

## Motion

- Product interaction stays quiet. No ambient looping ribbons, parallax or cursor theatre from the template.
- Hover/border transitions: 160 ms ease-out.
- Button press: `scale(0.98)` for 120 ms, only on active pointer interaction.
- Success report reveals without transform motion.
- Smooth scrolling is allowed only when reduced motion is not requested.
- `prefers-reduced-motion: reduce` removes position and scale motion while retaining immediate colour/focus feedback.
- Hover rules are gated behind `(hover: hover) and (pointer: fine)`.

## Accessibility

- `lang="en"`, skip link, semantic header/nav/main/section/article/footer, one H1 and logical heading order.
- Visible labels, 16 px minimum input text, 44 px minimum action targets.
- Focus ring is never removed and remains visible on dark and light surfaces.
- Status is expressed by symbol plus word, not colour alone.
- 390 px and 200% zoom must not create horizontal overflow.
- Decorative fields and SVGs use empty alt text or `aria-hidden="true"`.
- Keyboard order follows the DOM; successful report focus is preserved.
- Forced-colours mode remains readable without the gradient fields.

## Performance and deployment

- Static HTML, CSS, small ES module and original brand assets only.
- No Portfolite code, Framer runtime, external font, analytics or production reference imagery.
- HTML + CSS + JavaScript target: under 55 KB uncompressed.
- Abstract fields are CSS gradients and pseudo-elements; no large hero media request.
- Vercel exposes no Gemini, Anthropic or Kane credential.

## Product-specific anti-patterns

- Never imply the hosted page executed Kane or inspected the submitted repository.
- Never use portfolio imagery, invented clients, ratings, quotes, logos or adoption metrics.
- Never call captured fixture evidence a current live run.
- Never hide failed claims behind the aggregate score.
- Never copy Portfolite’s imagery, exact composition, Satoshi font assets, project names or animation code.
- Never let silver blur reduce form contrast or become a generic AI glow.
