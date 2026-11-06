# PatternLab — PostHog Dashboard & Funnel Configuration Guide

This guide provides instructions for configuring dashboards, insights, and funnels in PostHog for PatternLab.

---

## Dashboard 1: PatternLab — Product Health

**Purpose:** Executive and operational overview of overall application adoption, stability, and engagement.

### Insight 1: Daily & Weekly Active Users (DAU / WAU)
* **Insight Type:** Trends
* **Event:** `app_opened`
* **Aggregation:** Unique users (`Distinct IDs`)
* **Interval:** Day / Week
* **Display:** Line chart

### Insight 2: Adults vs. Kids Experience Distribution
* **Insight Type:** Trends
* **Event:** `experience_selected`
* **Breakdown by:** `experience` (`adults` vs `kids`)
* **Aggregation:** Total count
* **Display:** Donut / Bar chart

### Insight 3: Lesson Starts vs. Completions
* **Insight Type:** Trends
* **Series A:** `lesson_started` (Total count)
* **Series B:** `lesson_completed` (Total count)
* **Formula:** `(B / A) * 100` (Overall Completion Rate %)
* **Display:** Line chart + Value card

### Insight 4: Average Lesson Duration
* **Insight Type:** Trends
* **Event:** `step_completed`
* **Aggregation:** Median / Average of `duration_seconds`
* **Breakdown by:** `lesson_id`
* **Display:** Bar chart

### Insight 5: Drop-Off & Abandonment
* **Insight Type:** Trends
* **Event:** `lesson_exited`
* **Breakdown by:** `lesson_id`
* **Sort:** Descending count to find highest abandonment lessons

### Insight 6: Return Visits (Adults Retention)
* **Insight Type:** Retention
* **Starting Event:** `app_opened` where `experience = 'adults'`
* **Returning Event:** `app_opened` where `is_return_user = true`
* **Interval:** 1 week

### Insight 7: System Stability & Error Rate
* **Insight Type:** Trends
* **Event:** `app_error`
* **Breakdown by:** `error_category`
* **Filter:** Group by `affected_experience`
* **Display:** Stacked area chart

---

## Dashboard 2: PatternLab — Kids Learning Progress

**Purpose:** Aggregate diagnostic view across the 20 Kids Geometry Adventure stages to identify pedagogical friction without tracking individual children.

### Insight 1: 20-Stage Completion Overview
* **Insight Type:** Trends / Bar Chart
* **Event:** `step_completed` where `experience = 'kids'`
* **Breakdown by:** `step_number` (1 to 20)
* **Sort:** Numerical order (1 -> 20)

### Insight 2: High Retry Steps (Friction Points)
* **Insight Type:** Trends
* **Event:** `step_retry` where `experience = 'kids'`
* **Breakdown by:** `step_number`
* **Alert Trigger:** Any step where retry count > 2x average (e.g. Stage 10 intersecting circles or Stage 17 Andalusian star)

### Insight 3: Stage Duration Heatmap
* **Insight Type:** Trends
* **Event:** `step_completed` where `experience = 'kids'`
* **Aggregation:** Average of `duration_seconds`
* **Breakdown by:** `step_number`

### Insight 4: Undo & Reset Activity in Kids Room
* **Insight Type:** Trends
* **Series A:** `drawing_undo`
* **Series B:** `drawing_reset`
* **Filter:** `experience = 'kids'`

---

## 3. Funnel Analysis Configurations

### Funnel 1: Adults Curriculum Funnel
* **Steps:**
  1. `app_opened`
  2. `experience_selected` (`experience = 'adults'`)
  3. `lesson_started`
  4. `lesson_completed`
* **Conversion Window:** 30 minutes

### Funnel 2: Kids Adventure Funnel
* **Steps:**
  1. `app_opened`
  2. `experience_selected` (`experience = 'kids'`)
  3. `step_started` (`step_number = 1`)
  4. `step_completed` (`step_number = 20`)
* **Conversion Window:** 60 minutes

### Funnel 3: Sequential Progression Funnels
* Example: `kids-step-1 completed` -> `kids-step-2 completed` -> `kids-step-3 completed` ...
* **Limitation Note:** Some users explore non-linearly or return in subsequent sessions. For nonlinear usage, inspect step completion totals rather than rigid single-session funnels.

---

## 4. Alerting & Notification Setup

In PostHog -> Alerts (available with PostHog Cloud or Slack/Webhook integrations):

1. **Critical JavaScript Error Spike:**
   * Condition: Count of `app_error` > 10 in 15 minutes.
   * Target: Slack / Email notification.
2. **Pedagogical Blocker (Low Completion):**
   * Condition: Step retry rate on any single step exceeds 40% over 50 attempts.
   * Action: Review step instructions and guide visual contrast in `KidsAdventureView.tsx`.
