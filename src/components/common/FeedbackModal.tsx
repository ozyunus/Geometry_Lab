import React, { useState } from 'react';
import { MessageSquarePlus, X, Send, CheckCircle2, Heart } from 'lucide-react';
import analytics from '../../services/analytics';
import { useI18n } from '../../i18n/I18nContext';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  contextLessonId?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, contextLessonId }) => {
  const { lang } = useI18n();
  const isTr = lang === 'tr';
  const isKids = analytics.getExperience() === 'kids';

  const [confusing, setConfusing] = useState('');
  const [enjoyed, setEnjoyed] = useState('');
  const [improved, setImproved] = useState('');
  const [wouldUseAgain, setWouldUseAgain] = useState<string>('yes');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    analytics.trackFeedback({
      role: isKids ? 'parent_or_educator' : 'adult',
      confusing: confusing.trim() || undefined,
      enjoyed: enjoyed.trim() || undefined,
      improved: improved.trim() || undefined,
      would_use_again: wouldUseAgain,
      lesson_context: contextLessonId,
    });
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-lg bg-[#FFFDF8] rounded-2xl shadow-2xl border border-[#E8E5DD] overflow-hidden text-[#14313F]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E8E5DD] flex items-center justify-between bg-[#F8F5EE]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-100/70 text-[#087D86] flex items-center justify-center">
              <MessageSquarePlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {isKids
                  ? (isTr ? 'Ebeveyn & Eğitmen Geri Bildirimi' : 'Parent & Educator Feedback')
                  : (isTr ? 'Ürün Geri Bildirimi' : 'Product Feedback')}
              </h3>
              <p className="text-[11px] text-[#60757C]">
                {isKids
                  ? (isTr ? 'Çocukların güvenliği için bu form yalnızca yetişkinler içindir' : 'Designed exclusively for parents and educators')
                  : (isTr ? 'PatternLab deneyimini geliştirmemize yardımcı olun' : 'Help us improve the geometric learning experience')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-800">
              {isTr ? 'Geri Bildiriminiz İçin Teşekkürler!' : 'Thank You for Your Feedback!'}
            </h4>
            <p className="text-xs text-slate-600 max-w-xs mx-auto">
              {isTr
                ? 'Görüşleriniz geometri atölyemizi daha anlaşılır ve keyifli hale getirecek.'
                : 'Your insights help make our geometry studio more intuitive and inspiring.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
            {/* Question 1: Confusing */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {isTr ? '1. Hangi adım veya araç kafa karıştırıcıydı?' : '1. What felt confusing or difficult?'}
              </label>
              <textarea
                value={confusing}
                onChange={(e) => setConfusing(e.target.value)}
                placeholder={isTr ? 'Örn: Pergel kilit mekanizması, açı adımı...' : 'e.g. Compass lock, specific step explanation...'}
                className="w-full h-16 px-3 py-2 text-xs rounded-xl border border-[#E8E5DD] bg-white focus:outline-none focus:ring-2 focus:ring-[#087D86] resize-none"
              />
            </div>

            {/* Question 2: Enjoyed */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {isTr ? '2. En çok neyi keyifli buldunuz?' : '2. What did you enjoy the most?'}
              </label>
              <textarea
                value={enjoyed}
                onChange={(e) => setEnjoyed(e.target.value)}
                placeholder={isTr ? 'Örn: Rozetin açması, serbest çizim tuvali...' : 'e.g. Blooming rosette, geometric synthesis challenge...'}
                className="w-full h-16 px-3 py-2 text-xs rounded-xl border border-[#E8E5DD] bg-white focus:outline-none focus:ring-2 focus:ring-[#087D86] resize-none"
              />
            </div>

            {/* Question 3: Improve */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                {isTr ? '3. Neyi geliştirmemizi istersiniz?' : '3. What would you improve?'}
              </label>
              <textarea
                value={improved}
                onChange={(e) => setImproved(e.target.value)}
                placeholder={isTr ? 'Örn: Daha fazla İslami motif, cetvel kılavuzu...' : 'e.g. More Islamic star patterns, precision snapping...'}
                className="w-full h-16 px-3 py-2 text-xs rounded-xl border border-[#E8E5DD] bg-white focus:outline-none focus:ring-2 focus:ring-[#087D86] resize-none"
              />
            </div>

            {/* Question 4: Would use again */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">
                {isTr ? '4. PatternLab\'ı tekrar kullanır mısınız?' : '4. Would you use PatternLab again?'}
              </label>
              <div className="flex gap-2">
                {[
                  { id: 'yes', labelTr: 'Kesinlikle Evet', labelEn: 'Definitely Yes' },
                  { id: 'maybe', labelTr: 'Belki', labelEn: 'Maybe' },
                  { id: 'no', labelTr: 'Hayır', labelEn: 'No' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setWouldUseAgain(opt.id)}
                    className={`flex-1 py-1.5 px-2 rounded-xl border text-center font-bold transition cursor-pointer text-xs ${
                      wouldUseAgain === opt.id
                        ? 'border-[#087D86] bg-[#087D86] text-white shadow-xs'
                        : 'border-[#E8E5DD] bg-white text-slate-700 hover:bg-[#F8F5EE]'
                    }`}
                  >
                    {isTr ? opt.labelTr : opt.labelEn}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-[#E8E5DD]">
              <span className="text-[10px] text-slate-400">
                {isTr ? 'Anonim olarak iletilir. Kişisel veri toplanmaz.' : 'Submitted anonymously. No PII is collected.'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer"
                >
                  {isTr ? 'Vazgeç' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#087D86] text-white text-xs font-bold shadow-xs hover:opacity-90 transition cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isTr ? 'Gönder' : 'Submit'}</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
