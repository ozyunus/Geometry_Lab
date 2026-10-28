import React, { useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { Eye, EyeOff, RotateCw, Layers, Compass, Sparkles, CheckCircle2 } from 'lucide-react';

interface PatternDecoderProps {
  onTransferToStudio?: () => void;
}

export const PatternDecoder: React.FC<PatternDecoderProps> = ({ onTransferToStudio }) => {
  const { t, lang } = useI18n();
  const isTr = lang === 'tr';

  const [showBaseSquare, setShowBaseSquare] = useState(true);
  const [showRotatedSquare, setShowRotatedSquare] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [showGuides, setShowGuides] = useState(true);
  const [showFill, setShowFill] = useState(true);
  const [rotationAngle, setRotationAngle] = useState(45);

  const tealPrimary = '#087D86';
  const tealDark = '#08646C';
  const amberColor = '#D89A43';

  // Compute vertices for 8-point star when angle is 45°
  const R_outer = 130;
  const R_inner = R_outer * (Math.SQRT2 - 1); // ~ 53.85px

  // Generate star polygon points based on current rotationAngle
  // At 45 deg, it's a regular octagram
  const starPoints = Array.from({ length: 16 }).map((_, i) => {
    const isTip = i % 2 === 0;
    const r = isTip ? R_outer : R_inner;
    // Interleaving tips from square 1 (0, 90, 180, 270) and square 2 (rot, rot+90, ...)
    const angleDeg = (i * 22.5) - 90;
    const rad = (angleDeg * Math.PI) / 180;
    return `${(r * Math.cos(rad)).toFixed(1)},${(r * Math.sin(rad)).toFixed(1)}`;
  }).join(' ');

  const isExact45 = Math.abs(rotationAngle - 45) < 1;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#DCEDED] text-[#087D86] mb-2">
              <Layers className="w-3.5 h-3.5" />
              {isTr ? 'İnteraktif Geometrik Röntgen' : 'Interactive Geometric Deconstruction'}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-[#14313F]">
              {t('decoderTitle')}
            </h1>
            <p className="text-sm md:text-base text-[#60757C] mt-1 max-w-2xl">
              {t('decoderDesc')}
            </p>
          </div>

          {onTransferToStudio && (
            <button
              onClick={onTransferToStudio}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#087D86] text-white hover:bg-[#08646C] font-semibold text-sm shadow-sm transition cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              {t('tryInStudio')}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Deconstruction Canvas */}
        <div className="lg:col-span-8 bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center relative min-h-[440px] shadow-sm overflow-hidden">
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-geo-grid pointer-events-none opacity-60" />

          {/* SVG Viewport */}
          <svg viewBox="-180 -180 360 360" className="w-full max-w-[420px] aspect-square relative z-10">
            {/* Guide Circles */}
            {showGuides && (
              <g className="transition-opacity duration-300">
                {/* Circumscribed circle */}
                <circle cx="0" cy="0" r={R_outer} fill="none" stroke={amberColor} strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />
                {/* Inner throat circle */}
                <circle cx="0" cy="0" r={R_inner} fill="none" stroke="#60757C" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
              </g>
            )}

            {/* Symmetry Axes */}
            {showAxes && (
              <g className="transition-opacity duration-300" opacity="0.45">
                <line x1="-160" y1="0" x2="160" y2="0" stroke="#60757C" strokeWidth="1" strokeDasharray="5 5" />
                <line x1="0" y1="-160" x2="0" y2="160" stroke="#60757C" strokeWidth="1" strokeDasharray="5 5" />
                <line x1="-113" y1="-113" x2="113" y2="113" stroke="#60757C" strokeWidth="1" strokeDasharray="5 5" />
                <line x1="-113" y1="113" x2="113" y2="-113" stroke="#60757C" strokeWidth="1" strokeDasharray="5 5" />
              </g>
            )}

            {/* Base Square (0 deg) */}
            {showBaseSquare && (
              <rect
                x={-R_outer / Math.SQRT2}
                y={-R_outer / Math.SQRT2}
                width={R_outer * Math.SQRT2}
                height={R_outer * Math.SQRT2}
                fill="none"
                stroke={tealPrimary}
                strokeWidth="2.5"
                className="transition-all duration-300"
              />
            )}

            {/* Rotated Square (user angle) */}
            {showRotatedSquare && (
              <g transform={`rotate(${rotationAngle})`} className="transition-transform duration-100">
                <rect
                  x={-R_outer / Math.SQRT2}
                  y={-R_outer / Math.SQRT2}
                  width={R_outer * Math.SQRT2}
                  height={R_outer * Math.SQRT2}
                  fill="none"
                  stroke={amberColor}
                  strokeWidth="2.5"
                  strokeDasharray={isExact45 ? undefined : '5 4'}
                />
              </g>
            )}

            {/* Star Silhouette Fill (revealed especially when 45 deg) */}
            {showFill && isExact45 && (
              <polygon
                points={starPoints}
                fill="rgba(8, 125, 134, 0.16)"
                stroke={tealDark}
                strokeWidth="3.5"
                className="animate-fade-in"
              />
            )}

            {/* Center Origin Anchor */}
            <circle cx="0" cy="0" r="4" fill={amberColor} />
            <circle cx="0" cy="0" r="8" fill="none" stroke={amberColor} strokeWidth="1.5" />
          </svg>

          {/* Quick status pill inside canvas */}
          <div className="mt-3 z-10 flex items-center gap-2 bg-[#F8F5EE] border border-[#E8E5DD] px-3.5 py-1.5 rounded-full text-xs font-medium text-[#14313F]">
            {isExact45 ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#087D86]" />
                <span className="font-semibold text-[#087D86]">
                  {isTr ? '45°: Kusursuz 8 Köşeli Selçuklu Yıldızı' : '45°: Perfect 8-Point Seljuk Octagram'}
                </span>
              </>
            ) : (
              <>
                <RotateCw className="w-3.5 h-3.5 text-[#D89A43]" />
                <span>
                  {isTr ? `Döndürme: ${rotationAngle}° (Yıldız için 45° yapın)` : `Rotation: ${rotationAngle}° (Set 45° for star)`}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Layer Controls & Educational Panel */}
        <div className="lg:col-span-4 space-y-4">
          {/* Layer toggles */}
          <div className="bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#60757C] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#087D86]" />
              {isTr ? 'Geometrik Katmanlar' : 'Geometric Layers'}
            </h3>

            <div className="space-y-2">
              {/* Base Square Toggle */}
              <button
                type="button"
                onClick={() => setShowBaseSquare(!showBaseSquare)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm font-medium transition cursor-pointer ${
                  showBaseSquare
                    ? 'border-[#087D86] bg-[#DCEDED]/40 text-[#14313F]'
                    : 'border-[#E8E5DD] bg-white text-[#60757C] opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded border-2 border-[#087D86]" />
                  <span>{t('layerBaseSquare')}</span>
                </div>
                {showBaseSquare ? <Eye className="w-4 h-4 text-[#087D86]" /> : <EyeOff className="w-4 h-4" />}
              </button>

              {/* Rotated Square Toggle */}
              <button
                type="button"
                onClick={() => setShowRotatedSquare(!showRotatedSquare)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm font-medium transition cursor-pointer ${
                  showRotatedSquare
                    ? 'border-[#D89A43] bg-[#FBF2E3]/50 text-[#14313F]'
                    : 'border-[#E8E5DD] bg-white text-[#60757C] opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded border-2 border-[#D89A43]" />
                  <span>{t('layerRotatedSquare')}</span>
                </div>
                {showRotatedSquare ? <Eye className="w-4 h-4 text-[#D89A43]" /> : <EyeOff className="w-4 h-4" />}
              </button>

              {/* Symmetry Axes Toggle */}
              <button
                type="button"
                onClick={() => setShowAxes(!showAxes)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm font-medium transition cursor-pointer ${
                  showAxes
                    ? 'border-[#14313F]/30 bg-white text-[#14313F]'
                    : 'border-[#E8E5DD] bg-white text-[#60757C] opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-0.5 bg-[#60757C]" />
                  <span>{t('layerSymmetryAxes')}</span>
                </div>
                {showAxes ? <Eye className="w-4 h-4 text-[#14313F]" /> : <EyeOff className="w-4 h-4" />}
              </button>

              {/* Guide Circles Toggle */}
              <button
                type="button"
                onClick={() => setShowGuides(!showGuides)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm font-medium transition cursor-pointer ${
                  showGuides
                    ? 'border-[#14313F]/30 bg-white text-[#14313F]'
                    : 'border-[#E8E5DD] bg-white text-[#60757C] opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-3.5 h-3.5 rounded-full border border-dashed border-[#D89A43]" />
                  <span>{t('layerGuideCircles')}</span>
                </div>
                {showGuides ? <Eye className="w-4 h-4 text-[#14313F]" /> : <EyeOff className="w-4 h-4" />}
              </button>

              {/* Star Silhouette Fill Toggle */}
              <button
                type="button"
                onClick={() => setShowFill(!showFill)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-sm font-medium transition cursor-pointer ${
                  showFill
                    ? 'border-[#087D86] bg-[#087D86]/10 text-[#087D86]'
                    : 'border-[#E8E5DD] bg-white text-[#60757C] opacity-60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#087D86]" />
                  <span>{t('layerStarFill')}</span>
                </div>
                {showFill ? <Eye className="w-4 h-4 text-[#087D86]" /> : <EyeOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Interactive Rotation Slider */}
          <div className="bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="decoder-rotation" className="text-sm font-bold text-[#14313F]">
                {t('rotateAngle')}
              </label>
              <span className="font-mono text-sm px-2 py-0.5 rounded bg-[#DCEDED] text-[#087D86] font-bold">
                {rotationAngle}°
              </span>
            </div>

            <input
              id="decoder-rotation"
              type="range"
              min="0"
              max="90"
              step="1"
              value={rotationAngle}
              onChange={(e) => setRotationAngle(Number(e.target.value))}
              className="w-full accent-[#087D86] h-2 bg-[#E8E5DD] rounded-lg cursor-pointer"
            />

            <div className="flex justify-between text-xs text-[#60757C] pt-1">
              <button
                type="button"
                onClick={() => setRotationAngle(0)}
                className="hover:text-[#087D86] font-semibold underline cursor-pointer"
              >
                0° ({isTr ? 'Çakışma' : 'Coincide'})
              </button>
              <button
                type="button"
                onClick={() => setRotationAngle(45)}
                className="hover:text-[#087D86] font-semibold text-[#087D86] underline cursor-pointer"
              >
                45° ({isTr ? 'Yıldız' : 'Star'})
              </button>
              <button
                type="button"
                onClick={() => setRotationAngle(90)}
                className="hover:text-[#087D86] font-semibold underline cursor-pointer"
              >
                90° ({isTr ? 'Çakışma' : 'Coincide'})
              </button>
            </div>
          </div>

          {/* Explanation Callout */}
          <div className="bg-[#F8F5EE] border border-[#E8E5DD] rounded-2xl p-5 text-sm text-[#14313F] leading-relaxed">
            <h4 className="font-bold text-[#087D86] mb-1.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#D89A43]" />
              {t('tabWhyItWorks')}
            </h4>
            <p className="text-xs md:text-sm text-[#60757C]">
              {t('decoderExplanation')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
