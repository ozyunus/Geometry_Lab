/**
 * PatternLab Kids Room Session & Persistence Storage
 * 
 * Guarantees that no progress, drawn lines, or custom settings are lost
 * when navigating between views, switching modes, or reloading.
 */

export interface DrawnLine {
  id: string;
  from: string;
  to: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width?: number;
}

export interface StepDrawingState {
  drawnLines: DrawnLine[];
  undoStack: DrawnLine[][];
  dot1?: { x: number; y: number; color: string } | null;
  lineCompleted?: boolean;
  circleRadius?: number;
  circleCompleted?: boolean;
  circle2Radius?: number;
  circle2Completed?: boolean;
  petals3Count?: number;
  petals6Count?: number;
  bloomedPetals3?: number[];
  bloomedPetals6?: number[];
  isCompleted?: boolean;
}

export type ThemeMode = 'natural' | 'high-contrast' | 'vibrant' | 'night';
export type TextSizeMode = 'normal' | 'large' | 'xlarge'; // normal: 1rem, large: 1.18rem, xlarge: 1.35rem (75+ elderly)

export interface KidsSessionData {
  step: number;
  stars: number;
  activeColor: string;
  customColors: string[];
  strokeWidth: number;
  themeMode: ThemeMode;
  textSizeMode: TextSizeMode;
  sfxEnabled: boolean;
  bgMusicEnabled: boolean;
  tourCompleted: boolean;
  stepDrawings: Record<number, StepDrawingState>;
}

const STORAGE_KEY = 'patternlab_kids_session_v4';

export const DEFAULT_CALM_COLORS = [
  '#3A6B5C', // Forest Sage
  '#D4A373', // Warm Terracotta
  '#5A7184', // Slate Denim
  '#8C6D9E', // Soft Heather
  '#BC6C25', // Amber Ochre
  '#283618', // Deep Olive
  '#087D86', // Persian Teal
  '#C0392B', // Rich Carmine
];

const DEFAULT_SESSION: KidsSessionData = {
  step: 1,
  stars: 0,
  activeColor: '#3A6B5C',
  customColors: [],
  strokeWidth: 5,
  themeMode: 'natural',
  textSizeMode: 'normal',
  sfxEnabled: true,
  bgMusicEnabled: false,
  tourCompleted: false,
  stepDrawings: {},
};

// Validate that a step's lines actually belong to that step's geometry
const stepPrefixMap: Record<number, string> = {
  3: 't',
  4: 's',
  5: 'a',
  6: 'p',
  7: 'h',
  8: 'o',
  13: 'st',
  14: 'd',
  15: 'sq',
  16: 'sel',
  17: 'an',
  18: 'g',
  19: 'km',
  20: 'r',
};

function sanitizeStepDrawings(rawDrawings: Record<number, StepDrawingState>): Record<number, StepDrawingState> {
  const sanitized: Record<number, StepDrawingState> = {};
  for (const [stepStr, state] of Object.entries(rawDrawings)) {
    const stepNum = Number(stepStr);
    const prefix = stepPrefixMap[stepNum];

    let validLines = state.drawnLines || [];
    if (prefix) {
      validLines = validLines.filter(
        (l) => l.from && l.to && l.from.startsWith(prefix) && l.to.startsWith(prefix)
      );
    }

    sanitized[stepNum] = {
      ...state,
      drawnLines: validLines,
      undoStack: state.undoStack || [],
    };
  }
  return sanitized;
}

class KidsStorageService {
  private cache: KidsSessionData | null = null;

  public loadSession(): KidsSessionData {
    if (this.cache) return this.cache;

    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      // Migrate from v2 if v3 is not yet created
      if (!raw) {
        raw = localStorage.getItem('patternlab_kids_session_v2');
      }

      if (raw) {
        const parsed = JSON.parse(raw);
        const cleanedDrawings = sanitizeStepDrawings(parsed.stepDrawings || {});
        const loaded: KidsSessionData = {
          ...DEFAULT_SESSION,
          ...parsed,
          stepDrawings: cleanedDrawings,
          customColors: Array.isArray(parsed.customColors) ? parsed.customColors : [],
        };
        this.cache = loaded;
        return loaded;
      }
    } catch {
      // fallback
    }

    const fallback: KidsSessionData = { ...DEFAULT_SESSION };
    this.cache = fallback;
    return fallback;
  }

  public saveSession(data: Partial<KidsSessionData>): KidsSessionData {
    const current = this.loadSession();
    const updated: KidsSessionData = {
      ...current,
      ...data,
      stepDrawings: sanitizeStepDrawings({
        ...current.stepDrawings,
        ...(data.stepDrawings || {}),
      }),
    };

    this.cache = updated;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // storage full or private mode
    }

    return updated;
  }

  public getStepState(stepNumber: number): StepDrawingState {
    const session = this.loadSession();
    return session.stepDrawings[stepNumber] || {
      drawnLines: [],
      undoStack: [],
    };
  }

  public resetAllProgress(): KidsSessionData {
    this.cache = { ...DEFAULT_SESSION };
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('patternlab_kids_session_v2');
    } catch {}
    return this.cache;
  }
}

export const kidsStorage = new KidsStorageService();
export default kidsStorage;
