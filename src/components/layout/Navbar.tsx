import React, { useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { Compass, BookOpen, Globe, Info, Menu, X, Sparkles, Languages } from 'lucide-react';

export type ActiveView = 'home' | 'learn' | 'create' | 'explore' | 'about' | 'rosette' | 'rotation' | 'decoder';

interface NavbarProps {
  activeView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onOpenKids: () => void;
  isKidsMode: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeView, onNavigate, onOpenKids, isKidsMode }) => {
  const { t, lang, setLang } = useI18n();
  const isTr = lang === 'tr';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'learn', label: t('navLearn'), icon: BookOpen },
    { id: 'create', label: t('navCreate'), icon: Compass },
    { id: 'explore', label: t('navExplore'), icon: Globe },
    { id: 'about', label: t('navAbout'), icon: Info },
  ] as const;

  const toggleLanguage = () => {
    setLang(lang === 'tr' ? 'en' : 'tr');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FFFDF8]/95 backdrop-blur-md border-b border-[#E8E5DD]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Tagline */}
        <div
          onClick={() => {
            onNavigate('home');
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-3 cursor-pointer group"
        >
          {/* Logo 8-rosette geometric symbol */}
          <div className="w-10 h-10 rounded-xl bg-[#087D86] flex items-center justify-center text-white shadow-sm transition group-hover:scale-105">
            <svg viewBox="-50 -50 100 100" className="w-6 h-6">
              <circle cx="0" cy="0" r="32" fill="none" stroke="white" strokeWidth="6" opacity="0.4" />
              {[0, 45, 90, 135].map(deg => (
                <rect
                  key={deg}
                  x="-20"
                  y="-20"
                  width="40"
                  height="40"
                  transform={`rotate(${deg})`}
                  fill="none"
                  stroke="white"
                  strokeWidth="4"
                />
              ))}
              <circle cx="0" cy="0" r="4" fill="#D89A43" />
            </svg>
          </div>

          <div>
            <span className="text-xl font-bold font-display text-[#14313F] tracking-tight">
              Pattern<span className="text-[#087D86]">Lab</span>
            </span>
            <span className="hidden sm:block text-[11px] font-medium text-[#60757C]">
              {t('tagline')}
            </span>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive =
              activeView === item.id ||
              (item.id === 'learn' && (activeView === 'rosette' || activeView === 'rotation')) ||
              (item.id === 'explore' && activeView === 'decoder');

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id as ActiveView)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-[#087D86] text-white shadow-sm'
                    : 'text-[#14313F] hover:bg-[#F8F5EE] hover:text-[#087D86]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Kids Room Button & Language Switcher & Mobile Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Flowery Kids Room Button */}
          <button
            type="button"
            onClick={onOpenKids}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-teal-700 via-emerald-700 to-amber-700 text-white hover:opacity-95 text-xs font-extrabold shadow-sm transition transform hover:scale-105 cursor-pointer ${
              isKidsMode ? 'ring-3 ring-offset-2 ring-teal-700 scale-105' : ''
            }`}
            title="Minik Geometristler İçin Eğlenceli Çocuk Odası"
          >
            <span className="text-sm">🌿</span>
            <span className="hidden sm:inline">{isTr ? 'Çocuk Odası' : 'Kids Room'}</span>
          </button>

          {/* TR / EN Switcher */}
          <button
            type="button"
            onClick={toggleLanguage}
            title={lang === 'tr' ? 'Switch to English' : 'Türkçe\'ye Geç'}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E8E5DD] bg-white hover:bg-[#F8F5EE] text-[#14313F] text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5 text-[#087D86]" />
            <span className={lang === 'tr' ? 'font-extrabold text-[#087D86]' : 'text-[#60757C]'}>TR</span>
            <span className="text-[#E8E5DD]">/</span>
            <span className={lang === 'en' ? 'font-extrabold text-[#087D86]' : 'text-[#60757C]'}>EN</span>
          </button>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#14313F] hover:bg-[#F8F5EE] border border-[#E8E5DD] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FFFDF8] border-b border-[#E8E5DD] px-4 py-3 space-y-1 shadow-lg animate-fade-in">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive =
              activeView === item.id ||
              (item.id === 'learn' && (activeView === 'rosette' || activeView === 'rotation')) ||
              (item.id === 'explore' && activeView === 'decoder');

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onNavigate(item.id as ActiveView);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition cursor-pointer ${
                  isActive
                    ? 'bg-[#087D86] text-white shadow-sm'
                    : 'text-[#14313F] hover:bg-[#F8F5EE]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
