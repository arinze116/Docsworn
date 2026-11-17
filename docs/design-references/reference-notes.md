# Docsworn web reference notes

Research date: 2026-11-17. Scope: an interactive static judge-facing browser demo for the Docsworn CLI, deployed to Vercel. It must expose the repository-check interaction at the root URL and show real deterministic evidence without implying that Kane runs inside Vercel.

## Pinterest research

Queries inspected with the global Pinterest MCP:

- `developer tools landing page dark editorial UI`
- `software testing report dashboard UI documentation`
- `code audit report web design dashboard`
- `developer tool repository audit input form UI`
- `website audit checker form results dashboard UI`

Selected references:

1. Developer Tool Landing Page with a Dark Product Preview
   - Pinterest board: https://www.pinterest.com/oronstudio/landing-page-and-website-design/
   - Image: https://i.pinimg.com/originals/08/7e/b0/087eb009c19905394ace1048a4ced71f.png
   - Local reference: `pinterest/01_087eb009c19905394ace1048a4ced71f.jpg`
   - Useful pattern: plain-language claim first, then a large product/evidence surface. Restrained navigation and an interface preview carry more weight than feature-card repetition.
2. Incident/root-cause analysis dashboard
   - Pinterest board: https://www.pinterest.com/slavikbushko/dashboards/
   - Image: https://i.pinimg.com/originals/00/d6/c8/00d6c8fb27647ac0b82c287cae0bdde5.jpg
   - Local reference: `pinterest/02_00d6c8fb27647ac0b82c287cae0bdde5.jpg`
   - Useful pattern: narrative evidence sections—what happened, root cause, resolution—are clearer than a generic KPI grid. Status, time and provenance stay close to the incident title.
3. SEO audit report
   - Pinterest board: https://www.pinterest.com/RoyalWearStudio/digital-skills-hub/
   - Image: https://i.pinimg.com/originals/15/5d/78/155d78a62eef18ef40581ed07b40a821.png
   - Local reference: `pinterest/03_155d78a62eef18ef40581ed07b40a821.jpg`
   - Useful pattern: a compact score summary followed by grouped pass/warn/fail checks and a conclusion. Status always appears as text plus colour.
4. Repository audit input composition
   - Local reference: `pinterest/01_645362a432fb795531f946c480397425.png`
   - Discovery query: `developer tool repository audit input form UI`
   - Useful pattern: keep the single high-intent input and primary action visually inseparable in the opening product surface; place constraints immediately below the field.
5. Website checker results dashboard
   - Local reference: `pinterest/02_45fe3eef26b8e8a72c29365377fc44fc.jpg`
   - Discovery query: `website audit checker form results dashboard UI`
   - Useful pattern: preserve continuity from entered URL to result heading, then lead with a score and plain-language status groups rather than generic charts.

Pinterest search results did not expose stable individual Pin URLs for these anonymous results. Board/image metadata is recorded where the result provided it; otherwise the exact discovery query and downloaded content-addressed asset are recorded. No Pin URL is invented.

## Framer Marketplace research

Candidates inspected through their official detail page and live presentation:

1. Cursor
   - Detail: https://www.framer.com/marketplace/templates/cursor/
   - Live: https://cursorswarm.framer.website/
   - Local screenshot: `framer/cursor.png`
   - Observation: high-contrast editorial hero, monospace annotations and a large proof canvas. Strong hierarchy; the collaborative cursor theatre is visually memorable but irrelevant to Docsworn.
2. Fluxbase
   - Detail: https://www.framer.com/marketplace/templates/fluxbase/
   - Live: https://fluxbase.framer.website/
   - Local screenshot: `framer/fluxbase.png`
   - Observation: confident whitespace and a single visual gesture. Too sparse for an evidence-heavy product but useful as a reminder not to overfill the opening screen.
3. Alytics
   - Detail: https://www.framer.com/marketplace/templates/alytics/
   - Live: https://alytics.framer.website/
   - Local screenshot: `framer/alytics.png`
   - Observation: direct headline, one-sentence explanation and immediate product proof. The unsourced trust badge and floating logos are patterns to avoid.
4. Aigent
   - Detail: https://www.framer.com/marketplace/templates/aigent/
   - Live: https://aigentx.framer.website/
   - Local screenshot: `framer/aigent.png`
   - Observation: strong dark grid and split composition. The decorative particle sphere and invented customer logos dominate the product and will not be adopted.
5. AlphaOS
   - Detail: https://www.framer.com/marketplace/templates/alphaos/
   - Live: https://alphaos.framer.website/
   - Local screenshot: `framer/alphaos.png`
   - Observation: a useful split between product thesis and a concrete code artefact. Excessive pill navigation and warm gradient decoration are not needed.

## Shortlist and synthesis

- Cursor: adapt the editorial hierarchy, technical annotations and proof-canvas emphasis.
- Root-cause dashboard: adapt the evidence narrative and status/provenance adjacency.
- SEO audit report: adapt the concise score + grouped outcomes + conclusion structure.
- Repository/checker references: adapt the first-viewport input/action pairing and entered-URL-to-report continuity.

The final direction is original: a documentation “docket” on cool paper, using black ink, oath blue, verification green, warning amber and contradiction red. It combines a developer-tool opening with a report that reads like evidence, not a generic SaaS dashboard.

## Avoid

- Purple/blue AI gradients, glowing orbs and decorative particles.
- Unsourced customer logos, user counts or trust badges.
- Three interchangeable feature cards.
- Hiding limitations or presenting captured evidence as a live Kane run.
- Copying proprietary template artwork, layout, branding, code or assets.

## Copyright and licensing

Pinterest and Framer material is retained only as internal design reference. No referenced image, logo, illustration, template code or proprietary asset is used in the production site. The implementation uses original HTML/CSS and system fonts.
