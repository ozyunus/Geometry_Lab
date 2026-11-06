import React from 'react';
import { X, Check, Eye, Type, Volume2, Music, RotateCcw, HelpCircle, Palette } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { ThemeMode, TextSizeMode } from '../../services/kidsStorage';
import soundEffects from '../../services/soundEffects';

interface ThemeStyleTweakerProps {
  isOpen: boolean;
  onClose: () => void;
  themeMode: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  textSizeMode: TextSizeMode;
  onSelectTextSize: (size: TextSizeMode) => void;
  strokeWidth: number;
  onSelectStrokeWidth: (width: number) => void;
  sfxEnabled: boolean;
  onToggleSfx: () => void;
  bgMusicEnabled: boolean;
  onToggleBgMusic: () => void;
  onReopenTour: () => void;
  onResetAllProgress: () => void;
}

export const ThemeStyleTweaker: React.FC<ThemeStyleTweakerProps> = ({
  isOpen,
  onClose,
  themeMode,
  onSelectTheme,
  textSizeMode,
  onSelectTextSize,
  strokeWidth,
  onSelectStrokeWidth,
  sfxEnabled,
  onToggleSfx,
  bgMusicEnabled,
  onToggleBgMusic,
  onReopenTour,
  onResetAllProgress,
}) => {
  const { lang } = useI18n();
  const isTr = lang === 'tr';

  if (!isOpen) return null;

  const themes: { id: ThemeMode; label: string; desc: string; previewBg: string; previewAccent: string }[] = [
    {
      id: 'natural',
      label: isTr ? '🌿 Doğal & Dingin' : '🌿 Natural Sage',
      desc: isTr ? 'Sakin toprak tonları, gözü yormayan hafif renkler' : 'Calm earth tones and gentle organic shades',
      previewBg: 'bg-[#FDFBF7] border-slate-300',
      previewAccent: 'bg-[#3A6B5C]',
    },
    {
      id: 'high-contrast',
      label: isTr ? '👁️ Yüksek Kontrast (75+ Yaş)' : '👁️ High Contrast (75+)',
      desc: isTr ? 'WCAG AAA uyumlu, net siyah-beyaz zemin ve kalın çizgiler' : 'WCAG AAA contrast, bold black/white for easy reading',
      previewBg: 'bg-white border-black border-2',
      previewAccent: 'bg-black',
    },
    {
      id: 'vibrant',
      label: isTr ? '🎨 Renkli Çocuk Odası' : '🎨 Playful Kids',
      desc: isTr ? 'Neşeli, canlı ve çocukların enerjisine uygun tonlar' : 'Vibrant, bright, and cheerful palette',
      previewBg: 'bg-amber-50/80 border-amber-300',
      previewAccent: 'bg-amber-600',
    },
    {
      id: 'night',
      label: isTr ? '🌙 Gece Modu' : '🌙 Night Mode',
      desc: isTr ? 'Karanlık ortamlar için yumuşak lacivert ve açık çizgiler' : 'Soft dark navy surface with luminous lines',
      previewBg: 'bg-slate-900 border-slate-700 text-white',
      previewAccent: 'bg-teal-400',
    },
  ];

  const textSizes: { id: TextSizeMode; label: string; pxLabel: string }[] = [
    { id: 'normal', label: isTr ? 'Standart' : 'Standard', pxLabel: '1rem (16px)' },
    { id: 'large', label: isTr ? 'Büyük' : 'Large', pxLabel: '1.18rem (19px)' },
    { id: 'xlarge', label: isTr ? '75+ Çok Büyük' : '75+ Extra Large', pxLabel: '1.35rem (22px)' },
  ];

  const strokes = [
    { width: 3, label: isTr ? 'İnce' : 'Fine', iconW: 3 },
    { width: 5, label: isTr ? 'Belirgin (Önerilen)' : 'Bold (Default)', iconW: 5 },
    { width: 8, label: isTr ? '75+ Çok Kalın' : '75+ Extra Thick', iconW: 8 },
  ];

  const [showResetConfirm, setShowResetConfirm] = React.useState(false);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-tweaker-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border-2 border-teal-500 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h2 id="theme-tweaker-title" className="text-xl sm:text-2xl font-extrabold text-slate-900">
                {isTr ? 'Görünüm, Ses & Erişilebilirlik' : 'Theme, Audio & Accessibility'}
              </h2>
              <p className="text-sm text-slate-600 font-medium">
                {isTr ? 'WCAG 2.2 ve 75+ yaş dostu ergonomik ayarlar' : 'WCAG 2.2 & 75+ elderly friendly adjustments'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Themes */}
        <div className="space-y-3">
          <label className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-teal-700" />
            <span>{isTr ? 'Tema & Kontrast Stili' : 'Theme & Contrast Style'}</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {themes.map((t) => {
              const isSelected = themeMode === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    soundEffects.playDot();
                    onSelectTheme(t.id);
                  }}
                  className={`p-3.5 rounded-2xl text-left border-2 transition min-h-[44px] cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-teal-700 bg-teal-50/50 shadow-md ring-2 ring-teal-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-base text-slate-900">{t.label}</span>
                    <span className="flex items-center gap-1.5">
                      <span className={`w-4 h-4 rounded-full ${t.previewAccent}`} />
                      {isSelected && <Check className="w-4 h-4 text-teal-700" />}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-medium">{t.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Text Size Scaler (Min 1rem always) */}
        <div className="space-y-3">
          <label className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Type className="w-5 h-5 text-teal-700" />
            <span>{isTr ? 'Yazı Boyutu (Min 1rem / 16px)' : 'Text Size (Min 1rem / 16px)'}</span>
          </label>

          <div className="grid grid-cols-3 gap-2">
            {textSizes.map((ts) => {
              const isSelected = textSizeMode === ts.id;
              return (
                <button
                  key={ts.id}
                  type="button"
                  onClick={() => {
                    soundEffects.playDot();
                    onSelectTextSize(ts.id);
                  }}
                  className={`p-3 rounded-2xl text-center border-2 transition min-h-[44px] cursor-pointer ${
                    isSelected
                      ? 'border-teal-700 bg-teal-700 text-white font-extrabold shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 text-slate-800 font-bold bg-white'
                  }`}
                >
                  <div className="text-sm">{ts.label}</div>
                  <div className={`text-xs mt-0.5 ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>{ts.pxLabel}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Stroke Thickness */}
        <div className="space-y-3">
          <label className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <span>✏️</span>
            <span>{isTr ? 'Kalem Çizgi Kalınlığı' : 'Pencil Stroke Thickness'}</span>
          </label>

          <div className="grid grid-cols-3 gap-2">
            {strokes.map((st) => {
              const isSelected = strokeWidth === st.width;
              return (
                <button
                  key={st.width}
                  type="button"
                  onClick={() => {
                    soundEffects.playDot();
                    onSelectStrokeWidth(st.width);
                  }}
                  className={`p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 border-2 transition min-h-[44px] cursor-pointer ${
                    isSelected
                      ? 'border-teal-700 bg-teal-50 shadow-sm ring-2 ring-teal-500'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div
                    className="w-12 bg-slate-800 rounded-full"
                    style={{ height: `${st.iconW}px` }}
                  />
                  <span className="text-xs font-bold text-slate-800 mt-1">{st.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Sound Controls */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <label className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-teal-700" />
            <span>{isTr ? 'Ses & Müzik Ayarları' : 'Audio & Music Settings'}</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                onToggleSfx();
                soundEffects.playDot();
              }}
              className={`p-3.5 rounded-2xl border-2 flex items-center justify-between min-h-[44px] cursor-pointer transition ${
                sfxEnabled
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-extrabold'
                  : 'border-slate-200 bg-slate-50 text-slate-600 font-bold'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-5 h-5" />
                <span>{isTr ? 'Çizim Efekt Sesleri' : 'Drawing Sound Effects'}</span>
              </div>
              <span className="text-sm font-bold">{sfxEnabled ? (isTr ? 'AÇIK' : 'ON') : (isTr ? 'KAPALI' : 'OFF')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onToggleBgMusic();
              }}
              className={`p-3.5 rounded-2xl border-2 flex items-center justify-between min-h-[44px] cursor-pointer transition ${
                bgMusicEnabled
                  ? 'border-teal-600 bg-teal-50 text-teal-900 font-extrabold'
                  : 'border-slate-200 bg-slate-50 text-slate-600 font-bold'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Music className="w-5 h-5" />
                <span>{isTr ? 'Sakinleştirici Fon Müziği' : 'Calm Background Music'}</span>
              </div>
              <span className="text-sm font-bold">{bgMusicEnabled ? (isTr ? 'AÇIK' : 'ON') : (isTr ? 'KAPALI' : 'OFF')}</span>
            </button>
          </div>
        </div>

        {/* Section 5: Helpful Actions & Reset */}
        <div className="pt-2 border-t border-slate-100 space-y-3">
          {showResetConfirm ? (
            <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 space-y-3 animate-fade-in">
              <div className="flex items-center gap-2 text-rose-900 font-extrabold text-base">
                <RotateCcw className="w-5 h-5 text-rose-600 shrink-0" />
                <span>{isTr ? 'Tüm ilerleme sıfırlansın mı?' : 'Reset all progress across all 20 stages?'}</span>
              </div>
              <p className="text-sm text-rose-800 font-medium">
                {isTr
                  ? 'Tüm 20 bölümdeki çizimleriniz ve yıldızlarınız sıfırlanacaktır. Bu işlem geri alınamaz.'
                  : 'All drawings and stars will be permanently reset.'}
              </p>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    soundEffects.playUndo();
                    onResetAllProgress();
                    setShowResetConfirm(false);
                    onClose();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-sm cursor-pointer min-h-[44px]"
                >
                  {isTr ? 'Evet, Hepsini Sıfırla' : 'Yes, Reset All'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm cursor-pointer min-h-[44px]"
                >
                  {isTr ? 'Vazgeç' : 'Cancel'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReopenTour();
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm flex items-center gap-2 min-h-[44px] cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-teal-700" />
                <span>{isTr ? 'Başlangıç Rehberini Aç' : 'Open Onboarding Tour'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-sm flex items-center gap-2 min-h-[44px] cursor-pointer border border-rose-200"
              >
                <RotateCcw className="w-4 h-4 text-rose-600" />
                <span>{isTr ? 'Tüm İlerlemeyi Sıfırla' : 'Reset All Progress'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Done button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-base shadow-md cursor-pointer transition min-h-[44px]"
          >
            {isTr ? 'Ayarları Uygula ve Kapat' : 'Apply Settings & Close'}
          </button>
        </div>

        {/* Footer Done button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-base shadow-md cursor-pointer transition min-h-[44px]"
          >
            {isTr ? 'Ayarları Uygula ve Kapat' : 'Apply Settings & Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
