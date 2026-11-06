import posthog from 'posthog-js';
import {
  AppEvent,
  BaseEventProperties,
  DrawingEvent,
  DrawingEventProperties,
  ErrorEventProperties,
  ExperienceType,
  FeedbackProperties,
  LanguageType,
  LessonEvent,
  LessonEventProperties,
  NavigationEvent,
  NavigationEventProperties,
  AnalyticsConsentState,
} from '../types/analytics';

const APP_VERSION = '1.2.0';
const CONSENT_STORAGE_KEY = 'patternlab_analytics_consent_v1';
const RETURN_VISIT_KEY = 'patternlab_anon_adult_session_v1';

class CentralizedAnalyticsService {
  private initialized = false;
  private posthogKey: string = '';
  private posthogHost: string = 'https://eu.i.posthog.com';
  private isGloballyDisabled: boolean = false;
  private currentExperience: ExperienceType = 'adults';
  private currentLanguage: LanguageType = 'tr';
  private recentEvents = new Map<string, number>();
  private readonly DEDUP_WINDOW_MS = 1500;

  // In-memory debug log for QA and verification (max 100 entries)
  private debugLog: Array<{ event: string; properties: Record<string, unknown>; timestamp: number }> = [];

  constructor() {
    this.readEnvConfig();
  }

  private readEnvConfig() {
    try {
      this.posthogKey = (import.meta.env.VITE_POSTHOG_KEY || '').trim();
      this.posthogHost = (import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com').trim();
      const disableEnv = (import.meta.env.VITE_POSTHOG_DISABLED || '').toString().toLowerCase();
      this.isGloballyDisabled = disableEnv === 'true' || disableEnv === '1';
    } catch {
      // In case of non-Vite or test execution
      this.posthogKey = '';
      this.posthogHost = 'https://eu.i.posthog.com';
      this.isGloballyDisabled = false;
    }
  }

  /**
   * Initialize the Analytics Service.
   * Safe to call multiple times (idempotent).
   */
  public init(initialLang: LanguageType = 'tr') {
    if (this.initialized) return;
    this.currentLanguage = initialLang;

    // Check localStorage kill switch
    try {
      const localDisabled = localStorage.getItem('patternlab_analytics_disabled');
      if (localDisabled === 'true') {
        this.isGloballyDisabled = true;
      }
    } catch {
      // ignore
    }

    if (this.isGloballyDisabled) {
      this.logDev('Analytics globally disabled by configuration or user preference.');
      this.initialized = true;
      return;
    }

    if (!this.posthogKey) {
      this.logDev('PostHog API Key not provided. Running in safe local inspection mode.');
      this.initialized = true;
      this.setupGlobalErrorListeners();
      return;
    }

    try {
      posthog.init(this.posthogKey, {
        api_host: this.posthogHost,
        autocapture: false,
        capture_pageview: false,
        capture_pageleave: false,
        disable_session_recording: true, // Replay strictly disabled by default
        disable_surveys: false,
        persistence: 'localStorage',
        sanitize_properties: (properties) => {
          // Extra safety check: strip drawing buffers or base64 if accidentally attached
          const cleanProps = { ...properties };
          for (const k of Object.keys(cleanProps)) {
            if (typeof cleanProps[k] === 'string' && (cleanProps[k] as string).length > 1000) {
              cleanProps[k] = '[TRUNCATED_FOR_PRIVACY]';
            }
          }
          return cleanProps;
        },
        loaded: (ph) => {
          this.logDev('PostHog successfully initialized.');
          const consent = this.getConsent();
          if (!consent.analyticsGranted) {
            ph.opt_out_capturing();
          } else {
            ph.opt_in_capturing();
          }
        },
      });

      this.initialized = true;
      this.setupGlobalErrorListeners();
    } catch (err) {
      console.warn('[Analytics] PostHog initialization failed gracefully:', err);
      this.initialized = true;
    }
  }

  /**
   * Set the active experience ('adults' | 'kids').
   * CRITICAL: If switching to 'kids', Session Replay is IMMEDIATELY terminated.
   */
  public setExperience(experience: ExperienceType) {
    const prev = this.currentExperience;
    this.currentExperience = experience;

    if (experience === 'kids') {
      this.stopSessionReplay();
      this.logDev('Switched to Kids experience. Session Replay forcefully stopped.');
    } else if (prev === 'kids' && experience === 'adults') {
      // When returning to adults, only resume replay if adult user gave explicit consent
      const consent = this.getConsent();
      if (consent.sessionReplayGranted) {
        this.startSessionReplay();
      }
    }
  }

  public setLanguage(lang: LanguageType) {
    this.currentLanguage = lang;
  }

  public getExperience(): ExperienceType {
    return this.currentExperience;
  }

  public getLanguage(): LanguageType {
    return this.currentLanguage;
  }

  // --- Consent & Privacy Management ---

  public getConsent(): AnalyticsConsentState {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore
    }
    return {
      hasAnswered: false,
      analyticsGranted: false,
      sessionReplayGranted: false,
    };
  }

  public setConsent(analyticsGranted: boolean, sessionReplayGranted: boolean) {
    try {
      const state: AnalyticsConsentState = {
        hasAnswered: true,
        analyticsGranted,
        sessionReplayGranted: analyticsGranted && sessionReplayGranted,
        answeredAt: new Date().toISOString(),
      };
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(state));

      if (analyticsGranted) {
        posthog.opt_in_capturing?.();
        if (state.sessionReplayGranted && this.currentExperience === 'adults') {
          this.startSessionReplay();
        } else {
          this.stopSessionReplay();
        }
      } else {
        this.stopSessionReplay();
        posthog.opt_out_capturing?.();
      }
      this.logDev('Consent updated:', state);
    } catch (err) {
      console.warn('[Analytics] Failed to persist consent state:', err);
    }
  }

  public setGlobalKillswitch(disabled: boolean) {
    this.isGloballyDisabled = disabled;
    try {
      localStorage.setItem('patternlab_analytics_disabled', disabled ? 'true' : 'false');
      if (disabled) {
        posthog.opt_out_capturing?.();
        this.stopSessionReplay();
      }
    } catch {
      // ignore
    }
    this.logDev(`Global analytics killswitch set to: ${disabled}`);
  }

  public isEnabled(): boolean {
    if (this.isGloballyDisabled) return false;
    const consent = this.getConsent();
    // In dev without explicit answer we permit local debugging, but in production we require consent
    return !this.isGloballyDisabled && (consent.hasAnswered ? consent.analyticsGranted : false);
  }

  // --- Session Replay Isolation (Adults Only) ---

  public startSessionReplay() {
    if (this.isGloballyDisabled) return;
    if (this.currentExperience === 'kids') {
      this.logDev('Session Replay blocked: Kids experience active.');
      return;
    }
    const consent = this.getConsent();
    if (!consent.sessionReplayGranted) {
      this.logDev('Session Replay blocked: Consent not granted.');
      return;
    }

    try {
      if (posthog.startSessionRecording) {
        posthog.startSessionRecording();
        this.logDev('Session Replay started for adult session.');
      }
    } catch (err) {
      console.warn('[Analytics] Failed to start session recording:', err);
    }
  }

  public stopSessionReplay() {
    try {
      if (posthog.stopSessionRecording) {
        posthog.stopSessionRecording();
        this.logDev('Session Replay stopped.');
      }
    } catch (err) {
      console.warn('[Analytics] Failed to stop session recording:', err);
    }
  }

  // --- Privacy-Conscious Return Visit Counter (Adults Only) ---

  private getAdultReturnVisitMetrics(): { isReturn: boolean; count: number } {
    // Return visit tracking is NEVER used for kids
    if (this.currentExperience === 'kids') {
      return { isReturn: false, count: 1 };
    }

    try {
      const stored = localStorage.getItem(RETURN_VISIT_KEY);
      const now = Date.now();
      const ONE_DAY = 24 * 60 * 60 * 1000;

      if (stored) {
        const parsed = JSON.parse(stored);
        const lastVisit = parsed.lastVisit || now;
        let count = parsed.count || 1;

        // If last visit was more than 12 hours ago, increment visit count
        if (now - lastVisit > ONE_DAY / 2) {
          count += 1;
          localStorage.setItem(RETURN_VISIT_KEY, JSON.stringify({ count, lastVisit: now }));
        }
        return { isReturn: count > 1, count };
      } else {
        localStorage.setItem(RETURN_VISIT_KEY, JSON.stringify({ count: 1, lastVisit: now }));
        return { isReturn: false, count: 1 };
      }
    } catch {
      return { isReturn: false, count: 1 };
    }
  }

  // --- Deduplication Helper ---

  private isDuplicate(eventKey: string): boolean {
    const now = Date.now();
    const lastTime = this.recentEvents.get(eventKey);
    if (lastTime && now - lastTime < this.DEDUP_WINDOW_MS) {
      return true;
    }
    this.recentEvents.set(eventKey, now);

    // Garbage collect old keys
    if (this.recentEvents.size > 200) {
      for (const [k, time] of this.recentEvents.entries()) {
        if (now - time > 10000) this.recentEvents.delete(k);
      }
    }
    return false;
  }

  // --- Generic Safe Dispatcher ---

  private captureEvent(eventName: AppEvent, properties: Record<string, unknown>) {
    if (this.isGloballyDisabled) return;

    const returnMetrics = this.getAdultReturnVisitMetrics();

    const enrichedProperties = {
      ...properties,
      app_version: APP_VERSION,
      experience: this.currentExperience,
      language: this.currentLanguage,
      is_return_user: this.currentExperience === 'adults' ? returnMetrics.isReturn : undefined,
      visit_count: this.currentExperience === 'adults' ? returnMetrics.count : undefined,
      timestamp: new Date().toISOString(),
    };

    // Store in debug log
    this.debugLog.push({
      event: eventName,
      properties: enrichedProperties,
      timestamp: Date.now(),
    });
    if (this.debugLog.length > 100) this.debugLog.shift();

    this.logDev(`[Track] ${eventName}:`, enrichedProperties);

    try {
      if (this.posthogKey && posthog.__loaded) {
        posthog.capture(eventName, enrichedProperties);
      }
    } catch (err) {
      console.warn(`[Analytics] Failed to capture event "${eventName}":`, err);
    }
  }

  // --- Public Tracking APIs ---

  public trackAppOpened() {
    this.captureEvent('app_opened', {
      initial_experience: this.currentExperience,
    });
  }

  public trackExperienceSelected(targetExperience: ExperienceType) {
    const dedupKey = `exp_${targetExperience}`;
    if (this.isDuplicate(dedupKey)) return;

    this.setExperience(targetExperience);
    this.captureEvent('experience_selected', {
      experience: targetExperience,
    });
  }

  public trackLessonListViewed(experience: ExperienceType = this.currentExperience) {
    const dedupKey = `list_${experience}`;
    if (this.isDuplicate(dedupKey)) return;

    this.captureEvent('lesson_list_viewed', {
      experience,
    });
  }

  public trackLessonStarted(props: Omit<LessonEventProperties, 'app_version' | 'language' | 'experience'>) {
    const dedupKey = `start_${props.lesson_id}_${props.step_number || 1}`;
    if (this.isDuplicate(dedupKey)) return;

    this.captureEvent('lesson_started', {
      ...props,
      step_number: props.step_number || 1,
    });
  }

  public trackLessonCompleted(props: Omit<LessonEventProperties, 'app_version' | 'language' | 'experience'>) {
    const dedupKey = `complete_${props.lesson_id}_${props.step_number || 1}`;
    if (this.isDuplicate(dedupKey)) return;

    this.captureEvent('lesson_completed', {
      ...props,
      completion_percentage: 100,
    });
  }

  public trackLessonExited(props: Omit<LessonEventProperties, 'app_version' | 'language' | 'experience'>) {
    this.captureEvent('lesson_exited', props);
  }

  public trackStepStarted(props: Omit<LessonEventProperties, 'app_version' | 'language' | 'experience'>) {
    const dedupKey = `step_start_${props.lesson_id}_${props.step_number}`;
    if (this.isDuplicate(dedupKey)) return;

    this.captureEvent('step_started', props);
  }

  public trackStepCompleted(props: Omit<LessonEventProperties, 'app_version' | 'language' | 'experience'>) {
    const dedupKey = `step_complete_${props.lesson_id}_${props.step_number}`;
    if (this.isDuplicate(dedupKey)) return;

    this.captureEvent('step_completed', props);
  }

  public trackHintRequested(props: Omit<LessonEventProperties, 'app_version' | 'language' | 'experience'>) {
    this.captureEvent('hint_requested', props);
  }

  public trackStepRetry(props: Omit<LessonEventProperties, 'app_version' | 'language' | 'experience'>) {
    this.captureEvent('step_retry', props);
  }

  // --- Drawing Interactions (Macro Actions Only) ---

  public trackDrawingStarted(props?: { tool?: string; lesson_id?: string; step_number?: number }) {
    const dedupKey = `draw_start_${this.currentExperience}_${props?.tool || 'default'}`;
    if (this.isDuplicate(dedupKey)) return;

    this.captureEvent('drawing_started', {
      tool: props?.tool,
      lesson_id: props?.lesson_id,
      step_number: props?.step_number,
    });
  }

  public trackDrawingReset(props?: { element_count?: number; lesson_id?: string; step_number?: number }) {
    this.captureEvent('drawing_reset', {
      element_count: props?.element_count,
      lesson_id: props?.lesson_id,
      step_number: props?.step_number,
    });
  }

  public trackDrawingUndo(props?: { element_count?: number; lesson_id?: string; step_number?: number }) {
    this.captureEvent('drawing_undo', {
      element_count: props?.element_count,
      lesson_id: props?.lesson_id,
      step_number: props?.step_number,
    });
  }

  public trackDrawingCompleted(props?: { element_count?: number; lesson_id?: string; step_number?: number; tool?: string }) {
    this.captureEvent('drawing_completed', {
      element_count: props?.element_count,
      tool: props?.tool,
      lesson_id: props?.lesson_id,
      step_number: props?.step_number,
    });
  }

  // --- Feedback ---

  public trackFeedback(props: Omit<FeedbackProperties, 'app_version' | 'language' | 'experience'>) {
    this.captureEvent('feedback_submitted', {
      ...props,
      experience: this.currentExperience,
      language: this.currentLanguage,
    });
  }

  // --- Error Tracking ---

  public trackError(props: ErrorEventProperties) {
    const dedupKey = `err_${props.error_category}_${props.message.slice(0, 50)}`;
    if (this.isDuplicate(dedupKey)) return;

    this.captureEvent('app_error', {
      ...props,
      affected_experience: props.affected_experience || this.currentExperience,
      language: this.currentLanguage,
    });
  }

  private setupGlobalErrorListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('error', (event: ErrorEvent) => {
      this.trackError({
        error_category: 'unhandled_error',
        message: event.message || 'Unknown window error',
        stack_summary: event.error?.stack?.slice(0, 300),
        affected_experience: this.currentExperience,
      });
    });

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      let message = 'Unhandled promise rejection';
      let stack = '';
      if (event.reason instanceof Error) {
        message = event.reason.message;
        stack = event.reason.stack || '';
      } else if (typeof event.reason === 'string') {
        message = event.reason;
      }

      this.trackError({
        error_category: 'unhandled_rejection',
        message,
        stack_summary: stack.slice(0, 300),
        affected_experience: this.currentExperience,
      });
    });
  }

  // --- Inspection & Debugging for QA ---

  public getDebugLog() {
    return [...this.debugLog];
  }

  public clearDebugLog() {
    this.debugLog = [];
  }

  private logDev(...args: unknown[]) {
    if (import.meta.env.DEV) {
      console.log('%c[PatternLab Analytics]', 'color: #087D86; font-weight: bold;', ...args);
    }
  }
}

export const analytics = new CentralizedAnalyticsService();
export default analytics;
