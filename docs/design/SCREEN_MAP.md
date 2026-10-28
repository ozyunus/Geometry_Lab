# Screen map and responsive requirements

1. `/` Home — hero with "Geometry Shapes the World" / "Geometri Dünyayı Şekillendirir"; four paths: Learn Geometry, Create Patterns, Explore World Art, Understand Deeper. No fake avatar.
2. `/learn` — skill-based paths, not mandatory grade. Progress stored locally.
3. `/learn/circles/rosette` — actual editable circles, progress steps, tool palette, Do/Why/Math tabs; success only after geometry checks.
4. `/learn/rotation` — live square rotation demo and causal explanations.
5. `/create` — unrestricted geometric studio, local save and export.
6. `/explore` — global traditions gallery, filters by technique/region, illustration attribution.
7. `/explore/eight-point-star` — toggle geometry layers, 45° rotation and reconstruct.
8. `/about` — learning philosophy and local-data privacy.

### Layout by viewport
- Desktop 1440: nav across top, left navigation/tool rail 170–220px, canvas fills remaining central space, right contextual panel 250–330px.
- Tablet 768: top compact header, canvas occupies most vertical area, bottom tool rail, step panel collapsible.
- Mobile 390: 44px controls, fixed/accessible tool tray, no horizontal overflow, canvas min-height ~300px, instructions collapsible; do not hide math explanations behind unavailable hover states.

### Visual content
Show real geometric lines, construction points, guides, intersections, star and rosette; use SVG for crisp rendering. Cards may use generated vector patterns, not third-party image hotlinks.
