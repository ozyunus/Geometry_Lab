# MASTER PROMPT — Paste into Google AI Studio Build

You are the senior product designer, geometry educator, frontend engineer and QA lead building **PatternLab**. Implement a working, responsive, bilingual (Turkish/English) MVP — not a landing-page-only mockup.

Read and obey all attached files: `PRODUCT_SPEC.md`, `LEARNING_CONTENT.md`, `GEOMETRY_ENGINE.md`, `I18N_CONTENT.md`, `TECH_ARCHITECTURE.md`, `QA_ACCEPTANCE.md` and `design/*`. Visual reference PNGs guide visual direction but are not pixel-perfect specifications; ignore any mockup UI suggesting accounts/profiles. Functional specs override mockups.

**Product promise:** Explore. Understand. Create. People learn geometric pattern construction by DOING first, noticing outcomes, reading a short "Why It Works" explanation, optionally exploring math details, and then making their own art. Not tied to a school curriculum or any one country. Islamic geometric art is a prominent part of the broader world gallery, including Seljuk, Ottoman, Persian, Moroccan and Andalusian examples, with culturally accurate labeling and no invented provenance. Also show other global traditions such as Japanese kumiko and modern tessellation.

**Implement these flows end-to-end:**
1. Landing with clear calls to Learn, Create, Explore.
2. Learn → interactive six-petal rosette lesson: draw/adjust circles, geometrically validate, show contextual hints and math 360°/6=60°, reveal optional deeper explanation.
3. Learn → rotation discovery: two centered identical squares with 0–90° slider; 45° creates eight evenly spaced corner directions; 0°/90° coincide.
4. Create → working SVG studio: select, point, segment, circle, regular polygon, color/stroke, undo/redo, reset, save locally, export SVG and PNG.
5. Explore → global pattern gallery → interactive eight-point-star decoder with toggled squares/axes/rotation overlay → related lesson.
6. Language switch TR/EN anywhere without loss of current drawing, progress or step.

**Responsive UI:** Desktop left tool rail, center canvas, right step/why/math panel. Tablet wide drawing area and bottom toolbar. Phone large canvas, compact progress, scrollable touch toolbar and collapsible instruction panels. Warm off-white canvas, deep teal, muted amber, sophisticated geometric illustration, high readability, not childish. See `design/`.

**Engineering:** React+TypeScript, SVG geometry model with actual math, localStorage only, no backend/login/payments/ads/analytics/API key. Do not call external AI APIs. Add a small set of geometry unit tests. Avoid fake success indicators or decorative dead controls. Use generated SVG illustrations and no unlicensed remote imagery. Accessible controls and 44px touch targets.

**Execution order:** (1) inspect references, (2) scaffold and design tokens, (3) i18n and navigation, (4) geometry engine and tests, (5) guided lessons and validation, (6) studio, (7) explore decoder/gallery, (8) local persistence/export, (9) responsive/accessibility QA, (10) run build and fix errors.

**Definition of done:** `QA_ACCEPTANCE.md` passes; provide a working preview, project source, run instructions and an honest list of limitations. If time is constrained, prioritize fully working rosette lesson, rotation lesson, studio and bilingual switch over additional static lesson cards. Do not ask for more requirements unless a true blocker exists. Start building now.
