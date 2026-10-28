import React from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { Compass, Sparkles, BookOpen, Globe, ArrowRight, RotateCw, Layers } from 'lucide-react';

interface HomeViewProps {
  onNavigate: (view: 'learn' | 'create' | 'explore' | 'about' | 'rosette' | 'rotation' | 'decoder') => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigate }) => {
  const { t, lang } = useI18n();
  const isTr = lang === 'tr';

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-[#FFFDF8] border border-[#E8E5DD] rounded-3xl p-6 sm:p-10 md:p-14 shadow-sm">
        {/* Subtle geometric background pattern */}
        <div className="absolute inset-0 bg-geo-grid opacity-60 pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#DCEDED] text-[#087D86]">
              <Sparkles className="w-3.5 h-3.5 text-[#D89A43]" />
              <span>{isTr ? 'İnteraktif Geometri & Desen Atölyesi' : 'Interactive Geometry & Pattern Studio'}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold font-display text-[#14313F] leading-[1.15] tracking-tight">
              {isTr ? 'Geometri Dünyayı' : 'Geometry Shapes'}
              <span className="block text-[#087D86]">{isTr ? 'Şekillendirir.' : 'The World.'}</span>
            </h1>

            <p className="text-base sm:text-lg text-[#60757C] max-w-xl leading-relaxed">
              {t('heroSubtitle')}
            </p>

            {/* Main Action CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('rosette')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#087D86] text-white hover:bg-[#08646C] font-bold text-sm shadow-sm transition hover:shadow cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>{isTr ? 'Altı Yapraklı Çiçeği Çiz' : 'Construct Six-Petal Rosette'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('create')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-[#E8E5DD] text-[#14313F] hover:bg-[#F8F5EE] font-bold text-sm shadow-2xs transition cursor-pointer"
              >
                <span>{t('openStudio')}</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('decoder')}
                className="inline-flex items-center gap-2 px-4 py-3.5 rounded-xl bg-[#FBF2E3] border border-[#D89A43]/40 text-[#D89A43] hover:bg-[#FBF2E3]/70 font-bold text-sm transition cursor-pointer"
              >
                <Layers className="w-4 h-4" />
                <span>{t('decodePattern')}</span>
              </button>
            </div>
          </div>

          {/* Hero Interactive Vector Visual */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 bg-white border border-[#E8E5DD] rounded-2xl shadow-inner p-4 flex items-center justify-center">
              <svg viewBox="-140 -140 280 280" className="w-full h-full animate-spin-slow">
                {/* Central guide circle */}
                <circle cx="0" cy="0" r="75" fill="rgba(8, 125, 134, 0.08)" stroke="#087D86" strokeWidth="2" />
                {/* 6 surrounding circles */}
                {[0, 60, 120, 180, 240, 300].map(deg => {
                  const rad = (deg * Math.PI) / 180;
                  const cx = 75 * Math.cos(rad);
                  const cy = 75 * Math.sin(rad);
                  return (
                    <circle
                      key={deg}
                      cx={cx}
                      cy={cy}
                      r="75"
                      fill="none"
                      stroke="#D89A43"
                      strokeWidth="1.5"
                      strokeDasharray="4 3"
                    />
                  );
                })}
                {/* 8-point star overlay in center */}
                <polygon
                  points="0,-60 17,-17 60,0 17,17 0,60 -17,17 -60,0 -17,-17"
                  fill="rgba(8, 125, 134, 0.2)"
                  stroke="#087D86"
                  strokeWidth="2.5"
                />
                <circle cx="0" cy="0" r="4" fill="#087D86" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Foundation Paths */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold font-display text-[#14313F]">
          {isTr ? 'Dört Temel Yol' : 'Four Core Paths'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Path 1: Learn */}
          <div
            onClick={() => onNavigate('learn')}
            className="bg-[#FFFDF8] border border-[#E8E5DD] hover:border-[#087D86] rounded-2xl p-6 shadow-sm transition hover:shadow-md cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#DCEDED] flex items-center justify-center text-[#087D86]">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold font-display text-[#14313F] group-hover:text-[#087D86] transition">
                {t('pathLearnTitle')}
              </h3>
              <p className="text-xs text-[#60757C] leading-relaxed">
                {t('pathLearnDesc')}
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-[#E8E5DD] flex items-center text-xs font-bold text-[#087D86] gap-1">
              <span>{t('startLearning')}</span>
              <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
            </div>
          </div>

          {/* Path 2: Create */}
          <div
            onClick={() => onNavigate('create')}
            className="bg-[#FFFDF8] border border-[#E8E5DD] hover:border-[#087D86] rounded-2xl p-6 shadow-sm transition hover:shadow-md cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#DCEDED] flex items-center justify-center text-[#087D86]">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold font-display text-[#14313F] group-hover:text-[#087D86] transition">
                {t('pathCreateTitle')}
              </h3>
              <p className="text-xs text-[#60757C] leading-relaxed">
                {t('pathCreateDesc')}
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-[#E8E5DD] flex items-center text-xs font-bold text-[#087D86] gap-1">
              <span>{t('openStudio')}</span>
              <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
            </div>
          </div>

          {/* Path 3: Explore */}
          <div
            onClick={() => onNavigate('explore')}
            className="bg-[#FFFDF8] border border-[#E8E5DD] hover:border-[#087D86] rounded-2xl p-6 shadow-sm transition hover:shadow-md cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FBF2E3] flex items-center justify-center text-[#D89A43]">
                <Globe className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold font-display text-[#14313F] group-hover:text-[#D89A43] transition">
                {t('pathExploreTitle')}
              </h3>
              <p className="text-xs text-[#60757C] leading-relaxed">
                {t('pathExploreDesc')}
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-[#E8E5DD] flex items-center text-xs font-bold text-[#D89A43] gap-1">
              <span>{t('exploreWorld')}</span>
              <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
            </div>
          </div>

          {/* Path 4: Understand Deeper */}
          <div
            onClick={() => onNavigate('rotation')}
            className="bg-[#FFFDF8] border border-[#E8E5DD] hover:border-[#087D86] rounded-2xl p-6 shadow-sm transition hover:shadow-md cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#DCEDED] flex items-center justify-center text-[#087D86]">
                <RotateCw className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold font-display text-[#14313F] group-hover:text-[#087D86] transition">
                {t('pathUnderstandTitle')}
              </h3>
              <p className="text-xs text-[#60757C] leading-relaxed">
                {t('pathUnderstandDesc')}
              </p>
            </div>
            <div className="pt-4 mt-3 border-t border-[#E8E5DD] flex items-center text-xs font-bold text-[#087D86] gap-1">
              <span>{isTr ? 'Döndürmeyi İncele' : 'Explore Rotation'}</span>
              <ArrowRight className="w-3.5 h-3.5 transition group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
