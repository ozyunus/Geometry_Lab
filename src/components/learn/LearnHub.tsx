import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { LESSONS, LessonStep } from '../../content/learningPaths';
import { BookOpen, CheckCircle2, ArrowRight, Compass, RotateCw, Sparkles } from 'lucide-react';

interface LearnHubProps {
  onSelectLesson: (lessonId: string) => void;
}

export const LearnHub: React.FC<LearnHubProps> = ({ onSelectLesson }) => {
  const { t, lang } = useI18n();
  const isTr = lang === 'tr';

  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('patternlab_completed_lessons');
      return stored ? JSON.parse(stored) : ['lesson-1'];
    } catch {
      return ['lesson-1'];
    }
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Hero / Header */}
      <div className="bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#DCEDED] text-[#087D86] mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              {isTr ? 'Öğrenme Yolu: Çemberler & Yıldızlar' : 'Learning Path: Circles & Stars'}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-[#14313F]">
              {t('pathLearnTitle')}
            </h1>
            <p className="text-sm md:text-base text-[#60757C] mt-1 max-w-2xl">
              {t('pathLearnDesc')}
            </p>
          </div>

          {/* Quick Shortcuts */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectLesson('lesson-4')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#087D86] text-white text-xs font-bold hover:bg-[#08646C] shadow-sm cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>{isTr ? 'Altı Yapraklı Çiçek' : 'Six-Petal Rosette'}</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectLesson('lesson-6')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-[#D89A43] bg-[#FBF2E3] text-[#D89A43] text-xs font-bold hover:bg-[#FBF2E3]/80 cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
              <span>{isTr ? 'Döndürme Keşfi' : 'Rotation Discovery'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid of 8 Lessons */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {LESSONS.map((lesson, idx) => {
          const isDone = completedIds.includes(lesson.id);
          const isFeatured = lesson.id === 'lesson-4' || lesson.id === 'lesson-6' || lesson.id === 'lesson-7';

          return (
            <div
              key={lesson.id}
              onClick={() => onSelectLesson(lesson.id)}
              className={`bg-[#FFFDF8] border rounded-2xl p-5 shadow-sm transition hover:shadow-md cursor-pointer flex flex-col justify-between ${
                isFeatured ? 'border-[#087D86]/60 bg-gradient-to-b from-[#FFFDF8] to-[#F8F5EE]' : 'border-[#E8E5DD]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#F8F5EE] border border-[#E8E5DD] text-[#60757C]">
                    #{idx + 1}
                  </span>
                  {isFeatured && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DCEDED] text-[#087D86]">
                      {isTr ? 'İnteraktif Laboratuvar' : 'Interactive Lab'}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold font-display text-[#14313F] leading-snug">
                  {isTr ? lesson.titleTr : lesson.titleEn}
                </h3>

                <p className="text-xs text-[#60757C] line-clamp-2">
                  {isTr ? lesson.shortDescTr : lesson.shortDescEn}
                </p>
              </div>

              <div className="pt-4 mt-3 border-t border-[#E8E5DD] flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#087D86] flex items-center gap-1">
                  {t('tabDoIt')}
                  <ArrowRight className="w-3 h-3" />
                </span>
                {isDone && <CheckCircle2 className="w-4 h-4 text-[#087D86]" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
