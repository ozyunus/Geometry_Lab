import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { GeoPoint, GeoSegment, GeoCircle, GeoPolygon, GeoScene, ToolType } from '../../types/geometry';
import { distance, getPolygonVertices, verticesToSvgPoints, inspectGeometryScene, GeometricInspectionResult } from '../../geometry/engine';
import {
  MousePointer2,
  Dot,
  Minus,
  Circle as CircleIcon,
  Hexagon,
  Eraser,
  Undo2,
  Redo2,
  RotateCcw,
  Save,
  Download,
  Grid,
  Magnet,
  Palette,
  Check,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck,
  Award,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface GeometryStudioProps {
  initialScene?: GeoScene | null;
  initialTemplateGuide?: 'none' | 'rosette' | 'seljuk8';
}

const COLOR_PALETTE = [
  { name: 'Teal', hex: '#087D86' },
  { name: 'Amber', hex: '#D89A43' },
  { name: 'Navy', hex: '#14313F' },
  { name: 'Crimson', hex: '#C23B22' },
  { name: 'Emerald', hex: '#2D6A4F' },
  { name: 'Indigo', hex: '#3F37C9' },
];

export const GeometryStudio: React.FC<GeometryStudioProps> = ({ initialScene, initialTemplateGuide }) => {
  const { t, lang } = useI18n();
  const isTr = lang === 'tr';

  const [activeTool, setActiveTool] = useState<ToolType>('circle');
  const [activeColor, setActiveColor] = useState<string>('#087D86');
  const [strokeWidth, setStrokeWidth] = useState<number>(2.5);
  const [isDashed, setIsDashed] = useState<boolean>(false);
  const [polygonSides, setPolygonSides] = useState<number>(6);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);
  const [snapToPoints, setSnapToPoints] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1);
  const [templateGuide, setTemplateGuide] = useState<'none' | 'rosette' | 'seljuk8'>(
    initialTemplateGuide || 'rosette'
  );
  const [templateOpacity, setTemplateOpacity] = useState<number>(0.2);

  // Geometric Accuracy Inspector Modal State
  const [showInspectorModal, setShowInspectorModal] = useState<boolean>(false);
  const [inspection, setInspection] = useState<GeometricInspectionResult | null>(null);

  // Scene state
  const [scene, setScene] = useState<GeoScene>(() => {
    if (initialScene) return initialScene;
    try {
      const saved = localStorage.getItem('patternlab_studio_scene_v1');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return {
      points: [{ id: 'p-origin', x: 300, y: 300, label: 'O', isAnchor: true }],
      segments: [],
      circles: [],
      polygons: [],
    };
  });

  // History for undo/redo
  const [history, setHistory] = useState<GeoScene[]>([]);
  const [redoStack, setRedoStack] = useState<GeoScene[]>([]);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Interaction tracking
  const [isInteracting, setIsInteracting] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; id?: string } | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ x: number; y: number } | null>(null);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Update scene when initialScene prop changes (e.g., from lesson transfer)
  useEffect(() => {
    if (initialScene) {
      setScene(initialScene);
    }
  }, [initialScene]);

  // Push current scene state to undo history
  const pushHistory = useCallback(() => {
    setHistory(prev => [...prev.slice(-25), JSON.parse(JSON.stringify(scene))]);
    setRedoStack([]);
  }, [scene]);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('patternlab_studio_scene_v1', JSON.stringify(scene));
    } catch {
      // ignore
    }
  }, [scene]);

  // Coordinate conversion
  const getSvgCoordinates = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 300, y: 300 };
    const rect = svgRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 600;
    let y = ((e.clientY - rect.top) / rect.height) * 600;

    // Grid snap (24px grid)
    if (snapToGrid) {
      x = Math.round(x / 24) * 24;
      y = Math.round(y / 24) * 24;
    }

    // Point snap
    if (snapToPoints) {
      for (const p of scene.points) {
        if (distance({ x, y }, p) <= 15) {
          return { x: p.x, y: p.y, snapPoint: p };
        }
      }
    }

    return { x, y, snapPoint: null };
  }, [snapToGrid, snapToPoints, scene.points]);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const coords = getSvgCoordinates(e);

    if (activeTool === 'eraser') {
      handleErase(coords.x, coords.y);
      return;
    }

    if (activeTool === 'point') {
      pushHistory();
      const newPoint: GeoPoint = {
        id: `p-${Date.now()}`,
        x: coords.x,
        y: coords.y,
        label: `P${scene.points.length}`,
      };
      setScene(prev => ({
        ...prev,
        points: [...prev.points, newPoint],
      }));
      return;
    }

    setIsInteracting(true);
    setDragStart({
      x: coords.x,
      y: coords.y,
      id: coords.snapPoint?.id || `p-${Date.now()}`,
    });
    setCurrentCoords({ x: coords.x, y: coords.y });
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const coords = getSvgCoordinates(e);
    setCurrentCoords({ x: coords.x, y: coords.y });
  };

  const handlePointerUp = () => {
    if (!isInteracting || !dragStart || !currentCoords) {
      setIsInteracting(false);
      setDragStart(null);
      return;
    }

    const dist = distance(dragStart, currentCoords);
    if (dist > 8) {
      pushHistory();
      const newPoints = [...scene.points];

      // Ensure start point exists
      let p1Id = dragStart.id!;
      if (!newPoints.some(p => p.id === p1Id)) {
        newPoints.push({ id: p1Id, x: dragStart.x, y: dragStart.y });
      }

      if (activeTool === 'segment') {
        // Ensure end point exists
        const p2Id = `p-${Date.now()}-end`;
        newPoints.push({ id: p2Id, x: currentCoords.x, y: currentCoords.y });

        const newSegment: GeoSegment = {
          id: `seg-${Date.now()}`,
          p1Id,
          p2Id,
          stroke: activeColor,
          strokeWidth,
          strokeDasharray: isDashed ? '5 4' : undefined,
        };
        setScene(prev => ({
          ...prev,
          points: newPoints,
          segments: [...prev.segments, newSegment],
        }));
      } else if (activeTool === 'circle') {
        const newCircle: GeoCircle = {
          id: `c-${Date.now()}`,
          centerId: p1Id,
          radius: dist,
          stroke: activeColor,
          strokeWidth,
          strokeDasharray: isDashed ? '5 4' : undefined,
        };
        setScene(prev => ({
          ...prev,
          points: newPoints,
          circles: [...prev.circles, newCircle],
        }));
      } else if (activeTool === 'polygon') {
        const angleRad = Math.atan2(currentCoords.y - dragStart.y, currentCoords.x - dragStart.x);
        const rotationDeg = (angleRad * 180) / Math.PI;
        const newPolygon: GeoPolygon = {
          id: `poly-${Date.now()}`,
          centerId: p1Id,
          sides: polygonSides,
          radius: dist,
          rotationDeg,
          stroke: activeColor,
          strokeWidth,
        };
        setScene(prev => ({
          ...prev,
          points: newPoints,
          polygons: [...prev.polygons, newPolygon],
        }));
      }
    }

    setIsInteracting(false);
    setDragStart(null);
  };

  const handleErase = (x: number, y: number) => {
    pushHistory();
    // Erase circles near click
    const filteredCircles = scene.circles.filter(c => {
      const cp = scene.points.find(p => p.id === c.centerId);
      if (!cp) return true;
      const d = distance({ x, y }, cp);
      return Math.abs(d - c.radius) > 15;
    });

    // Erase points near click
    const filteredPoints = scene.points.filter(p => distance({ x, y }, p) > 15);

    setScene(prev => ({
      ...prev,
      points: filteredPoints,
      circles: filteredCircles,
    }));
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack(r => [...r, JSON.parse(JSON.stringify(scene))]);
    setHistory(history.slice(0, -1));
    setScene(prev);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory(h => [...h, JSON.parse(JSON.stringify(scene))]);
    setRedoStack(redoStack.slice(0, -1));
    setScene(next);
  };

  const handleReset = () => {
    pushHistory();
    setScene({
      points: [{ id: 'p-origin', x: 300, y: 300, label: 'O', isAnchor: true }],
      segments: [],
      circles: [],
      polygons: [],
    });
  };

  // Export clean standalone SVG
  const handleExportSvg = () => {
    const pointMap = new Map<string, GeoPoint>();
    scene.points.forEach(p => pointMap.set(p.id, p));

    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="1200" height="1200">\n`;
    svgContent += `  <rect width="600" height="600" fill="#FFFDF8"/>\n`;

    // Circles
    scene.circles.forEach(c => {
      const cp = pointMap.get(c.centerId);
      if (cp) {
        svgContent += `  <circle cx="${cp.x.toFixed(2)}" cy="${cp.y.toFixed(2)}" r="${c.radius.toFixed(2)}" fill="${c.fill || 'none'}" stroke="${c.stroke || '#087D86'}" stroke-width="${c.strokeWidth || 2}" ${c.strokeDasharray ? `stroke-dasharray="${c.strokeDasharray}"` : ''}/>\n`;
      }
    });

    // Segments
    scene.segments.forEach(s => {
      const p1 = pointMap.get(s.p1Id);
      const p2 = pointMap.get(s.p2Id);
      if (p1 && p2) {
        svgContent += `  <line x1="${p1.x.toFixed(2)}" y1="${p1.y.toFixed(2)}" x2="${p2.x.toFixed(2)}" y2="${p2.y.toFixed(2)}" stroke="${s.stroke || '#087D86'}" stroke-width="${s.strokeWidth || 2}" ${s.strokeDasharray ? `stroke-dasharray="${s.strokeDasharray}"` : ''}/>\n`;
      }
    });

    // Polygons
    scene.polygons.forEach(poly => {
      const cp = pointMap.get(poly.centerId);
      if (cp) {
        const verts = getPolygonVertices(cp, poly.sides, poly.radius, poly.rotationDeg);
        svgContent += `  <polygon points="${verticesToSvgPoints(verts)}" fill="${poly.fill || 'none'}" stroke="${poly.stroke || '#087D86'}" stroke-width="${poly.strokeWidth || 2}"/>\n`;
      }
    });

    svgContent += `</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `patternlab-design-${dateStr}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export raster PNG via canvas
  const handleExportPng = () => {
    if (!svgRef.current) return;
    const svgEl = svgRef.current;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgEl);
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFDF8';
        ctx.fillRect(0, 0, 1200, 1200);
        ctx.drawImage(img, 0, 0, 1200, 1200);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        const dateStr = new Date().toISOString().slice(0, 10);
        link.href = pngUrl;
        link.download = `patternlab-design-${dateStr}.png`;
        link.click();
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleManualSave = () => {
    try {
      localStorage.setItem('patternlab_studio_scene_v1', JSON.stringify(scene));
      setSaveStatus(isTr ? 'Çalışmanız yerel belleğe kaydedildi!' : 'Saved to browser storage!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus(isTr ? 'Kayıt başarısız oldu' : 'Failed to save');
    }
  };

  const pointMap = new Map<string, GeoPoint>();
  scene.points.forEach(p => pointMap.set(p.id, p));

  // In-progress preview calculation
  let previewElement: React.ReactNode = null;
  if (isInteracting && dragStart && currentCoords) {
    const d = distance(dragStart, currentCoords);
    if (activeTool === 'segment') {
      previewElement = (
        <line
          x1={dragStart.x}
          y1={dragStart.y}
          x2={currentCoords.x}
          y2={currentCoords.y}
          stroke={activeColor}
          strokeWidth={strokeWidth}
          strokeDasharray="4 4"
        />
      );
    } else if (activeTool === 'circle') {
      previewElement = (
        <circle
          cx={dragStart.x}
          cy={dragStart.y}
          r={d}
          fill="none"
          stroke={activeColor}
          strokeWidth={strokeWidth}
          strokeDasharray="4 4"
        />
      );
    } else if (activeTool === 'polygon') {
      const angleRad = Math.atan2(currentCoords.y - dragStart.y, currentCoords.x - dragStart.x);
      const rotationDeg = (angleRad * 180) / Math.PI;
      const verts = getPolygonVertices(dragStart, polygonSides, d, rotationDeg);
      previewElement = (
        <polygon
          points={verticesToSvgPoints(verts)}
          fill="none"
          stroke={activeColor}
          strokeWidth={strokeWidth}
          strokeDasharray="4 4"
        />
      );
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-3 md:p-6 space-y-4">
      {/* Top Studio Control Bar */}
      <div className="bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Tool Selector Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            title={t('toolCircle')}
            onClick={() => setActiveTool('circle')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTool === 'circle'
                ? 'bg-[#087D86] text-white shadow-sm'
                : 'bg-white text-[#14313F] border border-[#E8E5DD] hover:bg-[#F8F5EE]'
            }`}
          >
            <CircleIcon className="w-4 h-4" />
            <span>{t('toolCircle')}</span>
          </button>

          <button
            type="button"
            title={t('toolSegment')}
            onClick={() => setActiveTool('segment')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTool === 'segment'
                ? 'bg-[#087D86] text-white shadow-sm'
                : 'bg-white text-[#14313F] border border-[#E8E5DD] hover:bg-[#F8F5EE]'
            }`}
          >
            <Minus className="w-4 h-4" />
            <span>{t('toolSegment')}</span>
          </button>

          <button
            type="button"
            title={t('toolPolygon')}
            onClick={() => setActiveTool('polygon')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTool === 'polygon'
                ? 'bg-[#087D86] text-white shadow-sm'
                : 'bg-white text-[#14313F] border border-[#E8E5DD] hover:bg-[#F8F5EE]'
            }`}
          >
            <Hexagon className="w-4 h-4" />
            <span>{t('toolPolygon')}</span>
          </button>

          <button
            type="button"
            title={t('toolPoint')}
            onClick={() => setActiveTool('point')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTool === 'point'
                ? 'bg-[#087D86] text-white shadow-sm'
                : 'bg-white text-[#14313F] border border-[#E8E5DD] hover:bg-[#F8F5EE]'
            }`}
          >
            <Dot className="w-4 h-4" />
            <span>{t('toolPoint')}</span>
          </button>

          <button
            type="button"
            title={t('toolEraser')}
            onClick={() => setActiveTool('eraser')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTool === 'eraser'
                ? 'bg-[#C23B22] text-white shadow-sm'
                : 'bg-white text-[#14313F] border border-[#E8E5DD] hover:bg-[#F8F5EE]'
            }`}
          >
            <Eraser className="w-4 h-4" />
            <span>{t('toolEraser')}</span>
          </button>
        </div>

        {/* History & Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            title={t('undo')}
            onClick={handleUndo}
            disabled={history.length === 0}
            className="p-2 rounded-xl border border-[#E8E5DD] bg-white text-[#14313F] hover:bg-[#F8F5EE] disabled:opacity-40 cursor-pointer"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title={t('redo')}
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="p-2 rounded-xl border border-[#E8E5DD] bg-white text-[#14313F] hover:bg-[#F8F5EE] disabled:opacity-40 cursor-pointer"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            title={t('reset')}
            onClick={handleReset}
            className="p-2 rounded-xl border border-[#E8E5DD] bg-white text-[#14313F] hover:bg-[#F8F5EE] cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            type="button"
            title={t('inspectPattern')}
            onClick={() => {
              setInspection(inspectGeometryScene(scene, lang));
              setShowInspectorModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#D89A43] bg-[#FBF2E3] text-[#D89A43] text-xs font-bold hover:bg-[#FBF2E3]/80 cursor-pointer shadow-2xs"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isTr ? 'Doğrula' : 'Verify'}</span>
          </button>

          <button
            type="button"
            title={t('save')}
            onClick={handleManualSave}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#087D86] bg-[#DCEDED]/50 text-[#087D86] text-xs font-bold hover:bg-[#DCEDED] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">{t('save')}</span>
          </button>

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleExportSvg}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#087D86] text-white text-xs font-bold hover:bg-[#08646C] shadow-sm cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{t('exportSvg')}</span>
            </button>
            <button
              type="button"
              onClick={handleExportPng}
              className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl border border-[#E8E5DD] bg-white text-[#14313F] text-xs font-semibold hover:bg-[#F8F5EE] cursor-pointer"
            >
              <span>PNG</span>
            </button>
          </div>
        </div>
      </div>

      {saveStatus && (
        <div className="bg-[#DCEDED] border border-[#087D86]/30 text-[#087D86] text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4" />
          {saveStatus}
        </div>
      )}

      {/* Main Studio Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Canvas Area */}
        <div className="lg:col-span-9 bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-4 flex flex-col items-center justify-center relative min-h-[500px] shadow-sm overflow-hidden">
          {showGrid && (
            <div className="absolute inset-0 bg-geo-grid pointer-events-none opacity-60" />
          )}

          {/* SVG Canvas */}
          <svg
            ref={svgRef}
            viewBox="0 0 600 600"
            className="w-full max-w-[560px] aspect-square relative z-10 cursor-crosshair geometry-canvas-touch border border-[#E8E5DD]/70 rounded-xl bg-white shadow-inner"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Origin Grid Guides */}
            <g opacity="0.2">
              <line x1="0" y1="300" x2="600" y2="300" stroke="#60757C" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="300" y1="0" x2="300" y2="600" stroke="#60757C" strokeWidth="1" strokeDasharray="4 4" />
            </g>

            {/* Background Template Watermark Guide (Low Opacity) */}
            {templateGuide === 'rosette' && (
              <g opacity={templateOpacity} className="pointer-events-none transition-opacity duration-300">
                <circle cx="300" cy="300" r="115" fill="rgba(8, 125, 134, 0.05)" stroke="#087D86" strokeWidth="2.5" strokeDasharray="6 6" />
                {[0, 60, 120, 180, 240, 300].map(deg => {
                  const ang = (deg * Math.PI) / 180;
                  return (
                    <circle
                      key={deg}
                      cx={300 + 115 * Math.cos(ang)}
                      cy={300 + 115 * Math.sin(ang)}
                      r="115"
                      fill="none"
                      stroke="#D89A43"
                      strokeWidth="2"
                      strokeDasharray="5 5"
                    />
                  );
                })}
                <circle cx="300" cy="300" r="4" fill="#087D86" />
              </g>
            )}

            {templateGuide === 'seljuk8' && (
              <g opacity={templateOpacity} className="pointer-events-none transition-opacity duration-300">
                <rect x="208" y="208" width="184" height="184" fill="none" stroke="#087D86" strokeWidth="2" strokeDasharray="5 5" />
                <rect x="208" y="208" width="184" height="184" transform="rotate(45 300 300)" fill="none" stroke="#D89A43" strokeWidth="2" strokeDasharray="5 5" />
                <polygon
                  points={Array.from({ length: 16 }).map((_, i) => {
                    const isTip = i % 2 === 0;
                    const r = isTip ? 130 : 130 * (Math.SQRT2 - 1);
                    const ang = (i * 22.5 - 90) * (Math.PI / 180);
                    return `${(300 + r * Math.cos(ang)).toFixed(1)},${(300 + r * Math.sin(ang)).toFixed(1)}`;
                  }).join(' ')}
                  fill="rgba(8, 125, 134, 0.08)"
                  stroke="#14313F"
                  strokeWidth="2.5"
                  strokeDasharray="4 4"
                />
                <circle cx="300" cy="300" r="4" fill="#14313F" />
              </g>
            )}

            {/* Render Circles */}
            {scene.circles.map(c => {
              const cp = pointMap.get(c.centerId);
              if (!cp) return null;
              return (
                <circle
                  key={c.id}
                  cx={cp.x}
                  cy={cp.y}
                  r={c.radius}
                  fill={c.fill || 'none'}
                  stroke={c.stroke || '#087D86'}
                  strokeWidth={c.strokeWidth || 2}
                  strokeDasharray={c.strokeDasharray}
                />
              );
            })}

            {/* Render Segments */}
            {scene.segments.map(seg => {
              const p1 = pointMap.get(seg.p1Id);
              const p2 = pointMap.get(seg.p2Id);
              if (!p1 || !p2) return null;
              return (
                <line
                  key={seg.id}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={seg.stroke || '#087D86'}
                  strokeWidth={seg.strokeWidth || 2}
                  strokeDasharray={seg.strokeDasharray}
                />
              );
            })}

            {/* Render Polygons */}
            {scene.polygons.map(poly => {
              const cp = pointMap.get(poly.centerId);
              if (!cp) return null;
              const verts = getPolygonVertices(cp, poly.sides, poly.radius, poly.rotationDeg);
              return (
                <polygon
                  key={poly.id}
                  points={verticesToSvgPoints(verts)}
                  fill={poly.fill || 'none'}
                  stroke={poly.stroke || '#087D86'}
                  strokeWidth={poly.strokeWidth || 2}
                />
              );
            })}

            {/* In-progress Drag Preview */}
            {previewElement}

            {/* Render Points */}
            {scene.points.map(p => (
              <g key={p.id}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={p.isAnchor ? 5 : 4}
                  fill={p.isAnchor ? '#087D86' : '#14313F'}
                  stroke="white"
                  strokeWidth="1.5"
                />
                {p.label && (
                  <text
                    x={p.x + 8}
                    y={p.y - 8}
                    className="text-[12px] font-mono font-bold fill-[#14313F] select-none pointer-events-none"
                  >
                    {p.label}
                  </text>
                )}
              </g>
            ))}
          </svg>

          {/* Coordinate Readout Bar */}
          <div className="w-full mt-3 flex items-center justify-between text-xs text-[#60757C] pt-2 border-t border-[#E8E5DD]">
            <div className="flex items-center gap-3">
              <span>
                {isTr ? 'Öğeler' : 'Elements'}: {scene.circles.length} {t('toolCircle').toLowerCase()}, {scene.segments.length} {t('toolSegment').toLowerCase()}, {scene.polygons.length} {t('toolPolygon').toLowerCase()}
              </span>
            </div>
            {currentCoords && (
              <div className="font-mono text-xs font-semibold text-[#14313F]">
                X: {Math.round(currentCoords.x)} | Y: {Math.round(currentCoords.y)}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Controls (Colors, Thickness, Grid, Snap) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Colors Panel */}
          <div className="bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#60757C] flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-[#087D86]" />
              {t('strokeColor')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {COLOR_PALETTE.map(c => (
                <button
                  key={c.hex}
                  type="button"
                  title={c.name}
                  onClick={() => setActiveColor(c.hex)}
                  className={`w-7 h-7 rounded-full border-2 transition cursor-pointer flex items-center justify-center ${
                    activeColor === c.hex ? 'border-[#14313F] scale-110 shadow-sm' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c.hex }}
                >
                  {activeColor === c.hex && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          {/* Stroke Width & Line Style */}
          <div className="bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#60757C]">
              {t('strokeWidth')}
            </h3>
            <div className="grid grid-cols-3 gap-1.5">
              {[1.5, 2.5, 4].map(w => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setStrokeWidth(w)}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                    strokeWidth === w
                      ? 'bg-[#087D86] text-white border-[#087D86]'
                      : 'bg-white border-[#E8E5DD] text-[#14313F] hover:bg-[#F8F5EE]'
                  }`}
                >
                  {w}px
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-[#E8E5DD] flex items-center justify-between">
              <span className="text-xs font-medium text-[#14313F]">{t('lineStyle')}</span>
              <button
                type="button"
                onClick={() => setIsDashed(!isDashed)}
                className={`px-3 py-1 text-xs font-bold rounded-lg border transition cursor-pointer ${
                  isDashed
                    ? 'bg-[#FBF2E3] text-[#D89A43] border-[#D89A43]'
                    : 'bg-white text-[#14313F] border-[#E8E5DD]'
                }`}
              >
                {isDashed ? t('styleDashed') : t('styleSolid')}
              </button>
            </div>
          </div>

          {/* Polygon Sides (if polygon tool is active) */}
          {activeTool === 'polygon' && (
            <div className="bg-[#FFFDF8] border border-[#087D86] rounded-2xl p-4 shadow-sm space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#14313F]">{t('polygonSides')}</span>
                <span className="font-mono text-xs font-bold text-[#087D86]">{polygonSides}</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[3, 4, 5, 6, 8].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setPolygonSides(s)}
                    className={`py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                      polygonSides === s
                        ? 'bg-[#087D86] text-white border-[#087D86]'
                        : 'bg-white border-[#E8E5DD] text-[#14313F] hover:bg-[#F8F5EE]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grid & Snapping Options */}
          <div className="bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-4 shadow-sm space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#60757C]">
              {isTr ? 'Hizalama & Kılavuzlar' : 'Alignment & Guides'}
            </h3>

            <label className="flex items-center gap-2 text-xs font-medium text-[#14313F] cursor-pointer">
              <input
                type="checkbox"
                checked={showGrid}
                onChange={(e) => setShowGrid(e.target.checked)}
                className="rounded text-[#087D86] focus:ring-0 cursor-pointer"
              />
              <Grid className="w-3.5 h-3.5 text-[#60757C]" />
              <span>{t('gridToggle')}</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-[#14313F] cursor-pointer">
              <input
                type="checkbox"
                checked={snapToGrid}
                onChange={(e) => setSnapToGrid(e.target.checked)}
                className="rounded text-[#087D86] focus:ring-0 cursor-pointer"
              />
              <Magnet className="w-3.5 h-3.5 text-[#60757C]" />
              <span>{t('snapGrid')}</span>
            </label>

            <label className="flex items-center gap-2 text-xs font-medium text-[#14313F] cursor-pointer">
              <input
                type="checkbox"
                checked={snapToPoints}
                onChange={(e) => setSnapToPoints(e.target.checked)}
                className="rounded text-[#087D86] focus:ring-0 cursor-pointer"
              />
              <Dot className="w-3.5 h-3.5 text-[#60757C]" />
              <span>{t('snapPoints')}</span>
            </label>
          </div>

          {/* Background Watermark Template Guide Card */}
          <div className="bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-4 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#14313F]">
                {isTr ? 'Kılavuz Şablon (Arkaplan)' : 'Guide Template (Watermark)'}
              </h3>
              {templateGuide !== 'none' && (
                <span className="text-[10px] font-mono font-bold text-[#087D86] px-1.5 py-0.5 rounded bg-[#DCEDED]">
                  %{Math.round(templateOpacity * 100)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => setTemplateGuide('rosette')}
                className={`py-1.5 px-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
                  templateGuide === 'rosette'
                    ? 'bg-[#087D86] text-white border-[#087D86]'
                    : 'bg-white border-[#E8E5DD] text-[#14313F] hover:bg-[#F8F5EE]'
                }`}
              >
                {isTr ? '🌸 Çiçek' : '🌸 Rosette'}
              </button>

              <button
                type="button"
                onClick={() => setTemplateGuide('seljuk8')}
                className={`py-1.5 px-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
                  templateGuide === 'seljuk8'
                    ? 'bg-[#087D86] text-white border-[#087D86]'
                    : 'bg-white border-[#E8E5DD] text-[#14313F] hover:bg-[#F8F5EE]'
                }`}
              >
                {isTr ? '⭐ 8 Yıldız' : '⭐ 8-Star'}
              </button>

              <button
                type="button"
                onClick={() => setTemplateGuide('none')}
                className={`py-1.5 px-1 text-[11px] font-bold rounded-lg border transition cursor-pointer ${
                  templateGuide === 'none'
                    ? 'bg-[#14313F] text-white border-[#14313F]'
                    : 'bg-white border-[#E8E5DD] text-[#60757C] hover:bg-[#F8F5EE]'
                }`}
              >
                {isTr ? 'Gizle' : 'Hide'}
              </button>
            </div>

            {templateGuide !== 'none' && (
              <div className="flex items-center justify-between pt-1 text-[11px] text-[#60757C]">
                <span>{isTr ? 'Belirginlik' : 'Opacity'}:</span>
                <div className="flex gap-1">
                  {[0.12, 0.22, 0.4].map(op => (
                    <button
                      key={op}
                      type="button"
                      onClick={() => setTemplateOpacity(op)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        templateOpacity === op ? 'bg-[#087D86] text-white' : 'bg-[#F8F5EE] text-[#14313F]'
                      }`}
                    >
                      %{Math.round(op * 100)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GEOMETRIC ACCURACY INSPECTOR MODAL */}
      {showInspectorModal && inspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E5DD] pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#087D86]" />
                <h3 className="text-sm font-bold text-[#14313F]">
                  {t('accuracyInspector')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInspectorModal(false)}
                className="p-1 rounded-lg text-[#60757C] hover:text-[#14313F] hover:bg-[#F8F5EE] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Score & Pattern Banner */}
            <div className="p-4 rounded-xl bg-[#DCEDED]/50 border border-[#087D86]/20 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-[#60757C] font-bold block">
                  {isTr ? 'Algılanan Geometrik Motif' : 'Detected Pattern'}
                </span>
                <span className="text-sm font-bold text-[#14313F]">
                  {inspection.detectedPattern === 'rosette'
                    ? '🌸 Altı Yapraklı Rozeta (6-Fold)'
                    : inspection.detectedPattern === 'seljuk8'
                    ? '⭐ 8 Köşeli Selçuklu Yıldızı (8-Fold)'
                    : inspection.detectedPattern === 'concentric'
                    ? '◎ Eşmerkezli Çemberler'
                    : isTr ? 'Özgün Geometrik Kompozisyon' : 'Custom Composition'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] uppercase tracking-wider text-[#60757C] font-bold block">
                  {t('scoreLabel')}
                </span>
                <span className="font-mono text-xl font-bold text-[#087D86]">
                  %{inspection.score}
                </span>
              </div>
            </div>

            {/* Summary Message */}
            <p className="text-xs text-[#60757C] leading-relaxed">
              {inspection.summary}
            </p>

            {/* Checks list */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {inspection.checks.map((chk, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                    chk.passed
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50/60 border-amber-200 text-amber-900'
                  }`}
                >
                  {chk.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block">{chk.title}</span>
                    <span className="text-[11px] opacity-80">{chk.detail}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowInspectorModal(false)}
              className="w-full py-2.5 px-4 rounded-xl bg-[#087D86] text-white hover:bg-[#08646C] font-bold text-xs shadow-sm transition cursor-pointer"
            >
              {isTr ? 'Anladım, Çizime Dön' : 'Done, Return to Canvas'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
