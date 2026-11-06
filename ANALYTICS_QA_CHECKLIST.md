# PatternLab — Analytics QA & Verification Checklist

This document details the test procedures, expected outcomes, and verification methods for the PatternLab product analytics integration.

---

## 1. Test Matrix & Automated Validation Results

All automated tests are implemented in `src/services/analyticsValidator.ts` and can be executed programmatically.

| Test ID | Test Scenario | Automated | Status | Verification Details |
| :--- | :--- | :---: | :---: | :--- |
| **TC-01** | **Service Initialization** | Yes | ✅ PASSED | `AnalyticsService` initializes gracefully without uncaught exceptions when API key is missing or invalid. |
| **TC-02** | **Kids Mode Replay Isolation** | Yes | ✅ PASSED | Entering Kids mode (`setExperience('kids')`) immediately halts and prevents Session Replay. |
| **TC-03** | **Duplicate Event Prevention** | Yes | ✅ PASSED | Repeated calls to `experience_selected` or `lesson_completed` within 1.5s are deduplicated. |
| **TC-04** | **No Drawing Coordinates in Payload** | Yes | ✅ PASSED | `drawing_completed` / `drawing_started` payloads contain only count and tool names; no pixel or vertex arrays. |
| **TC-05** | **Global Kill Switch** | Yes | ✅ PASSED | Setting `VITE_POSTHOG_DISABLED="true"` or local kill switch drops all outgoing events safely. |
| **TC-06** | **Consent Granted Flow** | Manual | ✅ READY | Choosing "Kabul Et / Accept" stores consent and enables event dispatch. |
| **TC-07** | **Consent Refused Flow** | Manual | ✅ READY | Choosing "Yalnızca Zorunlu" calls `opt_out_capturing()` and stops all telemetry. |
| **TC-08** | **Adult-to-Kids Navigation** | Manual | ✅ READY | Clicking "Çocuk Odası" switches experience to `'kids'` and logs `experience_selected`. |
| **TC-09** | **Kids-to-Adult Navigation** | Manual | ✅ READY | Clicking "Normal Mod" switches experience back to `'adults'` and logs `lesson_exited`. |
| **TC-10** | **Session Replay Canvas Masking** | Manual | ✅ READY | Canvases have `ph-no-capture` CSS class. Content is blanked in replay stream. |
| **TC-11** | **Accurate Lesson Completion** | Manual | ✅ READY | `lesson_completed` only fires when all geometric requirements are met, never on simple navigation. |
| **TC-12** | **Offline Operation** | Manual | ✅ READY | Simulating offline mode in browser DevTools Network tab does not block drawing or progress saving. |
| **TC-13** | **Unhandled Error Capture** | Manual | ✅ READY | React Error Boundary catches rendering exceptions and transmits `app_error`. |
| **TC-14** | **Bilingual Event Consistency** | Manual | ✅ READY | Language property correctly mirrors TR and EN switcher without losing state. |

---

## 2. Manual Verification Walkthrough

### Step 1: Open PatternLab in Development Mode
1. Open the browser console (F12).
2. Look for the formatted tag: `%c[PatternLab Analytics]`.
3. Notice `app_opened` being recorded with default parameters.

### Step 2: Test Kids Room Isolation
1. Click the **"🌿 Çocuk Odası"** button in the navbar.
2. In the console, observe:
   * `[PatternLab Analytics] Switched to Kids experience. Session Replay forcefully stopped.`
   * `[Track] experience_selected: { experience: "kids", ... }`
3. Advance through Stage 1 -> Stage 2. Observe `step_started` and `step_completed`.
4. Click "Normal Mod". Observe `lesson_exited` and switch back to `adults`.

### Step 3: Test Feedback Submission
1. In the global footer, click **"Geri Bildirim / Feedback"** (or **"Ebeveyn Görüşü"** if in Kids Room).
2. Fill out any of the 4 optional questions.
3. Submit and verify `feedback_submitted` in the console. Notice the role is appropriately flagged.
