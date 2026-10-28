import React, { useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { ShieldCheck, Heart, Sparkles, Trash2, Check, Globe } from 'lucide-react';

export const AboutView: React.FC = () => {
  const { t, lang } = useI18n();
  const isTr = lang === 'tr';
  const [cleared, setCleared] = useState(false);

  const handleClearData = () => {
    try {
      localStorage.removeItem('patternlab_studio_scene_v1');
      localStorage.removeItem('patternlab_completed_lessons');
      setCleared(true);
      setTimeout(() => setCleared(false), 3000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
      {/* Brand Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#DCEDED] text-[#087D86]">
          <Sparkles className="w-4 h-4 text-[#D89A43]" />
          <span>PatternLab v1.0 MVP</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold font-display text-[#14313F]">
          {t('aboutTitle')}
        </h1>
        <p className="text-lg md:text-xl font-medium text-[#087D86] italic font-serif-hero">
          {t('tagline')}
        </p>
      </div>

      {/* Mission & Pedagogy Card */}
      <div className="bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
        <h2 className="text-xl font-bold font-display text-[#14313F] flex items-center gap-2.5">
          <Heart className="w-5 h-5 text-[#C23B22]" />
          {t('aboutMissionTitle')}
        </h2>
        <p className="text-sm md:text-base text-[#60757C] leading-relaxed">
          {t('aboutMissionDesc')}
        </p>

        {/* 4 Steps Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
          <div className="p-3 bg-[#F8F5EE] rounded-xl border border-[#E8E5DD] text-center">
            <span className="block font-mono text-xs text-[#087D86] font-bold">1</span>
            <span className="font-bold text-sm text-[#14313F]">{isTr ? 'Yap' : 'Do'}</span>
          </div>
          <div className="p-3 bg-[#F8F5EE] rounded-xl border border-[#E8E5DD] text-center">
            <span className="block font-mono text-xs text-[#087D86] font-bold">2</span>
            <span className="font-bold text-sm text-[#14313F]">{isTr ? 'Fark Et' : 'Notice'}</span>
          </div>
          <div className="p-3 bg-[#F8F5EE] rounded-xl border border-[#E8E5DD] text-center">
            <span className="block font-mono text-xs text-[#087D86] font-bold">3</span>
            <span className="font-bold text-sm text-[#14313F]">{isTr ? 'Anla' : 'Understand'}</span>
          </div>
          <div className="p-3 bg-[#F8F5EE] rounded-xl border border-[#E8E5DD] text-center">
            <span className="block font-mono text-xs text-[#087D86] font-bold">4</span>
            <span className="font-bold text-sm text-[#14313F]">{isTr ? 'Üret' : 'Create'}</span>
          </div>
        </div>
      </div>

      {/* Cultural Attribution */}
      <div className="bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
        <h2 className="text-xl font-bold font-display text-[#14313F] flex items-center gap-2.5">
          <Globe className="w-5 h-5 text-[#087D86]" />
          {t('aboutAttributionTitle')}
        </h2>
        <p className="text-sm md:text-base text-[#60757C] leading-relaxed">
          {t('aboutAttributionDesc')}
        </p>
      </div>

      {/* Privacy & Local Data */}
      <div className="bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-display text-[#14313F] flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#087D86]" />
              {t('aboutPrivacyTitle')}
            </h2>
            <p className="text-sm text-[#60757C] max-w-xl leading-relaxed">
              {t('aboutPrivacyDesc')}
            </p>
          </div>

          <button
            type="button"
            onClick={handleClearData}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#C23B22]/30 bg-white text-[#C23B22] text-xs font-bold hover:bg-[#C23B22]/10 transition cursor-pointer self-start sm:self-center"
          >
            {cleared ? <Check className="w-4 h-4 text-[#2D6A4F]" /> : <Trash2 className="w-4 h-4" />}
            <span>{cleared ? (isTr ? 'Veriler Temizlendi' : 'Data Cleared') : (isTr ? 'Kayıtlı Verileri Temizle' : 'Clear Local Data')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
