import React from 'react';
import { X, Check, Sparkles, Palette, Shield, Terminal, Eye } from 'lucide-react';
import { AppTheme } from '../../types';
import { APP_THEMES } from '../../data/themes';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border-2 border-amber-600/80 rounded-sm shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="theme-modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-amber-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xs bg-amber-950/80 border border-amber-600/60 text-amber-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 bg-amber-950/60 border border-amber-800/40 px-1.5 py-0.5 rounded-xs">
                  Aesthetic Engine
                </span>
                <span className="text-[10px] font-mono text-slate-400">Data-Slate Appearance</span>
              </div>
              <h2 id="theme-modal-title" className="text-lg font-serif font-black tracking-wider text-slate-100 uppercase">
                Select Imperial Theme
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-sm transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
          <p className="text-xs font-mono text-slate-300">
            Select an aesthetic protocol to recalibrate data conduits, terminal borders, and chromatic telemetry:
          </p>

          <div className="grid grid-cols-1 gap-3.5">
            {Object.values(APP_THEMES).map((theme) => {
              const isSelected = currentTheme === theme.id;
              return (
                <div
                  key={theme.id}
                  onClick={() => {
                    onSelectTheme(theme.id);
                  }}
                  className={`cursor-pointer p-4 rounded-sm border-2 transition-all relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isSelected
                      ? 'bg-slate-950 border-amber-500 shadow-lg shadow-amber-950/40'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-serif font-bold text-base text-slate-100">
                        {theme.name}
                      </span>
                      <span className={`text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-xs border font-semibold ${theme.badgeColor}`}>
                        {theme.badge}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 border border-amber-700 px-2 py-0.5 rounded-xs flex items-center gap-1 font-bold">
                          <Check className="w-3 h-3" /> ACTIVE PROTOCOL
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-amber-300/80">
                      {theme.subtitle}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
                      {theme.description}
                    </p>
                  </div>

                  {/* Swatches */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 bg-slate-950 p-2 rounded-xs border border-slate-800">
                      {theme.previewColors.map((color, idx) => (
                        <div
                          key={idx}
                          className="w-4 h-4 rounded-full border border-slate-700 shadow-sm"
                          style={{ backgroundColor: color }}
                          title={`Color ${idx + 1}`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTheme(theme.id);
                      }}
                      className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-xs border transition-colors ${
                        isSelected
                          ? 'bg-amber-600 border-amber-500 text-slate-950 font-bold'
                          : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Apply'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs font-mono text-slate-400">
          <span>Persists automatically to local data-slate memory</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xs border border-slate-700 transition-colors uppercase font-mono tracking-wider"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
