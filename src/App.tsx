import React, { useState } from 'react';
import { I18nProvider, useI18n } from './i18n/I18nContext';
import { Navbar, ActiveView } from './components/layout/Navbar';
import { HomeView } from './components/home/HomeView';
import { InteractiveLessonPlayer } from './components/learn/InteractiveLessonPlayer';
import { RosetteLesson } from './components/lesson/RosetteLesson';
import { RotationLesson } from './components/lesson/RotationLesson';
import { PatternDecoder } from './components/decoder/PatternDecoder';
import { GeometryStudio } from './components/studio/GeometryStudio';
import { ExploreGallery } from './components/explore/ExploreGallery';
import { AboutView } from './components/about/AboutView';
import { GeoScene } from './types/geometry';
import { ShieldCheck } from 'lucide-react';
import { KidsAdventureView } from './components/kids/KidsAdventureView';

function AppContent() {
  const { t, lang } = useI18n();
  const isTr = lang === 'tr';

  const [activeView, setActiveView] = useState<ActiveView>('home');
  const [isKidsMode, setIsKidsMode] = useState<boolean>(false);
  const [selectedLessonId, setSelectedLessonId] = useState<string>('lesson-1');
  const [transferredScene, setTransferredScene] = useState<GeoScene | null>(null);
  const [transferredTemplateGuide, setTransferredTemplateGuide] = useState<'none' | 'rosette' | 'seljuk8'>('rosette');

  const handleNavigate = (view: ActiveView) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectLesson = (lessonId: string) => {
    setSelectedLessonId(lessonId);
    setActiveView('learn');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTransferToStudio = (scene?: GeoScene, template?: 'none' | 'rosette' | 'seljuk8') => {
    if (scene) {
      setTransferredScene(scene);
    }
    if (template) {
      setTransferredTemplateGuide(template);
    }
    setActiveView('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F5EE] text-[#14313F]">
      {/* Top sticky navbar */}
      <Navbar
        activeView={activeView}
        onNavigate={(v) => {
          setIsKidsMode(false);
          handleNavigate(v);
        }}
        onOpenKids={() => setIsKidsMode(true)}
        isKidsMode={isKidsMode}
      />

      {/* Main Content Area */}
      <main className="flex-1 py-4 sm:py-6">
        {isKidsMode ? (
          <KidsAdventureView
            onReturn={() => setIsKidsMode(false)}
            onNavigate={(v) => {
              setIsKidsMode(false);
              handleNavigate(v);
            }}
          />
        ) : (
          <>
            {activeView === 'home' && (
          <HomeView
            onNavigate={(view) => {
              if (view === 'rosette') {
                setSelectedLessonId('lesson-4');
                setActiveView('learn');
              } else if (view === 'rotation') {
                setSelectedLessonId('lesson-6');
                setActiveView('learn');
              } else if (view === 'decoder') {
                setActiveView('decoder');
              } else {
                setActiveView(view as ActiveView);
              }
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* Unified 8-Step Interactive Guided Learning Engine */}
        {activeView === 'learn' && (
          <InteractiveLessonPlayer
            key={selectedLessonId}
            initialLessonId={selectedLessonId}
            onNavigateToStudio={handleTransferToStudio}
          />
        )}

        {activeView === 'rosette' && (
          <RosetteLesson
            onTransferToStudio={handleTransferToStudio}
            onNextLesson={() => {
              setSelectedLessonId('lesson-6');
              setActiveView('learn');
            }}
          />
        )}

        {activeView === 'rotation' && (
          <RotationLesson
            onTransferToStudio={() => setActiveView('create')}
          />
        )}

        {activeView === 'decoder' && (
          <PatternDecoder
            onTransferToStudio={() => setActiveView('create')}
          />
        )}

        {activeView === 'create' && (
          <GeometryStudio initialScene={transferredScene} initialTemplateGuide={transferredTemplateGuide} />
        )}

        {activeView === 'explore' && (
          <ExploreGallery
            onOpenDecoder={() => setActiveView('decoder')}
            onOpenStudio={() => setActiveView('create')}
          />
        )}

        {activeView === 'about' && <AboutView />}
          </>
        )}
      </main>

      {/* Global Footer */}
      <footer className="bg-[#FFFDF8] border-t border-[#E8E5DD] py-8 px-4 text-xs text-[#60757C]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#14313F]">PatternLab</span>
            <span>—</span>
            <span>{t('tagline')}</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleNavigate('about')}
              className="hover:text-[#087D86] underline cursor-pointer"
            >
              {t('navAbout')}
            </button>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#087D86]" />
              {isTr ? '100% Yerel & Güvenli' : '100% Local & Private'}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppContent />
    </I18nProvider>
  );
}
