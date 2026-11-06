/**
 * PatternLab - Product Analytics Event Types & Schemas
 * Strictly anonymous, GDPR/COPPA privacy compliant.
 */

export type ExperienceType = 'adults' | 'kids';
export type LanguageType = 'tr' | 'en';

export type NavigationEvent = 'app_opened' | 'experience_selected' | 'lesson_list_viewed';

export type LessonEvent =
  | 'lesson_started'
  | 'lesson_completed'
  | 'lesson_exited'
  | 'step_started'
  | 'step_completed'
  | 'hint_requested'
  | 'step_retry';

export type DrawingEvent =
  | 'drawing_started'
  | 'drawing_reset'
  | 'drawing_undo'
  | 'drawing_completed';

export type AppEvent = NavigationEvent | LessonEvent | DrawingEvent | 'app_error' | 'feedback_submitted';

export interface BaseEventProperties {
  experience: ExperienceType;
  language: LanguageType;
  app_version: string;
  is_return_user?: boolean;
  visit_count?: number;
  timestamp?: string;
  [key: string]: unknown;
}

export interface NavigationEventProperties {
  experience: ExperienceType;
  language: LanguageType;
  app_version: string;
  previous_view?: string;
  target_view?: string;
}

export interface LessonEventProperties {
  experience: ExperienceType;
  language: LanguageType;
  app_version: string;
  lesson_id: string;
  lesson_number: number;
  step_number?: number;
  total_steps: number;
  duration_seconds?: number;
  completion_percentage?: number;
  is_final_step?: boolean;
}

export interface DrawingEventProperties {
  experience: ExperienceType;
  language: LanguageType;
  app_version: string;
  tool?: string;
  element_count?: number;
  lesson_id?: string;
  step_number?: number;
}

export interface ErrorEventProperties {
  error_category: 'unhandled_error' | 'unhandled_rejection' | 'drawing_engine' | 'lesson_engine' | 'ui_boundary';
  message: string;
  stack_summary?: string;
  affected_experience?: ExperienceType | 'global';
  lesson_id?: string;
  step_number?: number;
  language?: LanguageType;
  app_version?: string;
}

export interface FeedbackProperties {
  experience: ExperienceType;
  language: LanguageType;
  app_version: string;
  role: 'adult' | 'parent_or_educator';
  confusing?: string;
  enjoyed?: string;
  improved?: string;
  would_use_again?: string;
  lesson_context?: string;
}

export interface AnalyticsConsentState {
  hasAnswered: boolean;
  analyticsGranted: boolean;
  sessionReplayGranted: boolean;
  answeredAt?: string;
}
