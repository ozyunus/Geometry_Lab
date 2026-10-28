import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, TranslationKey } from './translations';
import { Language } from '../types/geometry';

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem('patternlab_lang');
      if (stored === 'tr' || stored === 'en') return stored;
      if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('tr')) {
        return 'tr';
      }
    } catch {
      // fallback
    }
    return 'tr'; // Default to Turkish as primary per spec, easily switchable
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem('patternlab_lang', newLang);
      document.documentElement.lang = newLang;
    } catch {
      // ignore storage errors
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = (key: TranslationKey): string => {
    const dict = (translations[lang] || translations.en) as Record<TranslationKey, string>;
    if (dict[key]) return dict[key];
    return translations.en[key] || (key as string);
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
