import React from 'react';
import { AlertCircle, ArrowLeft, Check, Sparkles } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';

interface ExitConfirmModalProps {
  isOpen: boolean;
  currentStep: number;
  onConfirmExit: () => void;
  onCancel: () => void;
}

export const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  isOpen,
  currentStep,
  onConfirmExit,
  onCancel,
}) => {
  const { lang } = useI18n();
  const isTr = lang === 'tr';

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
    >
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border-2 border-amber-300 relative">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0 border border-amber-200">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-3">
            <h3 id="exit-modal-title" className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
              {isTr ? 'Sayfadan Çıkmak İstiyor musunuz?' : 'Are you sure you want to exit?'}
            </h3>

            <p className="text-base text-slate-700 leading-relaxed font-medium">
              {isTr ? (
                <>
                  Şu an <strong className="text-teal-800 font-bold">{currentStep}. Bölümdesiniz</strong>. Çizimleriniz, kazandığınız yıldızlar ve ilerlemeniz otomatik olarak güvende tutuldu.
                </>
              ) : (
                <>
                  You are currently at <strong className="text-teal-800 font-bold">Stage {currentStep}</strong>. Your drawings, stars, and progress are automatically saved.
                </>
              )}
            </p>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-sm sm:text-base text-emerald-900 font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                {isTr
                  ? 'Dilediğiniz an geri döndüğünüzde kaldığınız yerden devam edebilirsiniz!'
                  : 'You can come back anytime and resume right where you left off!'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons - Min 44px touch target */}
        <div className="mt-8 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
          <button
            type="button"
            onClick={onConfirmExit}
            className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-base font-bold transition cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>{isTr ? 'Evet, Çıkış Yap' : 'Yes, Exit'}</span>
          </button>

          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white text-base font-extrabold shadow-lg shadow-teal-900/20 transition transform hover:scale-105 cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            <span>{isTr ? 'Burada Kal & Çizmeye Devam Et' : 'Stay Here & Keep Drawing'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
