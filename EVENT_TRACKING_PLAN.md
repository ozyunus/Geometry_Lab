# PatternLab — Event Tracking Plan & Data Dictionary

This document defines all telemetry events, trigger conditions, and payload properties tracked across the PatternLab application.

---

## 1. Global / Common Properties

Every event captured automatically includes these sanitized baseline properties:

| Property | Type | Description | Values / Examples |
| :--- | :--- | :--- | :--- |
| `experience` | string | Current user environment | `'adults'`, `'kids'` |
| `language` | string | Interface language | `'tr'`, `'en'` |
| `app_version`| string | PatternLab build version | `'1.2.0'` |
| `timestamp` | string | ISO timestamp of event | `'2026-10-29T14:30:00.000Z'` |
| `is_return_user` | boolean | Consenting adult returning flag | `true`, `false` (omitted for kids) |
| `visit_count` | number | Count of adult sessions | `1`, `2`, `3` ... (omitted for kids) |

---

## 2. Navigation Events

### `app_opened`
* **Trigger:** Application loads on initial page mount.
* **Properties:**
  * `initial_experience`: `'adults'` or `'kids'`

### `experience_selected`
* **Trigger:** User toggles between Adults and Kids Room in the top navbar or exits Kids mode.
* **Properties:**
  * `experience`: Target mode selected (`'adults'` or `'kids'`)

### `lesson_list_viewed`
* **Trigger:** User enters the learning path or opens the Kids 20-stage room.
* **Properties:**
  * `experience`: `'adults'` or `'kids'`

---

## 3. Lesson & Curriculum Progression Events

### `lesson_started`
* **Trigger:** User opens an adult lesson or starts the kids geometry adventure.
* **Properties:**
  * `lesson_id`: e.g. `'lesson-1'`, `'kids-adventure-all'`
  * `lesson_number`: Sequential integer (1 to 8 for Adults, 1 to 20 for Kids)
  * `step_number`: Active step number
  * `total_steps`: `8` (adults) or `20` (kids)

### `step_started`
* **Trigger:** User advances to a new step or stage.
* **Properties:**
  * `lesson_id`: e.g. `'lesson-2'`, `'kids-step-4'`
  * `lesson_number`: Number of current lesson
  * `step_number`: Specific step number (1–20)
  * `total_steps`: Total steps in the journey

### `step_completed`
* **Trigger:** Successful completion of the interactive step requirement (e.g. correct radius locked, rosette petals bloomed, octagon lines completed).
* **Properties:**
  * `lesson_id`: Identifier of the lesson/step
  * `step_number`: Completed step number
  * `duration_seconds`: Active time spent on this step
  * `completion_percentage`: `Math.round((step / total) * 100)`

### `step_retry`
* **Trigger:** User clicks the "Reset / Yeniden Dene" button on a step.
* **Properties:**
  * `lesson_id`: Identifier of the retried step
  * `step_number`: Number of the retried step

### `hint_requested`
* **Trigger:** User opens the "Why It Works / Neden Çalışır?" or "Math Details / Matematik Detayları" educational tabs.
* **Properties:**
  * `lesson_id`: Lesson where explanation was requested
  * `step_number`: Step index

### `lesson_completed`
* **Trigger:** Final step of the curriculum is verified and completed.
* **Properties:**
  * `lesson_id`: `'adults-guided-curriculum'` or `'kids-adventure-all'`
  * `duration_seconds`: Total active duration
  * `completion_percentage`: `100`

### `lesson_exited`
* **Trigger:** User leaves a lesson before finishing all steps (e.g., clicks "Normal Mod" from Kids, or navigates to Studio/About).
* **Properties:**
  * `lesson_id`: Current lesson ID at exit
  * `step_number`: Last step viewed

---

## 4. Drawing Engine Interactions (Macro Only)

To preserve performance and user privacy, individual pointer movements and coordinates are **never** streamed. Only macro actions are tracked:

### `drawing_started`
* **Trigger:** Pointer pressed on canvas to begin a geometric construct.
* **Properties:**
  * `tool`: `'circle'`, `'segment'`, `'polygon'`, `'point'`
  * `lesson_id`: (optional) active lesson context

### `drawing_undo`
* **Trigger:** User clicks Undo (`handleUndo`).
* **Properties:**
  * `element_count`: Number of geometric elements remaining on canvas

### `drawing_reset`
* **Trigger:** User clears canvas (`handleReset`).
* **Properties:**
  * `element_count`: Number of elements cleared

### `drawing_completed`
* **Trigger:** User saves, exports SVG, or completes full pattern verification.
* **Properties:**
  * `tool`: `'export_svg'` or active tool
  * `element_count`: Total elements in finalized pattern

---

## 5. Application Monitoring & Feedback Events

### `app_error`
* **Trigger:** Unhandled JS error, rejected promise, or React Error Boundary catch.
* **Properties:**
  * `error_category`: `'unhandled_error'`, `'unhandled_rejection'`, `'ui_boundary'`, `'drawing_engine'`
  * `message`: Error message summary
  * `stack_summary`: Truncated stack trace (max 300 chars, no PII)
  * `affected_experience`: `'adults'` or `'kids'`

### `feedback_submitted`
* **Trigger:** User submits the feedback form.
* **Properties:**
  * `role`: `'adult'` or `'parent_or_educator'`
  * `confusing`: User feedback on confusion points (optional)
  * `enjoyed`: User feedback on enjoyable aspects (optional)
  * `improved`: Suggestions for improvements (optional)
  * `would_use_again`: `'yes'`, `'maybe'`, `'no'`
  * `lesson_context`: (optional) current lesson ID
