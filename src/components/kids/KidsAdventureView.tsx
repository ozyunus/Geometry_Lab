import React, { useState, useRef, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Star,
  ArrowRight,
  ArrowLeft,
  RefreshCcw,
  Smile,
  CheckCircle,
  Undo2,
  Sliders,
  Volume2,
  VolumeX,
  Music,
  HelpCircle,
  Award,
} from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { ActiveView } from '../layout/Navbar';
import analytics from '../../services/analytics';
import soundEffects from '../../services/soundEffects';
import kidsStorage, {
  DrawnLine,
  StepDrawingState,
  ThemeMode,
  TextSizeMode,
} from '../../services/kidsStorage';
import { ExitConfirmModal } from './ExitConfirmModal';
import { KidsOnboardingTour } from './KidsOnboardingTour';
import { ThemeStyleTweaker } from './ThemeStyleTweaker';
import { ColorPaletteBuilder } from './ColorPaletteBuilder';

interface KidsAdventureProps {
  onReturn: () => void;
  onNavigate: (view: ActiveView) => void;
}

export const KidsAdventureView: React.FC<KidsAdventureProps> = ({ onReturn }) => {
  const { lang } = useI18n();
  const isTr = lang === 'tr';

  // Load persistent session on mount
  const initialSession = kidsStorage.loadSession();

  const [step, setStep] = useState<number>(initialSession.step || 1);
  const [stars, setStars] = useState<number>(initialSession.stars || 0);
  const [activeColor, setActiveColor] = useState<string>(initialSession.activeColor || '#3A6B5C');
  const [customColors, setCustomColors] = useState<string[]>(initialSession.customColors || []);
  const [strokeWidth, setStrokeWidth] = useState<number>(initialSession.strokeWidth || 5);

  // Appearance & Accessibility Modes
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialSession.themeMode || 'natural');
  const [textSizeMode, setTextSizeMode] = useState<TextSizeMode>(initialSession.textSizeMode || 'normal');
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(initialSession.sfxEnabled ?? true);
  const [bgMusicEnabled, setBgMusicEnabled] = useState<boolean>(initialSession.bgMusicEnabled ?? false);

  // Modals & Panels
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isOnboardingTourOpen, setIsOnboardingTourOpen] = useState(!initialSession.tourCompleted);
  const [isThemeTweakerOpen, setIsThemeTweakerOpen] = useState(false);

  // Step duration timer
  const stepStartTimeRef = useRef<number>(Date.now());

  // Step drawings map: strictly isolated per stage
  const [stepDrawings, setStepDrawings] = useState<Record<number, StepDrawingState>>(
    () => initialSession.stepDrawings || {}
  );

  // Current Step State (Derived directly by step ID)
  const currentStepState: StepDrawingState = stepDrawings[step] || {
    drawnLines: [],
    undoStack: [],
  };

  // Helper to update current step's drawing state and persist immediately
  const updateCurrentStepState = (updater: (prev: StepDrawingState) => StepDrawingState) => {
    setStepDrawings((prevMap) => {
      const existing = prevMap[step] || { drawnLines: [], undoStack: [] };
      const nextState = updater(existing);
      const updatedMap = { ...prevMap, [step]: nextState };
      kidsStorage.saveSession({ stepDrawings: updatedMap });
      return updatedMap;
    });
  };

  // SVG Ref for exact coordinate conversion
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Transient drag states (for in-flight line drawing)
  const [activeStart, setActiveStart] = useState<string | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);

  // STEP 2 drag state
  const lineStart = { x: 100, y: 200 };
  const lineEnd = { x: 300, y: 200 };
  const [isDrawingLine2, setIsDrawingLine2] = useState(false);
  const [currentLine2Drag, setCurrentLine2Drag] = useState<{ x: number; y: number } | null>(null);

  // STEP 9 & 10 circle drag states
  const [isDrawingCircle9, setIsDrawingCircle9] = useState(false);
  const [isDrawingCircle10, setIsDrawingCircle10] = useState(false);

  // Auto-advance celebration overlay & countdown
  const [celebrationCountdown, setCelebrationCountdown] = useState<number | null>(null);

  // Persist general session data
  useEffect(() => {
    kidsStorage.saveSession({
      step,
      stars,
      activeColor,
      customColors,
      strokeWidth,
      themeMode,
      textSizeMode,
      sfxEnabled,
      bgMusicEnabled,
    });
  }, [step, stars, activeColor, customColors, strokeWidth, themeMode, textSizeMode, sfxEnabled, bgMusicEnabled]);

  // Track step view on mount & step changes
  useEffect(() => {
    stepStartTimeRef.current = Date.now();

    analytics.trackLessonListViewed('kids');
    analytics.trackStepStarted({
      lesson_id: `kids-step-${step}`,
      lesson_number: step,
      step_number: step,
      total_steps: 20,
    });

    if (step === 1) {
      analytics.trackLessonStarted({
        lesson_id: 'kids-adventure-all',
        lesson_number: 1,
        step_number: 1,
        total_steps: 20,
      });
    }
  }, [step]);

  // Sync audio service
  useEffect(() => {
    soundEffects.setSfxEnabled(sfxEnabled);
  }, [sfxEnabled]);

  useEffect(() => {
    soundEffects.setBgMusicEnabled(bgMusicEnabled);
    return () => {
      soundEffects.stopAmbientMusic();
    };
  }, [bgMusicEnabled]);

  // Trigger celebration confetti
  const triggerConfetti = (particleCount = 50) => {
    confetti({
      particleCount,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3A6B5C', '#D4A373', '#5A7184', '#8C6D9E', '#E63946'],
    });
  };

  // 1:1 SVG coordinate converter
  const getSvgCoordinates = (e: React.PointerEvent<Element>, viewBoxSize = 400) => {
    if (!svgRef.current) return { x: viewBoxSize / 2, y: viewBoxSize / 2 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(((e.clientX - rect.left) / rect.width) * viewBoxSize, 0), viewBoxSize);
    const y = Math.min(Math.max(((e.clientY - rect.top) / rect.height) * viewBoxSize, 0), viewBoxSize);
    return { x, y };
  };

  // Generous touch hit-testing (48px threshold)
  const findClosestVertex = <T extends { id: string; x: number; y: number }>(
    coords: { x: number; y: number },
    vertices: T[],
    threshold = 48
  ) => {
    for (const v of vertices) {
      if (Math.hypot(coords.x - v.x, coords.y - v.y) <= threshold) {
        return v;
      }
    }
    return null;
  };

  // Sorted unique edge key (e.g. ['a', 'b'].sort().join('-'))
  const getEdgeKey = (id1: string, id2: string) => [id1, id2].sort().join('-');

  // Step 11: 3 Petal Guide Points
  const petalGuidePoints3 = [
    { id: 0, ang: -90, x: 200, y: 115, label: '1' },
    { id: 1, ang: 30, x: Math.round(200 + 85 * Math.cos((30 * Math.PI) / 180)), y: Math.round(200 + 85 * Math.sin((30 * Math.PI) / 180)), label: '2' },
    { id: 2, ang: 150, x: Math.round(200 + 85 * Math.cos((150 * Math.PI) / 180)), y: Math.round(200 + 85 * Math.sin((150 * Math.PI) / 180)), label: '3' },
  ];
  const bloomedPetals3 = currentStepState.bloomedPetals3 || [];

  // Step 12: 6 Petal Guide Points
  const petalGuidePoints6 = [
    { id: 0, ang: -90, label: '1' },
    { id: 1, ang: -30, label: '2' },
    { id: 2, ang: 30, label: '3' },
    { id: 3, ang: 90, label: '4' },
    { id: 4, ang: 150, label: '5' },
    { id: 5, ang: 210, label: '6' },
  ].map((p) => ({
    ...p,
    x: Math.round(200 + 85 * Math.cos((p.ang * Math.PI) / 180)),
    y: Math.round(200 + 85 * Math.sin((p.ang * Math.PI) / 180)),
  }));
  const bloomedPetals6 = currentStepState.bloomedPetals6 || [];

  // Navigation handlers
  const handleNext = () => {
    setCelebrationCountdown(null);

    const duration = Math.max(1, Math.round((Date.now() - stepStartTimeRef.current) / 1000));
    analytics.trackStepCompleted({
      lesson_id: `kids-step-${step}`,
      lesson_number: step,
      step_number: step,
      total_steps: 20,
      duration_seconds: duration,
      completion_percentage: Math.round((step / 20) * 100),
    });

    if (step === 20) {
      soundEffects.playCrownFanfare();
      triggerConfetti(120);
      analytics.trackLessonCompleted({
        lesson_id: 'kids-adventure-all',
        lesson_number: 20,
        step_number: 20,
        total_steps: 20,
        completion_percentage: 100,
      });
    } else {
      soundEffects.playStepSuccess();
      triggerConfetti(50);
    }

    setActiveStart(null);
    setDragCurrent(null);
    setStep((s) => Math.min(s + 1, 20));
  };

  const handlePrev = () => {
    soundEffects.playUndo();
    setCelebrationCountdown(null);
    setActiveStart(null);
    setDragCurrent(null);
    setStep((s) => Math.max(s - 1, 1));
  };

  // Robust undo handling
  const handleUndo = () => {
    soundEffects.playUndo();
    setCelebrationCountdown(null);

    if (currentStepState.drawnLines && currentStepState.drawnLines.length > 0) {
      updateCurrentStepState((prev) => ({
        ...prev,
        drawnLines: prev.drawnLines.slice(0, -1),
      }));
      return;
    }

    if (step === 1 && currentStepState.dot1) {
      updateCurrentStepState((prev) => ({ ...prev, dot1: null }));
      return;
    }
    if (step === 2 && currentStepState.lineCompleted) {
      updateCurrentStepState((prev) => ({ ...prev, lineCompleted: false }));
      return;
    }
    if (step === 9 && currentStepState.circleCompleted) {
      updateCurrentStepState((prev) => ({ ...prev, circleCompleted: false, circleRadius: 0 }));
      return;
    }
    if (step === 10 && currentStepState.circle2Completed) {
      updateCurrentStepState((prev) => ({ ...prev, circle2Completed: false, circle2Radius: 0 }));
      return;
    }
    if (step === 11 && bloomedPetals3.length > 0) {
      updateCurrentStepState((prev) => ({
        ...prev,
        bloomedPetals3: (prev.bloomedPetals3 || []).slice(0, -1),
        petals3Count: Math.max((prev.bloomedPetals3?.length || 1) - 1, 0),
      }));
      return;
    }
    if (step === 12 && bloomedPetals6.length > 0) {
      updateCurrentStepState((prev) => ({
        ...prev,
        bloomedPetals6: (prev.bloomedPetals6 || []).slice(0, -1),
        petals6Count: Math.max((prev.bloomedPetals6?.length || 1) - 1, 0),
      }));
      return;
    }

    if (step > 1) {
      setStep((s) => s - 1);
    }
  };

  // Reset current step
  const handleResetCurrentStep = () => {
    soundEffects.playUndo();
    setCelebrationCountdown(null);
    updateCurrentStepState(() => ({
      drawnLines: [],
      undoStack: [],
      dot1: null,
      lineCompleted: false,
      circleRadius: 0,
      circleCompleted: false,
      circle2Radius: 0,
      circle2Completed: false,
      petals3Count: 0,
      petals6Count: 0,
      bloomedPetals3: [],
      bloomedPetals6: [],
    }));
    setActiveStart(null);
    setDragCurrent(null);
  };

  // Reset all progress across all 20 stages (clean restart)
  const handleResetAllProgress = () => {
    soundEffects.playUndo();
    kidsStorage.resetAllProgress();
    setStep(1);
    setStars(0);
    setStepDrawings({});
    setCelebrationCountdown(null);
    setActiveStart(null);
    setDragCurrent(null);
  };

  const handleConfirmExit = () => {
    setIsExitModalOpen(false);
    analytics.trackLessonExited({
      lesson_id: `kids-step-${step}`,
      lesson_number: step,
      step_number: step,
      total_steps: 20,
    });
    onReturn();
  };

  // Stage configurations for geometric figures
  const getStageConfig = () => {
    switch (step) {
      case 3: // Triangle
        return {
          vertices: [
            { id: 't1', x: 200, y: 70, label: 'A' },
            { id: 't2', x: 80, y: 290, label: 'B' },
            { id: 't3', x: 320, y: 290, label: 'C' },
          ],
          edges: [getEdgeKey('t1', 't2'), getEdgeKey('t2', 't3'), getEdgeKey('t1', 't3')],
          polygonSvg: (
            <polygon
              points="200,70 80,290 320,290"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="3.5"
              strokeDasharray="6 6"
              opacity="0.6"
            />
          ),
        };
      case 4: // Square
        return {
          vertices: [
            { id: 's1', x: 110, y: 100, label: 'A' },
            { id: 's2', x: 290, y: 100, label: 'B' },
            { id: 's3', x: 290, y: 280, label: 'C' },
            { id: 's4', x: 110, y: 280, label: 'D' },
          ],
          edges: [getEdgeKey('s1', 's2'), getEdgeKey('s2', 's3'), getEdgeKey('s3', 's4'), getEdgeKey('s1', 's4')],
          polygonSvg: (
            <rect
              x="110"
              y="100"
              width="180"
              height="180"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="3.5"
              strokeDasharray="6 6"
              rx="6"
              opacity="0.6"
            />
          ),
        };
      case 5: // Right Angle 90°
        return {
          vertices: [
            { id: 'a1', x: 100, y: 100, label: 'A' },
            { id: 'a2', x: 100, y: 280, label: 'B' },
            { id: 'a3', x: 280, y: 280, label: 'C' },
          ],
          edges: [getEdgeKey('a1', 'a2'), getEdgeKey('a2', 'a3')],
          polygonSvg: (
            <polyline
              points="100,100 100,280 280,280"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="3.5"
              strokeDasharray="6 6"
              opacity="0.6"
            />
          ),
        };
      case 6: // Pentagon (5 sides)
        return {
          vertices: Array.from({ length: 5 }).map((_, i) => {
            const ang = (i * 72 - 90) * (Math.PI / 180);
            return {
              id: `p${i + 1}`,
              x: Math.round(200 + 115 * Math.cos(ang)),
              y: Math.round(200 + 115 * Math.sin(ang)),
              label: `${i + 1}`,
            };
          }),
          edges: [
            getEdgeKey('p1', 'p2'),
            getEdgeKey('p2', 'p3'),
            getEdgeKey('p3', 'p4'),
            getEdgeKey('p4', 'p5'),
            getEdgeKey('p1', 'p5'),
          ],
          polygonSvg: (
            <polygon
              points={Array.from({ length: 5 })
                .map((_, i) => {
                  const ang = (i * 72 - 90) * (Math.PI / 180);
                  return `${Math.round(200 + 115 * Math.cos(ang))},${Math.round(200 + 115 * Math.sin(ang))}`;
                })
                .join(' ')}
              fill="none"
              stroke="#94A3B8"
              strokeWidth="3"
              strokeDasharray="6 6"
              opacity="0.6"
            />
          ),
        };
      case 7: // Hexagon (6 sides)
        return {
          vertices: Array.from({ length: 6 }).map((_, i) => {
            const ang = (i * 60 - 90) * (Math.PI / 180);
            return {
              id: `h${i + 1}`,
              x: Math.round(200 + 115 * Math.cos(ang)),
              y: Math.round(200 + 115 * Math.sin(ang)),
              label: `${i + 1}`,
            };
          }),
          edges: [
            getEdgeKey('h1', 'h2'),
            getEdgeKey('h2', 'h3'),
            getEdgeKey('h3', 'h4'),
            getEdgeKey('h4', 'h5'),
            getEdgeKey('h5', 'h6'),
            getEdgeKey('h1', 'h6'),
          ],
          polygonSvg: (
            <polygon
              points={Array.from({ length: 6 })
                .map((_, i) => {
                  const ang = (i * 60 - 90) * (Math.PI / 180);
                  return `${Math.round(200 + 115 * Math.cos(ang))},${Math.round(200 + 115 * Math.sin(ang))}`;
                })
                .join(' ')}
              fill="none"
              stroke="#94A3B8"
              strokeWidth="3"
              strokeDasharray="6 6"
              opacity="0.6"
            />
          ),
        };
      case 8: // Octagon (8 sides)
        return {
          vertices: Array.from({ length: 8 }).map((_, i) => {
            const ang = (i * 45 - 90) * (Math.PI / 180);
            return {
              id: `o${i + 1}`,
              x: Math.round(200 + 115 * Math.cos(ang)),
              y: Math.round(200 + 115 * Math.sin(ang)),
              label: `${i + 1}`,
            };
          }),
          edges: [
            getEdgeKey('o1', 'o2'),
            getEdgeKey('o2', 'o3'),
            getEdgeKey('o3', 'o4'),
            getEdgeKey('o4', 'o5'),
            getEdgeKey('o5', 'o6'),
            getEdgeKey('o6', 'o7'),
            getEdgeKey('o7', 'o8'),
            getEdgeKey('o1', 'o8'),
          ],
          polygonSvg: (
            <polygon
              points={Array.from({ length: 8 })
                .map((_, i) => {
                  const ang = (i * 45 - 90) * (Math.PI / 180);
                  return `${Math.round(200 + 115 * Math.cos(ang))},${Math.round(200 + 115 * Math.sin(ang))}`;
                })
                .join(' ')}
              fill="none"
              stroke="#94A3B8"
              strokeWidth="3"
              strokeDasharray="6 6"
              opacity="0.6"
            />
          ),
        };
      case 13: // Hexagram Star (6 lines)
        return {
          vertices: Array.from({ length: 6 }).map((_, i) => {
            const ang = (i * 60 - 90) * (Math.PI / 180);
            return {
              id: `st${i + 1}`,
              x: Math.round(200 + 115 * Math.cos(ang)),
              y: Math.round(200 + 115 * Math.sin(ang)),
              label: `${i + 1}`,
            };
          }),
          edges: [
            getEdgeKey('st1', 'st3'),
            getEdgeKey('st3', 'st5'),
            getEdgeKey('st1', 'st5'),
            getEdgeKey('st2', 'st4'),
            getEdgeKey('st4', 'st6'),
            getEdgeKey('st2', 'st6'),
          ],
          polygonSvg: (
            <g opacity="0.6">
              <polygon points="200,85 300,258 100,258" fill="none" stroke="#94A3B8" strokeWidth="3" strokeDasharray="6 6" />
              <polygon points="200,315 100,142 300,142" fill="none" stroke="#94A3B8" strokeWidth="3" strokeDasharray="6 6" />
            </g>
          ),
        };
      case 14: // Rhombus Diamond
        return {
          vertices: [
            { id: 'd1', x: 200, y: 70, label: 'A' },
            { id: 'd2', x: 320, y: 200, label: 'B' },
            { id: 'd3', x: 200, y: 330, label: 'C' },
            { id: 'd4', x: 80, y: 200, label: 'D' },
          ],
          edges: [getEdgeKey('d1', 'd2'), getEdgeKey('d2', 'd3'), getEdgeKey('d3', 'd4'), getEdgeKey('d1', 'd4')],
          polygonSvg: (
            <polygon
              points="200,70 320,200 200,330 80,200"
              fill="none"
              stroke="#94A3B8"
              strokeWidth="3"
              strokeDasharray="6 6"
              opacity="0.6"
            />
          ),
        };
      case 15: // Seljuk Double Squares (Foundation Skeleton)
        return {
          vertices: [
            { id: 'sqa1', x: 120, y: 120, label: 'A' },
            { id: 'sqa2', x: 280, y: 120, label: 'B' },
            { id: 'sqa3', x: 280, y: 280, label: 'C' },
            { id: 'sqa4', x: 120, y: 280, label: 'D' },
            { id: 'sqb1', x: 200, y: 87, label: 'E' },
            { id: 'sqb2', x: 313, y: 200, label: 'F' },
            { id: 'sqb3', x: 200, y: 313, label: 'G' },
            { id: 'sqb4', x: 87, y: 200, label: 'H' },
          ],
          edges: [
            getEdgeKey('sqa1', 'sqa2'),
            getEdgeKey('sqa2', 'sqa3'),
            getEdgeKey('sqa3', 'sqa4'),
            getEdgeKey('sqa1', 'sqa4'),
            getEdgeKey('sqb1', 'sqb2'),
            getEdgeKey('sqb2', 'sqb3'),
            getEdgeKey('sqb3', 'sqb4'),
            getEdgeKey('sqb1', 'sqb4'),
          ],
          polygonSvg: (
            <g opacity="0.6">
              <rect x="120" y="120" width="160" height="160" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeDasharray="5 5" />
              <rect
                x="120"
                y="120"
                width="160"
                height="160"
                transform="rotate(45 200 200)"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="2.5"
                strokeDasharray="5 5"
              />
            </g>
          ),
        };
      case 16: {
        // True Seljuk 8-Point Star Motif (Octagram 8/3 rays connecting the 8 tips)
        const selVertices = Array.from({ length: 8 }).map((_, i) => {
          const ang = (i * 45 - 90) * (Math.PI / 180);
          return {
            id: `sel${i + 1}`,
            x: Math.round(200 + 118 * Math.cos(ang)),
            y: Math.round(200 + 118 * Math.sin(ang)),
            label: `${i + 1}`,
          };
        });
        const starPairs: [string, string][] = [
          ['sel1', 'sel4'],
          ['sel4', 'sel7'],
          ['sel7', 'sel2'],
          ['sel2', 'sel5'],
          ['sel5', 'sel8'],
          ['sel8', 'sel3'],
          ['sel3', 'sel6'],
          ['sel6', 'sel1'],
        ];
        return {
          vertices: selVertices,
          edges: starPairs.map(([a, b]) => getEdgeKey(a, b)),
          polygonSvg: (
            <g opacity="0.6">
              {starPairs.map(([fromId, toId], idx) => {
                const v1 = selVertices.find((v) => v.id === fromId)!;
                const v2 = selVertices.find((v) => v.id === toId)!;
                return (
                  <line
                    key={idx}
                    x1={v1.x}
                    y1={v1.y}
                    x2={v2.x}
                    y2={v2.y}
                    stroke="#94A3B8"
                    strokeWidth="2.5"
                    strokeDasharray="5 5"
                  />
                );
              })}
            </g>
          ),
        };
      }
      case 17: {
        // Andalusian Star Tile Grid (Guide lines now 100% MATCH the exact edges)
        const anVertices = [
          { id: 'an1', x: 200, y: 85, label: '1' },
          { id: 'an2', x: 315, y: 200, label: '2' },
          { id: 'an3', x: 200, y: 315, label: '3' },
          { id: 'an4', x: 85, y: 200, label: '4' },
          { id: 'an5', x: 135, y: 135, label: '5' },
          { id: 'an6', x: 265, y: 135, label: '6' },
          { id: 'an7', x: 265, y: 265, label: '7' },
          { id: 'an8', x: 135, y: 265, label: '8' },
        ];
        const anEdges: [string, string][] = [
          ['an1', 'an6'],
          ['an6', 'an2'],
          ['an2', 'an7'],
          ['an7', 'an3'],
          ['an3', 'an8'],
          ['an8', 'an4'],
          ['an4', 'an5'],
          ['an5', 'an1'],
        ];
        return {
          vertices: anVertices,
          edges: anEdges.map(([a, b]) => getEdgeKey(a, b)),
          polygonSvg: (
            <g opacity="0.6">
              {anEdges.map(([fromId, toId], idx) => {
                const v1 = anVertices.find((v) => v.id === fromId)!;
                const v2 = anVertices.find((v) => v.id === toId)!;
                return (
                  <line
                    key={idx}
                    x1={v1.x}
                    y1={v1.y}
                    x2={v2.x}
                    y2={v2.y}
                    stroke="#94A3B8"
                    strokeWidth="3"
                    strokeDasharray="6 6"
                  />
                );
              })}
            </g>
          ),
        };
      }
      case 18: {
        // Persian Girih Pentagram Star (Fixed sorted edge keys & clear sequence guidance)
        const gVertices = Array.from({ length: 5 }).map((_, i) => {
          const ang = (i * 72 - 90) * (Math.PI / 180);
          return {
            id: `g${i + 1}`,
            x: Math.round(200 + 115 * Math.cos(ang)),
            y: Math.round(200 + 115 * Math.sin(ang)),
            label: `${i + 1}`,
          };
        });
        const gEdges: [string, string][] = [
          ['g1', 'g3'],
          ['g3', 'g5'],
          ['g5', 'g2'],
          ['g2', 'g4'],
          ['g4', 'g1'],
        ];
        return {
          vertices: gVertices,
          // CRITICAL: every edge is generated through getEdgeKey so string ordering matches!
          edges: gEdges.map(([a, b]) => getEdgeKey(a, b)),
          polygonSvg: (
            <g opacity="0.6">
              {gEdges.map(([fromId, toId], idx) => {
                const v1 = gVertices.find((v) => v.id === fromId)!;
                const v2 = gVertices.find((v) => v.id === toId)!;
                return (
                  <line
                    key={idx}
                    x1={v1.x}
                    y1={v1.y}
                    x2={v2.x}
                    y2={v2.y}
                    stroke="#94A3B8"
                    strokeWidth="3"
                    strokeDasharray="6 6"
                  />
                );
              })}
            </g>
          ),
        };
      }
      case 19: {
        // Kumiko Asanoha Hemp Leaf: Center C and 6 outer vertices
        const kmVertices = [
          { id: 'km0', x: 200, y: 200, label: 'C' },
          ...Array.from({ length: 6 }).map((_, i) => {
            const ang = (i * 60 - 90) * (Math.PI / 180);
            return {
              id: `km${i + 1}`,
              x: Math.round(200 + 115 * Math.cos(ang)),
              y: Math.round(200 + 115 * Math.sin(ang)),
              label: `${i + 1}`,
            };
          }),
        ];
        const outerKm = kmVertices.slice(1);
        return {
          vertices: kmVertices,
          edges: [
            getEdgeKey('km0', 'km1'),
            getEdgeKey('km0', 'km2'),
            getEdgeKey('km0', 'km3'),
            getEdgeKey('km0', 'km4'),
            getEdgeKey('km0', 'km5'),
            getEdgeKey('km0', 'km6'),
            getEdgeKey('km1', 'km2'),
            getEdgeKey('km2', 'km3'),
            getEdgeKey('km3', 'km4'),
            getEdgeKey('km4', 'km5'),
            getEdgeKey('km5', 'km6'),
            getEdgeKey('km1', 'km6'),
          ],
          polygonSvg: (
            <g opacity="0.6">
              {/* Outer hexagon guide matching exactly vertices 1..6 */}
              <polygon
                points={outerKm.map((v) => `${v.x},${v.y}`).join(' ')}
                fill="none"
                stroke="#94A3B8"
                strokeWidth="2.5"
                strokeDasharray="5 5"
              />
              {/* 6 radial spokes from center C to each vertex 1..6 */}
              {outerKm.map((v) => (
                <line
                  key={`km-spoke-${v.id}`}
                  x1="200"
                  y1="200"
                  x2={v.x}
                  y2={v.y}
                  stroke="#94A3B8"
                  strokeWidth="2.5"
                  strokeDasharray="5 5"
                />
              ))}
            </g>
          ),
        };
      }
      case 20: {
        // Royal 12-Point Crown Star (4 intersecting equilateral triangles)
        const rVertices = Array.from({ length: 12 }).map((_, i) => {
          const ang = (i * 30 - 90) * (Math.PI / 180);
          return {
            id: `r${i + 1}`,
            x: Math.round(200 + 120 * Math.cos(ang)),
            y: Math.round(200 + 120 * Math.sin(ang)),
            label: `${i + 1}`,
          };
        });

        const triangleGroups = [
          ['r1', 'r5', 'r9'],
          ['r2', 'r6', 'r10'],
          ['r3', 'r7', 'r11'],
          ['r4', 'r8', 'r12'],
        ];

        return {
          vertices: rVertices,
          edges: [
            getEdgeKey('r1', 'r5'),
            getEdgeKey('r5', 'r9'),
            getEdgeKey('r1', 'r9'),
            getEdgeKey('r2', 'r6'),
            getEdgeKey('r6', 'r10'),
            getEdgeKey('r2', 'r10'),
            getEdgeKey('r3', 'r7'),
            getEdgeKey('r7', 'r11'),
            getEdgeKey('r3', 'r11'),
            getEdgeKey('r4', 'r8'),
            getEdgeKey('r8', 'r12'),
            getEdgeKey('r4', 'r12'),
          ],
          polygonSvg: (
            <g opacity="0.6">
              {/* Outer guide circle */}
              <circle
                cx="200"
                cy="200"
                r="120"
                fill="none"
                stroke="#94A3B8"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              {/* 4 dashed guide triangles for the 12-point royal star */}
              {triangleGroups.map((group, tIdx) => {
                const pts = group
                  .map((id) => {
                    const v = rVertices.find((item) => item.id === id)!;
                    return `${v.x},${v.y}`;
                  })
                  .join(' ');
                return (
                  <polygon
                    key={`tri-guide-${tIdx}`}
                    points={pts}
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="2.5"
                    strokeDasharray="5 5"
                  />
                );
              })}
            </g>
          ),
        };
      }
      default:
        return null;
    }
  };

  const stageCfg = getStageConfig();

  // STRICT ISOLATION: Only render lines that belong strictly to the current stage's valid edges!
  const drawnLines = stageCfg
    ? (currentStepState.drawnLines || []).filter((line) => {
        const key = getEdgeKey(line.from, line.to);
        return stageCfg.edges.includes(key);
      })
    : currentStepState.drawnLines || [];

  // Step 18 guided next move
  const step18Sequence = [
    { from: 'g1', to: 'g3', fromLabel: '1', toLabel: '3' },
    { from: 'g3', to: 'g5', fromLabel: '3', toLabel: '5' },
    { from: 'g5', to: 'g2', fromLabel: '5', toLabel: '2' },
    { from: 'g2', to: 'g4', fromLabel: '2', toLabel: '4' },
    { from: 'g4', to: 'g1', fromLabel: '4', toLabel: '1' },
  ];
  const nextStep18Move =
    step === 18
      ? step18Sequence.find((seq) => !drawnLines.some((l) => getEdgeKey(l.from, l.to) === getEdgeKey(seq.from, seq.to)))
      : null;

  // Step 20 guided next move (4 equilateral triangles: 1-5-9, 2-6-10, 3-7-11, 4-8-12)
  const step20Sequence = [
    { from: 'r1', to: 'r5', fromLabel: '1', toLabel: '5', group: isTr ? '1. Üçgen' : 'Triangle 1' },
    { from: 'r5', to: 'r9', fromLabel: '5', toLabel: '9', group: isTr ? '1. Üçgen' : 'Triangle 1' },
    { from: 'r9', to: 'r1', fromLabel: '9', toLabel: '1', group: isTr ? '1. Üçgen' : 'Triangle 1' },
    { from: 'r2', to: 'r6', fromLabel: '2', toLabel: '6', group: isTr ? '2. Üçgen' : 'Triangle 2' },
    { from: 'r6', to: 'r10', fromLabel: '6', toLabel: '10', group: isTr ? '2. Üçgen' : 'Triangle 2' },
    { from: 'r10', to: 'r2', fromLabel: '10', toLabel: '2', group: isTr ? '2. Üçgen' : 'Triangle 2' },
    { from: 'r3', to: 'r7', fromLabel: '3', toLabel: '7', group: isTr ? '3. Üçgen' : 'Triangle 3' },
    { from: 'r7', to: 'r11', fromLabel: '7', toLabel: '11', group: isTr ? '3. Üçgen' : 'Triangle 3' },
    { from: 'r11', to: 'r3', fromLabel: '11', toLabel: '3', group: isTr ? '3. Üçgen' : 'Triangle 3' },
    { from: 'r4', to: 'r8', fromLabel: '4', toLabel: '8', group: isTr ? '4. Üçgen' : 'Triangle 4' },
    { from: 'r8', to: 'r12', fromLabel: '8', toLabel: '12', group: isTr ? '4. Üçgen' : 'Triangle 4' },
    { from: 'r12', to: 'r4', fromLabel: '12', toLabel: '4', group: isTr ? '4. Üçgen' : 'Triangle 4' },
  ];
  const nextStep20Move =
    step === 20
      ? step20Sequence.find((seq) => !drawnLines.some((l) => getEdgeKey(l.from, l.to) === getEdgeKey(seq.from, seq.to)))
      : null;

  // Determine stage completion accurately
  const isCurrentStepReadyToAdvance = Boolean(
    (step === 1 && currentStepState.dot1) ||
      (step === 2 && currentStepState.lineCompleted) ||
      (step === 9 && currentStepState.circleCompleted) ||
      (step === 10 && currentStepState.circle2Completed) ||
      (step === 11 && (bloomedPetals3.length >= 3 || (currentStepState.petals3Count ?? 0) >= 3)) ||
      (step === 12 && (bloomedPetals6.length >= 6 || (currentStepState.petals6Count ?? 0) >= 6)) ||
      (stageCfg && drawnLines.length >= stageCfg.edges.length)
  );

  // Trigger celebration and auto-advance exclusively when user actively completes a step
  const triggerStepCompletionCelebration = (completedStep: number) => {
    if (completedStep === 20) {
      soundEffects.playCrownFanfare();
      triggerConfetti(120);
      setCelebrationCountdown(null);
    } else {
      soundEffects.playStepSuccess();
      soundEffects.playStarSparkle();
      triggerConfetti(60);
      setCelebrationCountdown(3);
    }
  };

  // Countdown timer for auto-advance
  useEffect(() => {
    if (celebrationCountdown === null) return;
    if (celebrationCountdown <= 0) {
      setCelebrationCountdown(null);
      handleNext();
      return;
    }
    const timer = window.setTimeout(() => {
      setCelebrationCountdown((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [celebrationCountdown]);

  // Dynamic Theme Styling Classes
  const getThemeContainerClass = () => {
    switch (themeMode) {
      case 'high-contrast':
        return 'bg-white text-black border-4 border-black';
      case 'vibrant':
        return 'bg-amber-50/60 text-slate-900 border-2 border-amber-300';
      case 'night':
        return 'bg-slate-900 text-slate-100 border-2 border-slate-700';
      default:
        return 'bg-white text-slate-900 border border-slate-200';
    }
  };

  const getCanvasBgClass = () => {
    switch (themeMode) {
      case 'high-contrast':
        return 'bg-white border-4 border-black shadow-none';
      case 'night':
        return 'bg-slate-950 border-2 border-slate-700 shadow-inner';
      case 'vibrant':
        return 'bg-white border-2 border-amber-200 shadow-inner';
      default:
        return 'bg-[#FDFBF7] border border-slate-200 shadow-inner';
    }
  };

  // Dynamic Text Size Class (guaranteed minimum 1rem / 16px)
  const getTextSizeClass = () => {
    switch (textSizeMode) {
      case 'xlarge': // 75+ elderly mode
        return 'text-xl leading-relaxed';
      case 'large':
        return 'text-lg leading-relaxed';
      default:
        return 'text-base leading-relaxed'; // 1rem minimum!
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6 space-y-6 select-none animate-fade-in">
      {/* Top Header Banner with Accessibility Controls & High Contrast Support */}
      <div
        className={`rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden flex flex-wrap items-center justify-between gap-4 ${
          themeMode === 'high-contrast'
            ? 'bg-black text-white border-4 border-amber-400'
            : themeMode === 'night'
            ? 'bg-slate-800 text-white border-2 border-slate-700'
            : 'bg-gradient-to-r from-slate-800 via-teal-900 to-amber-800 text-white'
        }`}
      >
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-3xl sm:text-4xl shadow-inner border border-white/20 shrink-0">
            🌿
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display drop-shadow-sm">
              {isTr ? 'Minik Geometrist Çocuk Odası' : 'Junior Geometer Playroom'}
            </h1>
            <p className="text-white/90 text-base sm:text-lg font-medium mt-0.5">
              {isTr
                ? 'Kılavuzlar eşliğinde adım adım geometrik şekilleri keşfet!'
                : 'Discover and draw geometric shapes step-by-step with clear guides!'}
            </p>
          </div>
        </div>

        {/* Header Right Utility Controls */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 relative z-10">
          {/* Stars Counter */}
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/30 shadow-inner min-h-[44px]">
            <Star className="w-6 h-6 text-amber-300 fill-amber-300" />
            <span className="font-extrabold text-xl text-white">{stars} ⭐</span>
          </div>

          {/* Quick Sound Toggle */}
          <button
            type="button"
            onClick={() => {
              setSfxEnabled(!sfxEnabled);
              soundEffects.playDot();
            }}
            title={sfxEnabled ? (isTr ? 'Sesleri Kapat' : 'Mute Sounds') : (isTr ? 'Sesleri Aç' : 'Enable Sounds')}
            className="p-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/30 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center transition"
          >
            {sfxEnabled ? <Volume2 className="w-5 h-5 text-amber-300" /> : <VolumeX className="w-5 h-5 text-white/60" />}
          </button>

          {/* Quick Ambient Music Toggle */}
          <button
            type="button"
            onClick={() => {
              const next = !bgMusicEnabled;
              setBgMusicEnabled(next);
            }}
            title={bgMusicEnabled ? (isTr ? 'Müziği Durdur' : 'Stop Music') : (isTr ? 'Fon Müziğini Başlat' : 'Play Music')}
            className={`p-3 rounded-2xl border cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center transition ${
              bgMusicEnabled
                ? 'bg-amber-400 text-slate-900 border-amber-300 font-bold shadow-md'
                : 'bg-white/15 hover:bg-white/25 text-white border-white/30'
            }`}
          >
            <Music className="w-5 h-5" />
          </button>

          {/* Theme Tweaker Button */}
          <button
            type="button"
            onClick={() => setIsThemeTweakerOpen(true)}
            title={isTr ? 'Görünüm, Ses & Yazı Boyutu' : 'Theme, Sound & Text Size'}
            className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/30 font-extrabold text-base cursor-pointer min-h-[44px] flex items-center gap-2 transition"
          >
            <Sliders className="w-5 h-5 text-amber-300" />
            <span className="hidden sm:inline">{isTr ? 'Görünüm & Ayar' : 'Tweaker'}</span>
          </button>

          {/* Onboarding Tour Help Button */}
          <button
            type="button"
            onClick={() => setIsOnboardingTourOpen(true)}
            title={isTr ? 'Nasıl Oynanır? Başlangıç Rehberi' : 'How to Play Tour'}
            className="p-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white border border-white/30 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center transition"
          >
            <HelpCircle className="w-5 h-5 text-amber-300" />
          </button>

          {/* Safe Exit to Normal Mode (With Confirmation Guard) */}
          <button
            type="button"
            onClick={() => setIsExitModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-base shadow-md transition transform hover:scale-105 cursor-pointer min-h-[44px] flex items-center gap-2"
          >
            <Smile className="w-5 h-5 text-teal-800" />
            <span>{isTr ? 'Normal Mod' : 'Normal Mode'}</span>
          </button>
        </div>
      </div>

      {/* Main Activity Card */}
      <div className={`rounded-3xl p-6 sm:p-8 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-8 ${getThemeContainerClass()}`}>
        {/* Left Instruction Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Step Counter Badge */}
            <div className="inline-flex items-center gap-2 bg-teal-100 text-teal-900 px-4 py-1.5 rounded-full text-base font-extrabold border-2 border-teal-300">
              <Sparkles className="w-4 h-4 text-teal-700" />
              <span>{isTr ? `Bölüm ${step} / 20` : `Stage ${step} / 20`}</span>
            </div>

            {/* Stage Title and Large Instructions */}
            <div className="space-y-2">
              {step === 1 && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {isTr ? '1. İlk Noktanı Koy' : '1. Placing a Dot'}
                  </h2>
                  <p className={`text-slate-700 font-medium ${getTextSizeClass()}`}>
                    {isTr
                      ? 'Çizim alanına parmağınla veya farenle bir kez dokunarak ilk geometri noktanı oluştur.'
                      : 'Click or tap anywhere on the canvas to place your first dot.'}
                  </p>
                </>
              )}
              {step === 2 && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {isTr ? '2. Düz Çizgi Çekme' : '2. Drawing a Line'}
                  </h2>
                  <p className={`text-slate-700 font-medium ${getTextSizeClass()}`}>
                    {isTr
                      ? 'A noktasından tutup B noktasına doğru sürükleyerek cetvel çizgisi çek.'
                      : 'Drag from dot A to dot B to draw a straight line.'}
                  </p>
                </>
              )}
              {step === 3 && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {isTr ? '3. Üçgen Şekli (3 Kenar)' : '3. Triangle'}
                  </h2>
                  <p className={`text-slate-700 font-medium ${getTextSizeClass()}`}>
                    {isTr
                      ? 'Köşeleri birbirine sürükleyerek üçgenin 3 kenarını tamamla.'
                      : 'Drag between corners to connect the 3 sides of the triangle.'}
                  </p>
                </>
              )}
              {step === 4 && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {isTr ? '4. Kare Kutusu (4 Kenar)' : '4. Square'}
                  </h2>
                  <p className={`text-slate-700 font-medium ${getTextSizeClass()}`}>
                    {isTr
                      ? '4 köşeyi birbirine bağlayarak eşit kenarlı kareyi üret.'
                      : 'Connect the 4 corners to build a square.'}
                  </p>
                </>
              )}
              {step === 5 && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {isTr ? '5. Dik Açı (90° Köşe)' : '5. Right Angle (90°)'}
                  </h2>
                  <p className={`text-slate-700 font-medium ${getTextSizeClass()}`}>
                    {isTr
                      ? "A'dan B'ye ve B'den C'ye sürükleyerek 90 derecelik dik köşeyi çiz."
                      : 'Drag A->B and B->C to form a 90° right angle.'}
                  </p>
                </>
              )}
              {step === 6 && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {isTr ? '6. Düzgün Beşgen' : '6. Regular Pentagon'}
                  </h2>
                  <p className={`text-slate-700 font-medium ${getTextSizeClass()}`}>
                    {isTr
                      ? '5 köşeyi sırayla birleştirerek düzgün beşgenini tamamla.'
                      : 'Connect the 5 corners in sequence to complete the pentagon.'}
                  </p>
                </>
              )}
              {step === 7 && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {isTr ? '7. Düzgün Altıgen' : '7. Regular Hexagon'}
                  </h2>
                  <p className={`text-slate-700 font-medium ${getTextSizeClass()}`}>
                    {isTr
                      ? 'Arı kovanı peteği gibi 6 köşeyi sürükleyerek altıgeni tamamla.'
                      : 'Connect 6 corners to form a honeycomb hexagon.'}
                  </p>
                </>
              )}
              {step === 8 && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {isTr ? '8. Düzgün Sekizgen' : '8. Regular Octagon'}
                  </h2>
                  <p className={`text-slate-700 font-medium ${getTextSizeClass()}`}>
                    {isTr
                      ? '8 köşeyi sürükleyerek sekizgen madalyonunu ortaya çıkar.'
                      : 'Connect 8 corners to reveal the regular octagon.'}
                  </p>
                </>
              )}
              {step === 9 && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {isTr ? '9. Çember Dünyası' : '9. First Compass Circle'}
                  </h2>
                  <p className={`text-slate-700 font-medium ${getTextSizeClass()}`}>
                    {isTr
                      ? 'Merkez noktadan dışarıya doğru sürükleyerek pergel çemberini büyüt.'
                      : 'Drag outward from center point to open your compass circle.'}
                  </p>
                </>
              )}
              {step === 10 && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {isTr ? '10. İki Çember Kesişimi' : '10. Intersecting Circles'}
                  </h2>
                  <p className={`text-slate-700 font-medium ${getTextSizeClass()}`}>
                    {isTr
                      ? 'Arka plandaki silik kılavuza uyarak B noktasından 2. çemberi çiz.'
                      : 'Follow the faint guide and drag from point B to draw the 2nd circle.'}
                  </p>
                </>
              )}
              {step === 11 && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {isTr ? "11. Çiçek Yaprakları (3'lü Rosette)" : '11. Rosette Petals'}
                  </h2>
                  <p className={`text-slate-700 font-medium ${getTextSizeClass()}`}>
                    {isTr
                      ? 'Çember üzerindeki 3 silik kılavuz noktaya dokunarak çiçek yapraklarını tek tek açtır!'
                      : 'Tap on the 3 guided points on the circle circumference to bloom each petal!'}
                  </p>
                </>
              )}
              {step === 12 && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {isTr ? '12. Altı Yapraklı Tam Çiçek' : '12. 6-Petal Rosette Flower'}
                  </h2>
                  <p className={`text-slate-700 font-medium ${getTextSizeClass()}`}>
                    {isTr
                      ? 'Çember çevresindeki 6 kılavuz noktaya dokunarak tam çiçeği açtır!'
                      : 'Tap each of the 6 guided points on the circle circumference to bloom all petals!'}
                  </p>
                </>
              )}
              {step === 13 && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {isTr ? '13. Altı Köşeli Yıldız' : '13. Hexagram Star'}
                  </h2>
                  <p className={`text-slate-700 font-medium ${getTextSizeClass()}`}>
                    {isTr
                      ? 'İki ters üçgeni birleştirerek 6 köşeli geometri yıldızını çiz.'
                      : 'Connect corners along the guide to create a 6-point star.'}
                  </p>
                </>
              )}
              {step === 14 && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {isTr ? '14. Baklava Motifi (Rhombus)' : '14. Diamond Rhombus'}
                  </h2>
                  <p className={`text-slate-700 font-medium ${getTextSizeClass()}`}>
                    {isTr
                      ? '4 elmas köşesini birleştirerek baklava dilimi motifini çiz.'
                      : 'Connect 4 diamond points to form the rhombus tile.'}
                  </p>
                </>
              )}
              {step === 15 && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {isTr ? '15. Selçuklu Çift Karesi (Temel İskelet)' : '15. Seljuk Double Squares'}
                  </h2>
                  <p className={`text-slate-700 font-medium ${getTextSizeClass()}`}>
                    {isTr
                      ? 'Biri düz, diğeri 45° dönmüş iki özdeş kareyi çizerek 8 köşeli yıldızın temel iskeletini kur!'
                      : 'Draw two squares (one straight, one rotated 45°) to create the 8-point geometric skeleton!'}
                  </p>
                </>
              )}
              {step === 16 && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {isTr ? '16. Tarihi Selçuklu 8 Köşeli Yıldızı' : '16. Authentic Seljuk 8-Point Star'}
                  </h2>
                  <p className={`text-slate-700 font-medium ${getTextSizeClass()}`}>
                    {isTr
                      ? '8 yıldız tepe noktasını çapraz ışınlarla birleştirerek Selçuklu saraylarının görkemli yıldız motifini üret!'
                      : 'Connect the 8 peak vertices across the circle to create the magnificent Seljuk octagram star motif!'}
                  </p>
                </>
              )}
              {step === 17 && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {isTr ? '17. Endülüs Çini Deseni' : '17. Andalusian Tile'}
                  </h2>
                  <p className={`text-slate-700 font-medium ${getTextSizeClass()}`}>
                    {isTr
                      ? 'Kılavuz çizgileri takip ederek Endülüs saray çinisinin 8 kenarlı köşeli yıldızını tamamla.'
                      : 'Follow the guide lines to connect the Andalusian palace star tile.'}
                  </p>
                </>
              )}
              {step === 18 && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {isTr ? '18. İran Girih Düğüm Yıldızı (5 Köşeli)' : '18. Persian Girih Pentagram Star'}
                  </h2>
                  <p className={`text-slate-700 font-medium ${getTextSizeClass()}`}>
                    {isTr
                      ? '1 → 3 → 5 → 2 → 4 → 1 sırasıyla noktaları birleştirerek 5 köşeli düğüm yıldızını çiz!'
                      : 'Connect vertices in order 1 → 3 → 5 → 2 → 4 → 1 to draw the 5-point Girih knot star!'}
                  </p>
                </>
              )}
              {step === 19 && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {isTr ? '19. Japon Kumiko Kenevir Yaprağı' : '19. Japanese Kumiko'}
                  </h2>
                  <p className={`text-slate-700 font-medium ${getTextSizeClass()}`}>
                    {isTr
                      ? 'Merkezden dış köşelere uzanan geleneksel ahşap Kumiko motifini çiz.'
                      : 'Draw the traditional Japanese Kumiko Asanoha leaf pattern.'}
                  </p>
                </>
              )}
              {step === 20 && (
                <>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                    <span>{isTr ? '20. Saray Taç Kapı Yıldızı' : '20. Royal Portal Star'}</span>
                    <Award className="w-8 h-8 text-amber-500" />
                  </h2>
                  <p className={`text-slate-700 font-medium ${getTextSizeClass()}`}>
                    {isTr
                      ? '12 köşeli taç kapı yıldızı 4 adet eşkenar üçgenden oluşur (1-5-9, 2-6-10, 3-7-11, 4-8-12). Kılavuz üçgenleri sırayla tamamla ve Geometri Tacını Kazan!'
                      : 'The 12-point portal star is made of 4 equilateral triangles (1-5-9, 2-6-10, 3-7-11, 4-8-12). Complete each guided triangle to claim your crown!'}
                  </p>
                </>
              )}
            </div>

            {/* Custom Color Palette & Custom Shade Generator */}
            <div className="pt-2">
              <ColorPaletteBuilder
                activeColor={activeColor}
                onSelectColor={(c) => setActiveColor(c)}
                customColors={customColors}
                onAddCustomColor={(c) => setCustomColors((prev) => [...prev, c])}
              />
            </div>
          </div>

          {/* Action Toolbar & Navigation Controls */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-3">
              {/* Reliable Undo Button */}
              <button
                type="button"
                onClick={handleUndo}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-amber-100 text-amber-950 font-bold text-base border-2 border-amber-300 hover:bg-amber-200 cursor-pointer min-h-[44px] transition"
                title={isTr ? 'Son çizgiyi geri al' : 'Undo last line'}
              >
                <Undo2 className="w-5 h-5 text-amber-800" />
                <span>{isTr ? 'Geri Al' : 'Undo'}</span>
              </button>

              {/* Reset Current Step */}
              <button
                type="button"
                onClick={handleResetCurrentStep}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 text-slate-800 font-bold text-base border-2 border-slate-300 hover:bg-slate-200 cursor-pointer min-h-[44px] transition"
                title={isTr ? 'Bu adımı sıfırla' : 'Reset this stage'}
              >
                <RefreshCcw className="w-5 h-5 text-slate-700" />
                <span>{isTr ? 'Sıfırla' : 'Reset'}</span>
              </button>
            </div>

            {/* Step Navigation: Back & Next Buttons */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handlePrev}
                disabled={step === 1}
                className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-base disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer min-h-[44px] transition"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>{isTr ? 'Önceki Bölüm' : 'Back'}</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={!isCurrentStepReadyToAdvance}
                className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-base shadow-lg shadow-teal-900/20 transform hover:scale-105 transition cursor-pointer min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span>{step === 20 ? (isTr ? 'Tacı Kazan 🏆' : 'Win Crown 🏆') : isTr ? 'Sonraki Bölüm' : 'Next Stage'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Interactive Canvas Area */}
        <div
          className={`lg:col-span-7 rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center relative min-h-[460px] sm:min-h-[500px] overflow-hidden select-none ${getCanvasBgClass()}`}
        >
          {/* STEP 1: Place 1 Dot */}
          {step === 1 && (
            <div className="w-full max-w-[480px] sm:max-w-[500px] aspect-square rounded-3xl bg-white border-2 border-slate-300 flex flex-col items-center justify-center relative cursor-crosshair shadow-sm">
              <svg
                ref={svgRef}
                viewBox="0 0 400 400"
                className="w-full h-full"
                onPointerDown={(e) => {
                  const coords = getSvgCoordinates(e);
                  soundEffects.playDot();
                  updateCurrentStepState((prev) => ({
                    ...prev,
                    dot1: { x: coords.x, y: coords.y, color: activeColor },
                  }));
                  setStars(10);
                  triggerStepCompletionCelebration(1);
                }}
              >
                {!currentStepState.dot1 ? (
                  <g pointerEvents="none">
                    <circle cx="200" cy="200" r="30" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="2.5" strokeDasharray="5 5" />
                    <text x="200" y="206" textAnchor="middle" fill="#334155" fontSize="16" fontWeight="bold">
                      {isTr ? 'Dokun' : 'Tap'}
                    </text>
                  </g>
                ) : (
                  <g pointerEvents="none">
                    <circle
                      cx={currentStepState.dot1.x}
                      cy={currentStepState.dot1.y}
                      r={strokeWidth * 2.5 + 6}
                      fill={currentStepState.dot1.color}
                      stroke="white"
                      strokeWidth="3.5"
                    />
                    <text
                      x={currentStepState.dot1.x}
                      y={currentStepState.dot1.y - 24}
                      textAnchor="middle"
                      fill="#0F172A"
                      fontSize="16"
                      fontWeight="bold"
                    >
                      {isTr ? 'Nokta Oluştu!' : 'Dot Created!'} ✨
                    </text>
                  </g>
                )}
              </svg>
              <div className="absolute bottom-4 text-center pointer-events-none text-base font-bold text-slate-700">
                {currentStepState.dot1 ? (
                  <span className="text-emerald-700 flex items-center gap-1.5 justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>{isTr ? 'Harika! Sonraki bölüme geçebilirsin.' : 'Great! Ready for next stage.'}</span>
                  </span>
                ) : (
                  <span>{isTr ? 'Ekranda dilediğin yere dokun' : 'Tap anywhere on the canvas'}</span>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Drag Line */}
          {step === 2 && (
            <div className="w-full max-w-[480px] sm:max-w-[500px] aspect-square rounded-3xl bg-white border-2 border-slate-300 flex flex-col items-center justify-center relative shadow-sm">
              <svg
                ref={svgRef}
                viewBox="0 0 400 400"
                className="w-full h-full cursor-crosshair"
                onPointerDown={(e) => {
                  if (currentStepState.lineCompleted) return;
                  const coords = getSvgCoordinates(e);
                  if (Math.hypot(coords.x - lineStart.x, coords.y - lineStart.y) <= 48) {
                    soundEffects.playDot();
                    setIsDrawingLine2(true);
                    setCurrentLine2Drag(coords);
                  }
                }}
                onPointerMove={(e) => {
                  if (!isDrawingLine2 || currentStepState.lineCompleted) return;
                  const coords = getSvgCoordinates(e);
                  setCurrentLine2Drag(coords);
                }}
                onPointerUp={(e) => {
                  if (!isDrawingLine2 || currentStepState.lineCompleted) return;
                  setIsDrawingLine2(false);
                  const coords = getSvgCoordinates(e);
                  if (Math.hypot(coords.x - lineEnd.x, coords.y - lineEnd.y) <= 50) {
                    soundEffects.playLineSnap();
                    updateCurrentStepState((prev) => ({
                      ...prev,
                      lineCompleted: true,
                    }));
                    setStars(20);
                    triggerStepCompletionCelebration(2);
                  }
                  setCurrentLine2Drag(null);
                }}
              >
                <line
                  x1={lineStart.x}
                  y1={lineStart.y}
                  x2={lineEnd.x}
                  y2={lineEnd.y}
                  stroke="#94A3B8"
                  strokeWidth="4"
                  strokeDasharray="6 6"
                  opacity="0.6"
                />

                {currentStepState.lineCompleted && (
                  <line
                    x1={lineStart.x}
                    y1={lineStart.y}
                    x2={lineEnd.x}
                    y2={lineEnd.y}
                    stroke={activeColor}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                  />
                )}

                {isDrawingLine2 && currentLine2Drag && !currentStepState.lineCompleted && (
                  <line
                    x1={lineStart.x}
                    y1={lineStart.y}
                    x2={currentLine2Drag.x}
                    y2={currentLine2Drag.y}
                    stroke={activeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray="5 5"
                  />
                )}

                <circle cx={lineStart.x} cy={lineStart.y} r="16" fill="#1E293B" stroke="white" strokeWidth="3" />
                <text x={lineStart.x} y={lineStart.y + 5} textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" pointerEvents="none">
                  A
                </text>

                <circle cx={lineEnd.x} cy={lineEnd.y} r="16" fill="#1E293B" stroke="white" strokeWidth="3" />
                <text x={lineEnd.x} y={lineEnd.y + 5} textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" pointerEvents="none">
                  B
                </text>
              </svg>

              <div className="absolute bottom-4 text-center pointer-events-none text-base font-bold text-slate-700">
                {currentStepState.lineCompleted ? (
                  <span className="text-emerald-700 flex items-center gap-1.5 justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>{isTr ? 'Harika Çizgi! Çizgi tamamlandı.' : 'Great straight line!'}</span>
                  </span>
                ) : (
                  <span>{isTr ? "A noktasından tutup B noktasına doğru sürükle" : 'Drag from A to B'}</span>
                )}
              </div>
            </div>
          )}

          {/* STAGES WITH CONFIG: 3, 4, 5, 6, 7, 8, 13, 14, 15, 16, 17, 18, 19, 20 */}
          {stageCfg && (
            <div className="w-full max-w-[480px] sm:max-w-[500px] aspect-square rounded-3xl bg-white border-2 border-slate-300 flex flex-col items-center justify-center relative shadow-sm">
              <svg
                ref={svgRef}
                viewBox="0 0 400 400"
                className="w-full h-full cursor-crosshair"
                onPointerDown={(e) => {
                  if (drawnLines.length >= stageCfg.edges.length) return;
                  const coords = getSvgCoordinates(e);
                  const startV = findClosestVertex(coords, stageCfg.vertices);
                  if (startV) {
                    soundEffects.playDot();
                    setActiveStart(startV.id);
                    setDragCurrent(coords);
                  }
                }}
                onPointerMove={(e) => {
                  if (!activeStart || drawnLines.length >= stageCfg.edges.length) return;
                  const coords = getSvgCoordinates(e);
                  setDragCurrent(coords);
                }}
                onPointerUp={(e) => {
                  if (!activeStart || drawnLines.length >= stageCfg.edges.length) return;
                  const coords = getSvgCoordinates(e);
                  const endV = findClosestVertex(coords, stageCfg.vertices);

                  if (endV && endV.id !== activeStart) {
                    const startV = stageCfg.vertices.find((v) => v.id === activeStart)!;
                    const edgeKey = getEdgeKey(activeStart, endV.id);

                    const exists = drawnLines.some((l) => getEdgeKey(l.from, l.to) === edgeKey);
                    if (!exists && stageCfg.edges.includes(edgeKey)) {
                      soundEffects.playLineSnap();
                      const newLine: DrawnLine = {
                        id: `line-${Date.now()}`,
                        from: startV.id,
                        to: endV.id,
                        x1: startV.x,
                        y1: startV.y,
                        x2: endV.x,
                        y2: endV.y,
                        color: activeColor,
                        width: strokeWidth,
                      };
                      const updated = [...drawnLines, newLine];
                      updateCurrentStepState((prev) => ({
                        ...prev,
                        drawnLines: updated,
                      }));

                      if (updated.length === stageCfg.edges.length) {
                        setStars(step * 15);
                        triggerStepCompletionCelebration(step);
                      }
                    }
                  }

                  setActiveStart(null);
                  setDragCurrent(null);
                }}
              >
                {/* Background target guide */}
                {stageCfg.polygonSvg}

                {/* Already Drawn Lines strictly belonging to this stage */}
                {drawnLines.map((line) => (
                  <line
                    key={line.id}
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke={line.color}
                    strokeWidth={line.width || strokeWidth}
                    strokeLinecap="round"
                  />
                ))}

                {/* Live Drag Preview Line */}
                {activeStart && dragCurrent && (() => {
                  const startV = stageCfg.vertices.find((v) => v.id === activeStart);
                  if (!startV) return null;
                  return (
                    <line
                      x1={startV.x}
                      y1={startV.y}
                      x2={dragCurrent.x}
                      y2={dragCurrent.y}
                      stroke={activeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray="5 5"
                    />
                  );
                })()}

                {/* Step 18 & 20 Next Move Pulse Arrow & Halo */}
                {(() => {
                  const activeNextMove = step === 18 ? nextStep18Move : step === 20 ? nextStep20Move : null;
                  if (!activeNextMove) return null;
                  const vFrom = stageCfg.vertices.find((v) => v.id === activeNextMove.from);
                  const vTo = stageCfg.vertices.find((v) => v.id === activeNextMove.to);
                  if (!vFrom || !vTo) return null;
                  return (
                    <g pointerEvents="none">
                      <circle
                        cx={vFrom.x}
                        cy={vFrom.y}
                        r="24"
                        fill="none"
                        stroke="#F59E0B"
                        strokeWidth="2.5"
                        strokeDasharray="4 4"
                        className="animate-spin"
                        style={{ transformOrigin: `${vFrom.x}px ${vFrom.y}px` }}
                      />
                      <line
                        x1={vFrom.x}
                        y1={vFrom.y}
                        x2={vTo.x}
                        y2={vTo.y}
                        stroke="#F59E0B"
                        strokeWidth="2.5"
                        strokeDasharray="4 4"
                        opacity="0.8"
                      />
                    </g>
                  );
                })()}

                {/* Neutral High-Contrast Vertex Markers */}
                {stageCfg.vertices.map((p) => {
                  const activeNextMove = step === 18 ? nextStep18Move : step === 20 ? nextStep20Move : null;
                  const isNextStart = activeNextMove?.from === p.id;
                  const isNextEnd = activeNextMove?.to === p.id;
                  return (
                    <g key={p.id} pointerEvents="none">
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isNextStart || isNextEnd ? '17' : '15'}
                        fill={isNextStart ? '#087D86' : isNextEnd ? '#D97706' : '#0F172A'}
                        stroke="white"
                        strokeWidth="3"
                      />
                      <text x={p.x} y={p.y + 5} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
                        {p.label}
                      </text>
                    </g>
                  );
                })}
              </svg>

              <div className="absolute bottom-4 text-center pointer-events-none text-base font-bold text-slate-700 px-3">
                {drawnLines.length === stageCfg.edges.length ? (
                  <span className="text-emerald-700 flex items-center gap-1.5 justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>{isTr ? 'Şekil Tamamlandı!' : 'Shape Completed!'}</span>
                  </span>
                ) : step === 18 && nextStep18Move ? (
                  <span className="text-amber-800 bg-amber-50 px-3 py-1 rounded-xl border border-amber-300 shadow-2xs font-extrabold text-sm sm:text-base">
                    {isTr
                      ? `Sıradaki: ${nextStep18Move.fromLabel} noktasından ${nextStep18Move.toLabel} noktasına sürükle (${drawnLines.length}/5)`
                      : `Next: Drag from ${nextStep18Move.fromLabel} to ${nextStep18Move.toLabel} (${drawnLines.length}/5)`}
                  </span>
                ) : step === 20 && nextStep20Move ? (
                  <span className="text-amber-800 bg-amber-50 px-3 py-1 rounded-xl border border-amber-300 shadow-2xs font-extrabold text-sm sm:text-base">
                    {isTr
                      ? `Sıradaki: ${nextStep20Move.group} için ${nextStep20Move.fromLabel}'den ${nextStep20Move.toLabel}'e sürükle (${drawnLines.length}/12)`
                      : `Next: For ${nextStep20Move.group}, drag ${nextStep20Move.fromLabel} to ${nextStep20Move.toLabel} (${drawnLines.length}/12)`}
                  </span>
                ) : (
                  <span>
                    {isTr
                      ? `Köşeleri birbirine sürükle (${drawnLines.length}/${stageCfg.edges.length} kenar)`
                      : `Drag between corners (${drawnLines.length}/${stageCfg.edges.length} sides)`}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* STEP 9: Circle */}
          {step === 9 && (
            <div
              className="w-full max-w-[480px] sm:max-w-[500px] aspect-square rounded-3xl bg-white border-2 border-slate-300 flex flex-col items-center justify-center relative cursor-crosshair shadow-sm"
              onPointerDown={() => {
                if (currentStepState.circleCompleted) return;
                soundEffects.playDot();
                setIsDrawingCircle9(true);
              }}
              onPointerMove={(e) => {
                if (!isDrawingCircle9 || currentStepState.circleCompleted) return;
                const coords = getSvgCoordinates(e);
                const r = Math.hypot(coords.x - 200, coords.y - 200);
                updateCurrentStepState((prev) => ({
                  ...prev,
                  circleRadius: Math.min(Math.max(r, 20), 140),
                }));
              }}
              onPointerUp={() => {
                if (!isDrawingCircle9 || currentStepState.circleCompleted) return;
                setIsDrawingCircle9(false);
                if ((currentStepState.circleRadius ?? 0) > 60) {
                  updateCurrentStepState((prev) => ({
                    ...prev,
                    circleCompleted: true,
                  }));
                  setStars(80);
                  triggerStepCompletionCelebration(9);
                }
              }}
            >
              <svg ref={svgRef} viewBox="0 0 400 400" className="w-full h-full pointer-events-none">
                <circle cx="200" cy="200" r="100" fill="none" stroke="#94A3B8" strokeWidth="3" strokeDasharray="6 6" opacity="0.6" />

                <circle
                  cx="200"
                  cy="200"
                  r={currentStepState.circleRadius || 40}
                  fill={currentStepState.circleCompleted ? `${activeColor}22` : 'none'}
                  stroke={activeColor}
                  strokeWidth={currentStepState.circleCompleted ? strokeWidth : 3}
                  strokeDasharray={currentStepState.circleCompleted ? undefined : '5 5'}
                />
                <circle cx="200" cy="200" r="8" fill="#0F172A" />
              </svg>
              <div className="absolute bottom-4 text-center pointer-events-none text-base font-bold text-slate-700">
                {currentStepState.circleCompleted ? (
                  <span className="text-emerald-700 flex items-center gap-1.5 justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>{isTr ? 'Çember Tamamlandı!' : 'Circle Completed!'}</span>
                  </span>
                ) : (
                  <span>{isTr ? 'Merkezden dışarıya doğru sürükleyerek çemberi büyüt' : 'Drag outward from center'}</span>
                )}
              </div>
            </div>
          )}

          {/* STEP 10: Two Overlapping Circles */}
          {step === 10 && (
            <div
              className="w-full max-w-[480px] sm:max-w-[500px] aspect-square rounded-3xl bg-white border-2 border-slate-300 flex flex-col items-center justify-center relative shadow-sm cursor-crosshair"
              onPointerDown={() => {
                if (currentStepState.circle2Completed) return;
                soundEffects.playDot();
                setIsDrawingCircle10(true);
              }}
              onPointerMove={(e) => {
                if (!isDrawingCircle10 || currentStepState.circle2Completed) return;
                const coords = getSvgCoordinates(e);
                const r = Math.hypot(coords.x - 290, coords.y - 200);
                updateCurrentStepState((prev) => ({
                  ...prev,
                  circle2Radius: Math.min(Math.max(r, 20), 110),
                }));
              }}
              onPointerUp={() => {
                if (!isDrawingCircle10 || currentStepState.circle2Completed) return;
                setIsDrawingCircle10(false);
                if ((currentStepState.circle2Radius ?? 0) > 60) {
                  updateCurrentStepState((prev) => ({
                    ...prev,
                    circle2Completed: true,
                  }));
                  setStars(95);
                  triggerStepCompletionCelebration(10);
                }
              }}
            >
              <svg ref={svgRef} viewBox="0 0 400 400" className="w-full h-full pointer-events-none">
                <circle cx="200" cy="200" r="90" fill="none" stroke="#3A6B5C" strokeWidth="3.5" />
                <circle cx="200" cy="200" r="6" fill="#0F172A" />

                <circle cx="290" cy="200" r="90" fill="none" stroke="#94A3B8" strokeWidth="3" strokeDasharray="6 6" opacity="0.6" />

                <circle cx="290" cy="200" r="9" fill="#D4A373" stroke="white" strokeWidth="2.5" />
                <text x="290" y="178" textAnchor="middle" fill="#0F172A" fontSize="13" fontWeight="bold">
                  B
                </text>

                <circle
                  cx="290"
                  cy="200"
                  r={currentStepState.circle2Radius || 30}
                  fill={currentStepState.circle2Completed ? `${activeColor}22` : 'none'}
                  stroke={activeColor}
                  strokeWidth={currentStepState.circle2Completed ? strokeWidth : 3}
                  strokeDasharray={currentStepState.circle2Completed ? undefined : '5 5'}
                />
              </svg>
              <div className="absolute bottom-4 text-center pointer-events-none text-base font-bold text-slate-700">
                {currentStepState.circle2Completed ? (
                  <span className="text-emerald-700 flex items-center gap-1.5 justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>{isTr ? 'Pergel Kesişimi Başarılı!' : 'Intersecting Circles Done!'}</span>
                  </span>
                ) : (
                  <span>{isTr ? 'Silik kılavuza uyarak B noktasından 2. çemberi çiz' : 'Follow faint guide and drag from B'}</span>
                )}
              </div>
            </div>
          )}

          {/* STEP 11: 3 Petals Rosette (Touch-Targeted Guide Points on Circle) */}
          {step === 11 && (
            <div className="w-full max-w-[480px] sm:max-w-[500px] aspect-square rounded-3xl bg-white border-2 border-slate-300 flex flex-col items-center justify-center relative shadow-sm">
              <svg
                ref={svgRef}
                viewBox="0 0 400 400"
                className="w-full h-full cursor-pointer"
                onPointerDown={(e) => {
                  const coords = getSvgCoordinates(e);
                  // Find if clicked near any of the 3 guide points
                  const found = petalGuidePoints3.find((p) => Math.hypot(coords.x - p.x, coords.y - p.y) <= 45);
                  if (found) {
                    if (!bloomedPetals3.includes(found.id)) {
                      soundEffects.playLineSnap();
                      const updated = [...bloomedPetals3, found.id];
                      updateCurrentStepState((prev) => ({
                        ...prev,
                        bloomedPetals3: updated,
                        petals3Count: updated.length,
                      }));
                      if (updated.length === 3) {
                        setStars(115);
                        triggerStepCompletionCelebration(11);
                      }
                    } else {
                      soundEffects.playDot();
                    }
                  }
                }}
              >
                {/* Center Circle */}
                <circle cx="200" cy="200" r="85" fill="none" stroke="#3A6B5C" strokeWidth="3.5" />
                <circle cx="200" cy="200" r="6" fill="#0F172A" />

                {/* 3 Faint Guide Circles */}
                {petalGuidePoints3.map((pt) => (
                  <circle
                    key={`guide-${pt.id}`}
                    cx={pt.x}
                    cy={pt.y}
                    r="85"
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="2.5"
                    strokeDasharray="5 5"
                    opacity="0.6"
                  />
                ))}

                {/* Bloomed Petal Circles (Only for bloomed ones) */}
                {bloomedPetals3.map((petalId) => {
                  const pt = petalGuidePoints3.find((p) => p.id === petalId);
                  if (!pt) return null;
                  return (
                    <circle
                      key={`bloomed-${petalId}`}
                      cx={pt.x}
                      cy={pt.y}
                      r="85"
                      fill="rgba(212, 163, 115, 0.12)"
                      stroke={activeColor}
                      strokeWidth={strokeWidth}
                    />
                  );
                })}

                {/* Interactive Touch Target Badges at Guide Points */}
                {petalGuidePoints3.map((pt) => {
                  const isBloomed = bloomedPetals3.includes(pt.id);
                  return (
                    <g key={`marker-${pt.id}`} className="transition-all duration-300">
                      {/* Generous touch target */}
                      <circle cx={pt.x} cy={pt.y} r="32" fill="transparent" />

                      {/* Visible node */}
                      {!isBloomed ? (
                        <>
                          <circle cx={pt.x} cy={pt.y} r="18" fill="#FEF3C7" stroke="#D97706" strokeWidth="2.5" />
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="24"
                            fill="none"
                            stroke="#D97706"
                            strokeWidth="2"
                            strokeDasharray="3 3"
                            className="animate-spin"
                            style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
                          />
                          <text x={pt.x} y={pt.y + 5} textAnchor="middle" fill="#92400E" fontSize="12" fontWeight="bold">
                            {pt.label}
                          </text>
                        </>
                      ) : (
                        <>
                          <circle cx={pt.x} cy={pt.y} r="14" fill="#10B981" stroke="white" strokeWidth="2.5" />
                          <text x={pt.x} y={pt.y + 4} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
                            ✓
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>

              <div className="absolute bottom-4 text-center pointer-events-none text-base font-bold text-slate-700">
                {bloomedPetals3.length === 3 ? (
                  <span className="text-emerald-700 flex items-center gap-1.5 justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>{isTr ? '3 Çiçek Yaprağı Açtı!' : '3 Petals Bloomed!'}</span>
                  </span>
                ) : (
                  <span>
                    {isTr
                      ? `Çember üzerindeki kılavuz noktalara dokun (${bloomedPetals3.length}/3)`
                      : `Tap the guide nodes on the circle (${bloomedPetals3.length}/3)`}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* STEP 12: Full 6 Petals Rosette (Touch-Targeted Guide Points) */}
          {step === 12 && (
            <div className="w-full max-w-[480px] sm:max-w-[500px] aspect-square rounded-3xl bg-white border-2 border-slate-300 flex flex-col items-center justify-center relative shadow-sm">
              <svg
                ref={svgRef}
                viewBox="0 0 400 400"
                className="w-full h-full cursor-pointer"
                onPointerDown={(e) => {
                  const coords = getSvgCoordinates(e);
                  const found = petalGuidePoints6.find((p) => Math.hypot(coords.x - p.x, coords.y - p.y) <= 45);
                  if (found) {
                    if (!bloomedPetals6.includes(found.id)) {
                      soundEffects.playLineSnap();
                      const updated = [...bloomedPetals6, found.id];
                      updateCurrentStepState((prev) => ({
                        ...prev,
                        bloomedPetals6: updated,
                        petals6Count: updated.length,
                      }));
                      if (updated.length === 6) {
                        setStars(130);
                        triggerStepCompletionCelebration(12);
                      }
                    } else {
                      soundEffects.playDot();
                    }
                  }
                }}
              >
                {/* Center Circle */}
                <circle cx="200" cy="200" r="85" fill="none" stroke="#3A6B5C" strokeWidth="3.5" />
                <circle cx="200" cy="200" r="6" fill="#0F172A" />

                {/* 6 Faint Guide Circles */}
                {petalGuidePoints6.map((pt) => (
                  <circle
                    key={`guide6-${pt.id}`}
                    cx={pt.x}
                    cy={pt.y}
                    r="85"
                    fill="none"
                    stroke="#94A3B8"
                    strokeWidth="2.5"
                    strokeDasharray="5 5"
                    opacity="0.6"
                  />
                ))}

                {/* Bloomed Petal Circles */}
                {bloomedPetals6.map((petalId) => {
                  const pt = petalGuidePoints6.find((p) => p.id === petalId);
                  if (!pt) return null;
                  return (
                    <circle
                      key={`bloomed6-${petalId}`}
                      cx={pt.x}
                      cy={pt.y}
                      r="85"
                      fill="rgba(8, 125, 134, 0.12)"
                      stroke={activeColor}
                      strokeWidth={strokeWidth}
                    />
                  );
                })}

                {/* Interactive Touch Target Badges */}
                {petalGuidePoints6.map((pt) => {
                  const isBloomed = bloomedPetals6.includes(pt.id);
                  return (
                    <g key={`marker6-${pt.id}`} className="transition-all duration-300">
                      <circle cx={pt.x} cy={pt.y} r="32" fill="transparent" />

                      {!isBloomed ? (
                        <>
                          <circle cx={pt.x} cy={pt.y} r="16" fill="#CCFBF1" stroke="#0D9488" strokeWidth="2.5" />
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="22"
                            fill="none"
                            stroke="#0D9488"
                            strokeWidth="2"
                            strokeDasharray="3 3"
                            className="animate-spin"
                            style={{ transformOrigin: `${pt.x}px ${pt.y}px` }}
                          />
                          <text x={pt.x} y={pt.y + 5} textAnchor="middle" fill="#115E59" fontSize="12" fontWeight="bold">
                            {pt.label}
                          </text>
                        </>
                      ) : (
                        <>
                          <circle cx={pt.x} cy={pt.y} r="14" fill="#0D9488" stroke="white" strokeWidth="2.5" />
                          <text x={pt.x} y={pt.y + 4} textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">
                            ✓
                          </text>
                        </>
                      )}
                    </g>
                  );
                })}
              </svg>

              <div className="absolute bottom-4 text-center pointer-events-none text-base font-bold text-slate-700">
                {bloomedPetals6.length === 6 ? (
                  <span className="text-emerald-700 flex items-center gap-1.5 justify-center">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span>{isTr ? '6 Yapraklı Çiçek Tamamlandı!' : 'Full Rosette Flower Completed!'}</span>
                  </span>
                ) : (
                  <span>
                    {isTr
                      ? `Çember üzerindeki kılavuz noktalara dokun (${bloomedPetals6.length}/6)`
                      : `Tap the guide nodes on the circle (${bloomedPetals6.length}/6)`}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Automatic Stage Advance Celebration Overlay (3s Countdown + Direct Skip) */}
          {celebrationCountdown !== null && (
            <div
              role="alert"
              aria-live="polite"
              className="absolute inset-0 z-40 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in rounded-3xl"
            >
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border-4 border-amber-400 space-y-4">
                <div className="text-5xl animate-bounce">🎉</div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {isTr ? 'Tebrikler!' : 'Congratulations!'}
                </h3>
                <p className="text-base text-slate-700 font-semibold">
                  {isTr ? `${step}. Bölümü Başarıyla Tamamladın!` : `Stage ${step} Completed!`}
                </p>

                <div className="flex items-center justify-center gap-2 text-sm sm:text-base text-teal-900 font-extrabold bg-teal-50 py-2.5 px-4 rounded-xl border border-teal-200">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                  <span>
                    {isTr
                      ? `Sonraki bölüme geçiliyor... (${celebrationCountdown}s)`
                      : `Advancing to next stage... (${celebrationCountdown}s)`}
                  </span>
                </div>

                <div className="flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCelebrationCountdown(null);
                      handleNext();
                    }}
                    className="flex-1 py-3 px-4 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-md cursor-pointer min-h-[44px] transition"
                  >
                    <span>{isTr ? 'Hemen Geç' : 'Next Now'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCelebrationCountdown(null)}
                    className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm cursor-pointer min-h-[44px] transition"
                  >
                    {isTr ? 'İncele' : 'Review'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Grand Victory Modal on Step 20 Final Completion */}
          {step === 20 && isCurrentStepReadyToAdvance && (
            <div
              role="alert"
              aria-live="polite"
              className="absolute inset-0 z-40 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in rounded-3xl"
            >
              <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border-4 border-amber-400 space-y-4">
                <div className="text-6xl animate-bounce">👑</div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {isTr ? 'Muhteşem! Geometri Ustası Oldun!' : 'Magnificent! Junior Geometer Champion!'}
                </h3>
                <p className="text-base text-slate-700 font-medium">
                  {isTr
                    ? 'Tüm 20 bölümü başarıyla tamamladın ve Selçuklu saray kapısı taç yıldızını ortaya çıkardın!'
                    : 'You completed all 20 stages and mastered Islamic geometric patterns!'}
                </p>
                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-300 font-extrabold text-amber-900 text-lg">
                  ⭐ {stars} Geometri Puanı
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleResetAllProgress}
                    className="flex-1 py-3 px-4 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-sm sm:text-base cursor-pointer min-h-[44px]"
                  >
                    {isTr ? '1. Bölümden Tekrar Oyna' : 'Play Again'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExitModalOpen(true)}
                    className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm sm:text-base cursor-pointer min-h-[44px]"
                  >
                    {isTr ? 'Normal Mod' : 'Normal Mode'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Exit Confirmation Modal */}
      <ExitConfirmModal
        isOpen={isExitModalOpen}
        currentStep={step}
        onConfirmExit={handleConfirmExit}
        onCancel={() => setIsExitModalOpen(false)}
      />

      {/* Onboarding Tour Builder */}
      <KidsOnboardingTour
        isOpen={isOnboardingTourOpen}
        onClose={() => {
          setIsOnboardingTourOpen(false);
          kidsStorage.saveSession({ tourCompleted: true });
        }}
      />

      {/* Theme Style Tweaker */}
      <ThemeStyleTweaker
        isOpen={isThemeTweakerOpen}
        onClose={() => setIsThemeTweakerOpen(false)}
        themeMode={themeMode}
        onSelectTheme={(t) => setThemeMode(t)}
        textSizeMode={textSizeMode}
        onSelectTextSize={(s) => setTextSizeMode(s)}
        strokeWidth={strokeWidth}
        onSelectStrokeWidth={(w) => setStrokeWidth(w)}
        sfxEnabled={sfxEnabled}
        onToggleSfx={() => {
          const next = !sfxEnabled;
          setSfxEnabled(next);
        }}
        bgMusicEnabled={bgMusicEnabled}
        onToggleBgMusic={() => {
          const next = !bgMusicEnabled;
          setBgMusicEnabled(next);
        }}
        onReopenTour={() => setIsOnboardingTourOpen(true)}
        onResetAllProgress={handleResetAllProgress}
      />
    </div>
  );
};
