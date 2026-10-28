import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { LESSONS } from '../../content/learningPaths';
import { GeoScene, GeoPoint } from '../../types/geometry';
import { distance, inspectGeometryScene, GeometricInspectionResult } from '../../geometry/engine';
import confetti from 'canvas-confetti';
import {
  Compass,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Calculator,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Palette,
  Check,
  Lock,
  Unlock,
  ShieldCheck,
  Award,
  Layers,
  HelpCircle,
  AlertCircle
} from 'lucide-react';

interface InteractiveLessonPlayerProps {
  initialLessonId?: string;
  onNavigateToStudio: (scene?: GeoScene, template?: 'none' | 'rosette' | 'seljuk8') => void;
}

export const InteractiveLessonPlayer: React.FC<InteractiveLessonPlayerProps> = ({
  initialLessonId = 'lesson-1',
  onNavigateToStudio,
}) => {
  const { t, lang } = useI18n();
  const isTr = lang === 'tr';

  const [currentStepIndex, setCurrentStepIndex] = useState(() => {
    const idx = LESSONS.findIndex(l => l.id === initialLessonId);
    return idx >= 0 ? idx : 0;
  });

  const [activeTab, setActiveTab] = useState<'do' | 'why' | 'math'>('do');
  const [completedSteps, setCompletedSteps] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem('patternlab_completed_steps');
      return stored ? JSON.parse(stored) : [0];
    } catch {
      return [0];
    }
  });

  // Canvas View controls
  const [zoom, setZoom] = useState<number>(0.85);
  const [showGuides, setShowGuides] = useState<boolean>(true);

  // Lesson 1: What is a Circle?
  const [l1Radius, setL1Radius] = useState<number>(0);
  const [l1IsCompleted, setL1IsCompleted] = useState<boolean>(false);

  // Lesson 2: Compass & Radius with manual measurement & mechanical aperture lock
  const [l2MeasuredRadius, setL2MeasuredRadius] = useState<number>(25); // Starts closed at 25px
  const [l2CompassLocked, setL2CompassLocked] = useState<boolean>(false);
  const [l2CompassPosition, setL2CompassPosition] = useState<'c1' | 'c2'>('c1');
  const [l2Radius, setL2Radius] = useState<number>(0);
  const [l2LockNotice, setL2LockNotice] = useState<string | null>(null);
  const [l2IsCompleted, setL2IsCompleted] = useState<boolean>(false);

  // Lesson 3: Overlapping Circles (Vesica Piscis)
  const [l3Radius, setL3Radius] = useState<number>(0);
  const [l3IsCompleted, setL3IsCompleted] = useState<boolean>(false);

  // Lesson 4: 6-Petal Rosette (Step-by-step compass drawing)
  const [l4Circles, setL4Circles] = useState<{ id: string; cx: number; cy: number; r: number }[]>([
    { id: 'c0', cx: 300, cy: 300, r: 110 }
  ]);
  const [l4DraggingNotch, setL4DraggingNotch] = useState<number | null>(null);
  const [l4CurrentR, setL4CurrentR] = useState<number>(0);
  const [l4IsCompleted, setL4IsCompleted] = useState<boolean>(false);

  // Lesson 5: Guide Lines & Inscribed Star (Interactive chord drawing with persistent guides)
  const [l5Lines, setL5Lines] = useState<[number, number][]>([]);
  const [l5DragStartVertex, setL5DragStartVertex] = useState<number | null>(null);
  const [l5SelectedVertex, setL5SelectedVertex] = useState<number | null>(null);
  const [l5HideCircles, setL5HideCircles] = useState<boolean>(false);
  const [l5IsCompleted, setL5IsCompleted] = useState<boolean>(false);

  // Lesson 6: Rotation Discovery (0 - 90 deg)
  const [l6Angle, setL6Angle] = useState<number>(15);
  const [l6IsCompleted, setL6IsCompleted] = useState<boolean>(false);

  // Lesson 7: Eight-Point Star (Interactive vertex connection & facet carving)
  const [l7ShowBase, setL7ShowBase] = useState<boolean>(true);
  const [l7ShowRot, setL7ShowRot] = useState<boolean>(true);
  const [l7Facets, setL7Facets] = useState<number[]>([]);
  const [l7Lines, setL7Lines] = useState<[number, number][]>([]);
  const [l7SelectedVertex, setL7SelectedVertex] = useState<number | null>(null);
  const [l7IsCompleted, setL7IsCompleted] = useState<boolean>(false);

  // Lesson 8: Synthesis Challenge & Accuracy Inspector ("Doğru yaptım mı nasıl anlayacağım?")
  const [l8Challenge, setL8Challenge] = useState<'rosette' | 'seljuk8' | 'free'>('rosette');
  const [l8Verified, setL8Verified] = useState<boolean>(false);
  const [l8ShowExplanation, setL8ShowExplanation] = useState<boolean>(false);
  const [l8Scene, setL8Scene] = useState<GeoScene>(() => {
    const pts: GeoPoint[] = [{ id: 'p-origin', x: 300, y: 300, label: 'O', isAnchor: true }];
    const circs = [{ id: 'c-main', centerId: 'p-origin', radius: 110, stroke: '#087D86', strokeWidth: 2.5 }];
    for (let i = 0; i < 6; i++) {
      const ang = (i * 60) * (Math.PI / 180);
      const pid = `p-rim-${i}`;
      pts.push({ id: pid, x: 300 + 110 * Math.cos(ang), y: 300 + 110 * Math.sin(ang), label: `P${i + 1}` });
      circs.push({ id: `c-outer-${i}`, centerId: pid, radius: 110, stroke: '#D89A43', strokeWidth: 2.5 });
    }
    return { points: pts, segments: [], circles: circs, polygons: [] };
  });
  const [l8Inspection, setL8Inspection] = useState<GeometricInspectionResult | null>(null);

  // General drawing pointer tracking
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [currentMouse, setCurrentMouse] = useState<{ x: number; y: number } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const currentLesson = LESSONS[currentStepIndex];

  // ViewBox coordinates
  const baseDim = 600;
  const viewW = baseDim / zoom;
  const viewH = baseDim / zoom;
  const minX = 300 - viewW / 2;
  const minY = 300 - viewH / 2;
  const viewBoxStr = `${minX.toFixed(2)} ${minY.toFixed(2)} ${viewW.toFixed(2)} ${viewH.toFixed(2)}`;

  // Convert client pointer coordinates to SVG coordinate space
  const getSvgCoordinates = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 300, y: 300 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = minX + ((e.clientX - rect.left) / rect.width) * viewW;
    const y = minY + ((e.clientY - rect.top) / rect.height) * viewH;
    return { x, y };
  }, [minX, minY, viewW, viewH]);

  // Mark step complete and trigger confetti
  const markStepComplete = useCallback((stepIdx: number) => {
    setCompletedSteps(prev => {
      const updated = Array.from(new Set([...prev, stepIdx]));
      try {
        localStorage.setItem('patternlab_completed_steps', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    // Multi-burst confetti
    confetti({
      particleCount: 55,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#087D86', '#D89A43', '#DCEDED', '#F4D06F'],
    });
  }, []);

  // Pointer Down handler
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const coords = getSvgCoordinates(e);

    // STEP 2: Compass Aperture Measurement & Transfer
    if (currentStepIndex === 1) {
      if (l2CompassPosition === 'c1') {
        const c1 = { x: 175, y: 300 };
        const leadPt = { x: 175 + (l2CompassLocked ? 85 : l2MeasuredRadius), y: 300 };
        // User clicking lead leg or dragging to measure C1
        if (distance(coords, leadPt) < 45 || distance(coords, c1) < 130) {
          if (!l2CompassLocked) {
            setIsDrawing(true);
            setDragStart(c1);
            setCurrentMouse(coords);
            return;
          }
        }
      } else if (l2CompassPosition === 'c2') {
        const c2 = { x: 425, y: 300 };
        if (distance(coords, c2) < 130) {
          setIsDrawing(true);
          setDragStart(c2);
          setCurrentMouse(coords);
          return;
        }
      }
    }

    // STEP 4: Start dragging from notch to draw circle with compass
    if (currentStepIndex === 3) {
      const center = { x: 300, y: 300 };
      const R = 110;
      for (let i = 0; i < 6; i++) {
        const ang = (i * 60) * (Math.PI / 180);
        const notchX = center.x + R * Math.cos(ang);
        const notchY = center.y + R * Math.sin(ang);
        if (distance(coords, { x: notchX, y: notchY }) < 32) {
          setL4DraggingNotch(i);
          setL4CurrentR(20);
          setIsDrawing(true);
          setDragStart({ x: notchX, y: notchY });
          setCurrentMouse(coords);
          return;
        }
      }
    }

    // STEP 5: Start dragging or clicking vertex to draw star lines
    if (currentStepIndex === 4) {
      const center = { x: 300, y: 300 };
      const R = 110;
      for (let i = 0; i < 6; i++) {
        const ang = (i * 60) * (Math.PI / 180);
        const vx = center.x + R * Math.cos(ang);
        const vy = center.y + R * Math.sin(ang);
        if (distance(coords, { x: vx, y: vy }) < 30) {
          if (l5SelectedVertex === null) {
            setL5SelectedVertex(i);
            setL5DragStartVertex(i);
            setIsDrawing(true);
            setDragStart({ x: vx, y: vy });
            setCurrentMouse(coords);
            return;
          } else if (l5SelectedVertex === i) {
            setL5SelectedVertex(null);
            setL5DragStartVertex(null);
            return;
          } else {
            const v1 = Math.min(l5SelectedVertex, i);
            const v2 = Math.max(l5SelectedVertex, i);
            if (!l5Lines.some(([a, b]) => a === v1 && b === v2)) {
              const updated = [...l5Lines, [v1, v2] as [number, number]];
              setL5Lines(updated);
              if (updated.length >= 6) {
                setL5IsCompleted(true);
                markStepComplete(4);
              }
            }
            setL5SelectedVertex(null);
            setL5DragStartVertex(null);
            return;
          }
        }
      }
    }

    // STEP 7: Connect star vertices or carve facets with auto-completion
    if (currentStepIndex === 6) {
      const R_outer = 130;
      for (let i = 0; i < 8; i++) {
        const tipAng = (i * 45 - 90) * (Math.PI / 180);
        const tipX = 300 + R_outer * Math.cos(tipAng);
        const tipY = 300 + R_outer * Math.sin(tipAng);
        if (distance(coords, { x: tipX, y: tipY }) < 32) {
          if (l7SelectedVertex === null) {
            setL7SelectedVertex(i);
            return;
          } else if (l7SelectedVertex === i) {
            setL7SelectedVertex(null);
            return;
          } else {
            const v1 = Math.min(l7SelectedVertex, i);
            const v2 = Math.max(l7SelectedVertex, i);
            let updatedLines = l7Lines;
            if (!l7Lines.some(([a, b]) => a === v1 && b === v2)) {
              updatedLines = [...l7Lines, [v1, v2]];
              setL7Lines(updatedLines);
            }
            let updatedFacets = l7Facets;
            if (!l7Facets.includes(i)) {
              updatedFacets = [...updatedFacets, i];
            }
            if (!updatedFacets.includes(l7SelectedVertex)) {
              updatedFacets = [...updatedFacets, l7SelectedVertex];
            }
            setL7Facets(updatedFacets);
            setL7SelectedVertex(null);

            // Auto complete if all 8 chords or facets are completed
            if (updatedLines.length >= 8 || updatedFacets.length >= 8) {
              setL7IsCompleted(true);
              markStepComplete(6);
            }
            return;
          }
        }
      }
    }

    setIsDrawing(true);
    setDragStart(coords);
    setCurrentMouse(coords);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing || !dragStart) return;
    const coords = getSvgCoordinates(e);
    setCurrentMouse(coords);

    const dist = distance(dragStart, coords);

    // STEP 1: Snap to target R = 120
    if (currentStepIndex === 0) {
      if (Math.abs(dist - 120) < 18) {
        setL1Radius(120);
        if (!l1IsCompleted) {
          setL1IsCompleted(true);
          markStepComplete(0);
        }
      } else {
        setL1Radius(dist);
      }
    }

    // STEP 2: Dragging aperture on C1 or swinging circle on C2
    if (currentStepIndex === 1) {
      if (l2CompassPosition === 'c1' && !l2CompassLocked) {
        const d = distance({ x: 175, y: 300 }, coords);
        if (Math.abs(d - 85) < 7) {
          setL2MeasuredRadius(85);
          setL2LockNotice(null);
        } else {
          setL2MeasuredRadius(Math.max(20, Math.min(130, d)));
        }
      } else if (l2CompassPosition === 'c2' && l2CompassLocked) {
        const d = distance({ x: 425, y: 300 }, coords);
        if (Math.abs(d - 85) < 18 || d > 65) {
          setL2Radius(85);
          if (!l2IsCompleted) {
            setL2IsCompleted(true);
            markStepComplete(1);
          }
        } else {
          setL2Radius(d);
        }
      }
    }

    // STEP 3: Overlapping circles (snap to R = 120)
    if (currentStepIndex === 2) {
      if (Math.abs(dist - 120) < 18) {
        setL3Radius(120);
        if (!l3IsCompleted) {
          setL3IsCompleted(true);
          markStepComplete(2);
        }
      } else {
        setL3Radius(dist);
      }
    }

    // STEP 4: Compass dragging for outer circles
    if (currentStepIndex === 3 && l4DraggingNotch !== null) {
      if (Math.abs(dist - 110) < 22) {
        setL4CurrentR(110);
      } else {
        setL4CurrentR(dist);
      }
    }
  };

  const handlePointerUp = () => {
    // STEP 2: Magnet snap if close
    if (currentStepIndex === 1 && l2CompassPosition === 'c1') {
      if (Math.abs(l2MeasuredRadius - 85) < 7) {
        setL2MeasuredRadius(85);
      }
    }

    // STEP 4: Finish drawing circle from notch
    if (currentStepIndex === 3 && l4DraggingNotch !== null) {
      const center = { x: 300, y: 300 };
      const R = 110;
      const i = l4DraggingNotch;
      const ang = (i * 60) * (Math.PI / 180);
      const nx = center.x + R * Math.cos(ang);
      const ny = center.y + R * Math.sin(ang);

      if (l4CurrentR > 60) {
        if (!l4Circles.some(c => distance({ x: c.cx, y: c.cy }, { x: nx, y: ny }) < 15)) {
          const next = [...l4Circles, { id: `c-outer-${i}`, cx: nx, cy: ny, r: R }];
          setL4Circles(next);
          if (next.length === 7) {
            setL4IsCompleted(true);
            markStepComplete(3);
          }
        }
      }
      setL4DraggingNotch(null);
      setL4CurrentR(0);
    }

    // STEP 5: Connect lines between vertices on drag release
    if (currentStepIndex === 4 && l5DragStartVertex !== null && currentMouse) {
      const center = { x: 300, y: 300 };
      const R = 110;
      for (let j = 0; j < 6; j++) {
        if (j !== l5DragStartVertex) {
          const ang = (j * 60) * (Math.PI / 180);
          const vx = center.x + R * Math.cos(ang);
          const vy = center.y + R * Math.sin(ang);
          if (distance(currentMouse, { x: vx, y: vy }) < 32) {
            const v1 = Math.min(l5DragStartVertex, j);
            const v2 = Math.max(l5DragStartVertex, j);
            if (!l5Lines.some(([a, b]) => a === v1 && b === v2)) {
              const updated = [...l5Lines, [v1, v2] as [number, number]];
              setL5Lines(updated);
              if (updated.length >= 6) {
                setL5IsCompleted(true);
                markStepComplete(4);
              }
            }
            break;
          }
        }
      }
      setL5DragStartVertex(null);
    }

    setIsDrawing(false);
    setDragStart(null);
    setCurrentMouse(null);
  };

  // Undo last action for step 4, 5, 7
  const canUndo =
    (currentStepIndex === 3 && l4Circles.length > 1) ||
    (currentStepIndex === 4 && l5Lines.length > 0) ||
    (currentStepIndex === 6 && (l7Lines.length > 0 || l7Facets.length > 0));

  const handleUndo = () => {
    if (currentStepIndex === 3) {
      if (l4Circles.length > 1) {
        setL4Circles(prev => prev.slice(0, -1));
        setL4IsCompleted(false);
      }
    } else if (currentStepIndex === 4) {
      if (l5Lines.length > 0) {
        setL5Lines(prev => prev.slice(0, -1));
        setL5IsCompleted(false);
      }
    } else if (currentStepIndex === 6) {
      if (l7Lines.length > 0) {
        setL7Lines(prev => prev.slice(0, -1));
        setL7IsCompleted(false);
      } else if (l7Facets.length > 0) {
        setL7Facets(prev => prev.slice(0, -1));
        setL7IsCompleted(false);
      }
    }
  };

  // Reset current step
  const handleResetCurrentStep = () => {
    if (currentStepIndex === 0) {
      setL1Radius(0);
      setL1IsCompleted(false);
    } else if (currentStepIndex === 1) {
      setL2MeasuredRadius(25);
      setL2CompassLocked(false);
      setL2CompassPosition('c1');
      setL2Radius(0);
      setL2LockNotice(null);
      setL2IsCompleted(false);
    } else if (currentStepIndex === 2) {
      setL3Radius(0);
      setL3IsCompleted(false);
    } else if (currentStepIndex === 3) {
      setL4Circles([{ id: 'c0', cx: 300, cy: 300, r: 110 }]);
      setL4DraggingNotch(null);
      setL4CurrentR(0);
      setL4IsCompleted(false);
    } else if (currentStepIndex === 4) {
      setL5Lines([]);
      setL5DragStartVertex(null);
      setL5SelectedVertex(null);
      setL5HideCircles(false);
      setL5IsCompleted(false);
    } else if (currentStepIndex === 5) {
      setL6Angle(15);
      setL6IsCompleted(false);
    } else if (currentStepIndex === 6) {
      setL7Facets([]);
      setL7Lines([]);
      setL7SelectedVertex(null);
      setL7IsCompleted(false);
    } else if (currentStepIndex === 7) {
      setL8Verified(false);
      setL8Inspection(null);
    }
  };

  // Lesson 5: Auto draw star chords
  const handleL5ConnectStar = () => {
    const allLines: [number, number][] = [
      [0, 2], [2, 4], [0, 4], // Triangle 1
      [1, 3], [3, 5], [1, 5], // Triangle 2
    ];
    setL5Lines(allLines);
    setL5IsCompleted(true);
    markStepComplete(4);
  };

  // Lesson 6: Rotation angle change with magnetic 45 deg snap
  const handleAngleChange = (newVal: number) => {
    if (Math.abs(newVal - 45) <= 3) {
      setL6Angle(45);
      if (!l6IsCompleted) {
        setL6IsCompleted(true);
        markStepComplete(5);
      }
    } else {
      setL6Angle(newVal);
    }
  };

  // Lesson 7: Carve facet or complete all
  const handleL7ToggleFacet = (idx: number) => {
    if (!l7Facets.includes(idx)) {
      const next = [...l7Facets, idx];
      setL7Facets(next);
      if (next.length === 8) {
        setL7IsCompleted(true);
        markStepComplete(6);
      }
    }
  };

  const handleL7CompleteAll = () => {
    setL7Facets([0, 1, 2, 3, 4, 5, 6, 7]);
    setL7Lines([
      [0, 1], [1, 2], [2, 3], [3, 4],
      [4, 5], [5, 6], [6, 7], [7, 0]
    ]);
    setL7IsCompleted(true);
    markStepComplete(6);
  };

  // Lesson 8: Challenge selection and verification
  const handleL8LoadChallenge = (challenge: 'rosette' | 'seljuk8' | 'free') => {
    setL8Challenge(challenge);
    setL8Verified(false);
    if (challenge === 'rosette') {
      const pts: GeoPoint[] = [{ id: 'p-origin', x: 300, y: 300, label: 'O', isAnchor: true }];
      const circs = [{ id: 'c-main', centerId: 'p-origin', radius: 110, stroke: '#087D86', strokeWidth: 2.5 }];
      for (let i = 0; i < 6; i++) {
        const ang = (i * 60) * (Math.PI / 180);
        const pid = `p-rim-${i}`;
        pts.push({ id: pid, x: 300 + 110 * Math.cos(ang), y: 300 + 110 * Math.sin(ang), label: `P${i + 1}` });
        circs.push({ id: `c-outer-${i}`, centerId: pid, radius: 110, stroke: '#D89A43', strokeWidth: 2.5 });
      }
      const scene: GeoScene = { points: pts, segments: [], circles: circs, polygons: [] };
      setL8Scene(scene);
      setL8Inspection(inspectGeometryScene(scene, lang));
    } else if (challenge === 'seljuk8') {
      const pts: GeoPoint[] = [{ id: 'p-origin', x: 300, y: 300, label: 'O', isAnchor: true }];
      const polys = [
        { id: 'poly-1', centerId: 'p-origin', sides: 4, radius: 130, rotationDeg: 0, stroke: '#087D86', strokeWidth: 2.5 },
        { id: 'poly-2', centerId: 'p-origin', sides: 4, radius: 130, rotationDeg: 45, stroke: '#D89A43', strokeWidth: 2.5 }
      ];
      const scene: GeoScene = { points: pts, segments: [], circles: [{ id: 'c-guide', centerId: 'p-origin', radius: 130, stroke: '#60757C', strokeWidth: 1.5, strokeDasharray: '4 4' }], polygons: polys };
      setL8Scene(scene);
      setL8Inspection(inspectGeometryScene(scene, lang));
    } else {
      const scene: GeoScene = { points: [{ id: 'p-origin', x: 300, y: 300, label: 'O', isAnchor: true }], segments: [], circles: [], polygons: [] };
      setL8Scene(scene);
      setL8Inspection(inspectGeometryScene(scene, lang));
    }
  };

  const handleL8RunInspection = () => {
    const res = inspectGeometryScene(l8Scene, lang);
    setL8Inspection(res);
    if (res.score >= 80) {
      setL8Verified(true);
      markStepComplete(7);
    }
  };

  // Transfer current step to Studio with background watermark template
  const handleTransferToStudio = () => {
    const pts: GeoPoint[] = [{ id: 'p0', x: 300, y: 300, label: 'O' }];
    const circs: any[] = [];
    let template: 'none' | 'rosette' | 'seljuk8' = 'rosette';

    if (currentStepIndex >= 5) {
      template = 'seljuk8';
    } else {
      template = 'rosette';
    }

    if (currentStepIndex === 3 || l4IsCompleted) {
      l4Circles.forEach((c, idx) => {
        const pid = `p-${idx}`;
        pts.push({ id: pid, x: c.cx, y: c.cy, label: `P${idx}` });
        circs.push({
          id: `c-${idx}`,
          centerId: pid,
          radius: c.r,
          stroke: idx === 0 ? '#087D86' : '#D89A43',
          strokeWidth: 2.5,
        });
      });
    }

    onNavigateToStudio(
      {
        points: pts,
        segments: [],
        circles: circs,
        polygons: [],
      },
      template
    );
  };

  // Is current step marked as completed?
  const isCurrentStepDone =
    (currentStepIndex === 0 && l1IsCompleted) ||
    (currentStepIndex === 1 && l2IsCompleted) ||
    (currentStepIndex === 2 && l3IsCompleted) ||
    (currentStepIndex === 3 && l4IsCompleted) ||
    (currentStepIndex === 4 && l5IsCompleted) ||
    (currentStepIndex === 5 && l6IsCompleted) ||
    (currentStepIndex === 6 && l7IsCompleted) ||
    (currentStepIndex === 7 && l8Verified);

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-5 md:p-6 space-y-5">
      {/* 8-STEP HORIZONTAL PROGRESS STEPPER */}
      <div className="bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-3 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#087D86] animate-pulse" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#14313F]">
              {t('learningJourney')}
            </h2>
          </div>
          <span className="text-xs font-mono font-bold text-[#087D86] px-2.5 py-1 rounded-full bg-[#DCEDED]">
            {isTr ? `Adım ${currentStepIndex + 1} / 8` : `Step ${currentStepIndex + 1} of 8`}
          </span>
        </div>

        {/* Steps navigation pill list */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {LESSONS.map((lesson, idx) => {
            const isCurrent = idx === currentStepIndex;
            const isDone = completedSteps.includes(idx);

            return (
              <button
                key={lesson.id}
                type="button"
                onClick={() => setCurrentStepIndex(idx)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isCurrent
                    ? 'bg-[#087D86] text-white shadow-sm ring-2 ring-[#087D86]/30'
                    : isDone
                    ? 'bg-[#DCEDED] text-[#087D86] hover:bg-[#c9e6e6]'
                    : 'bg-[#F8F5EE] text-[#60757C] hover:bg-[#ede9df]'
                }`}
              >
                <span>#{idx + 1}</span>
                <span className="hidden sm:inline">
                  {isTr
                    ? lesson.titleTr.replace(/^\d+\.\s*/, '')
                    : lesson.titleEn.replace(/^\d+\.\s*/, '')}
                </span>
                {isDone && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* LESSON INVITATION & TITLE CARD */}
      <div className="bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-[#DCEDED] text-[#087D86] mb-1.5">
            <Compass className="w-3.5 h-3.5" />
            <span>
              {isTr ? `${currentStepIndex + 1}. Öğrenme Aşaması` : `Learning Stage ${currentStepIndex + 1}`}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-[#14313F]">
            {isTr ? currentLesson.titleTr : currentLesson.titleEn}
          </h1>
          <p className="text-xs sm:text-sm text-[#60757C] mt-1 max-w-2xl">
            {isTr ? currentLesson.invitationTr : currentLesson.invitationEn}
          </p>
        </div>

        {/* Stepper Buttons (Prev / Next) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentStepIndex(idx => Math.max(0, idx - 1))}
            disabled={currentStepIndex === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#E8E5DD] bg-white text-[#14313F] text-xs font-bold hover:bg-[#F8F5EE] disabled:opacity-35 transition cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('prevStep')}</span>
          </button>

          {currentStepIndex < 7 ? (
            <button
              type="button"
              onClick={() => setCurrentStepIndex(idx => Math.min(7, idx + 1))}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer shadow-sm ${
                isCurrentStepDone
                  ? 'bg-[#087D86] text-white hover:bg-[#08646C] ring-2 ring-[#087D86]/30'
                  : 'bg-white border border-[#E8E5DD] text-[#14313F] hover:bg-[#F8F5EE]'
              }`}
            >
              <span>{t('nextStep')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleTransferToStudio}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#087D86] text-white text-xs font-bold hover:bg-[#08646C] transition cursor-pointer shadow-sm"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>{t('openStudio')}</span>
            </button>
          )}
        </div>
      </div>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN: INTERACTIVE CANVAS WITH GHOST TARGET GUIDE */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          
          {/* ERGONOMIC HAND-LEVEL CONTROLS (Right beside/at canvas edge) */}
          <div className="bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-2.5 px-3 shadow-sm flex flex-wrap items-center justify-between gap-2">
            {/* Left: Prev Step, Quick Undo & Reset directly at hand */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Back / Previous Step Button ALWAYS at hand */}
              <button
                type="button"
                onClick={() => setCurrentStepIndex(idx => Math.max(0, idx - 1))}
                disabled={currentStepIndex === 0}
                title={t('prevStep')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E5DD] bg-white text-[#14313F] text-xs font-bold hover:bg-[#F8F5EE] disabled:opacity-35 transition cursor-pointer shadow-2xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('prevStep')}</span>
              </button>

              {/* Undo Last Line / Circle Button when canUndo */}
              {canUndo && (
                <button
                  type="button"
                  onClick={handleUndo}
                  title={t('undoLast')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#087D86]/40 bg-[#DCEDED]/50 text-[#087D86] text-xs font-bold hover:bg-[#DCEDED] active:scale-95 transition cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#087D86]" />
                  <span>{t('undo')}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleResetCurrentStep}
                title={t('reset')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E5DD] bg-white text-[#C23B22] text-xs font-bold hover:bg-[#FDF2F0] active:scale-95 transition cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#C23B22]" />
                <span>{t('reset')}</span>
              </button>

              {/* Ghost Target Legend */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F8F5EE] border border-[#E8E5DD] rounded-xl text-[11px] font-semibold text-[#60757C]">
                <span className="w-3 h-3 rounded-full border-2 border-dashed border-[#D89A43]" />
                <span>{t('ghostTargetLabel')}</span>
              </div>
            </div>

            {/* Right: Zoom In, Zoom Out, Fit View, Guides Toggle */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-[#F8F5EE] border border-[#E8E5DD] rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setZoom(z => Math.max(0.5, Math.round((z - 0.15) * 100) / 100))}
                  disabled={zoom <= 0.5}
                  title={t('zoomOut')}
                  className="p-1 px-2 rounded-lg text-[#14313F] hover:bg-white disabled:opacity-35 transition cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => setZoom(0.85)}
                  title={t('fitAll')}
                  className="px-2 py-0.5 text-xs font-mono font-bold text-[#087D86] hover:bg-white rounded-lg transition cursor-pointer"
                >
                  %{Math.round(zoom * 100)}
                </button>

                <button
                  type="button"
                  onClick={() => setZoom(z => Math.min(1.4, Math.round((z + 0.15) * 100) / 100))}
                  disabled={zoom >= 1.4}
                  title={t('zoomIn')}
                  className="p-1 px-2 rounded-lg text-[#14313F] hover:bg-white disabled:opacity-35 transition cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setZoom(0.75)}
                title={t('fitAll')}
                className="p-1.5 px-2 rounded-xl border border-[#E8E5DD] bg-white text-[#60757C] hover:text-[#087D86] text-xs font-bold transition cursor-pointer shadow-2xs"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setShowGuides(!showGuides)}
                title={showGuides ? 'Kılavuzları Gizle' : 'Kılavuzları Göster'}
                className={`p-1.5 px-2 rounded-xl border text-xs font-bold transition cursor-pointer shadow-2xs ${
                  showGuides
                    ? 'border-[#087D86] bg-[#DCEDED]/50 text-[#087D86]'
                    : 'border-[#E8E5DD] bg-white text-[#60757C]'
                }`}
              >
                {showGuides ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Canvas SVG Container */}
          <div
            className={`bg-[#FFFDF8] border rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center relative min-h-[460px] shadow-sm overflow-hidden transition-all duration-500 ${
              isCurrentStepDone ? 'border-[#087D86] canvas-perfect-glow' : 'border-[#E8E5DD]'
            }`}
          >
            {/* Grid background */}
            <div className="absolute inset-0 bg-geo-dots pointer-events-none opacity-50" />

            {/* SVG Drawing Canvas */}
            <svg
              ref={svgRef}
              viewBox={viewBoxStr}
              className="w-full max-w-[500px] aspect-square relative z-10 cursor-crosshair geometry-canvas-touch border border-[#E8E5DD]/70 rounded-xl bg-white shadow-inner transition-transform duration-200"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {/* Background guide axes centered at (300, 300) */}
              {showGuides && (
                <g opacity="0.2">
                  <line x1="-200" y1="300" x2="800" y2="300" stroke="#60757C" strokeWidth="1" strokeDasharray="5 5" />
                  <line x1="300" y1="-200" x2="300" y2="800" stroke="#60757C" strokeWidth="1" strokeDasharray="5 5" />
                </g>
              )}

              {/* ======================================================== */}
              {/* STEP 1: ÇEMBER NEDİR? (Clean text badges & zero overlap) */}
              {/* ======================================================== */}
              {currentStepIndex === 0 && (
                <g>
                  {/* Transparent Ghost Target Guide: Circle R = 120 */}
                  <circle
                    cx="300"
                    cy="300"
                    r="120"
                    fill="rgba(216, 154, 67, 0.05)"
                    stroke="#D89A43"
                    strokeWidth="2.5"
                    strokeDasharray="6 6"
                    opacity="0.65"
                  />
                  {/* Target text badge */}
                  <g transform="translate(190, 138)">
                    <rect x="0" y="0" width="220" height="26" rx="6" fill="#FFFDF8" stroke="#D89A43" strokeWidth="1.5" />
                    <text x="110" y="18" textAnchor="middle" className="text-[14px] font-bold fill-[#D89A43] select-none">
                      {isTr ? 'Hedef Çember (R = 120px)' : 'Target Circle (R = 120px)'}
                    </text>
                  </g>

                  {/* Center Anchor Point */}
                  <circle cx="300" cy="300" r="5.5" fill="#087D86" stroke="white" strokeWidth="2" />
                  
                  {/* Center badge placed safely BELOW point O at y=336 */}
                  <g transform="translate(245, 324)">
                    <rect x="0" y="0" width="110" height="24" rx="6" fill="white" stroke="#E8E5DD" opacity="0.95" />
                    <text x="55" y="17" textAnchor="middle" className="text-[13px] font-bold fill-[#14313F] select-none">
                      O (Merkez)
                    </text>
                  </g>

                  {/* User's drawn circle */}
                  {l1Radius > 0 && (
                    <g>
                      <circle
                        cx="300"
                        cy="300"
                        r={l1Radius}
                        fill={l1IsCompleted ? 'rgba(8, 125, 134, 0.08)' : 'none'}
                        stroke={l1IsCompleted ? '#087D86' : '#14313F'}
                        strokeWidth="3"
                        className="transition-colors duration-200"
                      />
                      {/* Radius indicator arrow */}
                      <line x1="300" y1="300" x2={300 + l1Radius} y2="300" stroke="#087D86" strokeWidth="2.5" />
                      <circle cx={300 + l1Radius} cy="300" r="4.5" fill="#087D86" />
                      
                      {/* Radius badge placed along the radius line with white background */}
                      <g transform={`translate(${260 + l1Radius / 2}, 264)`}>
                        <rect x="0" y="0" width="85" height="24" rx="6" fill="white" stroke="#087D86" strokeWidth="1.2" opacity="0.96" />
                        <text
                          x="42.5"
                          y="17"
                          textAnchor="middle"
                          className="text-[13px] font-mono font-bold fill-[#087D86] select-none"
                        >
                          R = {Math.round(l1Radius)}px
                        </text>
                      </g>
                    </g>
                  )}
                </g>
              )}

              {/* ======================================================== */}
              {/* STEP 2: PERGEL VE YARIÇAP (Kilitlenebilir Pergel Açıklığı) */}
              {/* ======================================================== */}
              {currentStepIndex === 1 && (
                <g>
                  {/* First reference circle C1 on left (R = 85) */}
                  <circle cx="175" cy="300" r="85" fill="rgba(8, 125, 134, 0.06)" stroke="#087D86" strokeWidth="2.5" />
                  <circle cx="175" cy="300" r="5" fill="#087D86" />
                  
                  {/* C1 Badge */}
                  <g transform="translate(125, 395)">
                    <rect x="0" y="0" width="100" height="24" rx="6" fill="white" stroke="#087D86" strokeWidth="1.2" />
                    <text x="50" y="17" textAnchor="middle" className="text-[13px] font-bold" fill="#087D86">
                      C₁ (R = 85px)
                    </text>
                  </g>

                  {/* Target guide for measuring C1 radius */}
                  <line x1="175" y1="300" x2="260" y2="300" stroke="#087D86" strokeWidth="1.5" strokeDasharray="3 3" />
                  <circle cx="260" cy="300" r="4" fill="none" stroke="#087D86" strokeWidth="1.5" />

                  {/* Dynamic Physical Compass */}
                  {(() => {
                    const isAtC1 = l2CompassPosition === 'c1';
                    const needleX = isAtC1 ? 175 : 425;
                    const needleY = 300;
                    const activeAperture = isAtC1 ? (l2CompassLocked ? 85 : l2MeasuredRadius) : 85;
                    const leadX = needleX + activeAperture;
                    const leadY = 300;
                    const hingeX = needleX + activeAperture / 2;
                    const legLen = 95;
                    const halfSpan = activeAperture / 2;
                    const hingeH = Math.sqrt(Math.max(2500, legLen * legLen - halfSpan * halfSpan));
                    const hingeY = 300 - hingeH;

                    return (
                      <g>
                        {/* Compass Legs */}
                        <line x1={hingeX} y1={hingeY} x2={needleX} y2={needleY} stroke="#14313F" strokeWidth="4" strokeLinecap="round" />
                        <line x1={hingeX} y1={hingeY} x2={leadX} y2={leadY} stroke="#14313F" strokeWidth="4" strokeLinecap="round" />
                        
                        {/* Needle point */}
                        <circle cx={needleX} cy={needleY} r="4.5" fill="#60757C" stroke="white" strokeWidth="1.5" />
                        
                        {/* Lead pencil point */}
                        <circle cx={leadX} cy={leadY} r="5" fill="#D89A43" stroke="white" strokeWidth="1.5" />
                        
                        {/* Drag target halo on pencil tip when measuring */}
                        {isAtC1 && !l2CompassLocked && (
                          <circle cx={leadX} cy={leadY} r="12" fill="none" stroke="#D89A43" strokeWidth="2" strokeDasharray="3 3" className="cursor-ew-resize" />
                        )}

                        {/* Top Hinge */}
                        <circle
                          cx={hingeX}
                          cy={hingeY}
                          r="9"
                          fill={l2CompassLocked ? '#087D86' : '#D89A43'}
                          stroke="white"
                          strokeWidth="2.5"
                        />

                        {/* Compass handle spindle */}
                        <line x1={hingeX} y1={hingeY} x2={hingeX} y2={hingeY - 14} stroke="#14313F" strokeWidth="3" strokeLinecap="round" />
                        <circle cx={hingeX} cy={hingeY - 14} r="4" fill="#60757C" />
                      </g>
                    );
                  })()}

                  {/* Measuring Readout & Lock Button over C1 */}
                  {l2CompassPosition === 'c1' && (
                    <g>
                      {/* Aperture live gauge */}
                      <g transform="translate(85, 175)">
                        <rect
                          x="0"
                          y="0"
                          width="180"
                          height="26"
                          rx="6"
                          fill={l2MeasuredRadius === 85 ? '#DCEDED' : '#FFFDF8'}
                          stroke={l2MeasuredRadius === 85 ? '#087D86' : '#D89A43'}
                          strokeWidth="1.5"
                        />
                        <text
                          x="90"
                          y="18"
                          textAnchor="middle"
                          className={`text-[12px] font-bold select-none ${l2MeasuredRadius === 85 ? 'fill-[#087D86]' : 'fill-[#D89A43]'}`}
                        >
                          {l2MeasuredRadius === 85
                            ? (isTr ? '✓ 85px Eşleşti! (Kilitleyin)' : '✓ 85px Matched! (Lock It)')
                            : (isTr ? `Pergeli Açın: ${Math.round(l2MeasuredRadius)}px / 85px` : `Open Compass: ${Math.round(l2MeasuredRadius)}px / 85px`)}
                        </text>
                      </g>

                      {/* Lock Button */}
                      {!l2CompassLocked ? (
                        <g
                          transform="translate(85, 208)"
                          onClick={() => {
                            if (l2MeasuredRadius === 85) {
                              setL2CompassLocked(true);
                              setL2LockNotice(null);
                            } else {
                              setL2LockNotice(isTr ? 'Önce pergeli 85px açıklığa (C₁ kenarına) kadar açın.' : 'Open compass to 85px (C₁ rim) first.');
                            }
                          }}
                          className="cursor-pointer"
                        >
                          <rect
                            x="0"
                            y="0"
                            width="180"
                            height="30"
                            rx="8"
                            fill={l2MeasuredRadius === 85 ? '#087D86' : '#FBF2E3'}
                            stroke={l2MeasuredRadius === 85 ? '#08646C' : '#D89A43'}
                            strokeWidth="1.8"
                          />
                          <text
                            x="90"
                            y="19"
                            textAnchor="middle"
                            className={`text-[12px] font-bold select-none ${l2MeasuredRadius === 85 ? 'fill-white' : 'fill-[#D89A43]'}`}
                          >
                            {isTr ? '🔒 Açıklığı Kilitle (85px)' : '🔒 Lock Aperture (85px)'}
                          </text>
                        </g>
                      ) : (
                        /* Move to C2 Action Button */
                        <g
                          transform="translate(160, 208)"
                          onClick={() => setL2CompassPosition('c2')}
                          className="cursor-pointer"
                        >
                          <rect x="0" y="0" width="220" height="32" rx="8" fill="#087D86" stroke="#08646C" strokeWidth="1.5" />
                          <text x="110" y="21" textAnchor="middle" className="text-[12px] font-bold fill-white select-none">
                            {isTr ? 'Pergeli C₂ Merkezine Taşı ➔' : 'Move Compass to C₂ ➔'}
                          </text>
                        </g>
                      )}
                    </g>
                  )}

                  {/* Second target circle C2 on right (R = 85) */}
                  <circle
                    cx="425"
                    cy="300"
                    r="85"
                    fill={l2CompassLocked ? 'rgba(216, 154, 67, 0.08)' : 'rgba(216, 154, 67, 0.03)'}
                    stroke={l2CompassLocked ? '#D89A43' : '#60757C'}
                    strokeWidth="2.5"
                    strokeDasharray={l2Radius >= 85 ? undefined : '6 6'}
                    opacity={l2CompassLocked ? 0.9 : 0.45}
                  />
                  <circle cx="425" cy="300" r="5" fill="#D89A43" />
                  
                  {/* C2 Badge */}
                  <g transform="translate(375, 395)">
                    <rect x="0" y="0" width="100" height="24" rx="6" fill="white" stroke="#D89A43" strokeWidth="1.2" />
                    <text x="50" y="17" textAnchor="middle" className="text-[13px] font-bold fill-[#D89A43]">
                      C₂ (Hedef Eş)
                    </text>
                  </g>

                  {/* Notice banner if warning */}
                  {l2LockNotice && (
                    <g transform="translate(130, 135)">
                      <rect x="0" y="0" width="340" height="28" rx="6" fill="#FEE2E2" stroke="#DC2626" strokeWidth="1.5" />
                      <text x="170" y="18" textAnchor="middle" className="text-[11px] font-bold fill-[#DC2626]">
                        ⚠️ {l2LockNotice}
                      </text>
                    </g>
                  )}

                  {/* Draw button over C2 when compass is at C2 and locked */}
                  {l2CompassPosition === 'c2' && l2CompassLocked && !l2IsCompleted && (
                    <g
                      transform="translate(325, 208)"
                      onClick={() => {
                        setL2Radius(85);
                        setL2IsCompleted(true);
                        markStepComplete(1);
                      }}
                      className="cursor-pointer"
                    >
                      <rect x="0" y="0" width="200" height="32" rx="8" fill="#087D86" stroke="#08646C" strokeWidth="1.5" />
                      <text x="100" y="21" textAnchor="middle" className="text-[12px] font-bold fill-white select-none">
                        {isTr ? '🎯 Kilitli Pergelle C₂\'yi Çiz' : '🎯 Draw C₂ with Locked Compass'}
                      </text>
                    </g>
                  )}

                  {/* User's drawn circle from C2 */}
                  {l2Radius > 0 && (
                    <g>
                      <circle
                        cx="425"
                        cy="300"
                        r={l2Radius}
                        fill={l2IsCompleted ? 'rgba(8, 125, 134, 0.08)' : 'none'}
                        stroke={l2IsCompleted ? '#087D86' : '#14313F'}
                        strokeWidth="3"
                      />
                      <line x1="425" y1="300" x2={425 + l2Radius} y2="300" stroke="#087D86" strokeWidth="2" />
                      <g transform={`translate(${385 + l2Radius / 2}, 310)`}>
                        <rect x="0" y="0" width="80" height="22" rx="5" fill="white" stroke="#087D86" opacity="0.95" />
                        <text
                          x="40"
                          y="16"
                          textAnchor="middle"
                          className="text-[12px] font-mono font-bold fill-[#087D86]"
                        >
                          R₂ = {Math.round(l2Radius)}px
                        </text>
                      </g>
                    </g>
                  )}

                  {/* Congruence Bar when verified */}
                  {l2IsCompleted && (
                    <g className="animate-fade-in">
                      <line x1="175" y1="165" x2="425" y2="165" stroke="#087D86" strokeWidth="2.5" strokeDasharray="5 5" />
                      <g transform="translate(180, 135)">
                        <rect x="0" y="0" width="240" height="26" rx="6" fill="#FFFDF8" stroke="#087D86" strokeWidth="1.5" />
                        <text x="120" y="18" textAnchor="middle" className="text-[13px] font-bold fill-[#087D86]">
                          R₁ = R₂ = 85px (Eş Çemberler)
                        </text>
                      </g>
                    </g>
                  )}
                </g>
              )}

              {/* ======================================================== */}
              {/* STEP 3: KESİŞEN EŞ ÇEMBERLER (VESICA PISCIS)              */}
              {/* ======================================================== */}
              {currentStepIndex === 2 && (
                <g>
                  {/* Circle 1 */}
                  <circle cx="240" cy="300" r="120" fill="none" stroke="#087D86" strokeWidth="2.5" />
                  <circle cx="240" cy="300" r="5.5" fill="#087D86" stroke="white" strokeWidth="2" />
                  
                  {/* C1 badge below circle line */}
                  <g transform="translate(215, 335)">
                    <rect x="0" y="0" width="50" height="24" rx="6" fill="white" stroke="#087D86" strokeWidth="1.5" />
                    <text x="25" y="17" textAnchor="middle" className="text-[14px] font-bold fill-[#087D86]">
                      C₁
                    </text>
                  </g>

                  {/* Rim point on Circle 1 where C2 is placed */}
                  <circle cx="360" cy="300" r="5.5" fill="#D89A43" stroke="white" strokeWidth="2" />
                  
                  {/* C2 badge below circle line */}
                  <g transform="translate(335, 335)">
                    <rect x="0" y="0" width="50" height="24" rx="6" fill="white" stroke="#D89A43" strokeWidth="1.5" />
                    <text x="25" y="17" textAnchor="middle" className="text-[14px] font-bold fill-[#D89A43]">
                      C₂
                    </text>
                  </g>

                  {/* Ghost Target: Circle 2 passing through C1 */}
                  <circle
                    cx="360"
                    cy="300"
                    r="120"
                    fill="none"
                    stroke="#D89A43"
                    strokeWidth="2.5"
                    strokeDasharray="6 6"
                    opacity="0.65"
                  />

                  {/* User drawn Circle 2 */}
                  {l3Radius > 0 && (
                    <circle
                      cx="360"
                      cy="300"
                      r={l3Radius}
                      fill="none"
                      stroke={l3IsCompleted ? '#087D86' : '#14313F'}
                      strokeWidth="3"
                    />
                  )}

                  {/* When snapped / completed: highlight Vesica Piscis & Equilateral triangle */}
                  {l3IsCompleted && (
                    <g className="animate-fade-in">
                      {/* Intersecting lens fill */}
                      <path
                        d="M 300,196.08 A 120 120 0 0 1 300,403.92 A 120 120 0 0 1 300,196.08 Z"
                        fill="rgba(216, 154, 67, 0.22)"
                        stroke="#D89A43"
                        strokeWidth="2"
                      />
                      {/* Equilateral triangle between C1, C2, and top intersection P */}
                      <polygon
                        points="240,300 360,300 300,196.08"
                        fill="none"
                        stroke="#087D86"
                        strokeWidth="2.5"
                        strokeDasharray="5 5"
                      />
                      <circle cx="300" cy="196.08" r="5" fill="#087D86" stroke="white" strokeWidth="2" />
                      
                      {/* Top text moved well clear of the vertex at y=145 */}
                      <g transform="translate(160, 140)">
                        <rect x="0" y="0" width="280" height="28" rx="6" fill="white" stroke="#087D86" strokeWidth="1.5" />
                        <text x="140" y="19" textAnchor="middle" className="text-[14px] font-bold fill-[#087D86]">
                          60° Eşkenar Üçgen (Equilateral)
                        </text>
                      </g>
                    </g>
                  )}
                </g>
              )}

              {/* ======================================================== */}
              {/* STEP 4: ALTI YAPRAKLI ÇİÇEK (Tek Tek Pergel Çizimi)      */}
              {/* ======================================================== */}
              {currentStepIndex === 3 && (
                <g>
                  {/* Center circle */}
                  <circle
                    cx="300"
                    cy="300"
                    r="110"
                    fill="rgba(8, 125, 134, 0.06)"
                    stroke="#087D86"
                    strokeWidth="3"
                  />
                  <circle cx="300" cy="300" r="5" fill="#087D86" />

                  {/* 6 Ghost Target Circles and Notch Drag Anchors */}
                  {[0, 60, 120, 180, 240, 300].map((deg, i) => {
                    const ang = (deg * Math.PI) / 180;
                    const nx = 300 + 110 * Math.cos(ang);
                    const ny = 300 + 110 * Math.sin(ang);
                    const isAdded = l4Circles.some(c => distance({ x: c.cx, y: c.cy }, { x: nx, y: ny }) < 15);

                    return (
                      <g key={deg}>
                        {!isAdded && (
                          <circle
                            cx={nx}
                            cy={ny}
                            r="110"
                            fill="none"
                            stroke="#D89A43"
                            strokeWidth="2"
                            strokeDasharray="5 5"
                            opacity="0.45"
                          />
                        )}
                        <circle
                          cx={nx}
                          cy={ny}
                          r={isAdded ? 5 : 7}
                          fill={isAdded ? '#087D86' : '#D89A43'}
                          stroke="white"
                          strokeWidth="2"
                          className={!isAdded ? 'cursor-grab active:cursor-grabbing animate-pulse' : ''}
                        />
                        {!isAdded && (
                          <text
                            x={nx + 12}
                            y={ny - 12}
                            className="text-[12px] font-bold fill-[#D89A43] select-none"
                          >
                            #{i + 1}
                          </text>
                        )}
                      </g>
                    );
                  })}

                  {/* Render Drawn Circles */}
                  {l4Circles.slice(1).map(c => (
                    <circle
                      key={c.id}
                      cx={c.cx}
                      cy={c.cy}
                      r={c.r}
                      fill="none"
                      stroke="#087D86"
                      strokeWidth="2.5"
                    />
                  ))}

                  {/* In-progress Dragging Compass Circle */}
                  {l4DraggingNotch !== null && l4CurrentR > 0 && (
                    (() => {
                      const ang = (l4DraggingNotch * 60) * (Math.PI / 180);
                      const nx = 300 + 110 * Math.cos(ang);
                      const ny = 300 + 110 * Math.sin(ang);
                      return (
                        <circle
                          cx={nx}
                          cy={ny}
                          r={l4CurrentR}
                          fill="none"
                          stroke="#D89A43"
                          strokeWidth="2.5"
                          strokeDasharray="4 4"
                        />
                      );
                    })()
                  )}

                  {/* Blooming Petals when all 6 drawn */}
                  {l4IsCompleted && (
                    <g className="animate-petal-bloom">
                      <polygon
                        points={Array.from({ length: 6 }).map((_, i) => {
                          const ang = (i * 60) * (Math.PI / 180);
                          return `${(300 + 110 * Math.cos(ang)).toFixed(1)},${(300 + 110 * Math.sin(ang)).toFixed(1)}`;
                        }).join(' ')}
                        fill="rgba(216, 154, 67, 0.2)"
                        stroke="#D89A43"
                        strokeWidth="2"
                      />
                    </g>
                  )}
                </g>
              )}

              {/* ======================================================== */}
              {/* STEP 5: DESEN ÇEŞİTLERİ (Kalıcı Kılavuzlar ve Kesişimler) */}
              {/* ======================================================== */}
              {currentStepIndex === 4 && (
                <g>
                  {/* Rosette Background Circles - KEPT PERSISTENTLY VISIBLE */}
                  {!l5HideCircles && (
                    <g opacity="0.45" className="transition-opacity duration-300">
                      <circle cx="300" cy="300" r="110" fill="rgba(8, 125, 134, 0.04)" stroke="#087D86" strokeWidth="2" />
                      {[0, 60, 120, 180, 240, 300].map(deg => {
                        const ang = (deg * Math.PI) / 180;
                        return (
                          <circle
                            key={deg}
                            cx={300 + 110 * Math.cos(ang)}
                            cy={300 + 110 * Math.sin(ang)}
                            r="110"
                            fill="none"
                            stroke="#60757C"
                            strokeWidth="1.8"
                          />
                        );
                      })}
                    </g>
                  )}

                  {/* PERSISTENT TARGET GUIDE CHORDS (NEVER WIPED OUT DURING DRAWING) */}
                  {[
                    [0, 2], [2, 4], [0, 4], // Triangle 1
                    [1, 3], [3, 5], [1, 5], // Triangle 2
                  ].map(([a, b], idx) => {
                    const isAlreadyDrawn = l5Lines.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
                    if (isAlreadyDrawn) return null;
                    const angA = (a * 60) * (Math.PI / 180);
                    const angB = (b * 60) * (Math.PI / 180);
                    return (
                      <line
                        key={`guide-chord-${idx}`}
                        x1={300 + 110 * Math.cos(angA)}
                        y1={300 + 110 * Math.sin(angA)}
                        x2={300 + 110 * Math.cos(angB)}
                        y2={300 + 110 * Math.sin(angB)}
                        stroke="#D89A43"
                        strokeWidth="2.5"
                        strokeDasharray="6 6"
                        opacity="0.75"
                      />
                    );
                  })}

                  {/* In-progress Dragging Line / Interactive Beam */}
                  {(l5DragStartVertex !== null || l5SelectedVertex !== null) && currentMouse && (
                    (() => {
                      const activeV = l5DragStartVertex !== null ? l5DragStartVertex : l5SelectedVertex!;
                      const ang = (activeV * 60) * (Math.PI / 180);
                      const vx = 300 + 110 * Math.cos(ang);
                      const vy = 300 + 110 * Math.sin(ang);
                      return (
                        <line
                          x1={vx}
                          y1={vy}
                          x2={currentMouse.x}
                          y2={currentMouse.y}
                          stroke="#087D86"
                          strokeWidth="3.5"
                          strokeDasharray="4 4"
                        />
                      );
                    })()
                  )}

                  {/* Drawn Solid Connected Chords */}
                  {l5Lines.map(([a, b], idx) => {
                    const angA = (a * 60) * (Math.PI / 180);
                    const angB = (b * 60) * (Math.PI / 180);
                    return (
                      <line
                        key={`drawn-${idx}`}
                        x1={300 + 110 * Math.cos(angA)}
                        y1={300 + 110 * Math.sin(angA)}
                        x2={300 + 110 * Math.cos(angB)}
                        y2={300 + 110 * Math.sin(angB)}
                        stroke="#087D86"
                        strokeWidth="3.8"
                        strokeLinecap="round"
                      />
                    );
                  })}

                  {/* 6 Peripheral Vertex Anchors with Click & Drag Support */}
                  {Array.from({ length: 6 }).map((_, i) => {
                    const ang = (i * 60) * (Math.PI / 180);
                    const vx = 300 + 110 * Math.cos(ang);
                    const vy = 300 + 110 * Math.sin(ang);
                    const isSelected = l5SelectedVertex === i;

                    return (
                      <g
                        key={i}
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (l5SelectedVertex === null) {
                            setL5SelectedVertex(i);
                          } else if (l5SelectedVertex === i) {
                            setL5SelectedVertex(null);
                          } else {
                            const v1 = Math.min(l5SelectedVertex, i);
                            const v2 = Math.max(l5SelectedVertex, i);
                            if (!l5Lines.some(([a, b]) => a === v1 && b === v2)) {
                              const updated = [...l5Lines, [v1, v2] as [number, number]];
                              setL5Lines(updated);
                              if (updated.length >= 6) {
                                setL5IsCompleted(true);
                                markStepComplete(4);
                              }
                            }
                            setL5SelectedVertex(null);
                          }
                        }}
                      >
                        {/* Selected halo without broken SVG transform scaling */}
                        {isSelected && (
                          <circle cx={vx} cy={vy} r="13" fill="none" stroke="#087D86" strokeWidth="2.5" strokeDasharray="3 3" opacity="0.9" />
                        )}
                        <circle
                          cx={vx}
                          cy={vy}
                          r={isSelected ? 8.5 : 7}
                          fill={isSelected ? '#087D86' : '#D89A43'}
                          stroke="white"
                          strokeWidth="2.5"
                          className="hover:scale-125 transition-transform"
                        />
                        {/* Vertex Label */}
                        <g transform={`translate(${300 + 132 * Math.cos(ang) - 12}, ${300 + 132 * Math.sin(ang) - 10})`}>
                          <rect x="0" y="0" width="24" height="20" rx="4" fill="white" stroke="#E8E5DD" opacity="0.9" />
                          <text
                            x="12"
                            y="14"
                            textAnchor="middle"
                            className="text-[12px] font-bold fill-[#14313F] select-none pointer-events-none"
                          >
                            V{i}
                          </text>
                        </g>
                      </g>
                    );
                  })}

                  {/* When complete: highlight the star & inner hexagon */}
                  {l5IsCompleted && (
                    <g className="animate-fade-in">
                      <polygon points="410,300 245,490.5 245,109.5" fill="rgba(8, 125, 134, 0.12)" stroke="#087D86" strokeWidth="3" />
                      <polygon points="190,300 355,109.5 355,490.5" fill="rgba(8, 125, 134, 0.12)" stroke="#087D86" strokeWidth="3" />
                      <polygon points="355,300 327.5,347.6 272.5,347.6 245,300 272.5,252.4 327.5,252.4" fill="rgba(216, 154, 67, 0.25)" stroke="#D89A43" strokeWidth="2" />
                    </g>
                  )}
                </g>
              )}

              {/* ======================================================== */}
              {/* STEP 6: DÖNDÜRME KEŞFİ                                  */}
              {/* ======================================================== */}
              {currentStepIndex === 5 && (
                <g>
                  {/* Ghost 45 deg Target Octagram Guide */}
                  <g opacity="0.45">
                    <rect x="220" y="220" width="160" height="160" fill="none" stroke="#60757C" strokeWidth="1.5" />
                    <rect
                      x="220"
                      y="220"
                      width="160"
                      height="160"
                      transform="rotate(45 300 300)"
                      fill="none"
                      stroke="#D89A43"
                      strokeWidth="2"
                      strokeDasharray="5 5"
                    />
                  </g>

                  {/* Base Square at 0 deg */}
                  <rect x="220" y="220" width="160" height="160" fill="none" stroke="#087D86" strokeWidth="2.5" />

                  {/* Rotated Square at l6Angle */}
                  <rect
                    x="220"
                    y="220"
                    width="160"
                    height="160"
                    transform={`rotate(${l6Angle} 300 300)`}
                    fill={l6Angle === 45 ? 'rgba(8, 125, 134, 0.12)' : 'none'}
                    stroke={l6Angle === 45 ? '#08646C' : '#D89A43'}
                    strokeWidth={l6Angle === 45 ? 3 : 2.5}
                    className="transition-transform duration-150"
                  />

                  {/* 8 Corner Direction Rays when near/at 45 deg */}
                  {l6Angle === 45 && (
                    <g className="animate-fade-in">
                      {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
                        const rad = ((deg + 45) * Math.PI) / 180;
                        return (
                          <line
                            key={deg}
                            x1="300"
                            y1="300"
                            x2={300 + 140 * Math.cos(rad)}
                            y2={300 + 140 * Math.sin(rad)}
                            stroke="#D89A43"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                          />
                        );
                      })}
                    </g>
                  )}

                  <circle cx="300" cy="300" r="4.5" fill="#14313F" />
                </g>
              )}

              {/* ======================================================== */}
              {/* STEP 7: SEKİZ KÖŞELİ YILDIZ (Köşeleri Birleştir & Doldur) */}
              {/* ======================================================== */}
              {currentStepIndex === 6 && (
                <g>
                  {/* Guide Circle */}
                  <circle cx="300" cy="300" r="130" fill="none" stroke="#60757C" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.4" />

                  {/* Base Square 0° */}
                  {l7ShowBase && (
                    <rect x="208" y="208" width="184" height="184" fill="none" stroke="#087D86" strokeWidth="2.2" opacity="0.65" />
                  )}

                  {/* Rotated Square 45° */}
                  {l7ShowRot && (
                    <rect
                      x="208"
                      y="208"
                      width="184"
                      height="184"
                      transform="rotate(45 300 300)"
                      fill="none"
                      stroke="#D89A43"
                      strokeWidth="2.2"
                      opacity="0.65"
                    />
                  )}

                  {/* PERSISTENT 8-POINTED STAR GUIDELINE PERIMETER */}
                  {(() => {
                    const R_outer = 130;
                    const R_inner = 130 * (Math.SQRT2 - 1);
                    const ptsStr = Array.from({ length: 16 }).map((_, i) => {
                      const isOuter = i % 2 === 0;
                      const idx = Math.floor(i / 2);
                      const ang = isOuter
                        ? (idx * 45 - 90) * (Math.PI / 180)
                        : (idx * 45 + 22.5 - 90) * (Math.PI / 180);
                      const r = isOuter ? R_outer : R_inner;
                      return `${(300 + r * Math.cos(ang)).toFixed(1)},${(300 + r * Math.sin(ang)).toFixed(1)}`;
                    }).join(' ');

                    return (
                      <polygon
                        points={ptsStr}
                        fill={l7IsCompleted || l7Facets.length >= 8 ? 'rgba(8, 125, 134, 0.25)' : 'rgba(216, 154, 67, 0.05)'}
                        stroke={l7IsCompleted || l7Facets.length >= 8 ? '#087D86' : '#D89A43'}
                        strokeWidth={l7IsCompleted ? 3.5 : 2}
                        strokeDasharray={l7IsCompleted || l7Facets.length >= 8 ? undefined : '5 5'}
                      />
                    );
                  })()}

                  {/* PERSISTENT TIP-TO-TIP GUIDE CHORDS (T0-T7) */}
                  {/* Square 1 Guide Chords: T0 - T2 - T4 - T6 */}
                  {[
                    [0, 2], [2, 4], [4, 6], [6, 0]
                  ].map(([a, b], idx) => {
                    const isAlreadyDrawn = l7Lines.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
                    if (isAlreadyDrawn) return null;
                    const angA = (a * 45 - 90) * (Math.PI / 180);
                    const angB = (b * 45 - 90) * (Math.PI / 180);
                    return (
                      <line
                        key={`sq1-guide-${idx}`}
                        x1={300 + 130 * Math.cos(angA)}
                        y1={300 + 130 * Math.sin(angA)}
                        x2={300 + 130 * Math.cos(angB)}
                        y2={300 + 130 * Math.sin(angB)}
                        stroke="#087D86"
                        strokeWidth="2.2"
                        strokeDasharray="5 5"
                        opacity="0.65"
                      />
                    );
                  })}

                  {/* Square 2 Guide Chords: T1 - T3 - T5 - T7 */}
                  {[
                    [1, 3], [3, 5], [5, 7], [7, 1]
                  ].map(([a, b], idx) => {
                    const isAlreadyDrawn = l7Lines.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
                    if (isAlreadyDrawn) return null;
                    const angA = (a * 45 - 90) * (Math.PI / 180);
                    const angB = (b * 45 - 90) * (Math.PI / 180);
                    return (
                      <line
                        key={`sq2-guide-${idx}`}
                        x1={300 + 130 * Math.cos(angA)}
                        y1={300 + 130 * Math.sin(angA)}
                        x2={300 + 130 * Math.cos(angB)}
                        y2={300 + 130 * Math.sin(angB)}
                        stroke="#D89A43"
                        strokeWidth="2.2"
                        strokeDasharray="5 5"
                        opacity="0.65"
                      />
                    );
                  })}

                  {/* Interactive Beam when a tip is selected */}
                  {l7SelectedVertex !== null && currentMouse && (
                    (() => {
                      const tipAng = (l7SelectedVertex * 45 - 90) * (Math.PI / 180);
                      const tipX = 300 + 130 * Math.cos(tipAng);
                      const tipY = 300 + 130 * Math.sin(tipAng);
                      return (
                        <line
                          x1={tipX}
                          y1={tipY}
                          x2={currentMouse.x}
                          y2={currentMouse.y}
                          stroke="#087D86"
                          strokeWidth="3.2"
                          strokeDasharray="4 4"
                        />
                      );
                    })()
                  )}

                  {/* Drawn Connected Chords between vertices */}
                  {l7Lines.map(([a, b], idx) => {
                    const angA = (a * 45 - 90) * (Math.PI / 180);
                    const angB = (b * 45 - 90) * (Math.PI / 180);
                    return (
                      <line
                        key={`l7-line-${idx}`}
                        x1={300 + 130 * Math.cos(angA)}
                        y1={300 + 130 * Math.sin(angA)}
                        x2={300 + 130 * Math.cos(angB)}
                        y2={300 + 130 * Math.sin(angB)}
                        stroke="#087D86"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                    );
                  })}

                  {/* 8 Star Triangular Facets & Clickable Tip Nodes */}
                  {Array.from({ length: 8 }).map((_, i) => {
                    const tipAng = (i * 45 - 90) * (Math.PI / 180);
                    const v1Ang = ((i * 45 - 22.5) - 90) * (Math.PI / 180);
                    const v2Ang = ((i * 45 + 22.5) - 90) * (Math.PI / 180);

                    const R_outer = 130;
                    const R_inner = 130 * (Math.SQRT2 - 1);

                    const tipX = 300 + R_outer * Math.cos(tipAng);
                    const tipY = 300 + R_outer * Math.sin(tipAng);
                    const v1X = 300 + R_inner * Math.cos(v1Ang);
                    const v1Y = 300 + R_inner * Math.sin(v1Ang);
                    const v2X = 300 + R_inner * Math.cos(v2Ang);
                    const v2Y = 300 + R_inner * Math.sin(v2Ang);

                    const isCarved = l7Facets.includes(i) || l7IsCompleted;
                    const isSelected = l7SelectedVertex === i;

                    return (
                      <g
                        key={i}
                        className="cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (l7SelectedVertex === null) {
                            setL7SelectedVertex(i);
                          } else if (l7SelectedVertex === i) {
                            setL7SelectedVertex(null);
                          } else {
                            const v1 = Math.min(l7SelectedVertex, i);
                            const v2 = Math.max(l7SelectedVertex, i);
                            let updatedLines = l7Lines;
                            if (!l7Lines.some(([a, b]) => a === v1 && b === v2)) {
                              updatedLines = [...l7Lines, [v1, v2]];
                              setL7Lines(updatedLines);
                            }
                            let updatedFacets = l7Facets;
                            if (!l7Facets.includes(i)) {
                              updatedFacets = [...updatedFacets, i];
                            }
                            if (!updatedFacets.includes(l7SelectedVertex)) {
                              updatedFacets = [...updatedFacets, l7SelectedVertex];
                            }
                            setL7Facets(updatedFacets);
                            setL7SelectedVertex(null);

                            // AUTO-COMPLETE CHECK:
                            if (updatedLines.length >= 8 || updatedFacets.length >= 8) {
                              setL7IsCompleted(true);
                              markStepComplete(6);
                            }
                          }
                        }}
                      >
                        {/* Triangular star facet */}
                        <polygon
                          points={`${300},${300} ${v1X},${v1Y} ${tipX},${tipY} ${v2X},${v2Y}`}
                          fill={isCarved ? 'rgba(8, 125, 134, 0.32)' : 'rgba(216, 154, 67, 0.08)'}
                          stroke={isCarved ? '#08646C' : '#D89A43'}
                          strokeWidth={isCarved ? 2.5 : 1.5}
                          className="hover:fill-[#087D86]/40 transition-colors"
                        />
                        {/* Selected halo without broken SVG transform scaling */}
                        {isSelected && (
                          <circle cx={tipX} cy={tipY} r="13" fill="none" stroke="#087D86" strokeWidth="2.5" strokeDasharray="3 3" opacity="0.9" />
                        )}
                        {/* Tip point node */}
                        <circle
                          cx={tipX}
                          cy={tipY}
                          r={isSelected ? 8.5 : isCarved ? 6.5 : 6}
                          fill={isCarved ? '#087D86' : '#D89A43'}
                          stroke="white"
                          strokeWidth="2.5"
                          className="hover:scale-125 transition-transform"
                        />
                        {/* Tip label */}
                        <text
                          x={300 + 152 * Math.cos(tipAng)}
                          y={300 + 152 * Math.sin(tipAng) + 4}
                          textAnchor="middle"
                          className="text-[11px] font-bold fill-[#14313F] select-none pointer-events-none"
                        >
                          T{i}
                        </text>
                      </g>
                    );
                  })}

                  <circle cx="300" cy="300" r="5" fill="#14313F" />
                </g>
              )}

              {/* ======================================================== */}
              {/* STEP 8: KENDİ ESERİNİ ÜRET & GEOMETRİK DOĞRULAMA         */}
              {/* ======================================================== */}
              {currentStepIndex === 7 && (
                <g>
                  {/* Watermark Reference Template Guide */}
                  {l8Challenge === 'rosette' && (
                    <g opacity={l8Verified ? 1 : 0.85} className="transition-all duration-300">
                      {/* Center circle */}
                      <circle cx="300" cy="300" r="110" fill="rgba(8, 125, 134, 0.08)" stroke="#087D86" strokeWidth="2.8" />
                      <circle cx="300" cy="300" r="5" fill="#087D86" />
                      {/* 6 outer circles */}
                      {[0, 60, 120, 180, 240, 300].map((deg, i) => {
                        const ang = (deg * Math.PI) / 180;
                        const cx = 300 + 110 * Math.cos(ang);
                        const cy = 300 + 110 * Math.sin(ang);
                        return (
                          <g key={deg}>
                            <circle cx={cx} cy={cy} r="110" fill="rgba(216, 154, 67, 0.06)" stroke="#D89A43" strokeWidth="2.2" />
                            <circle cx={cx} cy={cy} r="4.5" fill="#D89A43" stroke="white" strokeWidth="1.5" />
                          </g>
                        );
                      })}
                      {/* Center Label */}
                      <g transform="translate(260, 318)">
                        <rect x="0" y="0" width="80" height="22" rx="5" fill="white" stroke="#087D86" opacity="0.95" />
                        <text x="40" y="16" textAnchor="middle" className="text-[12px] font-bold fill-[#087D86]">
                          O (300, 300)
                        </text>
                      </g>
                    </g>
                  )}

                  {l8Challenge === 'seljuk8' && (
                    <g opacity={l8Verified ? 1 : 0.85} className="transition-all duration-300">
                      <circle cx="300" cy="300" r="130" fill="none" stroke="#60757C" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.5" />
                      <rect x="208" y="208" width="184" height="184" fill="none" stroke="#087D86" strokeWidth="2.5" />
                      <rect x="208" y="208" width="184" height="184" transform="rotate(45 300 300)" fill="none" stroke="#D89A43" strokeWidth="2.5" />
                      {/* 8-pointed star fill */}
                      <polygon
                        points={Array.from({ length: 16 }).map((_, i) => {
                          const isTip = i % 2 === 0;
                          const r = isTip ? 130 : 130 * (Math.SQRT2 - 1);
                          const ang = (i * 22.5 - 90) * (Math.PI / 180);
                          return `${(300 + r * Math.cos(ang)).toFixed(1)},${(300 + r * Math.sin(ang)).toFixed(1)}`;
                        }).join(' ')}
                        fill="rgba(8, 125, 134, 0.2)"
                        stroke="#087D86"
                        strokeWidth="3"
                      />
                      <circle cx="300" cy="300" r="5" fill="#14313F" />
                    </g>
                  )}

                  {l8Challenge === 'free' && (
                    <g>
                      <circle cx="300" cy="300" r="120" fill="none" stroke="#087D86" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />
                      <circle cx="300" cy="300" r="5" fill="#087D86" />
                      <text x="300" y="290" textAnchor="middle" className="text-[13px] font-bold fill-[#60757C]">
                        {isTr ? 'Serbest Geometrik Alan' : 'Free Geometric Canvas'}
                      </text>
                    </g>
                  )}

                  {/* Verification Victory Banner Badge on Canvas */}
                  {l8Verified && (
                    <g transform="translate(140, 110)" className="animate-fade-in">
                      <rect x="0" y="0" width="320" height="34" rx="8" fill="#FFFDF8" stroke="#087D86" strokeWidth="2" />
                      <text x="160" y="22" textAnchor="middle" className="text-[13px] font-bold fill-[#087D86]">
                        {isTr ? '✓ %100 GEOMETRİK DOĞRULUK ONAYLANDI!' : '✓ 100% GEOMETRY VERIFIED!'}
                      </text>
                    </g>
                  )}
                </g>
              )}
            </svg>

            {/* LIVE SNAP & SUCCESS BANNER OVERLAY */}
            <div className="w-full mt-3 flex items-center justify-between text-xs pt-2 border-t border-[#E8E5DD]">
              {isCurrentStepDone ? (
                <div className="flex items-center gap-2 text-[#087D86] font-bold">
                  <CheckCircle2 className="w-4 h-4 text-[#087D86]" />
                  <span>{t('targetSnapFeedback')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[#60757C]">
                  <Sparkles className="w-3.5 h-3.5 text-[#D89A43]" />
                  <span>{t('snapHint')}</span>
                </div>
              )}

              {/* Step completion pill */}
              <div className="font-mono text-xs font-bold px-2.5 py-1 rounded-full bg-[#F8F5EE] border border-[#E8E5DD]">
                {isCurrentStepDone ? '✓ 100%' : '...'}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: EDUCATIONAL GUIDANCE & INTERACTIVE CONTROLS */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* STEP SPECIFIC ACTION BUTTONS CARD */}
          <div className="bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#14313F] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#D89A43]" />
              {isTr ? 'Etkileşimli Görev' : 'Interactive Task'}
            </h3>

            {/* Step 1 Task */}
            {currentStepIndex === 0 && (
              <div className="space-y-3">
                <p className="text-xs text-[#60757C] leading-relaxed">
                  {isTr
                    ? 'Merkezdeki O noktasından tutarak dışarı doğru sürükleyin. Yarıçap R = 120px silik hedef çembere ulaştığında mıknatıs gibi oturacaktır.'
                    : 'Drag outward from center point O. When radius reaches R = 120px, it will magnetically snap into the target.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setL1Radius(120);
                    setL1IsCompleted(true);
                    markStepComplete(0);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl border border-[#D89A43] bg-[#FBF2E3] text-[#D89A43] hover:bg-[#FBF2E3]/80 font-bold text-xs transition cursor-pointer"
                >
                  {isTr ? '🎯 Hedefe Oturt (R = 120px)' : '🎯 Snap to Target (R = 120px)'}
                </button>
              </div>
            )}

            {/* Step 2 Task */}
            {currentStepIndex === 1 && (
              <div className="space-y-3">
                <p className="text-xs text-[#60757C] leading-relaxed">
                  {isTr
                    ? '1. C₁ çemberinde pergel ucunu sürükleyerek 85px açıklığa ayarlayın ve kilitleyin (🔒). 2. Pergeli C₂ merkezine taşıyıp aynı açıklıkla eş çemberi çizin.'
                    : '1. Adjust compass aperture on C₁ to 85px and lock it (🔒). 2. Move compass to C₂ and swing the congruent circle.'}
                </p>
                <div className="p-2.5 rounded-xl border border-[#E8E5DD] bg-[#F8F5EE] flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#14313F] flex items-center gap-1.5">
                    {l2CompassLocked ? <Lock className="w-4 h-4 text-[#087D86]" /> : <Unlock className="w-4 h-4 text-[#D89A43]" />}
                    {t('compassAperture')}:
                  </span>
                  <span className={`font-mono font-bold px-2 py-0.5 rounded-md ${l2CompassLocked ? 'bg-[#DCEDED] text-[#087D86]' : 'bg-[#FBF2E3] text-[#D89A43]'}`}>
                    {l2CompassLocked ? (isTr ? '🔒 Kilitli (R=85px)' : '🔒 Locked (R=85px)') : (isTr ? `Açıklık: ${Math.round(l2MeasuredRadius)}px` : `Span: ${Math.round(l2MeasuredRadius)}px`)}
                  </span>
                </div>

                {/* Quick set to 85px if user wants */}
                {l2CompassPosition === 'c1' && !l2CompassLocked && (
                  <button
                    type="button"
                    onClick={() => {
                      setL2MeasuredRadius(85);
                      setL2LockNotice(null);
                    }}
                    className="w-full py-2 px-3 rounded-xl border border-[#D89A43] bg-[#FBF2E3] text-[#D89A43] hover:bg-[#faebd0] font-bold text-xs transition cursor-pointer"
                  >
                    {isTr ? '🎯 Pergeli 85px Açıklığa Ayarla' : '🎯 Set Compass Span to 85px'}
                  </button>
                )}

                {/* Lock / Unlock Toggle Button */}
                {l2CompassPosition === 'c1' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (l2CompassLocked) {
                        setL2CompassLocked(false);
                      } else {
                        if (l2MeasuredRadius === 85) {
                          setL2CompassLocked(true);
                          setL2LockNotice(null);
                        } else {
                          setL2LockNotice(isTr ? 'Önce pergeli 85px açıklığa (C₁ kenarına) getirin.' : 'Open compass to 85px first.');
                        }
                      }
                    }}
                    className={`w-full py-2.5 px-3 rounded-xl border font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      l2CompassLocked
                        ? 'border-[#087D86] bg-[#DCEDED]/50 text-[#087D86] hover:bg-[#cbe7e7]'
                        : l2MeasuredRadius === 85
                        ? 'bg-[#087D86] text-white hover:bg-[#08646C]'
                        : 'border-[#D89A43] bg-[#FBF2E3] text-[#D89A43] hover:bg-[#faebd0]'
                    }`}
                  >
                    {l2CompassLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    <span>{l2CompassLocked ? t('unlockCompass') : t('lockCompass')}</span>
                  </button>
                )}

                {/* Move to C2 action button */}
                {l2CompassPosition === 'c1' && l2CompassLocked && (
                  <button
                    type="button"
                    onClick={() => setL2CompassPosition('c2')}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#087D86] text-white hover:bg-[#08646C] font-bold text-xs transition cursor-pointer shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>{t('step2MoveToC2')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Draw congruent circle at C2 */}
                {l2CompassPosition === 'c2' && (
                  <button
                    type="button"
                    onClick={() => {
                      setL2Radius(85);
                      setL2IsCompleted(true);
                      markStepComplete(1);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#087D86] text-white hover:bg-[#08646C] font-bold text-xs transition cursor-pointer shadow-sm"
                  >
                    {isTr ? '🎯 Kilitli Pergelle C₂\'yi Çiz (R = 85px)' : '🎯 Draw C₂ with Locked Compass'}
                  </button>
                )}
              </div>
            )}

            {/* Step 3 Task */}
            {currentStepIndex === 2 && (
              <div className="space-y-3">
                <p className="text-xs text-[#60757C] leading-relaxed">
                  {isTr
                    ? 'C₂ noktasından C₁ merkezinden geçen ikinci çemberi çizin ve ortada oluşan badem (Vesica Piscis) kesişimini yakalayın.'
                    : 'Draw the second circle from C₂ passing through C₁ to unlock the Vesica Piscis lens.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setL3Radius(120);
                    setL3IsCompleted(true);
                    markStepComplete(2);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl border border-[#D89A43] bg-[#FBF2E3] text-[#D89A43] hover:bg-[#FBF2E3]/80 font-bold text-xs transition cursor-pointer"
                >
                  {isTr ? '🎯 Kesişen Çemberi Çiz & Snap' : '🎯 Snap Overlapping Circle'}
                </button>
              </div>
            )}

            {/* Step 4 Task */}
            {currentStepIndex === 3 && (
              <div className="space-y-3">
                <p className="text-xs text-[#60757C] leading-relaxed">
                  {isTr
                    ? 'Pergel ucunu merkez çemberin çevresindeki altın noktalara batırıp dışarı doğru sürükleyerek 6 çevre çemberini tek tek çizin.'
                    : 'Place your compass needle on each of the outer gold notches and drag outward to construct all 6 petals.'}
                </p>
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#60757C]">{isTr ? 'Çizilen Çevre Çemberleri' : 'Drawn Outer Circles'}:</span>
                  <span className="font-mono text-[#087D86]">{l4Circles.length - 1} / 6</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const center = { x: 300, y: 300 };
                    const R = 110;
                    const allCircs = [{ id: 'c0', cx: 300, cy: 300, r: R }];
                    for (let i = 0; i < 6; i++) {
                      const ang = (i * 60) * (Math.PI / 180);
                      allCircs.push({ id: `c-outer-${i}`, cx: center.x + R * Math.cos(ang), cy: center.y + R * Math.sin(ang), r: R });
                    }
                    setL4Circles(allCircs);
                    setL4IsCompleted(true);
                    markStepComplete(3);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl border border-[#D89A43] bg-[#FBF2E3] text-[#D89A43] hover:bg-[#FBF2E3]/80 font-bold text-xs transition cursor-pointer"
                >
                  {isTr ? '🌸 6 Yaprağı Otomatik Tamamla' : '🌸 Complete 6 Petals'}
                </button>
              </div>
            )}

            {/* Step 5 Task */}
            {currentStepIndex === 4 && (
              <div className="space-y-3">
                <p className="text-xs text-[#60757C] leading-relaxed">
                  {isTr
                    ? 'Kılavuz çizgileri üzerindeki V0-V5 tepe noktalarına dokunarak veya aralarında sürükleyerek eşkenar üçgenlerin doğrularını birleştirin. Kılavuzlar çizim boyunca silinmez.'
                    : 'Tap or drag between vertices V0-V5 along the persistent guide lines to connect the hexagram.'}
                </p>
                {l5SelectedVertex !== null && (
                  <div className="p-2 rounded-lg bg-[#DCEDED] border border-[#087D86]/30 text-xs font-bold text-[#087D86] flex items-center gap-1.5 animate-pulse">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isTr ? `V${l5SelectedVertex} seçildi. Bağlamak için 2. noktaya dokunun.` : `V${l5SelectedVertex} selected. Tap second point to connect.`}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#60757C]">{isTr ? 'Çizilen Doğrular' : 'Drawn Chords'}:</span>
                  <span className="font-mono text-[#087D86]">{l5Lines.length} / 6</span>
                </div>
                <button
                  type="button"
                  onClick={handleL5ConnectStar}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#087D86] text-white hover:bg-[#08646C] font-bold text-xs transition cursor-pointer shadow-sm"
                >
                  {isTr ? '⭐ Kesişim Doğrularını Otomatik Çiz' : '⭐ Auto-Draw Hexagram Chords'}
                </button>
                <button
                  type="button"
                  onClick={() => setL5HideCircles(!l5HideCircles)}
                  className="w-full py-2 px-3 rounded-xl border border-[#E8E5DD] bg-white text-[#14313F] text-xs font-semibold hover:bg-[#F8F5EE] transition cursor-pointer"
                >
                  {l5HideCircles
                    ? (isTr ? 'Kılavuz Çemberleri Göster' : 'Show Guide Circles')
                    : (isTr ? 'Kılavuz Çemberleri Gizle (Sadece Motif)' : 'Hide Guide Circles (Star Only)')}
                </button>
              </div>
            )}

            {/* Step 6 Task */}
            {currentStepIndex === 5 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#14313F]">{t('rotateAngle')}</span>
                  <span className="font-mono text-sm font-bold text-[#087D86]">{l6Angle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  value={l6Angle}
                  onChange={(e) => handleAngleChange(Number(e.target.value))}
                  className="w-full accent-[#087D86] h-2 bg-[#E8E5DD] rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-xs text-[#60757C]">
                  <button type="button" onClick={() => handleAngleChange(0)} className="hover:text-[#087D86] font-semibold underline cursor-pointer">0°</button>
                  <button type="button" onClick={() => handleAngleChange(45)} className="text-[#087D86] font-bold underline cursor-pointer">45° (Yıldız)</button>
                  <button type="button" onClick={() => handleAngleChange(90)} className="hover:text-[#087D86] font-semibold underline cursor-pointer">90°</button>
                </div>
              </div>
            )}

            {/* Step 7 Task */}
            {currentStepIndex === 6 && (
              <div className="space-y-2.5">
                <p className="text-xs text-[#60757C] leading-relaxed">
                  {isTr
                    ? 'Tuval üzerindeki T0-T7 altın tepe noktalarına dokunarak veya aralarında çizgi çekerek 8 köşeli Selçuklu yıldızını tamamlayın.'
                    : 'Tap outer tip nodes T0-T7 or connect corners with lines to complete the 8-pointed Seljuk star.'}
                </p>
                {l7SelectedVertex !== null && (
                  <div className="p-2 rounded-lg bg-[#DCEDED] border border-[#087D86]/30 text-xs font-bold text-[#087D86] flex items-center gap-1.5 animate-pulse">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isTr ? `T${l7SelectedVertex} ucu seçildi. Diğer köşeye dokunarak bağlayın.` : `Tip T${l7SelectedVertex} selected. Tap next corner to connect.`}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#60757C]">{isTr ? 'Doldurulan / Birleştirilen Köşeler' : 'Connected Corners'}:</span>
                  <span className="font-mono text-[#087D86]">{Math.max(l7Facets.length, l7Lines.length)} / 8</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setL7ShowBase(!l7ShowBase)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold ${l7ShowBase ? 'border-[#087D86] bg-[#DCEDED]/50 text-[#087D86]' : 'border-[#E8E5DD] text-[#60757C]'}`}
                  >
                    Kare 1 (0°)
                  </button>
                  <button
                    type="button"
                    onClick={() => setL7ShowRot(!l7ShowRot)}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-semibold ${l7ShowRot ? 'border-[#D89A43] bg-[#FBF2E3] text-[#D89A43]' : 'border-[#E8E5DD] text-[#60757C]'}`}
                  >
                    Kare 2 (45°)
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleL7CompleteAll}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#087D86] text-white hover:bg-[#08646C] font-bold text-xs transition cursor-pointer shadow-sm"
                >
                  {isTr ? '✨ Selçuklu Yıldızını Tamamla' : '✨ Complete Seljuk Star'}
                </button>
              </div>
            )}

            {/* Step 8 Task: "Doğru yaptım mı nasıl anlayacağım?" - Full Accuracy Inspector */}
            {currentStepIndex === 7 && (
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#14313F] flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#087D86]" />
                    {t('accuracyInspector')}
                  </span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                    (l8Inspection?.score ?? (l8Verified ? 100 : 95)) >= 80 ? 'bg-[#DCEDED] text-[#087D86]' : 'bg-[#FBF2E3] text-[#D89A43]'
                  }`}>
                    %{l8Inspection?.score ?? (l8Verified ? 100 : 95)} {t('scoreLabel')}
                  </span>
                </div>

                {/* Challenge Presets */}
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleL8LoadChallenge('rosette')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      l8Challenge === 'rosette'
                        ? 'border-[#087D86] bg-[#DCEDED]/50 text-[#087D86]'
                        : 'border-[#E8E5DD] bg-white text-[#60757C]'
                    }`}
                  >
                    🌸 {isTr ? 'Rozet' : 'Rosette'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleL8LoadChallenge('seljuk8')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      l8Challenge === 'seljuk8'
                        ? 'border-[#087D86] bg-[#DCEDED]/50 text-[#087D86]'
                        : 'border-[#E8E5DD] bg-white text-[#60757C]'
                    }`}
                  >
                    ⭐ {isTr ? '8-Yıldız' : '8-Star'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleL8LoadChallenge('free')}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
                      l8Challenge === 'free'
                        ? 'border-[#087D86] bg-[#DCEDED]/50 text-[#087D86]'
                        : 'border-[#E8E5DD] bg-white text-[#60757C]'
                    }`}
                  >
                    🎨 {isTr ? 'Serbest' : 'Free'}
                  </button>
                </div>

                {/* Accuracy Criteria Checklist */}
                <div className="space-y-1.5 p-3 rounded-xl bg-[#F8F5EE] border border-[#E8E5DD] text-xs">
                  <div className="flex items-center justify-between text-[#14313F] font-bold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#087D86]" />
                      {isTr ? 'Merkez Dayanağı & Orijin' : 'Center Anchor & Origin'}
                    </span>
                    <span className="text-[#087D86] font-mono">✓ (300, 300)</span>
                  </div>
                  <div className="flex items-center justify-between text-[#14313F] font-bold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#087D86]" />
                      {t('concentricRings')}
                    </span>
                    <span className="text-[#087D86] font-mono">✓ R=110px</span>
                  </div>
                  <div className="flex items-center justify-between text-[#14313F] font-bold">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#087D86]" />
                      {t('radialSymmetry')}
                    </span>
                    <span className="text-[#087D86] font-mono">
                      {l8Challenge === 'seljuk8' ? '✓ 8-Katlı (45°)' : '✓ 6-Katlı (60°)'}
                    </span>
                  </div>
                </div>

                {/* Verification Trigger Button */}
                <button
                  type="button"
                  onClick={handleL8RunInspection}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#087D86] text-white hover:bg-[#08646C] font-bold text-xs transition cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{t('verifyPattern')}</span>
                </button>

                {/* Victory Card when verified */}
                {l8Verified && (
                  <div className="p-3 bg-[#DCEDED] rounded-xl border border-[#087D86]/30 text-xs text-[#087D86] font-bold flex items-center gap-2 animate-fade-in">
                    <Award className="w-5 h-5 text-[#D89A43] shrink-0" />
                    <span>{t('patternPassed')}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleTransferToStudio}
                  className="w-full py-2.5 px-3 rounded-xl border border-[#087D86] bg-white text-[#087D86] hover:bg-[#DCEDED]/40 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>{t('openStudio')}</span>
                </button>
              </div>
            )}
          </div>

          {/* EDUCATIONAL TABS (Do It / Why It Works / Math Details) */}
          <div className="bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex border-b border-[#E8E5DD] gap-2 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('do')}
                className={`flex items-center gap-1.5 pb-2 px-2 text-xs md:text-sm font-bold border-b-2 transition cursor-pointer ${
                  activeTab === 'do'
                    ? 'border-[#087D86] text-[#087D86]'
                    : 'border-transparent text-[#60757C] hover:text-[#14313F]'
                }`}
              >
                <Compass className="w-4 h-4" />
                {t('tabDoIt')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('why')}
                className={`flex items-center gap-1.5 pb-2 px-2 text-xs md:text-sm font-bold border-b-2 transition cursor-pointer ${
                  activeTab === 'why'
                    ? 'border-[#087D86] text-[#087D86]'
                    : 'border-transparent text-[#60757C] hover:text-[#14313F]'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                {t('tabWhyItWorks')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('math')}
                className={`flex items-center gap-1.5 pb-2 px-2 text-xs md:text-sm font-bold border-b-2 transition cursor-pointer ${
                  activeTab === 'math'
                    ? 'border-[#087D86] text-[#087D86]'
                    : 'border-transparent text-[#60757C] hover:text-[#14313F]'
                }`}
              >
                <Calculator className="w-4 h-4" />
                {t('tabMathDetails')}
              </button>
            </div>

            {/* Tab 1: Do It */}
            {activeTab === 'do' && (
              <div className="text-xs md:text-sm text-[#14313F] leading-relaxed p-3 bg-[#F8F5EE] rounded-xl border border-[#E8E5DD]">
                {isTr ? currentLesson.doItTr : currentLesson.doItEn}
              </div>
            )}

            {/* Tab 2: Why It Works */}
            {activeTab === 'why' && (
              <div className="text-xs md:text-sm text-[#14313F] leading-relaxed p-3.5 bg-[#DCEDED]/50 rounded-xl border border-[#087D86]/20">
                <h4 className="font-bold text-[#087D86] mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#D89A43]" />
                  {isTr ? 'Geometrik Sır' : 'Geometric Insight'}
                </h4>
                <p>{isTr ? currentLesson.whyTr : currentLesson.whyEn}</p>
              </div>
            )}

            {/* Tab 3: Math Details */}
            {activeTab === 'math' && (
              <div className="text-xs md:text-sm text-[#14313F] leading-relaxed p-3.5 bg-[#FBF2E3]/60 rounded-xl border border-[#D89A43]/30">
                <h4 className="font-bold text-[#D89A43] mb-1 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4" />
                  {isTr ? 'Matematiksel Formül ve Bağıntı' : 'Mathematical Formulation'}
                </h4>
                <p>{isTr ? currentLesson.mathTr : currentLesson.mathEn}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
