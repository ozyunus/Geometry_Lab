import React, { useState } from 'react';
import { Plus, Check, Palette } from 'lucide-react';
import { useI18n } from '../../i18n/I18nContext';
import { DEFAULT_CALM_COLORS } from '../../services/kidsStorage';
import soundEffects from '../../services/soundEffects';

interface ColorPaletteBuilderProps {
  activeColor: string;
  onSelectColor: (color: string) => void;
  customColors: string[];
  onAddCustomColor: (color: string) => void;
}

export const ColorPaletteBuilder: React.FC<ColorPaletteBuilderProps> = ({
  activeColor,
  onSelectColor,
  customColors,
  onAddCustomColor,
}) => {
  const { lang } = useI18n();
  const isTr = lang === 'tr';
  const [newColorInput, setNewColorInput] = useState('#E63946');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handlePick = (color: string) => {
    soundEffects.playDot();
    onSelectColor(color);
  };

  const handleAddNew = () => {
    if (newColorInput && !customColors.includes(newColorInput)) {
      onAddCustomColor(newColorInput);
      onSelectColor(newColorInput);
      soundEffects.playLineSnap();
      setShowColorPicker(false);
    }
  };

  const allColors = [...DEFAULT_CALM_COLORS, ...customColors];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-base font-extrabold text-slate-800 flex items-center gap-2">
          <Palette className="w-5 h-5 text-teal-700" />
          <span>{isTr ? 'Kalem Rengi' : 'Pencil Color'}</span>
        </label>

        <button
          type="button"
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="text-sm font-bold text-teal-800 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 cursor-pointer min-h-[44px] flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{isTr ? 'Kendi Rengini Oluştur' : 'Create Custom Color'}</span>
        </button>
      </div>

      {/* Custom Color Creator Dropdown / Inline Bar */}
      {showColorPicker && (
        <div className="p-4 bg-slate-50 border-2 border-teal-500 rounded-2xl space-y-3 animate-fade-in shadow-inner">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newColorInput}
                onChange={(e) => setNewColorInput(e.target.value)}
                className="w-12 h-12 rounded-xl cursor-pointer border-2 border-white shadow-md bg-transparent"
                title={isTr ? 'Renk Seçici' : 'Color Picker'}
              />
              <div>
                <span className="text-sm font-bold text-slate-700 block">
                  {isTr ? 'Seçilen Ton' : 'Selected Shade'}
                </span>
                <span className="text-sm font-mono font-bold text-slate-900 uppercase">
                  {newColorInput}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddNew}
              className="px-4 py-2.5 rounded-xl bg-teal-800 hover:bg-teal-900 text-white font-extrabold text-sm shadow transition cursor-pointer min-h-[44px] flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isTr ? 'Palete Ekle & Seç' : 'Add to Palette'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Swatches List with min 44x44px touch targets */}
      <div className="flex flex-wrap items-center gap-3">
        {allColors.map((c) => {
          const isSelected = activeColor.toLowerCase() === c.toLowerCase();
          return (
            <button
              key={c}
              type="button"
              onClick={() => handlePick(c)}
              className={`w-11 h-11 rounded-2xl transition transform hover:scale-110 cursor-pointer shadow-sm relative flex items-center justify-center border-2 ${
                isSelected
                  ? 'border-slate-900 scale-110 shadow-md ring-4 ring-teal-500/50'
                  : 'border-white hover:border-slate-300'
              }`}
              style={{ backgroundColor: c }}
              title={`Renk: ${c}`}
              aria-label={`Renk seç: ${c}`}
            >
              {isSelected && (
                <Check className="w-5 h-5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] stroke-[3]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
