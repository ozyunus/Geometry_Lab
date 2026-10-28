# Product requirements — PatternLab v1

## Product statement
**PatternLab — Explore. Understand. Create. / Keşfet. Anla. Üret.**
Help people recognize the geometric primitives behind patterns, construct them hands-on, understand why constructions work, decode existing patterns, and create original geometric art.

## Audience
Beginner-friendly for roughly primary-school through high-school learners, but age-neutral UI and no hard age gates. No mandatory grade selection; use skill-based paths and optional difficulty labels. Suitable for international users, Turkish and English launch languages.

## Core learning loop
**Do → Notice → Understand → Create** (Yap → Fark Et → Anla → Üret). Do the action first, reveal short explanation at meaningful moments; optional deeper mathematical details, never compulsory.

## Top-level navigation
- Learn / Öğren: interactive skill-based learning paths
- Create / Üret: free drawing studio
- Explore / Keşfet: world geometric pattern traditions and a sample pattern-decode challenge
- About / Hakkında: purpose and appropriate cultural attribution
Language switch TR / EN always available.

## MVP scope (must work)
1. Responsive landing/dashboard for desktop/tablet/mobile.
2. Language switching across UI, lessons, feedback, accessibility labels and pattern metadata without losing work.
3. SVG-based drawing canvas with grid, zoom, pan where practical, select, point, line, circle, regular polygon, undo/redo, reset, save local and export SVG/PNG.
4. Guided 8-step circle/rosette path with at least 4 **fully functional** interactive lessons; remaining lessons can be lightweight but functional, never dead buttons. Lessons: point and circle; radius and compass; two equal circles; six-petal rosette; circle variations; rotations; geometric star; free remix.
5. Working rotation exploration: two identical centered squares, adjustable rotation 0–90°, with special explanation at 0°, 45°, 90°.
6. Guided six-petal rosette: center, radius and six equally spaced surrounding circle centers; student actually manipulates geometry and gets correctness feedback.
7. Decode a Pattern: sample eight-point star, reveal underlying squares, axes and 45° rotation; learner can toggle layers.
8. Explore gallery: curated **sample** traditions: Anatolian Seljuk, Ottoman tile work, Persian girih, Moroccan zellige, Andalusian geometric decoration, Japanese kumiko, contemporary tessellations. Label illustrations as illustrative unless provenance is verified. Do not fabricate precise dates, buildings or attributions.
9. Local progress and drawings via browser storage. No account, cloud persistence or child data collection.
10. Accessible and touch-friendly UI; works without backend or API key.

## Explicitly out of scope
Login, profiles, teacher portal, class assignment, payments, ads, social/community upload, public gallery, photo-based computer vision recognition, AI pattern interpretation, gamified leaderboards, Firebase, mandatory MEB alignment, production CMS, complex full CAD engine.

## Key flows
A) Landing → Learn → Circles → rosette lesson → do construction → why it works → optional math details → finish → free remix.
B) Landing → Explore → eight-point star → decode layers → open corresponding guided construction.
C) Landing → Create → tools → build pattern → local save → export.
D) Switch language at any point: geometry state, selected step and progress remain unchanged.

## UX principles
Desktop: persistent left tools, large canvas center, contextual right instructions. Tablet: large canvas, steps above, touch tools below. Phone: compact top progress and step, canvas prioritization, bottom tool tray, optional collapsible explanation. Friendly but not childish; avoid school/exam language.
