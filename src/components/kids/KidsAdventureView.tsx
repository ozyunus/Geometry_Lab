import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Star, ArrowRight, ArrowLeft, RefreshCcw, Smile, CheckCircle, Undo2, Award } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { ActiveView } from '../layout/Navbar';

interface KidsAdventureProps {
  onReturn: () => void;
  onNavigate: (view: ActiveView) => void;
}

interface DrawnLine {
  id: string;
  from: string;
  to: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
}

export const KidsAdventureView: React.FC<KidsAdventureProps> = ({ onReturn }) => {
  const { lang } = useI18n();
  const isTr = lang === 'tr';

  const [step, setStep] = useState(1);
  const [stars, setStars] = useState(0);
  const [activeColor, setActiveColor] = useState('#3A6B5C');

  // Organic calm colors
  const calmColors = ['#3A6B5C', '#D4A373', '#5A7184', '#8C6D9E', '#BC6C25', '#283618'];

  // SVG Ref for exact 1:1 coordinate calculation
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Helper for 1:1 SVG coordinate conversion
  const getSvgCoordinates = (e: React.PointerEvent<Element>, viewBoxSize = 400) => {
    if (!svgRef.current) return { x: viewBoxSize / 2, y: viewBoxSize / 2 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(((e.clientX - rect.left) / rect.width) * viewBoxSize, 0), viewBoxSize);
    const y = Math.min(Math.max(((e.clientY - rect.top) / rect.height) * viewBoxSize, 0), viewBoxSize);
    return { x, y };
  };

  // Helper to find closest vertex within threshold
  const findClosestVertex = <T extends { id: string; x: number; y: number }>(coords: { x: number; y: number }, vertices: T[], threshold = 40) => {
    for (const v of vertices) {
      if (Math.hypot(coords.x - v.x, coords.y - v.y) <= threshold) {
        return v;
      }
    }
    return null;
  };

  const getEdgeKey = (id1: string, id2: string) => [id1, id2].sort().join('-');

  // STEP 1: Place 1 dot
  const [dot1, setDot1] = useState<{ x: number; y: number; color: string } | null>(null);

  // STEP 2: Drag line
  const lineStart = { x: 100, y: 200 };
  const lineEnd = { x: 300, y: 200 };
  const [isDrawingLine, setIsDrawingLine] = useState(false);
  const [lineCompleted, setLineCompleted] = useState(false);
  const [lineColor, setLineColor] = useState('#3A6B5C');
  const [currentLineDrag, setCurrentLineDrag] = useState<{ x: number; y: number } | null>(null);

  // Generic Polygon / Star line state for stages 3, 4, 5, 6, 7, 8, 13, 14, 15, 16, 17, 18, 19, 20
  const [drawnLines, setDrawnLines] = useState<DrawnLine[]>([]);
  const [activeStart, setActiveStart] = useState<string | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);

  // STEP 9: Circle
  const [circleRadius, setCircleRadius] = useState<number>(0);
  const [isDrawingCircle, setIsDrawingCircle] = useState(false);
  const [circleCompleted, setCircleCompleted] = useState(false);

  // STEP 10: Two Overlapping Circles
  const [circle2Radius, setCircle2Radius] = useState<number>(0);
  const [isDrawingCircle2, setIsDrawingCircle2] = useState(false);
  const [circle2Completed, setCircle2Completed] = useState(false);

  // STEP 11: 3 Petals Rosette
  const [petals3Count, setPetals3Count] = useState<number>(0);

  // STEP 12: Full 6 Petals Rosette
  const [petals6Count, setPetals6Count] = useState<number>(0);

  const triggerConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#3A6B5C', '#D4A373', '#5A7184', '#8C6D9E']
    });
  };

  const handleNext = () => {
    setDrawnLines([]);
    setActiveStart(null);
    setDragCurrent(null);
    setStep(s => Math.min(s + 1, 20));
    triggerConfetti();
  };

  const handlePrev = () => {
    setDrawnLines([]);
    setActiveStart(null);
    setDragCurrent(null);
    setStep(s => Math.max(s - 1, 1));
  };

  const handleResetStep = () => {
    setDrawnLines([]);
    setActiveStart(null);
    setDragCurrent(null);
    if (step === 1) setDot1(null);
    if (step === 2) { setLineCompleted(false); setCurrentLineDrag(null); }
    if (step === 9) { setCircleRadius(0); setCircleCompleted(false); }
    if (step === 10) { setCircle2Radius(0); setCircle2Completed(false); }
    if (step === 11) setPetals3Count(0);
    if (step === 12) setPetals6Count(0);
  };

  const handleUndoStep = () => {
    if (drawnLines.length > 0) setDrawnLines(prev => prev.slice(0, -1));
    if (step === 11 && petals3Count > 0) setPetals3Count(c => c - 1);
    if (step === 12 && petals6Count > 0) setPetals6Count(c => c - 1);
  };

  // Stage configurations for vertices and valid edges
  const getStageConfig = () => {
    switch (step) {
      case 3: // Triangle
        return {
          vertices: [
            { id: 't1', x: 200, y: 70, label: 'A' },
            { id: 't2', x: 80, y: 290, label: 'B' },
            { id: 't3', x: 320, y: 290, label: 'C' }
          ],
          edges: ['t1-t2', 't2-t3', 't1-t3'],
          polygonSvg: <polygon points="200,70 80,290 320,290" fill="none" stroke="#CBD5E1" strokeWidth="3" strokeDasharray="5 5" />
        };
      case 4: // Square
        return {
          vertices: [
            { id: 's1', x: 110, y: 100, label: 'A' },
            { id: 's2', x: 290, y: 100, label: 'B' },
            { id: 's3', x: 290, y: 280, label: 'C' },
            { id: 's4', x: 110, y: 280, label: 'D' }
          ],
          edges: ['s1-s2', 's2-s3', 's3-s4', 's1-s4'],
          polygonSvg: <rect x="110" y="100" width="180" height="180" fill="none" stroke="#CBD5E1" strokeWidth="3" strokeDasharray="5 5" rx="6" />
        };
      case 5: // Right Angle 90°
        return {
          vertices: [
            { id: 'a1', x: 100, y: 100, label: 'A' },
            { id: 'a2', x: 100, y: 280, label: 'B' },
            { id: 'a3', x: 280, y: 280, label: 'C' }
          ],
          edges: ['a1-a2', 'a2-a3'],
          polygonSvg: <polyline points="100,100 100,280 280,280" fill="none" stroke="#CBD5E1" strokeWidth="3" strokeDasharray="5 5" />
        };
      case 6: // Pentagon (5 sides)
        return {
          vertices: Array.from({ length: 5 }).map((_, i) => {
            const ang = (i * 72 - 90) * (Math.PI / 180);
            return { id: `p${i+1}`, x: Math.round(200 + 110 * Math.cos(ang)), y: Math.round(200 + 110 * Math.sin(ang)), label: `${i+1}` };
          }),
          edges: ['p1-p2', 'p2-p3', 'p3-p4', 'p4-p5', 'p1-p5'],
          polygonSvg: (
            <polygon
              points={Array.from({ length: 5 }).map((_, i) => {
                const ang = (i * 72 - 90) * (Math.PI / 180);
                return `${Math.round(200 + 110 * Math.cos(ang))},${Math.round(200 + 110 * Math.sin(ang))}`;
              }).join(' ')}
              fill="none" stroke="#CBD5E1" strokeWidth="3" strokeDasharray="5 5"
            />
          )
        };
      case 7: // Hexagon (6 sides)
        return {
          vertices: Array.from({ length: 6 }).map((_, i) => {
            const ang = (i * 60 - 90) * (Math.PI / 180);
            return { id: `h${i+1}`, x: Math.round(200 + 110 * Math.cos(ang)), y: Math.round(200 + 110 * Math.sin(ang)), label: `${i+1}` };
          }),
          edges: ['h1-h2', 'h2-h3', 'h3-h4', 'h4-h5', 'h5-h6', 'h1-h6'],
          polygonSvg: (
            <polygon
              points={Array.from({ length: 6 }).map((_, i) => {
                const ang = (i * 60 - 90) * (Math.PI / 180);
                return `${Math.round(200 + 110 * Math.cos(ang))},${Math.round(200 + 110 * Math.sin(ang))}`;
              }).join(' ')}
              fill="none" stroke="#CBD5E1" strokeWidth="3" strokeDasharray="5 5"
            />
          )
        };
      case 8: // Octagon (8 sides)
        return {
          vertices: Array.from({ length: 8 }).map((_, i) => {
            const ang = (i * 45 - 90) * (Math.PI / 180);
            return { id: `o${i+1}`, x: Math.round(200 + 110 * Math.cos(ang)), y: Math.round(200 + 110 * Math.sin(ang)), label: `${i+1}` };
          }),
          edges: ['o1-o2', 'o2-o3', 'o3-o4', 'o4-o5', 'o5-o6', 'o6-o7', 'o7-o8', 'o1-o8'],
          polygonSvg: (
            <polygon
              points={Array.from({ length: 8 }).map((_, i) => {
                const ang = (i * 45 - 90) * (Math.PI / 180);
                return `${Math.round(200 + 110 * Math.cos(ang))},${Math.round(200 + 110 * Math.sin(ang))}`;
              }).join(' ')}
              fill="none" stroke="#CBD5E1" strokeWidth="3" strokeDasharray="5 5"
            />
          )
        };
      case 13: // Hexagram Star (6 lines)
        return {
          vertices: Array.from({ length: 6 }).map((_, i) => {
            const ang = (i * 60 - 90) * (Math.PI / 180);
            return { id: `st${i+1}`, x: Math.round(200 + 110 * Math.cos(ang)), y: Math.round(200 + 110 * Math.sin(ang)), label: `${i+1}` };
          }),
          edges: ['st1-st3', 'st3-st5', 'st1-st5', 'st2-st4', 'st4-st6', 'st2-st6'],
          polygonSvg: (
            <g>
              <polygon points="200,90 295,255 105,255" fill="none" stroke="#CBD5E1" strokeWidth="3" strokeDasharray="5 5" />
              <polygon points="200,310 105,145 295,145" fill="none" stroke="#CBD5E1" strokeWidth="3" strokeDasharray="5 5" />
            </g>
          )
        };
      case 14: // Rhombus Diamond (4 lines)
        return {
          vertices: [
            { id: 'd1', x: 200, y: 70, label: 'A' },
            { id: 'd2', x: 310, y: 200, label: 'B' },
            { id: 'd3', x: 200, y: 330, label: 'C' },
            { id: 'd4', x: 90, y: 200, label: 'D' }
          ],
          edges: ['d1-d2', 'd2-d3', 'd3-d4', 'd1-d4'],
          polygonSvg: <polygon points="200,70 310,200 200,330 90,200" fill="none" stroke="#CBD5E1" strokeWidth="3" strokeDasharray="5 5" />
        };
      case 15: // Seljuk 8-Point Star (8 Outer Points)
        return {
          vertices: Array.from({ length: 8 }).map((_, i) => {
            const ang = (i * 45 - 90) * (Math.PI / 180);
            return { id: `sel${i+1}`, x: Math.round(200 + 110 * Math.cos(ang)), y: Math.round(200 + 110 * Math.sin(ang)), label: `${i+1}` };
          }),
          edges: ['sel1-sel3', 'sel3-sel5', 'sel5-sel7', 'sel1-sel7', 'sel2-sel4', 'sel4-sel6', 'sel6-sel8', 'sel2-sel8'],
          polygonSvg: (
            <g>
              <rect x="122" y="122" width="156" height="156" fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeDasharray="4 4" />
              <rect x="122" y="122" width="156" height="156" transform="rotate(45 200 200)" fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeDasharray="4 4" />
            </g>
          )
        };
      case 16: // Overlapping Squares Rotated 45°
        return {
          vertices: [
            { id: 'sqa1', x: 120, y: 120, label: 'A' },
            { id: 'sqa2', x: 280, y: 120, label: 'B' },
            { id: 'sqa3', x: 280, y: 280, label: 'C' },
            { id: 'sqa4', x: 120, y: 280, label: 'D' },
            { id: 'sqb1', x: 200, y: 87, label: 'E' },
            { id: 'sqb2', x: 313, y: 200, label: 'F' },
            { id: 'sqb3', x: 200, y: 313, label: 'G' },
            { id: 'sqb4', x: 87, y: 200, label: 'H' }
          ],
          edges: ['sqa1-sqa2', 'sqa2-sqa3', 'sqa3-sqa4', 'sqa1-sqa4', 'sqb1-sqb2', 'sqb2-sqb3', 'sqb3-sqb4', 'sqb1-sqb4'],
          polygonSvg: (
            <g>
              <rect x="120" y="120" width="160" height="160" fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeDasharray="4 4" />
              <rect x="120" y="120" width="160" height="160" transform="rotate(45 200 200)" fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeDasharray="4 4" />
            </g>
          )
        };
      case 17: // Andalusian Tile Grid Star
        return {
          vertices: [
            { id: 'an1', x: 200, y: 90, label: '1' },
            { id: 'an2', x: 310, y: 200, label: '2' },
            { id: 'an3', x: 200, y: 310, label: '3' },
            { id: 'an4', x: 90, y: 200, label: '4' },
            { id: 'an5', x: 130, y: 130, label: '5' },
            { id: 'an6', x: 270, y: 130, label: '6' },
            { id: 'an7', x: 270, y: 270, label: '7' },
            { id: 'an8', x: 130, y: 270, label: '8' }
          ],
          edges: ['an1-an7', 'an1-an8', 'an3-an5', 'an3-an6', 'an2-an5', 'an2-an8', 'an4-an6', 'an4-an7'],
          polygonSvg: <polygon points="200,90 270,130 310,200 270,270 200,310 130,270 90,200 130,130" fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeDasharray="4 4" />
        };
      case 18: // Girih Pentagram Star
        return {
          vertices: Array.from({ length: 5 }).map((_, i) => {
            const ang = (i * 72 - 90) * (Math.PI / 180);
            return { id: `g${i+1}`, x: Math.round(200 + 110 * Math.cos(ang)), y: Math.round(200 + 110 * Math.sin(ang)), label: `${i+1}` };
          }),
          edges: ['g1-g3', 'g3-g5', 'g5-g2', 'g2-g4', 'g4-g1'],
          polygonSvg: (
            <polygon
              points={Array.from({ length: 5 }).map((_, i) => {
                const ang = ((i * 2) % 5 * 72 - 90) * (Math.PI / 180);
                return `${Math.round(200 + 110 * Math.cos(ang))},${Math.round(200 + 110 * Math.sin(ang))}`;
              }).join(' ')}
              fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeDasharray="4 4"
            />
          )
        };
      case 19: // Kumiko Asanoha Hemp Leaf
        return {
          vertices: [
            { id: 'km0', x: 200, y: 200, label: 'C' },
            ...Array.from({ length: 6 }).map((_, i) => {
              const ang = (i * 60 - 90) * (Math.PI / 180);
              return { id: `km${i+1}`, x: Math.round(200 + 110 * Math.cos(ang)), y: Math.round(200 + 110 * Math.sin(ang)), label: `${i+1}` };
            })
          ],
          edges: ['km0-km1', 'km0-km2', 'km0-km3', 'km0-km4', 'km0-km5', 'km0-km6', 'km1-km2', 'km2-km3', 'km3-km4', 'km4-km5', 'km5-km6', 'km1-km6'],
          polygonSvg: (
            <g>
              <polygon points={Array.from({ length: 6 }).map((_, i) => {
                const ang = (i * 60 - 90) * (Math.PI / 180);
                return `${Math.round(200 + 110 * Math.cos(ang))},${Math.round(200 + 110 * Math.sin(ang))}`;
              }).join(' ')} fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeDasharray="4 4" />
              {[0, 60, 120, 180, 240, 300].map(deg => {
                const ang = (deg * Math.PI) / 180;
                return <line key={deg} x1="200" y1="200" x2={Math.round(200 + 110 * Math.cos(ang))} y2={Math.round(200 + 110 * Math.sin(ang))} stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" />;
              })}
            </g>
          )
        };
      case 20: // Royal 12-Point Crown Star
        return {
          vertices: Array.from({ length: 12 }).map((_, i) => {
            const ang = (i * 30 - 90) * (Math.PI / 180);
            return { id: `r${i+1}`, x: Math.round(200 + 115 * Math.cos(ang)), y: Math.round(200 + 115 * Math.sin(ang)), label: `${i+1}` };
          }),
          edges: ['r1-r5', 'r5-r9', 'r1-r9', 'r2-r6', 'r6-r10', 'r2-r10', 'r3-r7', 'r7-r11', 'r3-r11', 'r4-r8', 'r8-r12', 'r4-r12'],
          polygonSvg: (
            <circle cx="200" cy="200" r="115" fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeDasharray="4 4" />
          )
        };
      default:
        return null;
    }
  };

  const stageCfg = getStageConfig();

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-fade-in select-none">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-700 via-teal-800 to-amber-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-wrap items-center justify-between gap-4">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-3xl shadow-inner">
            🌿
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display drop-shadow-sm">
              {isTr ? 'Minik Geometrist Çocuk Odası' : 'Junior Geometer Playroom'}
            </h1>
            <p className="text-white/90 text-sm font-medium">
              {isTr ? 'Adım adım, kılavuzlar eşliğinde geometrik motifleri çiz!' : 'Draw geometric patterns step-by-step with clear guides!'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/30 shadow-inner">
            <Star className="w-5 h-5 text-amber-300 fill-amber-300" />
            <span className="font-extrabold text-lg">{stars} ⭐</span>
          </div>

          <button
            type="button"
            onClick={onReturn}
            className="px-4 py-2.5 rounded-2xl bg-white text-slate-800 hover:bg-slate-100 font-extrabold text-sm shadow-md transition transform hover:scale-105 cursor-pointer flex items-center gap-2"
          >
            <Smile className="w-4 h-4 text-teal-700" />
            <span>{isTr ? 'Normal Mod' : 'Normal Mode'}</span>
          </button>
        </div>
      </div>

      {/* Main Activity Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Instruction Panel */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 bg-teal-50 text-teal-800 px-3 py-1 rounded-full text-xs font-extrabold border border-teal-200">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isTr ? `Aşama ${step} / 20` : `Stage ${step} / 20`}</span>
            </div>

            {/* Level Descriptions */}
            {step === 1 && (
              <>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{isTr ? '1. Nokta Koyma' : '1. Placing a Dot'}</h2>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{isTr ? 'Boş alana dokunarak kendi ilk noktanı oluştur.' : 'Click anywhere to place your first dot.'}</p>
              </>
            )}
            {step === 2 && (
              <>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{isTr ? '2. Düz Çizgi' : '2. Drawing a Line'}</h2>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{isTr ? 'A noktasından B noktasına sürükleyerek düz çizgiyi çek.' : 'Drag from dot A to dot B.'}</p>
              </>
            )}
            {step === 3 && (
              <>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{isTr ? '3. Üçgen Şekli' : '3. Triangle'}</h2>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{isTr ? 'Köşeleri birbirine sürükleyerek üçgenin 3 kenarını tamamla.' : 'Drag between corners to draw 3 sides.'}</p>
              </>
            )}
            {step === 4 && (
              <>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{isTr ? '4. Kare Kutusu' : '4. Square'}</h2>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{isTr ? 'Köşeleri birleştirerek 4 kenarlı kareyi üret.' : 'Drag between corners to build a square.'}</p>
              </>
            )}
            {step === 5 && (
              <>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{isTr ? '5. Dik Açı (90° Köşe)' : '5. Right Angle (90°)'}</h2>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{isTr ? 'A\'dan B\'ye ve B\'den C\'ye sürükleyerek dik L köşesini oluştur!' : 'Drag A->B and B->C to make a 90° angle!'}</p>
              </>
            )}
            {step === 6 && (
              <>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{isTr ? '6. Düzgün Beşgen' : '6. Regular Pentagon'}</h2>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{isTr ? '5 köşeyi sırayla birleştirerek düzgün beşgenini tamamla.' : 'Connect 5 corners to complete the pentagon.'}</p>
              </>
            )}
            {step === 7 && (
              <>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{isTr ? '7. Düzgün Altıgen' : '7. Regular Hexagon'}</h2>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{isTr ? '6 köşeyi birleştirerek arı kovanı motifli altıgeni üret.' : 'Connect 6 corners to form a hexagon.'}</p>
              </>
            )}
            {step === 8 && (
              <>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{isTr ? '8. Düzgün Sekizgen' : '8. Regular Octagon'}</h2>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{isTr ? '8 köşeyi sürükleyerek sekizgen madalyonunu çiz.' : 'Connect 8 corners to draw an octagon.'}</p>
              </>
            )}
            {step === 9 && (
              <>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{isTr ? '9. Çember Dünyası' : '9. First Circle'}</h2>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{isTr ? 'Merkezden dışarıya sürükleyerek çemberini büyüt.' : 'Drag outward from center point.'}</p>
              </>
            )}
            {step === 10 && (
              <>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{isTr ? '10. Çember Kesişimi' : '10. Intersecting Circles'}</h2>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{isTr ? 'Arka plandaki silik kılavuza uyarak B noktasından 2. çemberi çiz!' : 'Follow the faint background guide and draw 2nd circle at B!'}</p>
              </>
            )}
            {step === 11 && (
              <>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{isTr ? '11. Çiçek Yaprakları (3\'lü Rosette)' : '11. Rosette Petals'}</h2>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{isTr ? 'Silik kılavuz rehberliğinde 3 çiçek yaprağı çemberini ekle!' : 'Follow faint guide and add 3 petal circles!'}</p>
              </>
            )}
            {step === 12 && (
              <>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{isTr ? '12. Altı Yapraklı Çiçek' : '12. 6-Petal Rosette'}</h2>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{isTr ? 'Çevredeki 6 silik rehber noktaya dokunarak tam çiçeği açtır!' : 'Tap 6 guided points to bloom the 6-petal flower!'}</p>
              </>
            )}
            {step === 13 && (
              <>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{isTr ? '13. Altı Köşeli Yıldız' : '13. Hexagram Star'}</h2>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{isTr ? 'Noktaları kılavuza göre birleştirerek 6 köşeli yıldızı üret.' : 'Connect points along guide to draw a 6-point star.'}</p>
              </>
            )}
            {step === 14 && (
              <>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{isTr ? '14. Baklava Motifi' : '14. Diamond Rhombus'}</h2>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{isTr ? '4 elmas köşesini sürükleyerek baklava dilimini çiz.' : 'Drag 4 diamond corners.'}</p>
              </>
            )}
            {step === 15 && (
              <>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{isTr ? '15. Selçuklu Yıldızı' : '15. Seljuk 8-Point Star'}</h2>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{isTr ? 'İki kare kesişimindeki 8 tepe noktasını birleştirip Selçuklu yıldızını üret!' : 'Connect 8 vertices to create Seljuk star!'}</p>
              </>
            )}
            {step === 16 && (
              <>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{isTr ? '16. Selçuklu Çift Karesi' : '16. Overlapping Squares'}</h2>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{isTr ? '45° dönmüş iki özdeş kareyi çizerek yıldız iskeletini kur!' : 'Draw two squares rotated 45°!'}</p>
              </>
            )}
            {step === 17 && (
              <>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{isTr ? '17. Endülüs Çini Motifi' : '17. Andalusian Tile'}</h2>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{isTr ? 'Kılavuz noktaları çapraz bağlayarak Endülüs saray çinisini tamamla.' : 'Connect diagonal guide nodes for Andalusian tile.'}</p>
              </>
            )}
            {step === 18 && (
              <>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{isTr ? '18. İran Girih Düğümü' : '18. Persian Girih Knot'}</h2>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{isTr ? 'Girih düğüm noktalarını sürükleyerek 5\'li düğüm yıldızını çiz!' : 'Connect girih knot points!'}</p>
              </>
            )}
            {step === 19 && (
              <>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{isTr ? '19. Japon Kumiko Desen' : '19. Japanese Kumiko'}</h2>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{isTr ? 'Merkezden dışa kenevir yaprağı (Asanoha) ahşap motifini çiz.' : 'Draw Kumiko Asanoha hemp leaf pattern.'}</p>
              </>
            )}
            {step === 20 && (
              <>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-800">{isTr ? '20. Saray Taç Kapı Yıldızı 🏆' : '20. Royal Portal Star 🏆'}</h2>
                <p className="text-slate-600 text-sm leading-relaxed font-medium">{isTr ? '12 köşeli muhteşem saray motifini tamamla ve Geometri Tacını Kazan!' : 'Complete the 12-point royal star and win the Geometer Crown!'}</p>
              </>
            )}

            {/* Color Palette Picker */}
            <div className="pt-3 pb-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                {isTr ? 'Kalem Rengi' : 'Pencil Color'}
              </span>
              <div className="flex items-center gap-2.5 mt-1">
                {calmColors.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setActiveColor(c)}
                    className={`w-8 h-8 rounded-full transition transform hover:scale-110 cursor-pointer shadow-sm ${
                      activeColor === c ? 'ring-3 ring-offset-2 ring-slate-700 scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Action Toolbar & Navigation Controls */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleUndoStep}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200 hover:bg-amber-100 cursor-pointer"
                title="Son çizgiyi geri al"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>{isTr ? 'Geri Al' : 'Undo'}</span>
              </button>
              <button
                type="button"
                onClick={handleResetStep}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold border border-slate-200 hover:bg-slate-200 cursor-pointer"
                title="Bu adımı sıfırla"
              >
                <RefreshCcw className="w-3.5 h-3.5" />
                <span>{isTr ? 'Sıfırla' : 'Reset'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrev}
                disabled={step === 1}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200 font-bold text-sm disabled:opacity-40 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{isTr ? 'Önceki' : 'Back'}</span>
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={
                  (step === 1 && !dot1) ||
                  (step === 2 && !lineCompleted) ||
                  (step === 9 && !circleCompleted) ||
                  (step === 10 && !circle2Completed) ||
                  (step === 11 && petals3Count < 3) ||
                  (step === 12 && petals6Count < 6) ||
                  Boolean(stageCfg && drawnLines.length < stageCfg.edges.length)
                }
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-teal-800 text-white hover:bg-teal-900 font-extrabold text-sm shadow-md transform hover:scale-105 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>{isTr ? 'Sonraki Adım' : 'Next Step'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Interactive Canvas Area */}
        <div className="lg:col-span-7 bg-[#FDFBF7] border border-slate-200 rounded-3xl p-4 flex flex-col items-center justify-center relative min-h-[420px] overflow-hidden shadow-inner select-none">
          
          {/* STEP 1: Place 1 Dot */}
          {step === 1 && (
            <div className="w-full max-w-[400px] aspect-square rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center relative cursor-crosshair shadow-2xs">
              <svg
                ref={svgRef}
                viewBox="0 0 400 400"
                className="w-full h-full"
                onPointerDown={(e) => {
                  const coords = getSvgCoordinates(e);
                  setDot1({ x: coords.x, y: coords.y, color: activeColor });
                  setStars(10);
                  triggerConfetti();
                }}
              >
                {!dot1 ? (
                  <g pointerEvents="none">
                    <circle cx="200" cy="200" r="24" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" />
                    <text x="200" y="204" textAnchor="middle" fill="#64748B" fontSize="13" fontWeight="bold">
                      {isTr ? 'Dokun' : 'Tap'}
                    </text>
                  </g>
                ) : (
                  <g pointerEvents="none">
                    <circle cx={dot1.x} cy={dot1.y} r="12" fill="#334155" stroke="white" strokeWidth="3" />
                    <text x={dot1.x} y={dot1.y - 20} textAnchor="middle" fill="#334155" fontSize="12" fontWeight="bold">
                      {isTr ? 'Nokta Oluştu!' : 'Dot Created!'} ✨
                    </text>
                  </g>
                )}
              </svg>
            </div>
          )}

          {/* STEP 2: Drag Line */}
          {step === 2 && (
            <div className="w-full max-w-[400px] aspect-square rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center relative shadow-2xs">
              <svg
                ref={svgRef}
                viewBox="0 0 400 400"
                className="w-full h-full cursor-crosshair"
                onPointerDown={(e) => {
                  if (lineCompleted) return;
                  const coords = getSvgCoordinates(e);
                  if (Math.hypot(coords.x - lineStart.x, coords.y - lineStart.y) <= 40) {
                    setIsDrawingLine(true);
                    setCurrentLineDrag(coords);
                  }
                }}
                onPointerMove={(e) => {
                  if (!isDrawingLine || lineCompleted) return;
                  const coords = getSvgCoordinates(e);
                  setCurrentLineDrag(coords);
                }}
                onPointerUp={(e) => {
                  if (!isDrawingLine || lineCompleted) return;
                  setIsDrawingLine(false);
                  const coords = getSvgCoordinates(e);
                  if (Math.hypot(coords.x - lineEnd.x, coords.y - lineEnd.y) <= 45) {
                    setLineCompleted(true);
                    setLineColor(activeColor);
                    setStars(20);
                    triggerConfetti();
                  }
                  setCurrentLineDrag(null);
                }}
              >
                <line x1={lineStart.x} y1={lineStart.y} x2={lineEnd.x} y2={lineEnd.y} stroke="#CBD5E1" strokeWidth="4" strokeDasharray="6 6" />
                {lineCompleted && (
                  <line x1={lineStart.x} y1={lineStart.y} x2={lineEnd.x} y2={lineEnd.y} stroke={lineColor} strokeWidth="5" strokeLinecap="round" />
                )}
                {isDrawingLine && currentLineDrag && !lineCompleted && (
                  <line x1={lineStart.x} y1={lineStart.y} x2={currentLineDrag.x} y2={currentLineDrag.y} stroke={activeColor} strokeWidth="4" strokeDasharray="4 4" />
                )}
                <circle cx={lineStart.x} cy={lineStart.y} r="12" fill="#334155" stroke="white" strokeWidth="3" />
                <text x={lineStart.x} y={lineStart.y + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" pointerEvents="none">A</text>

                <circle cx={lineEnd.x} cy={lineEnd.y} r="12" fill="#334155" stroke="white" strokeWidth="3" />
                <text x={lineEnd.x} y={lineEnd.y + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" pointerEvents="none">B</text>
              </svg>
              <div className="absolute bottom-4 text-center pointer-events-none text-xs font-bold text-slate-500">
                {lineCompleted ? (
                  <span className="text-emerald-600 flex items-center gap-1 justify-center"><CheckCircle className="w-4 h-4" /> {isTr ? 'Harika Çizgi!' : 'Great Line!'}</span>
                ) : (
                  <span>{isTr ? 'A noktasından tutup B noktasına sürükle' : 'Drag from A to B'}</span>
                )}
              </div>
            </div>
          )}

          {/* STAGES WITH STAGE CONFIG (3, 4, 5, 6, 7, 8, 13, 14, 15, 16, 17, 18, 19, 20) */}
          {stageCfg && (
            <div className="w-full max-w-[400px] aspect-square rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center relative shadow-2xs">
              <svg
                ref={svgRef}
                viewBox="0 0 400 400"
                className="w-full h-full cursor-crosshair"
                onPointerDown={(e) => {
                  if (drawnLines.length >= stageCfg.edges.length) return;
                  const coords = getSvgCoordinates(e);
                  const startV = findClosestVertex(coords, stageCfg.vertices);
                  if (startV) {
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
                    const startV = stageCfg.vertices.find(v => v.id === activeStart)!;
                    const edgeKey = getEdgeKey(activeStart, endV.id);

                    const exists = drawnLines.some(l => getEdgeKey(l.from, l.to) === edgeKey);
                    if (!exists && stageCfg.edges.includes(edgeKey)) {
                      const newLine: DrawnLine = {
                        id: `line-${Date.now()}`,
                        from: startV.id,
                        to: endV.id,
                        x1: startV.x,
                        y1: startV.y,
                        x2: endV.x,
                        y2: endV.y,
                        color: activeColor
                      };
                      const updated = [...drawnLines, newLine];
                      setDrawnLines(updated);
                      if (updated.length === stageCfg.edges.length) {
                        setStars(step * 15);
                        triggerConfetti();
                      }
                    }
                  }

                  setActiveStart(null);
                  setDragCurrent(null);
                }}
              >
                {/* Low opacity faint background guide */}
                {stageCfg.polygonSvg}

                {/* Already Drawn Lines */}
                {drawnLines.map((line) => (
                  <line key={line.id} x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2} stroke={line.color} strokeWidth="5" strokeLinecap="round" />
                ))}

                {/* Live Drag Preview Line (1:1 Cursor Precision) */}
                {activeStart && dragCurrent && (() => {
                  const startV = stageCfg.vertices.find(v => v.id === activeStart);
                  if (!startV) return null;
                  return (
                    <line x1={startV.x} y1={startV.y} x2={dragCurrent.x} y2={dragCurrent.y} stroke={activeColor} strokeWidth="4" strokeDasharray="4 4" />
                  );
                })()}

                {/* Neutral Vertex Points */}
                {stageCfg.vertices.map((p) => (
                  <g key={p.id} pointerEvents="none">
                    <circle cx={p.x} cy={p.y} r="12" fill="#334155" stroke="white" strokeWidth="3" />
                    <text x={p.x} y={p.y + 4} textAnchor="middle" fill="white" fontSize="9" fontWeight="bold">
                      {p.label}
                    </text>
                  </g>
                ))}
              </svg>

              <div className="mt-2 text-xs font-bold text-slate-600 pointer-events-none">
                {drawnLines.length === stageCfg.edges.length ? (
                  <span className="text-emerald-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> {isTr ? 'Şekil Tamamlandı!' : 'Shape Completed!'}</span>
                ) : (
                  <span>{isTr ? `Köşeleri birbirine sürükle (${drawnLines.length}/${stageCfg.edges.length} kenar)` : `Drag between corners (${drawnLines.length}/${stageCfg.edges.length} sides)`}</span>
                )}
              </div>
            </div>
          )}

          {/* STEP 9: Circle */}
          {step === 9 && (
            <div
              className="w-full max-w-[400px] aspect-square rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center relative cursor-crosshair shadow-2xs"
              onPointerDown={() => setIsDrawingCircle(true)}
              onPointerMove={(e) => {
                if (!isDrawingCircle || circleCompleted) return;
                const coords = getSvgCoordinates(e);
                const r = Math.hypot(coords.x - 200, coords.y - 200);
                setCircleRadius(Math.min(Math.max(r, 20), 140));
              }}
              onPointerUp={() => {
                if (!isDrawingCircle || circleCompleted) return;
                setIsDrawingCircle(false);
                if (circleRadius > 50) {
                  setCircleCompleted(true);
                  setStars(80);
                  triggerConfetti();
                }
              }}
            >
              <svg ref={svgRef} viewBox="0 0 400 400" className="w-full h-full pointer-events-none">
                {/* Low opacity target guide */}
                <circle cx="200" cy="200" r="100" fill="none" stroke="#CBD5E1" strokeWidth="2" strokeDasharray="4 4" />
                
                <circle cx="200" cy="200" r={circleRadius || 40} fill={circleCompleted ? `${activeColor}22` : "none"} stroke={activeColor} strokeWidth={circleCompleted ? "4" : "2"} strokeDasharray={circleCompleted ? undefined : "4 4"} />
                <circle cx="200" cy="200" r="6" fill="#334155" />
              </svg>
              <div className="absolute bottom-4 text-center pointer-events-none text-xs font-bold text-slate-500">
                {circleCompleted ? (
                  <span className="text-emerald-600 flex items-center gap-1 justify-center"><CheckCircle className="w-4 h-4" /> {isTr ? 'Çember Tamamlandı!' : 'Circle Completed!'}</span>
                ) : (
                  <span>{isTr ? 'Merkezden dışarıya doğru sürükleyerek çemberi büyüt' : 'Drag outward from center'}</span>
                )}
              </div>
            </div>
          )}

          {/* STEP 10: Two Overlapping Circles (With Clear Faint Target Guide) */}
          {step === 10 && (
            <div
              className="w-full max-w-[400px] aspect-square rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center relative shadow-2xs cursor-crosshair"
              onPointerDown={() => setIsDrawingCircle2(true)}
              onPointerMove={(e) => {
                if (!isDrawingCircle2 || circle2Completed) return;
                const coords = getSvgCoordinates(e);
                const r = Math.hypot(coords.x - 290, coords.y - 200);
                setCircle2Radius(Math.min(Math.max(r, 20), 110));
              }}
              onPointerUp={() => {
                if (!isDrawingCircle2 || circle2Completed) return;
                setIsDrawingCircle2(false);
                if (circle2Radius > 50) {
                  setCircle2Completed(true);
                  setStars(95);
                  triggerConfetti();
                }
              }}
            >
              <svg ref={svgRef} viewBox="0 0 400 400" className="w-full h-full pointer-events-none">
                {/* First Base Circle */}
                <circle cx="200" cy="200" r="90" fill="none" stroke="#3A6B5C" strokeWidth="3" />
                <circle cx="200" cy="200" r="5" fill="#334155" />

                {/* Low opacity faint target guide for 2nd circle */}
                <circle cx="290" cy="200" r="90" fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeDasharray="4 4" />

                <circle cx="290" cy="200" r="7" fill="#D4A373" stroke="white" strokeWidth="2" />
                <text x="290" y="180" textAnchor="middle" fill="#334155" fontSize="11" fontWeight="bold">B</text>

                {/* Second Compass Circle */}
                <circle cx="290" cy="200" r={circle2Radius || 30} fill={circle2Completed ? `${activeColor}22` : "none"} stroke={activeColor} strokeWidth={circle2Completed ? "4" : "2"} strokeDasharray={circle2Completed ? undefined : "4 4"} />
              </svg>
              <div className="absolute bottom-4 text-center pointer-events-none text-xs font-bold text-slate-500">
                {circle2Completed ? (
                  <span className="text-emerald-600 flex items-center gap-1 justify-center"><CheckCircle className="w-4 h-4" /> {isTr ? 'Pergel Kesişimi Başarılı!' : 'Intersecting Circles Done!'}</span>
                ) : (
                  <span>{isTr ? 'Silik kılavuza uyarak B noktasından 2. çemberi çiz' : 'Follow faint guide and drag from B'}</span>
                )}
              </div>
            </div>
          )}

          {/* STEP 11: 3 Petals Rosette (With Clear Faint Target Guides) */}
          {step === 11 && (
            <div
              className="w-full max-w-[400px] aspect-square rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center relative shadow-2xs cursor-pointer"
              onClick={() => {
                if (petals3Count < 3) {
                  const newCount = petals3Count + 1;
                  setPetals3Count(newCount);
                  if (newCount === 3) {
                    setStars(115);
                    triggerConfetti();
                  }
                }
              }}
            >
              <svg viewBox="0 0 400 400" className="w-full h-full pointer-events-none">
                {/* Center Circle */}
                <circle cx="200" cy="200" r="85" fill="none" stroke="#3A6B5C" strokeWidth="3" />
                <circle cx="200" cy="200" r="5" fill="#334155" />

                {/* Low Opacity Faint Target Guides for 3 Petals */}
                {[0, 120, 240].map((deg) => {
                  const ang = (deg * Math.PI) / 180;
                  return (
                    <circle
                      key={`guide-${deg}`}
                      cx={200 + 85 * Math.cos(ang)}
                      cy={200 + 85 * Math.sin(ang)}
                      r="85"
                      fill="none"
                      stroke="#CBD5E1"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {/* Drawn Petal Circles */}
                {[0, 120, 240].map((deg, idx) => {
                  if (idx >= petals3Count) return null;
                  const ang = (deg * Math.PI) / 180;
                  return (
                    <circle
                      key={deg}
                      cx={200 + 85 * Math.cos(ang)}
                      cy={200 + 85 * Math.sin(ang)}
                      r="85"
                      fill="rgba(212, 163, 115, 0.08)"
                      stroke={activeColor}
                      strokeWidth="3.5"
                    />
                  );
                })}
              </svg>
              <div className="absolute bottom-4 text-center pointer-events-none text-xs font-bold text-slate-500">
                {petals3Count === 3 ? (
                  <span className="text-emerald-600 flex items-center gap-1 justify-center"><CheckCircle className="w-4 h-4" /> {isTr ? 'Çiçek Yaprakları Açtı!' : '3 Petals Bloomed!'}</span>
                ) : (
                  <span>{isTr ? `Ekrana dokunarak silik kılavuzdaki yaprakları ekle (${petals3Count}/3 yaprak)` : `Tap to add guided petals (${petals3Count}/3)`}</span>
                )}
              </div>
            </div>
          )}

          {/* STEP 12: Full 6 Petals Rosette (With Clear Faint Target Guides) */}
          {step === 12 && (
            <div
              className="w-full max-w-[400px] aspect-square rounded-2xl bg-white border border-slate-200 flex flex-col items-center justify-center relative shadow-2xs cursor-pointer"
              onClick={() => {
                if (petals6Count < 6) {
                  const newCount = petals6Count + 1;
                  setPetals6Count(newCount);
                  if (newCount === 6) {
                    setStars(130);
                    triggerConfetti();
                  }
                }
              }}
            >
              <svg viewBox="0 0 400 400" className="w-full h-full pointer-events-none">
                {/* Center Circle */}
                <circle cx="200" cy="200" r="85" fill="none" stroke="#3A6B5C" strokeWidth="3" />
                <circle cx="200" cy="200" r="5" fill="#334155" />

                {/* Low Opacity Faint Target Guides for 6 Petals */}
                {[0, 60, 120, 180, 240, 300].map((deg) => {
                  const ang = (deg * Math.PI) / 180;
                  return (
                    <circle
                      key={`guide-${deg}`}
                      cx={200 + 85 * Math.cos(ang)}
                      cy={200 + 85 * Math.sin(ang)}
                      r="85"
                      fill="none"
                      stroke="#CBD5E1"
                      strokeWidth="2"
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {/* Drawn Petal Circles */}
                {[0, 60, 120, 180, 240, 300].map((deg, idx) => {
                  if (idx >= petals6Count) return null;
                  const ang = (deg * Math.PI) / 180;
                  return (
                    <circle
                      key={deg}
                      cx={200 + 85 * Math.cos(ang)}
                      cy={200 + 85 * Math.sin(ang)}
                      r="85"
                      fill="rgba(8, 125, 134, 0.08)"
                      stroke={activeColor}
                      strokeWidth="3.5"
                    />
                  );
                })}
              </svg>
              <div className="absolute bottom-4 text-center pointer-events-none text-xs font-bold text-slate-500">
                {petals6Count === 6 ? (
                  <span className="text-emerald-600 flex items-center gap-1 justify-center"><CheckCircle className="w-4 h-4" /> {isTr ? '6 Yapraklı Çiçek Tamamlandı!' : 'Full Rosette Flower Completed!'}</span>
                ) : (
                  <span>{isTr ? `Dokunarak silik kılavuzdaki 6 yaprağı açtır (${petals6Count}/6 yaprak)` : `Tap to bloom all guided petals (${petals6Count}/6)`}</span>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
