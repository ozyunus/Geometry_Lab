# Technical architecture / deployment assumptions

Preferred Google AI Studio Build deliverable: React + TypeScript + Vite single-page responsive web app; SVG geometry canvas; plain CSS/CSS modules or Tailwind if available; minimal dependencies. No backend, no API key, no AI calls required. Avoid heavy canvas/CAD packages unless necessary. Browser localStorage for settings, progress and scenes. Include npm scripts `dev`, `build`, `test` (if tests implemented).

Suggested modules: `src/components/layout`, `src/components/studio`, `src/components/lesson`, `src/components/explore`, `src/geometry`, `src/i18n`, `src/content`, `src/storage`, `src/styles`. Routes: `/`, `/learn`, `/learn/circles/rosette`, `/learn/rotation`, `/create`, `/explore`, `/explore/eight-point-star`, `/about`.

Use semantic HTML, keyboard navigation, WCAG-friendly contrast, visible focus states, descriptive icon labels, reduced-motion support. On mobile keep drawing surface large; toolbar horizontal scroll if needed. Add responsive breakpoints around 640 and 1024px; verify actual viewport widths 390, 768, 1440. Use public-domain/self-created SVG pattern illustrations rather than scraped or unlicensed historic images. Any sample artwork needs provenance notes. No tracking or public user content. Include privacy copy explaining local-only saves; users can clear browser data.

Keep geometry engine testable with pure functions and stable IDs. Unit tests should cover rotatePoint, distance, approximateEqual, validateRosette, undo/redo. Include clear README run steps and limitations.
