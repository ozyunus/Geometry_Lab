import React, { useState } from 'react';
import { Sparkles, ArrowRight, ArrowLeft, Check, Compass, Palette, Undo2, Volume2, X } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import soundEffects from '../../services/soundEffects';

interface KidsOnboardingTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KidsOnboardingTour: React.FC<KidsOnboardingTourProps> = ({ isOpen, onClose }) => {
  const { lang } = useI18n();
  const isTr = lang === 'tr';
  const [tourIndex, setTourIndex] = useState(0);

  if (!isOpen) return null;

  const tourSteps = [
    {
      title: isTr ? 'Hoş Geldiniz! Minik Geometrist & Kıymetli Büyüğümüz' : 'Welcome! Junior Geometer & Esteemed Elder',
      desc: isTr
        ? 'Burada hiçbir teknik bilgiye veya karmaşık tuşlara gerek yok. Sadece parmağınızla veya farenizle dokunarak adım adım harika geometrik şekiller ve tarihi Selçuklu yıldızları çizeceksiniz.'
        : 'No complex technology skills required here. Simply tap or drag with your finger or mouse to draw geometric shapes and historic Islamic stars step by step.',
      icon: '🌿',
      badge: isTr ? 'Başlangıç Rehberi (1/5)' : 'Tour Guide (1/5)',
      tip: isTr ? 'Tablet, telefon ve bilgisayarlarla %100 uyumludur.' : 'Fully compatible with tablets, phones, and computers.',
    },
    {
      title: isTr ? '1. Görev & Talimat Paneli' : '1. Stage Instructions Panel',
      desc: isTr
        ? 'Sol tarafta her adım için ne yapmanız gerektiği büyük ve net yazılarla anlatılır. Örneğin "A noktasından B noktasına sürükle" veya "Noktaya dokun".'
        : 'On the left, large and high-contrast text tells you exactly what to do, like "Drag from A to B" or "Tap to place a dot".',
      icon: Compass,
      badge: isTr ? 'Görevleri Anlama (2/5)' : 'Instructions (2/5)',
      tip: isTr ? 'Yazılar gözü yormayan büyük boyutlarda tasarlanmıştır.' : 'Designed with large text for relaxed reading.',
    },
    {
      title: isTr ? '2. Büyütülmüş Oyun & Çizim Alanı' : '2. Enlarged Drawing Canvas',
      desc: isTr
        ? 'Sağ tarafta geniş bir çizim alanı bulunur. Arka planda silik kılavuz çizgiler size yol gösterir. Köşelere dokunup birbirine bağladığınızda çizginiz mıknatıs gibi yerine oturur!'
        : 'On the right is your spacious drawing area. Faint guide lines help you see the target shape. Connect corners and lines snap easily into place!',
      icon: Sparkles,
      badge: isTr ? 'Çizim Deneyimi (3/5)' : 'Drawing Area (3/5)',
      tip: isTr ? 'Yanlış çizseniz bile endişelenmeyin, kılavuzlar sizi yönlendirir.' : 'Faint background guides keep you on track.',
    },
    {
      title: isTr ? '3. Kendi Rengini Oluşturma & Çizgi Kalınlığı' : '3. Color Palette & Custom Creator',
      desc: isTr
        ? 'İster hazır dingin renklerden birini seçin, isterseniz "Kendi Rengini Üret" düğmesine dokunarak en sevdiğiniz rengi tuvale taşıyın! Çizgi kalınlığını da dilediğiniz gibi ayarlayabilirsiniz.'
        : 'Pick from curated soothing colors or tap "Create Custom Color" to use your favorite shade. You can also adjust stroke thickness.',
      icon: Palette,
      badge: isTr ? 'Renk & Görünüm (4/5)' : 'Colors & Theme (4/5)',
      tip: isTr ? '75+ yaş için özel Yüksek Kontrast modu da bulunur.' : 'Special High Contrast mode is available in the theme tweaker.',
    },
    {
      title: isTr ? '4. Geri Al (Undo), Sesler & Otomatik Kayıt' : '4. Undo, Audio & Auto-Save',
      desc: isTr
        ? 'Hata yapmaktan hiç korkmayın! "Geri Al" düğmesi ile önceki adımlara geri gidebilirsiniz. Çizdiğiniz her şey hafızada tutulur. Sayfadan çıksanız bile geri döndüğünüzde aynı yerden devam edersiniz.'
        : 'Never worry about mistakes! The Undo button works smoothly across steps. Everything is saved automatically even if you leave and return later.',
      icon: Undo2,
      badge: isTr ? 'Güven & Eğlence (5/5)' : 'Undo & Audio (5/5)',
      tip: isTr ? 'Bölüm geçtikçe çalan tatlı melodiler ve fon müziği size eşlik eder.' : 'Delightful chimes and gentle background music celebrate your progress.',
    },
  ];

  const current = tourSteps[tourIndex];
  const isLast = tourIndex === tourSteps.length - 1;

  const handleNext = () => {
    soundEffects.playLineSnap();
    if (isLast) {
      soundEffects.playStepSuccess();
      onClose();
    } else {
      setTourIndex(i => i + 1);
    }
  };

  const handlePrev = () => {
    soundEffects.playUndo();
    setTourIndex(i => Math.max(i - 1, 0));
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border-2 border-teal-500 relative overflow-hidden">
        {/* Top Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-teal-600 to-amber-500 transition-all duration-300"
            style={{ width: `${((tourIndex + 1) / tourSteps.length) * 100}%` }}
          />
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            soundEffects.playUndo();
            onClose();
          }}
          className="absolute top-4 right-4 p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label={isTr ? 'Rehberi Kapat' : 'Close Tour'}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Badge & Step indicator */}
        <div className="pt-2">
          <span className="inline-block px-3.5 py-1 rounded-full bg-teal-50 text-teal-800 font-extrabold text-sm border border-teal-200">
            {current.badge}
          </span>
        </div>

        {/* Icon & Title */}
        <div className="mt-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-teal-100/70 border border-teal-300 flex items-center justify-center text-3xl shadow-inner shrink-0 text-teal-800">
            {typeof current.icon === 'string' ? (
              <span>{current.icon}</span>
            ) : (
              <current.icon className="w-8 h-8" />
            )}
          </div>
          <h3 id="tour-dialog-title" className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
            {current.title}
          </h3>
        </div>

        {/* Description (min 1rem = 16px) */}
        <div className="mt-5 space-y-4">
          <p className="text-base sm:text-lg text-slate-700 leading-relaxed font-medium">
            {current.desc}
          </p>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-sm sm:text-base text-amber-900 font-semibold flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
            <span>{current.tip}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePrev}
            disabled={tourIndex === 0}
            className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-base font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer min-h-[44px] flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{isTr ? 'Önceki' : 'Previous'}</span>
          </button>

          <div className="flex items-center gap-1.5">
            {tourSteps.map((_, i) => (
              <span
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === tourIndex ? 'bg-teal-700 w-6' : 'bg-slate-300'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-3 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white text-base font-extrabold shadow-md transition transform hover:scale-105 cursor-pointer min-h-[44px] flex items-center gap-2"
          >
            <span>{isLast ? (isTr ? 'Turu Bitir & Başla!' : 'Finish & Start!') : (isTr ? 'Sonraki' : 'Next')}</span>
            {isLast ? <Check className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
