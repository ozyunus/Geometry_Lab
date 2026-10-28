import React, { useState } from 'react';
import { useI18n } from '../../i18n/I18nContext';
import { WORLD_TRADITIONS, WorldTradition } from '../../content/worldTraditions';
import { PatternThumbSvg } from '../common/PatternThumbSvg';
import { Globe, Layers, Compass, Sparkles, Filter, Info } from 'lucide-react';

interface ExploreGalleryProps {
  onOpenDecoder?: () => void;
  onOpenStudio?: () => void;
}

export const ExploreGallery: React.FC<ExploreGalleryProps> = ({ onOpenDecoder, onOpenStudio }) => {
  const { t, lang } = useI18n();
  const isTr = lang === 'tr';

  const [activeFilter, setActiveFilter] = useState<'all' | 'islamic' | 'asian' | 'modern'>('all');
  const [selectedTradition, setSelectedTradition] = useState<WorldTradition | null>(WORLD_TRADITIONS[0]);

  const filtered = WORLD_TRADITIONS.filter(item => {
    if (activeFilter === 'all') return true;
    return item.category === activeFilter;
  });

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="bg-[#FFFDF8] border border-[#E8E5DD] rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#DCEDED] text-[#087D86] mb-2">
              <Globe className="w-3.5 h-3.5" />
              {isTr ? 'Evrensel Geometrik Miras' : 'Universal Geometric Heritage'}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-[#14313F]">
              {t('galleryTitle')}
            </h1>
            <p className="text-sm md:text-base text-[#60757C] mt-1 max-w-2xl">
              {t('gallerySubtitle')}
            </p>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-[#087D86] text-white shadow-sm'
                  : 'bg-white text-[#14313F] border border-[#E8E5DD] hover:bg-[#F8F5EE]'
              }`}
            >
              {t('filterAll')}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('islamic')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFilter === 'islamic'
                  ? 'bg-[#087D86] text-white shadow-sm'
                  : 'bg-white text-[#14313F] border border-[#E8E5DD] hover:bg-[#F8F5EE]'
              }`}
            >
              {t('filterIslamic')}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('asian')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFilter === 'asian'
                  ? 'bg-[#087D86] text-white shadow-sm'
                  : 'bg-white text-[#14313F] border border-[#E8E5DD] hover:bg-[#F8F5EE]'
              }`}
            >
              {t('filterAsian')}
            </button>
            <button
              type="button"
              onClick={() => setActiveFilter('modern')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFilter === 'modern'
                  ? 'bg-[#087D86] text-white shadow-sm'
                  : 'bg-white text-[#14313F] border border-[#E8E5DD] hover:bg-[#F8F5EE]'
              }`}
            >
              {t('filterModern')}
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Traditions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map(trad => {
          const isSelected = selectedTradition?.id === trad.id;
          return (
            <div
              key={trad.id}
              onClick={() => setSelectedTradition(trad)}
              className={`bg-[#FFFDF8] border rounded-2xl overflow-hidden shadow-sm transition hover:shadow-md cursor-pointer flex flex-col ${
                isSelected ? 'border-[#087D86] ring-2 ring-[#087D86]/20' : 'border-[#E8E5DD]'
              }`}
            >
              {/* Pattern Vector Preview Area */}
              <div className="w-full h-48 bg-[#F8F5EE] border-b border-[#E8E5DD] p-4 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-geo-grid opacity-40 pointer-events-none" />
                <div className="w-36 h-36 relative z-10 transition-transform duration-300 group-hover:scale-105">
                  <PatternThumbSvg type={trad.svgType} />
                </div>
                <span className="absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/90 border border-[#E8E5DD] text-[#087D86] shadow-2xs">
                  {isTr ? trad.eraTr : trad.eraEn}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#D89A43]">
                    {isTr ? trad.originTr : trad.originEn}
                  </div>
                  <h3 className="text-lg font-bold font-display text-[#14313F]">
                    {isTr ? trad.nameTr : trad.nameEn}
                  </h3>
                  <p className="text-xs text-[#60757C] leading-relaxed">
                    {isTr ? trad.descTr : trad.descEn}
                  </p>
                </div>

                {/* Mathematical Note Box */}
                <div className="p-3 bg-[#F8F5EE] rounded-xl border border-[#E8E5DD] text-xs text-[#14313F] space-y-1">
                  <div className="font-bold text-[#087D86] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#D89A43]" />
                    {isTr ? 'Geometrik Özellik' : 'Geometric Property'}
                  </div>
                  <p className="text-[11px] text-[#60757C]">
                    {isTr ? trad.geometryNotesTr : trad.geometryNotesEn}
                  </p>
                </div>

                {/* Attribution footnote */}
                <div className="flex items-center gap-1 text-[10px] text-[#60757C] italic">
                  <Info className="w-3 h-3 text-[#D89A43] shrink-0" />
                  <span>{isTr ? trad.attributionNoteTr : trad.attributionNoteEn}</span>
                </div>

                {/* Action button */}
                <div className="pt-2 border-t border-[#E8E5DD] flex items-center gap-2">
                  {trad.hasDecoder && onOpenDecoder ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenDecoder();
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-[#087D86] text-white text-xs font-bold hover:bg-[#08646C] transition cursor-pointer"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      {t('decodePattern')}
                    </button>
                  ) : onOpenStudio ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenStudio();
                      }}
                      className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-[#087D86] bg-[#DCEDED]/40 text-[#087D86] text-xs font-bold hover:bg-[#DCEDED] transition cursor-pointer"
                    >
                      <Compass className="w-3.5 h-3.5" />
                      {t('tryInStudio')}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
