# PatternLab — Product Analytics Implementation Guide

This document describes the technical architecture, configuration, and privacy protections implemented for PostHog product analytics in **PatternLab**.

---

## 1. Architectural Overview

PatternLab's analytics layer is designed with strict **separation of concerns**:
* **Zero UI Disruption:** Analytics failures never interrupt the user's drawing or learning flow. All calls are wrapped in non-blocking try/catch routines.
* **Centralized Analytics Service (`src/services/analytics.ts`):** All telemetry, events, errors, and session recordings are funneled through a single, type-safe singleton (`analytics`).
* **Framework Agnostic Data Layer:** The core geometric engine (`src/geometry/`) remains completely untouched by tracking code.
* **No PII & No Sensitive Canvas Tracking:** We never capture names, emails, IPs, student identifiers, or raw canvas coordinate streams.

```
                    ┌────────────────────────┐
                    │    React UI & Canvas   │
                    │   (PatternLab App)     │
                    └───────────┬────────────┘
                                │
                    ┌───────────▼────────────┐
                    │ Centralized Analytics  │
                    │   Service & Shield     │
                    │ (src/services/         │
                    │   analytics.ts)        │
                    └─────┬────────────┬─────┘
                          │            │
            ┌─────────────▼────┐  ┌────▼─────────────┐
            │  PostHog Cloud   │  │ Local Dev Memory │
            │  SDK Dispatch    │  │ Inspection & QA  │
            └──────────────────┘  └──────────────────┘
```

---

## 2. Environment Configuration

The application uses Vite environment variables:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `VITE_POSTHOG_KEY` | PostHog Project API Key | `phc_...` (or empty for local safe mode) |
| `VITE_POSTHOG_HOST` | PostHog Ingestion Host | `https://eu.i.posthog.com` |
| `VITE_POSTHOG_DISABLED`| Global killswitch | `false` (set to `true` to disable globally) |

### Setup Instructions
1. Copy `.env.example` to `.env` (or configure in your deployment hosting, e.g., Vercel / Cloud Run).
2. Set your `VITE_POSTHOG_KEY` obtained from PostHog Project Settings -> Project Variables.
3. If no key is set, PatternLab runs in **Safe Inspection Mode**: all calls print structured debug logs to the browser console without failing.

---

## 3. Privacy & Compliance (COPPA, GDPR & Student Protection)

PatternLab contains experiences suitable for both adults and young children. To uphold the highest privacy standards:

1. **Explicit Separation of Kids Experience:**
   * **Session Replay is strictly prohibited and forcefully stopped** when the user enters the Kids Room (`setExperience('kids')`).
   * No persistent identification cookies or tokens are created for children.
   * Return visit counters are exclusively maintained for consenting adult sessions.
2. **Opt-in & Granular Consent (`AnalyticsConsentBanner.tsx`):**
   * Tracking starts in an opted-out state.
   * Users can accept product analytics, customize permissions, or select "Essential Only" (complete opt-out).
   * Session Replay requires separate explicit consent and is only activated for adults.
3. **Canvas Content Masking:**
   * All drawing canvases and SVG interaction zones carry the `ph-no-capture` CSS class to ensure drawing strokes and tracing images are masked from session recordings.
4. **No Raw Coordinates in Events:**
   * Drawing events only send macro metadata (`action`, `tool`, `element_count`), never coordinate arrays or pixel data.

---

## 4. Error Tracking Architecture

1. **Global Unhandled Error Listeners:** Captures `window.onerror` and `window.onunhandledrejection` with truncated, privacy-safe stack traces.
2. **React Error Boundary (`src/components/common/ErrorBoundary.tsx`):** Protects the main learning and drawing canvas areas. If a rendering error occurs, it catches the exception, logs `app_error` with the affected experience context, and presents a recovery button so the user doesn't lose their state.

---

## 5. Global Killswitch & Emergency Disabling

Analytics can be disabled globally at any moment via three mechanisms:
1. **Environment Flag:** Set `VITE_POSTHOG_DISABLED="true"`.
2. **Local Storage Kill Switch:** Execute `localStorage.setItem('patternlab_analytics_disabled', 'true')` or invoke `analytics.setGlobalKillswitch(true)`.
3. **UI Consent Settings:** Click "Yalnızca Zorunlu / Essential Only" in the consent dialog.
