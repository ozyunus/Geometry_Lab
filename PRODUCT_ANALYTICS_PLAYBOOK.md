# PatternLab — Product Analytics Playbook & Decision Framework

This playbook provides practical guidelines for the PatternLab product team, educators, and engineers on how to interpret PostHog data and make user-centric decisions.

---

## 1. Core Principles of Product Health for PatternLab

Our objective is **geometric understanding, flow, and delight**, not addictive retention or monetization. Key signals of product success include:

1. **High Step Completion with Calm Duration:** Users complete geometric steps steadily without thrashing between tools.
2. **Low Retry Rate on Foundational Steps:** The mechanical compass concepts (fixed radius, intersecting arcs) should feel natural.
3. **Productive Hint Usage:** Users checking "Why It Works" or "Math Details" reflect curiosity, not frustration.

---

## 2. Diagnosing Common Usability Struggles

### Scenario A: High Abandonment at Step 2 (Compass & Radius)
* **Metric Signal:** In the Adults Funnel, a steep drop-off between Lesson 1 and Lesson 2, or high count of `lesson_exited` on `lesson-2`.
* **Root Cause Investigation:** Step 2 introduces the manual aperture lock (85px span). If users attempt to draw before locking the compass, they receive a lock notice.
* **Actionable Fix:** Increase visual affordance on the compass lock toggle, or animate the lock button when radius reaches 85px.

### Scenario B: High Retry Count in Kids Stage 10 (Intersecting Circles)
* **Metric Signal:** In the Kids Learning Progress Dashboard, Stage 10 shows `step_retry` count significantly higher than Stage 9.
* **Root Cause Investigation:** Children might struggle locating vertex B on the circumference of the first circle.
* **Actionable Fix:** We already placed a low-opacity faint dashed guide circle from center B. If retries persist, introduce an animated pulsating compass needle showing where to drag from B.

### Scenario C: High Undo-to-Line Ratio in Geometry Studio
* **Metric Signal:** `drawing_undo` events exceed 50% of `drawing_started` events.
* **Root Cause Investigation:** Snapping tolerance might be too wide or too narrow (e.g. 15px threshold), causing accidental line attachments.
* **Actionable Fix:** Refine snap distance thresholds or provide a visual indicator ring around snapped vertices.

---

## 3. Cohort Analysis & Return Visits

### Analyzing Returning Adults
* Consenting adult return visits are grouped by `is_return_user` and `visit_count`.
* **Key Question:** Do returning users go straight to the free-form **Geometry Studio** or do they revisit advanced lessons (e.g. Seljuk 8-Point Star or Andalusian tile grids)?
* **Data Path:** Filter `experience_selected` and `drawing_started` by `is_return_user = true`.

### Aggregate Kids Progress (No Child Profiling)
* Because children are never individually fingerprinted, we analyze progress as a **cohort bell curve**:
  * Which of the 20 stages has the longest median duration?
  * How does completion trend from early stages (1–5) to complex polygons (6–12) and Islamic stars (13–20)?
  * Any sudden cliffs in completion rate highlight instructions that need simplified language.

---

## 4. Feedback Triaging Process

Feedback captured via `feedback_submitted` should be reviewed weekly:
* **"What was confusing?"**: Grouped into UX/Controls vs Mathematical explanations.
* **"What did you enjoy?"**: Guides which new geometric patterns (e.g. Girih tiles, Kumiko wood patterns, Alhambra tessellations) should be prioritized.
* **"Parent & Educator Feedback"**: Evaluated specifically for classroom or homeschooling suitability.
