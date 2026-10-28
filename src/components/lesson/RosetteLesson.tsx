import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { GeoPoint, GeoCircle, GeoScene, ValidationFeedback } from '../../types/geometry';
import { validateRosette, distance } from '../../geometry/engine';
import confetti from 'canvas-confetti';
import {
  Compass,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Calculator,
  ArrowRight,
  Eye,
  EyeOff,
  Undo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Palette
} from 'lucide-react';

interface RosetteLessonProps {
  onTransferToStudio?: (scene: GeoScene) => void;
  onNextLesson?: () => void;
}

export const RosetteLesson: React.FC<RosetteLessonProps> = ({ onTransferToStudio, onNextLesson }) => {
  const { t, lang } = useI18n();
  const isTr = lang === 'tr';

  const [activeTab, setActiveTab] = useState<'do' | 'why' | 'math'>('do');
  
  // Center is placed at (300, 300) in a spacious 600x600 logical coordinate space
  const [scene, setScene] = useState<GeoScene>(() => {
    return {
      points: [
        { id: 'p-center', x: 300, y: 300, label: 'O', isAnchor: true }
      ],
      segments: [],
      circles: [],
      polygons: [],
    };
  });

  const [history, setHistory] = useState<GeoScene[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; id: string } | null>(null);
  const [currentMouse, setCurrentMouse] = useState<{ x: number; y: number } | null>(null);
  const [hasCelebrated, setHasCelebrated] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [showGuides, setShowGuides] = useState(true);

  // Zoom control: default 0.80 so the whole rosette has plenty of room
  const [zoom, setZoom] = useState<number>(0.80);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Validation output
  const validation: ValidationFeedback = validateRosette(scene, lang);

  // Multi-stage confetti celebration effect
  const triggerCelebration = useCallback(() => {
    // Wave 1: Left
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0.15, y: 0.65 },
      colors: ['#087D86', '#D89A43', '#DCEDED', '#F4D06F'],
    });

    // Wave 2: Right
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 0.85, y: 0.65 },
        colors: ['#D89A43', '#08646C', '#FFFFFF', '#F4D06F'],
      });
    }, 200);

    // Wave 3: Center fireworks with stars
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { x: 0.5, y: 0.4 },
        shapes: ['star', 'circle'],
        colors: ['#D89A43', '#087D86', '#14313F', '#F4D06F'],
      });
    }, 450);
  }, []);

  // Trigger celebration when user achieves 100% / isValid
  useEffect(() => {
    if (validation.isValid && !hasCelebrated) {
      setHasCelebrated(true);
      setShowCelebrationModal(true);
      triggerCelebration();
    }
  }, [validation.isValid, hasCelebrated, triggerCelebration]);

  // ViewBox calculation based on zoom and center (300, 300)
  const baseDim = 600;
  const viewW = baseDim / zoom;
  const viewH = baseDim / zoom;
  const minX = 300 - viewW / 2;
  const minY = 300 - viewH / 2;
  const viewBoxStr = `${minX.toFixed(2)} ${minY.toFixed(2)} ${viewW.toFixed(2)} ${viewH.toFixed(2)}`;

  // Convert client pointer coordinates to SVG coordinate space taking zoom into account
  const getSvgCoordinates = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 300, y: 300 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = minX + ((e.clientX - rect.left) / rect.width) * viewW;
    const y = minY + ((e.clientY - rect.top) / rect.height) * viewH;
    return { x, y };
  }, [minX, minY, viewW, viewH]);

  // Snap to existing points within threshold
  const findSnapPoint = (x: number, y: number, threshold = 18 / zoom): GeoPoint | null => {
    for (const p of scene.points) {
      if (distance({ x, y }, p) <= threshold) {
        return p;
      }
    }
    return null;
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const coords = getSvgCoordinates(e);
    const snap = findSnapPoint(coords.x, coords.y);
    const startPoint = snap ? { x: snap.x, y: snap.y, id: snap.id } : { ...coords, id: `p-${Date.now()}` };

    setDragStart(startPoint);
    setCurrentMouse(coords);
    setIsDrawing(true);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDrawing || !dragStart) return;
    const coords = getSvgCoordinates(e);
    setCurrentMouse(coords);
  };

  const handlePointerUp = () => {
    if (!isDrawing || !dragStart || !currentMouse) {
      setIsDrawing(false);
      setDragStart(null);
      return;
    }

    const r = distance(dragStart, currentMouse);
    if (r > 15) {
      // Save history for undo
      setHistory(prev => [...prev.slice(-20), JSON.parse(JSON.stringify(scene))]);

      const newPoints = [...scene.points];
      const centerId = dragStart.id;
      if (!newPoints.some(p => p.id === centerId)) {
        newPoints.push({
          id: centerId,
          x: dragStart.x,
          y: dragStart.y,
          label: `C${newPoints.length}`,
        });
      }

      // Add circle
      const newCircle: GeoCircle = {
        id: `c-${Date.now()}`,
        centerId,
        radius: r,
        stroke: scene.circles.length === 0 ? '#087D86' : '#D89A43',
        strokeWidth: 2.5,
        fill: scene.circles.length === 0 ? 'rgba(8, 125, 134, 0.05)' : 'none',
      };

      // Add guide notches around the center circle if this is the first circle
      if (scene.circles.length === 0) {
        for (let i = 0; i < 6; i++) {
          const angle = (i * 60) * (Math.PI / 180);
          const px = dragStart.x + r * Math.cos(angle);
          const py = dragStart.y + r * Math.sin(angle);
          newPoints.push({
            id: `p-guide-${i}`,
            x: px,
            y: py,
            isAnchor: false,
            isConstruction: true,
          });
        }
      }

      setScene({
        ...scene,
        points: newPoints,
        circles: [...scene.circles, newCircle],
      });
    }

    setIsDrawing(false);
    setDragStart(null);
    setCurrentMouse(null);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setScene(prev);
    setHasCelebrated(false);
  };

  const handleReset = () => {
    setHistory([]);
    setHasCelebrated(false);
    setShowCelebrationModal(false);
    setScene({
      points: [{ id: 'p-center', x: 300, y: 300, label: 'O', isAnchor: true }],
      segments: [],
      circles: [],
      polygons: [],
    });
  };

  // Provide a reference full rosette
  const handleShowReference = () => {
    setHistory(prev => [...prev, JSON.parse(JSON.stringify(scene))]);
    const cx = 300;
    const cy = 300;
    const R = 115;
    const pts: GeoPoint[] = [{ id: 'p-c', x: cx, y: cy, label: 'O' }];
    const circs: GeoCircle[] = [
      { id: 'c-0', centerId: 'p-c', radius: R, stroke: '#087D86', strokeWidth: 3, fill: 'rgba(8, 125, 134, 0.08)' }
    ];

    for (let i = 0; i < 6; i++) {
      const angle = (i * 60) * (Math.PI / 180);
      const px = cx + R * Math.cos(angle);
      const py = cy + R * Math.sin(angle);
      const pid = `p-outer-${i}`;
      pts.push({ id: pid, x: px, y: py });
      circs.push({
        id: `c-outer-${i}`,
        centerId: pid,
        radius: R,
        stroke: '#D89A43',
        strokeWidth: 2,
      });
    }

    setScene({
      points: pts,
      segments: [],
      circles: circs,
      polygons: [],
    });
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoom(z => Math.min(1.4, Math.round((z + 0.15) * 100) / 100));
  };

  const handleZoomOut = () => {
    setZoom(z => Math.max(0.5, Math.round((z - 0.15) * 100) / 100));
  };

  const handleFitView = () => {
    setZoom(0.75); // Generous wide view that fits all 7 circles easily
  };

  // Drag preview circle
  let previewCircle: { cx: number; cy: number; r: number } | null = null;
  if (isDrawing && dragStart && currentMouse) {
    previewCircle = {
      cx: dragStart.x,
      cy: dragStart.y,
      r: distance(dragStart, currentMouse),
    };
  }

  const pointMap = new Map<string, GeoPoint>();
  scene.points.forEach(p => pointMap.set(p.id, p));

  // Determine center circle and outer circles for petal visualization
  const centerCircle = scene.circles[0];
  const centerPoint = centerCircle ? pointMap.get(centerCircle.centerId) : null;
  const R = centerCircle ? centerCircle.radius : 115;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Title & Header */}
      <div className="bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#DCEDED] text-[#087D86] mb-2">
              <Compass className="w-3.5 h-3.5" />
              {isTr ? 'Rehberli Uygulama' : 'Guided Construction'}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-[#14313F]">
              {t('rosetteTitle')}
            </h1>
            <p className="text-sm md:text-base text-[#60757C] mt-1 max-w-2xl">
              {t('rosetteDesc')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShowReference}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#D89A43] bg-[#FBF2E3]/80 text-[#D89A43] text-xs font-bold hover:bg-[#FBF2E3] transition cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-4 h-4" />
              {t('autoCompleteRosette')}
            </button>
            {validation.isValid && (
              <button
                onClick={triggerCelebration}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#D89A43] text-white text-xs font-bold hover:bg-[#c58835] transition cursor-pointer shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                {t('replayCelebration')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Interactive Drawing Canvas Area */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          
          {/* ERGONOMIC HAND-LEVEL CONTROLS TOOLBAR (Right above/at canvas edge) */}
          <div className="bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-2.5 px-3 shadow-sm flex flex-wrap items-center justify-between gap-2 z-20">
            {/* Left: Quick Undo & Reset directly at hand */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleUndo}
                disabled={history.length === 0}
                title={t('undo')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E8E5DD] bg-white text-[#14313F] text-xs font-bold hover:bg-[#F8F5EE] active:scale-95 disabled:opacity-35 transition cursor-pointer shadow-2xs"
              >
                <Undo2 className="w-4 h-4 text-[#087D86]" />
                <span>{t('undo')}</span>
                {history.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#DCEDED] text-[#087D86] font-mono">
                    {history.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={handleReset}
                title={t('reset')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E8E5DD] bg-white text-[#C23B22] text-xs font-bold hover:bg-[#FDF2F0] active:scale-95 transition cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-4 h-4 text-[#C23B22]" />
                <span>{t('reset')}</span>
              </button>
            </div>

            {/* Right: Zoom In, Zoom Out, Fit View, Guides Toggle */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-[#F8F5EE] border border-[#E8E5DD] rounded-xl p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  title={t('zoomOut')}
                  className="p-1.5 px-2 rounded-lg text-[#14313F] hover:bg-white disabled:opacity-35 transition cursor-pointer"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleFitView}
                  title={t('fitAll')}
                  className="px-2 py-1 text-xs font-mono font-bold text-[#087D86] hover:bg-white rounded-lg transition cursor-pointer"
                >
                  %{Math.round(zoom * 100)}
                </button>

                <button
                  type="button"
                  onClick={handleZoomIn}
                  disabled={zoom >= 1.4}
                  title={t('zoomIn')}
                  className="p-1.5 px-2 rounded-lg text-[#14313F] hover:bg-white disabled:opacity-35 transition cursor-pointer"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={handleFitView}
                title={t('fitAll')}
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl border border-[#E8E5DD] bg-white text-[#60757C] hover:text-[#087D86] text-xs font-bold transition cursor-pointer shadow-2xs"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('fitAll')}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGuides(!showGuides)}
                title={showGuides ? 'Kılavuzları Gizle' : 'Kılavuzları Göster'}
                className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer shadow-2xs ${
                  showGuides
                    ? 'border-[#087D86] bg-[#DCEDED]/50 text-[#087D86]'
                    : 'border-[#E8E5DD] bg-white text-[#60757C]'
                }`}
              >
                {showGuides ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* SVG Canvas Container */}
          <div
            className={`bg-[#FFFDF8] border rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center relative min-h-[480px] shadow-sm overflow-hidden transition-all duration-500 ${
              validation.isValid ? 'border-[#D89A43] canvas-perfect-glow' : 'border-[#E8E5DD]'
            }`}
          >
            {/* Grid background */}
            <div className="absolute inset-0 bg-geo-dots pointer-events-none opacity-50" />

            {/* Canvas SVG */}
            <svg
              ref={svgRef}
              viewBox={viewBoxStr}
              className="w-full max-w-[520px] aspect-square relative z-10 cursor-crosshair geometry-canvas-touch border border-[#E8E5DD]/70 rounded-xl bg-white shadow-inner transition-transform duration-200"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <defs>
                {/* Soft gradient fill for verified petals */}
                <radialGradient id="rosettePetalGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#D89A43" stopOpacity="0.4" />
                  <stop offset="70%" stopColor="#087D86" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#087D86" stopOpacity="0.05" />
                </radialGradient>
              </defs>

              {/* Background guide axes centered at (300, 300) */}
              {showGuides && (
                <g opacity="0.25">
                  <line x1="-200" y1="300" x2="800" y2="300" stroke="#60757C" strokeWidth="1" strokeDasharray="5 5" />
                  <line x1="300" y1="-200" x2="300" y2="800" stroke="#60757C" strokeWidth="1" strokeDasharray="5 5" />
                  {/* Diagonal guides */}
                  <line x1="-50" y1="-50" x2="650" y2="650" stroke="#60757C" strokeWidth="0.8" strokeDasharray="4 6" opacity="0.6" />
                  <line x1="-50" y1="650" x2="650" y2="-50" stroke="#60757C" strokeWidth="0.8" strokeDasharray="4 6" opacity="0.6" />
                </g>
              )}

              {/* Verified Flower Glowing Shimmer Layer */}
              {validation.isValid && centerPoint && (
                <g className="animate-petal-bloom">
                  {/* Outer hex outline connecting centers */}
                  <polygon
                    points={Array.from({ length: 6 }).map((_, i) => {
                      const ang = (i * 60) * (Math.PI / 180);
                      return `${(centerPoint.x + R * Math.cos(ang)).toFixed(1)},${(centerPoint.y + R * Math.sin(ang)).toFixed(1)}`;
                    }).join(' ')}
                    fill="url(#rosettePetalGrad)"
                    stroke="#D89A43"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  {/* Central glowing flower disc */}
                  <circle
                    cx={centerPoint.x}
                    cy={centerPoint.y}
                    r={R}
                    fill="rgba(216, 154, 67, 0.08)"
                    stroke="#087D86"
                    strokeWidth="3"
                  />
                </g>
              )}

              {/* Render Circles */}
              {scene.circles.map((c, idx) => {
                const cp = pointMap.get(c.centerId);
                if (!cp) return null;
                const isCenter = idx === 0;
                return (
                  <circle
                    key={c.id}
                    cx={cp.x}
                    cy={cp.y}
                    r={c.radius}
                    fill={c.fill || 'none'}
                    stroke={validation.isValid ? (isCenter ? '#087D86' : '#D89A43') : (c.stroke || '#087D86')}
                    strokeWidth={validation.isValid ? (isCenter ? 3 : 2.5) : (c.strokeWidth || 2)}
                    strokeDasharray={c.strokeDasharray}
                    className="transition-colors duration-300"
                  />
                );
              })}

              {/* In-progress Drag Preview */}
              {previewCircle && (
                <circle
                  cx={previewCircle.cx}
                  cy={previewCircle.cy}
                  r={previewCircle.r}
                  fill="none"
                  stroke="#D89A43"
                  strokeWidth="2.5"
                  strokeDasharray="5 4"
                />
              )}

              {/* Render Points */}
              {scene.points.map(p => {
                if (p.isConstruction && !showGuides) return null;
                return (
                  <g key={p.id}>
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r={p.isAnchor ? 5.5 : 4.5}
                      fill={p.isAnchor ? '#087D86' : p.isConstruction ? '#D89A43' : '#14313F'}
                      stroke="white"
                      strokeWidth="1.8"
                    />
                    {p.label && (
                      <text
                        x={p.x + 9}
                        y={p.y - 9}
                        className="text-[13px] font-mono font-bold fill-[#14313F] select-none pointer-events-none"
                      >
                        {p.label}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Validation Status Bar below canvas */}
            <div className="w-full mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#E8E5DD]">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-[#60757C]">
                  {t('scoreLabel')}:
                </span>
                <div className="w-36 bg-[#E8E5DD] rounded-full h-3 overflow-hidden shadow-inner">
                  <div
                    className={`h-full transition-all duration-500 ${
                      validation.isValid
                        ? 'bg-gradient-to-r from-[#087D86] to-[#D89A43]'
                        : 'bg-[#D89A43]'
                    }`}
                    style={{ width: `${validation.score}%` }}
                  />
                </div>
                <span className="font-mono text-xs font-extrabold text-[#14313F]">
                  %{validation.score}
                </span>
              </div>

              {validation.isValid ? (
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#087D86] bg-[#DCEDED] px-3.5 py-1.5 rounded-full shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-[#087D86]" />
                    <span>{t('validationSuccess')}</span>
                  </div>
                  {onTransferToStudio && (
                    <button
                      onClick={() => onTransferToStudio(scene)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#087D86] text-white text-xs font-bold hover:bg-[#08646C] shadow-sm transition cursor-pointer"
                    >
                      <Palette className="w-3.5 h-3.5" />
                      <span>{t('transferToStudio')}</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ) : (
                <span className="text-xs text-[#60757C] italic">
                  {scene.circles.length === 0
                    ? (isTr ? 'Başlamak için merkez çemberi çizin' : 'Draw a center circle to begin')
                    : `${scene.circles.length}/7 ${isTr ? 'çember tamamlandı' : 'circles completed'}`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Educational Right Panel (Do It / Why It Works / Math Details) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Explanation Tabs */}
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

            {/* Tab 1: Do It (Step-by-step guidance) */}
            {activeTab === 'do' && (
              <div className="space-y-3.5 text-xs md:text-sm">
                <div className="p-3 rounded-xl bg-[#F8F5EE] border border-[#E8E5DD] space-y-1">
                  <div className="font-bold text-[#14313F]">{t('step1Title')}</div>
                  <p className="text-[#60757C]">{t('step1Desc')}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#F8F5EE] border border-[#E8E5DD] space-y-1">
                  <div className="font-bold text-[#14313F]">{t('step2Title')}</div>
                  <p className="text-[#60757C]">{t('step2Desc')}</p>
                </div>
                <div className="p-3 rounded-xl bg-[#F8F5EE] border border-[#E8E5DD] space-y-1">
                  <div className="font-bold text-[#14313F]">{t('step3Title')}</div>
                  <p className="text-[#60757C]">{t('step3Desc')}</p>
                </div>
              </div>
            )}

            {/* Tab 2: Why It Works */}
            {activeTab === 'why' && (
              <div className="space-y-3 text-xs md:text-sm text-[#14313F] leading-relaxed">
                <div className="p-4 rounded-xl bg-[#DCEDED]/50 border border-[#087D86]/20">
                  <h4 className="font-bold text-[#087D86] mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    {isTr ? 'Pergelin Mucizesi' : 'The Miracle of the Compass'}
                  </h4>
                  <p className="text-[#14313F]">{t('rosetteWhy')}</p>
                </div>
              </div>
            )}

            {/* Tab 3: Math Details */}
            {activeTab === 'math' && (
              <div className="space-y-3 text-xs md:text-sm text-[#14313F] leading-relaxed">
                <div className="p-4 rounded-xl bg-[#FBF2E3]/60 border border-[#D89A43]/30">
                  <h4 className="font-bold text-[#D89A43] mb-1 flex items-center gap-1.5">
                    <Calculator className="w-4 h-4" />
                    {isTr ? 'Açı ve Eşkenar Üçgen Bağıntısı' : 'Angle & Equilateral Geometry'}
                  </h4>
                  <p className="text-[#14313F]">{t('rosetteMath')}</p>
                  <div className="mt-2 pt-2 border-t border-[#D89A43]/20 font-mono text-xs text-[#087D86]">
                    360° / 6 = 60° | R_merkez = R_çevre
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mathematical Feedback / Criteria Check */}
          <div className="bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-5 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#60757C]">
              {t('criteriaMet')} ({validation.completedCriteria.length})
            </h4>
            <div className="space-y-1.5">
              {validation.completedCriteria.map((crit, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-[#087D86]">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#087D86] mt-0.5" />
                  <span>{crit}</span>
                </div>
              ))}
            </div>

            {validation.missingCriteria.length > 0 && (
              <>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#60757C] pt-2 border-t border-[#E8E5DD]">
                  {t('criteriaMissing')}
                </h4>
                <div className="space-y-1.5">
                  {validation.missingCriteria.map((crit, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-[#D89A43]">
                      <AlertCircle className="w-4 h-4 shrink-0 text-[#D89A43] mt-0.5" />
                      <span>{crit}</span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {validation.hints.length > 0 && (
              <div className="p-3 bg-[#F8F5EE] rounded-xl text-xs text-[#60757C] mt-2 border border-[#E8E5DD]">
                <span className="font-bold text-[#14313F] block mb-1">
                  💡 {t('hintsTitle')}:
                </span>
                {validation.hints[0]}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CELEBRATION MODAL OVERLAY (%100 KUSURSUZ DOĞRULAMA KUTLAMA KARTI) */}
      {showCelebrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#14313F]/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#FFFDF8] border-2 border-[#D89A43] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 relative animate-petal-bloom">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowCelebrationModal(false)}
              className="absolute top-4 right-4 p-2 text-[#60757C] hover:text-[#14313F] rounded-full hover:bg-[#F8F5EE] transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Trophy Icon */}
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#087D86] to-[#D89A43] flex items-center justify-center text-white shadow-lg shadow-[#D89A43]/30">
              <Sparkles className="w-9 h-9" />
            </div>

            {/* Title & Description */}
            <div className="text-center space-y-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-extrabold bg-[#DCEDED] text-[#087D86]">
                {isTr ? 'GEOMETRİK BAŞARI' : 'GEOMETRIC MASTERY'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-[#14313F]">
                {t('perfectCelebrationTitle')}
              </h2>
              <p className="text-xs sm:text-sm text-[#60757C] leading-relaxed">
                {t('perfectCelebrationDesc')}
              </p>
            </div>

            {/* Completed badges list */}
            <div className="bg-[#F8F5EE] border border-[#E8E5DD] rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2.5 text-xs font-bold text-[#087D86]">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#087D86]" />
                <span>{isTr ? '1 Merkez Çember ve 6 Eşit Çevre Çemberi' : '1 Center Circle & 6 Equal Outer Circles'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-[#087D86]">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#087D86]" />
                <span>{isTr ? 'Kusursuz 60° Eşit Açı Dağılımı (360° / 6)' : 'Exact 60° Radial Distribution (360° / 6)'}</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs font-bold text-[#087D86]">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#087D86]" />
                <span>{isTr ? 'Sabit Pergel Açıklığı Doğrulandı' : 'Fixed Compass Opening Verified'}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {onTransferToStudio && (
                <button
                  type="button"
                  onClick={() => {
                    setShowCelebrationModal(false);
                    onTransferToStudio(scene);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#087D86] text-white hover:bg-[#08646C] font-bold text-sm shadow-md transition cursor-pointer"
                >
                  <Palette className="w-4 h-4" />
                  <span>{t('transferToStudio')}</span>
                </button>
              )}

              {onNextLesson && (
                <button
                  type="button"
                  onClick={() => {
                    setShowCelebrationModal(false);
                    onNextLesson();
                  }}
                  className="inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl border border-[#D89A43] bg-[#FBF2E3] text-[#D89A43] hover:bg-[#FBF2E3]/80 font-bold text-sm transition cursor-pointer"
                >
                  <span>{isTr ? 'Döndürme Dersi' : 'Rotation Lesson'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Replay or keep admiring */}
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  triggerCelebration();
                }}
                className="text-xs text-[#60757C] hover:text-[#087D86] underline font-medium cursor-pointer"
              >
                {t('replayCelebration')} 🎉
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
