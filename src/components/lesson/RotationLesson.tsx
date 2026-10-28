import React, { useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { RotateCw, Sparkles, BookOpen, Calculator, Compass, CheckCircle2, ArrowRight } from 'lucide-react';

interface RotationLessonProps {
  onTransferToStudio?: () => void;
}

export const RotationLesson: React.FC<RotationLessonProps> = ({ onTransferToStudio }) => {
  const { t, lang } = useI18n();
  const isTr = lang === 'tr';

  const [angle, setAngle] = useState(45);
  const [activeTab, setActiveTab] = useState<'do' | 'why' | 'math'>('do');
  const [showCornerRays, setShowCornerRays] = useState(true);
  const [showIntersections, setShowIntersections] = useState(true);

  const L = 160; // side length of square
  const halfL = L / 2;
  const R_corner = Math.SQRT2 * halfL; // ~ 113.14px

  // Specific state flags
  const is0 = angle === 0;
  const is45 = Math.abs(angle - 45) < 1;
  const is90 = angle === 90;

  // Star polygon points when at 45°
  const R_inner = R_corner * (Math.SQRT2 - 1);
  const starPoints = Array.from({ length: 16 }).map((_, i) => {
    const isTip = i % 2 === 0;
    const r = isTip ? R_corner : R_inner;
    const a = (i * 22.5 - 90) * (Math.PI / 180);
    return `${(r * Math.cos(a)).toFixed(1)},${(r * Math.sin(a)).toFixed(1)}`;
  }).join(' ');

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#DCEDED] text-[#087D86] mb-2">
              <RotateCw className="w-3.5 h-3.5" />
              {isTr ? 'Etkileşimli Dönüşüm Laboratuvarı' : 'Interactive Transformation Lab'}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-[#14313F]">
              {t('rotationTitle')}
            </h1>
            <p className="text-sm md:text-base text-[#60757C] mt-1 max-w-2xl">
              {t('rotationDesc')}
            </p>
          </div>

          {onTransferToStudio && (
            <button
              onClick={onTransferToStudio}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#087D86] text-white text-xs font-bold hover:bg-[#08646C] cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              {t('tryInStudio')}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Canvas Display */}
        <div className="lg:col-span-8 bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-6 flex flex-col items-center justify-center relative min-h-[460px] shadow-sm">
          <div className="absolute inset-0 bg-geo-grid pointer-events-none opacity-50" />

          {/* SVG representation */}
          <svg viewBox="-160 -160 320 320" className="w-full max-w-[420px] aspect-square relative z-10">
            {/* Guide circle passing through corners */}
            <circle cx="0" cy="0" r={R_corner} fill="none" stroke="#D89A43" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />

            {/* Inscribed guide circle */}
            <circle cx="0" cy="0" r={halfL} fill="none" stroke="#60757C" strokeWidth="1" strokeDasharray="3 3" opacity="0.3" />

            {/* Corner Rays */}
            {showCornerRays && (
              <g opacity="0.4">
                {/* 4 rays for square 1 */}
                {[45, 135, 225, 315].map(deg => {
                  const rad = (deg * Math.PI) / 180;
                  return (
                    <line
                      key={`ray1-${deg}`}
                      x1="0"
                      y1="0"
                      x2={R_corner * Math.cos(rad)}
                      y2={R_corner * Math.sin(rad)}
                      stroke="#087D86"
                      strokeWidth="1.5"
                    />
                  );
                })}
                {/* 4 rays for rotated square 2 */}
                {[45, 135, 225, 315].map(deg => {
                  const rad = ((deg + angle) * Math.PI) / 180;
                  return (
                    <line
                      key={`ray2-${deg}`}
                      x1="0"
                      y1="0"
                      x2={R_corner * Math.cos(rad)}
                      y2={R_corner * Math.sin(rad)}
                      stroke="#D89A43"
                      strokeWidth="1.5"
                      strokeDasharray="3 2"
                    />
                  );
                })}
              </g>
            )}

            {/* Base Square (0 deg) */}
            <rect
              x={-halfL}
              y={-halfL}
              width={L}
              height={L}
              fill="none"
              stroke="#087D86"
              strokeWidth="2.5"
            />

            {/* Rotated Square */}
            <g transform={`rotate(${angle})`}>
              <rect
                x={-halfL}
                y={-halfL}
                width={L}
                height={L}
                fill="none"
                stroke="#D89A43"
                strokeWidth="2.5"
              />
            </g>

            {/* Highlight 8-point star silhouette if near 45° */}
            {is45 && (
              <polygon
                points={starPoints}
                fill="rgba(8, 125, 134, 0.12)"
                stroke="#08646C"
                strokeWidth="3"
                className="animate-fade-in"
              />
            )}

            {/* Center point */}
            <circle cx="0" cy="0" r="4" fill="#14313F" />
          </svg>

          {/* Current Status Banner */}
          <div className="w-full mt-4 p-4 rounded-xl border border-[#E8E5DD] bg-[#F8F5EE] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-mono text-base font-bold px-3 py-1 bg-white rounded-lg border border-[#E8E5DD] text-[#087D86]">
                θ = {angle}°
              </span>
              <span className="text-xs md:text-sm font-semibold text-[#14313F]">
                {is0 && t('deg0Insight')}
                {is45 && t('deg45Insight')}
                {is90 && t('deg90Insight')}
                {!is0 && !is45 && !is90 && (
                  isTr
                    ? `${angle}° Dönüş: İki kare kesişerek 8 köşeli asimetrik bir poligon oluşturur.`
                    : `${angle}° Rotation: The two squares form an asymmetric 8-vertex configuration.`
                )}
              </span>
            </div>
            {is45 && <CheckCircle2 className="w-5 h-5 text-[#087D86] shrink-0" />}
          </div>
        </div>

        {/* Right Controls and Math Panels */}
        <div className="lg:col-span-4 space-y-4">
          {/* Slider Card */}
          <div className="bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <label htmlFor="angle-slider" className="text-sm font-bold text-[#14313F]">
                {t('angleSliderLabel')}
              </label>
              <span className="font-mono text-base font-bold text-[#087D86]">
                {angle}°
              </span>
            </div>

            <input
              id="angle-slider"
              type="range"
              min="0"
              max="90"
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              className="w-full accent-[#087D86] h-2 bg-[#E8E5DD] rounded-lg cursor-pointer"
            />

            {/* Quick Angle Presets */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              {[0, 30, 45, 90].map(deg => (
                <button
                  key={deg}
                  type="button"
                  onClick={() => setAngle(deg)}
                  className={`py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                    angle === deg
                      ? 'bg-[#087D86] text-white border-[#087D86]'
                      : 'bg-white border-[#E8E5DD] text-[#14313F] hover:bg-[#F8F5EE]'
                  }`}
                >
                  {deg}° {deg === 45 ? '⭐' : ''}
                </button>
              ))}
            </div>

            {/* Feature toggles */}
            <div className="pt-2 border-t border-[#E8E5DD] space-y-2">
              <label className="flex items-center gap-2 text-xs font-medium text-[#14313F] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showCornerRays}
                  onChange={(e) => setShowCornerRays(e.target.checked)}
                  className="rounded text-[#087D86] focus:ring-0 cursor-pointer"
                />
                {isTr ? 'Köşe Işınlarını Göster' : 'Show Corner Direction Rays'}
              </label>
            </div>
          </div>

          {/* Educational Tabs */}
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

            {activeTab === 'do' && (
              <div className="space-y-2 text-xs md:text-sm text-[#60757C] leading-relaxed">
                <p>
                  {isTr
                    ? 'Kaydırıcıyı yavaşça hareket ettirerek 0° den 90° ye doğru ilerleyin. Köşelerin nasıl önce ayrıldığını, 45° de kusursuz bir 8 köşeli yıldıza dönüştüğünü, 90° de ise tekrar tek bir karede birleştiğini fark edin.'
                    : 'Move the slider smoothly from 0° to 90°. Notice how corners diverge, achieve radial balance as an 8-pointed star at 45°, and coalesce back into a single square at 90°.'}
                </p>
              </div>
            )}

            {activeTab === 'why' && (
              <div className="p-3.5 rounded-xl bg-[#DCEDED]/50 border border-[#087D86]/20 text-xs md:text-sm text-[#14313F] leading-relaxed">
                <h4 className="font-bold text-[#087D86] mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  {isTr ? '4 Katlı Simetri ve Yarı Açı' : '4-Fold Symmetry & Half-Angle'}
                </h4>
                <p>{t('rotationWhy')}</p>
              </div>
            )}

            {activeTab === 'math' && (
              <div className="p-3.5 rounded-xl bg-[#FBF2E3]/60 border border-[#D89A43]/30 text-xs md:text-sm text-[#14313F] leading-relaxed">
                <h4 className="font-bold text-[#D89A43] mb-1 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4" />
                  {isTr ? 'Rotasyon Matrisi & Trigonometri' : 'Rotation Matrix & Trigonometry'}
                </h4>
                <p>{t('rotationMath')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
