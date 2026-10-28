# Acceptance / QA checklist

## Functional
- [ ] Landing, Learn, Create, Explore, About all navigate correctly.
- [ ] Both TR and EN translations cover every visible core screen and lesson, not only navbar.
- [ ] Switching TR↔EN mid-drawing keeps scene and lesson step unchanged.
- [ ] Draw point, line segment, circle, polygon via mouse and touch.
- [ ] Move/rotate shapes where specified; undo/redo and reset function.
- [ ] Radius adjustments update actual circle geometry.
- [ ] Six-petal rosette can be built by user and verified by geometric rules.
- [ ] Incorrect rosette radius/centers produce specific hints, not false success.
- [ ] Rotation 0°, 45°, 90° displays correct geometry and correct explanations.
- [ ] Decode sample can toggle geometric layers and links to related lesson.
- [ ] Save, reload, restore draft/progress; SVG and PNG download contain the actual scene.
- [ ] Explore cards contain global traditions, with appropriate source/illustrative labels.
- [ ] No login, paywall, advertising, dead buttons, backend requirement or API key.

## Responsive / accessibility
- [ ] 390px phone portrait: usable drawing area and tools, no horizontal page overflow.
- [ ] 768px tablet: touch tools accessible and large canvas.
- [ ] 1440px desktop: tools left, canvas central, explanations right.
- [ ] Keyboard focus, labels, color contrast and reduced motion.

## Delivery
- [ ] `npm run build` succeeds with no TypeScript errors.
- [ ] Preview works; provide run instructions and list known limitations.
- [ ] If unable to implement a feature, state it explicitly rather than fake interaction.
