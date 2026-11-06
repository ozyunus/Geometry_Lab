import React, { useState, useEffect } from 'react';
import analytics from '../../services/analytics';
import { Shield, Check, X, Sliders, ChevronDown } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';

interface ConsentBannerProps {
  onOpenPrivacyModal?: () => void;
}

export const AnalyticsConsentBanner: React.FC<ConsentBannerProps> = () => {
  const { lang } = useI18n();
  const isTr = lang === 'tr';

  const [visible, setVisible] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [allowAnalytics, setAllowAnalytics] = useState(true);
  const [allowSessionReplay, setAllowSessionReplay] = useState(false);

  useEffect(() => {
    const consent = analytics.getConsent();
    if (!consent.hasAnswered) {
      // Show consent prompt after brief delay so initial load is smooth
      const timer = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAcceptAll = () => {
    analytics.setConsent(true, true);
    setVisible(false);
  };

  const handleAcceptAnalyticsOnly = () => {
    analytics.setConsent(true, false);
    setVisible(false);
  };

  const handleDeclineAll = () => {
    analytics.setConsent(false, false);
    setVisible(false);
  };

  const handleSaveCustom = () => {
    analytics.setConsent(allowAnalytics, allowAnalytics && allowSessionReplay);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Privacy & Consent Settings"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-[#FFFDF8] border border-[#E8E5DD] shadow-xl rounded-2xl p-4 sm:p-5 text-slate-800 animate-fade-in backdrop-blur-md bg-opacity-95"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-[#087D86] shrink-0">
          <Shield className="w-5 h-5" />
        </div>
        <div className="flex-1 text-xs">
          <h4 className="font-bold text-sm text-[#14313F] mb-1">
            {isTr ? 'Gizlilik & Ürün Analitiği' : 'Privacy & Product Analytics'}
          </h4>
          <p className="text-slate-600 leading-relaxed mb-3">
            {isTr
              ? 'PatternLab, geometrik öğrenme deneyimini geliştirmek için anonim kullanım verilerini analiz eder. Kişisel veri veya çizim içerikleri asla kaydedilmez. Çocuk Odası her zaman tam gizlilikle korunur.'
              : 'PatternLab uses anonymous product analytics to improve geometric learning experiences. We never collect personal identities or drawing content. The Kids Room is always strictly protected.'}
          </p>

          {showAdvanced && (
            <div className="space-y-2 p-3 bg-[#F8F5EE] rounded-xl border border-[#E8E5DD] mb-3 text-[11px]">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-bold text-slate-700">
                    {isTr ? 'Anonim Kullanım Analitiği' : 'Anonymous Product Analytics'}
                  </span>
                  <p className="text-slate-500">
                    {isTr ? 'Ders tamamlama ve hata oranlarını ölçer' : 'Measures lesson completion & error rates'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={allowAnalytics}
                  onChange={(e) => setAllowAnalytics(e.target.checked)}
                  className="rounded text-[#087D86] focus:ring-[#087D86] w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer pt-2 border-t border-[#E8E5DD]/60">
                <div>
                  <span className="font-bold text-slate-700">
                    {isTr ? 'Yetişkin Oturum Tekrarı' : 'Adult Session Replay'}
                  </span>
                  <p className="text-slate-500">
                    {isTr ? 'Yalnızca yetişkin arayüzünde gezinme zorluklarını tespit eder. Çizim tuvali maskelenir.' : 'Helps spot navigation issues in adult mode only. Canvas is masked.'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={allowSessionReplay}
                  disabled={!allowAnalytics}
                  onChange={(e) => setAllowSessionReplay(e.target.checked)}
                  className="rounded text-[#087D86] focus:ring-[#087D86] w-4 h-4 cursor-pointer disabled:opacity-40"
                />
              </label>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {showAdvanced ? (
              <button
                type="button"
                onClick={handleSaveCustom}
                className="px-3 py-1.5 rounded-xl bg-[#087D86] text-white font-bold hover:opacity-90 transition cursor-pointer text-xs"
              >
                {isTr ? 'Tercihleri Kaydet' : 'Save Preferences'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleAcceptAnalyticsOnly}
                  className="px-3 py-1.5 rounded-xl bg-[#087D86] text-white font-bold hover:opacity-90 transition cursor-pointer text-xs"
                >
                  {isTr ? 'Kabul Et' : 'Accept'}
                </button>
                <button
                  type="button"
                  onClick={handleDeclineAll}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold transition cursor-pointer text-xs"
                >
                  {isTr ? 'Yalnızca Zorunlu' : 'Essential Only'}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="px-2 py-1.5 text-slate-500 hover:text-[#087D86] underline font-semibold transition cursor-pointer text-[11px] ml-auto flex items-center gap-1"
            >
              <Sliders className="w-3 h-3" />
              <span>{showAdvanced ? (isTr ? 'Basit Görünüm' : 'Simple') : (isTr ? 'Özelleştir' : 'Customize')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
