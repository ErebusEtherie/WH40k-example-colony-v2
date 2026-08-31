import React, { useState } from 'react';
import { 
  Building2, 
  ChevronDown, 
  Plus, 
  Eye, 
  Sliders, 
  LogOut, 
  Cog,
  Check,
  Palette,
  Clock
} from 'lucide-react';
import { Colony, AccessibilityPalette, FontSizeSetting, AppTheme, BackendStatus } from '../../types';
import { COLONY_TYPES } from '../../data/rulesReference';
import { APP_THEMES } from '../../data/themes';

interface HeaderProps {
  colonies: Colony[];
  selectedColony: Colony;
  onSelectColony: (colonyId: string) => void;
  onOpenCreateColony: () => void;
  theme: AppTheme;
  onChangeTheme: (theme: AppTheme) => void;
  onOpenThemeModal: () => void;
  onAdvanceDays?: (days: number) => void;
  accessibilityPalette: AccessibilityPalette;
  onChangePalette: (palette: AccessibilityPalette) => void;
  isDyslexiaFont: boolean;
  onToggleDyslexiaFont: () => void;
  fontSize: FontSizeSetting;
  onChangeFontSize: (size: FontSizeSetting) => void;
  isHighContrast: boolean;
  onToggleHighContrast: () => void;
  username: string;
  onLogout: () => void;
  backendStatus?: BackendStatus;
}

interface BackendStatusConfig {
  text: string;
  dotClass: string;
  badgeClass: string;
}

const getBackendStatusConfig = (status: BackendStatus): BackendStatusConfig => {
  const configs: Record<BackendStatus, BackendStatusConfig> = {
    connected: {
      text: 'Cogitator Online',
      dotClass: 'bg-emerald-400 shadow-sm shadow-emerald-400',
      badgeClass: 'bg-emerald-950/90 border-emerald-500 text-emerald-300 shadow-emerald-950/50',
    },
    syncing: {
      text: 'Syncing...',
      dotClass: 'bg-cyan-400 shadow-sm shadow-cyan-400',
      badgeClass: 'bg-cyan-950/90 border-cyan-500 text-cyan-300 animate-pulse shadow-cyan-950/50',
    },
    offline: {
      text: 'Local Cache',
      dotClass: 'bg-red-400',
      badgeClass: 'bg-red-950/90 border-red-500 text-red-300 shadow-red-950/50',
    },
  };
  return configs[status];
};

const FONT_SIZE_LABELS: Record<FontSizeSetting, string> = {
  standard: '100%',
  large: '115%',
  xlarge: '130%',
};

const COLOR_BLIND_PALETTES = [
  { key: 'mechanicus', label: 'Default' },
  { key: 'high_contrast', label: 'Monochrome' },
  { key: 'protanopia', label: 'Deuter/Prot' },
  { key: 'tritanopia', label: 'Tritanopia' },
] as const;

const FONT_SIZE_OPTIONS = ['standard', 'large', 'xlarge'] as const;

interface AccessibilityMenuProps {
  isOpen: boolean;
  isDyslexiaFont: boolean;
  onToggleDyslexiaFont: () => void;
  isHighContrast: boolean;
  onToggleHighContrast: () => void;
  accessibilityPalette: AccessibilityPalette;
  onChangePalette: (palette: AccessibilityPalette) => void;
  fontSize: FontSizeSetting;
  onChangeFontSize: (size: FontSizeSetting) => void;
}

const AccessibilityMenu: React.FC<AccessibilityMenuProps> = ({
  isOpen,
  isDyslexiaFont,
  onToggleDyslexiaFont,
  isHighContrast,
  onToggleHighContrast,
  accessibilityPalette,
  onChangePalette,
  fontSize,
  onChangeFontSize,
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-72 bg-slate-900 border-2 border-cyan-700/80 rounded-sm shadow-2xl p-4 z-50 space-y-4 animate-in fade-in">
      <div className="flex items-center justify-between border-b border-cyan-900/80 pb-2">
        <span className="font-serif uppercase font-bold text-xs text-cyan-200 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Accessibility & Optics
        </span>
        <span className="text-[10px] font-mono text-slate-400">WCAG AA Compliant</span>
      </div>

      {/* Dyslexia-friendly Font */}
      <div className="space-y-1.5">
        <label htmlFor="toggle-dyslexia-font" className="text-xs font-medium text-slate-200 flex items-center justify-between">
          <span>Dyslexia-Optimized Font</span>
          <button
            type="button"
            onClick={onToggleDyslexiaFont}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              isDyslexiaFont ? 'bg-cyan-500' : 'bg-slate-700'
            }`}
            aria-pressed={isDyslexiaFont}
            id="toggle-dyslexia-font"
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                isDyslexiaFont ? 'translate-x-4.5' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
        <p className="text-[11px] text-slate-400">
          Switches body typography to Lexend with generous tracking.
        </p>
      </div>

      {/* High Contrast Boost */}
      <div className="space-y-1.5">
        <label htmlFor="toggle-high-contrast" className="text-xs font-medium text-slate-200 flex items-center justify-between">
          <span>High-Contrast Boost</span>
          <button
            type="button"
            onClick={onToggleHighContrast}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              isHighContrast ? 'bg-cyan-500' : 'bg-slate-700'
            }`}
            aria-pressed={isHighContrast}
            id="toggle-high-contrast"
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                isHighContrast ? 'translate-x-4.5' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
        <p className="text-[11px] text-slate-400">
          Sharpens border lines and maximizes contrast ratios.
        </p>
      </div>

      {/* Color-Blind Safe Palette */}
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-slate-200 block">
          Color-Blind Palette Profile
        </span>
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          {COLOR_BLIND_PALETTES.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => onChangePalette(p.key as AccessibilityPalette)}
              className={`px-2 py-1 text-left rounded-xs border text-[11px] font-mono transition-colors ${
                accessibilityPalette === p.key
                  ? 'bg-cyan-900 border-cyan-400 text-cyan-100 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Text Size */}
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-slate-200 block">
          Display Scale
        </span>
        <div className="flex gap-1.5">
          {FONT_SIZE_OPTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChangeFontSize(s)}
              className={`flex-1 py-1 text-center rounded-xs border text-xs font-mono uppercase transition-colors ${
                fontSize === s
                  ? 'bg-cyan-900 border-cyan-400 text-cyan-100 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {FONT_SIZE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export const Header: React.FC<HeaderProps> = ({
  colonies,
  selectedColony,
  onSelectColony,
  onOpenCreateColony,
  theme,
  onChangeTheme,
  onOpenThemeModal,
  onAdvanceDays,
  accessibilityPalette,
  onChangePalette,
  isDyslexiaFont,
  onToggleDyslexiaFont,
  fontSize,
  onChangeFontSize,
  isHighContrast,
  onToggleHighContrast,
  username: _username,
  onLogout,
  backendStatus = 'connected',
}) => {
  const [isColonyDropdownOpen, setIsColonyDropdownOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [isA11yMenuOpen, setIsA11yMenuOpen] = useState(false);

  const currentThemeConfig = APP_THEMES[theme] || APP_THEMES.mechanicus_amber;
  const colonyTypeInfo = COLONY_TYPES[selectedColony.colonyType] || COLONY_TYPES.research_mission;
  const statusConfig = getBackendStatusConfig(backendStatus);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 border-b border-amber-600/60 backdrop-blur-md shadow-md shadow-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand & Imperial Seal */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-sm bg-gradient-to-br from-amber-950 via-slate-900 to-slate-950 border border-amber-500/80 text-cyan-400 shadow-sm shadow-amber-950/40 shrink-0">
            <Cog className="w-6 h-6 animate-spin-slow text-cyan-400" />
            <div className="absolute inset-0 border border-amber-400/40 rounded-xs pointer-events-none" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
            <h1 className="text-xs sm:text-sm font-serif font-black tracking-wider text-amber-300 uppercase select-none">
              Warhammer 40,000 Rogue Trader · Imperial Colony Overseer System
            </h1>
            <div className="flex items-center gap-2">
              <span
                className={`text-[11px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-xs border font-bold flex items-center gap-1.5 shadow-xs ${statusConfig.badgeClass}`}
                title={`REST Cogitator Status: ${backendStatus}`}
              >
                <span className={`w-2 h-2 rounded-full ${statusConfig.dotClass}`} />
                {statusConfig.text}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls Group */}
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Colony Switcher Dropdown */}
          <div className="relative">
            <div className="flex items-center gap-1.5 bg-slate-900/90 border border-amber-700/80 rounded-sm p-1">
              <button
                type="button"
                onClick={() => setIsColonyDropdownOpen(!isColonyDropdownOpen)}
                className="flex items-center gap-2.5 px-2.5 py-1 text-left hover:bg-amber-950/40 rounded-xs transition-colors focus:outline-hidden focus:ring-1 focus:ring-amber-400"
                aria-expanded={isColonyDropdownOpen}
                aria-haspopup="listbox"
                id="colony-selector-btn"
              >
                <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="text-xs font-bold text-slate-100 flex items-center gap-2 font-serif uppercase">
                  {selectedColony.name}
                  <span className="text-[10px] font-mono font-normal text-amber-300 bg-amber-950/80 border border-amber-800/60 px-1 rounded-xs">
                    {colonyTypeInfo.displayName}
                  </span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-amber-400 transition-transform ${isColonyDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <button
                type="button"
                onClick={onOpenCreateColony}
                className="px-2 py-1 text-amber-400 hover:text-amber-200 hover:bg-amber-950/60 rounded-xs border border-amber-600/70 text-[11px] font-serif uppercase tracking-wider font-bold flex items-center gap-1 transition-colors"
                title="Found New Colony"
                aria-label="Found New Colony"
                id="new-colony-quick-btn"
              >
                <Plus className="w-3.5 h-3.5" /> Found Colony
              </button>
            </div>

            {/* Dropdown Menu */}
            {isColonyDropdownOpen && (
              <div className="absolute left-0 mt-1.5 w-72 sm:w-80 bg-slate-900 border-2 border-amber-600/90 rounded-sm shadow-2xl z-50 overflow-hidden animate-in fade-in">
                <div className="px-3 py-2 bg-slate-950 border-b border-amber-900 text-[11px] font-mono text-amber-300 uppercase tracking-wider flex justify-between">
                  <span>Select Colony Ledger</span>
                  <span>{colonies.length} Total</span>
                </div>
                <div className="max-h-64 overflow-y-auto py-1">
                  {colonies.map((c) => {
                    const type = COLONY_TYPES[c.colonyType];
                    const isSelected = c.id === selectedColony.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          onSelectColony(c.id);
                          setIsColonyDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2.5 text-left text-xs flex items-center justify-between hover:bg-amber-950/60 transition-colors ${
                          isSelected ? 'bg-amber-950/80 border-l-4 border-amber-400 text-amber-100 font-semibold' : 'text-slate-200'
                        }`}
                      >
                        <div>
                          <div className="font-serif text-sm text-slate-100">{c.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {type?.displayName} • {c.starSystem}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                      </button>
                    );
                  })}
                </div>
                <div className="p-2 bg-slate-950/80 border-t border-amber-900">
                  <button
                    type="button"
                    onClick={() => {
                      setIsColonyDropdownOpen(false);
                      onOpenCreateColony();
                    }}
                    className="w-full py-1.5 px-3 bg-amber-900/60 hover:bg-amber-800 border border-amber-500/60 text-amber-100 text-xs font-mono uppercase tracking-wider rounded-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Establish New Colony
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Chronological Quick Advancer in Header */}
          {onAdvanceDays && (
            <div className="hidden lg:flex items-center gap-1 bg-slate-900 border border-amber-800/60 rounded-xs px-2 py-1">
              <Clock className="w-3.5 h-3.5 text-amber-400 mr-1" />
              <span className="text-[10px] font-mono uppercase text-slate-400 mr-1">Advance:</span>
              {[1, 5, 10].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => onAdvanceDays(amt)}
                  className="px-1.5 py-0.5 bg-slate-950 hover:bg-cyan-950 border border-cyan-800/80 hover:border-cyan-400 text-cyan-300 hover:text-cyan-100 rounded-xs font-mono text-[10px] transition-colors font-bold"
                  title={`Advance colony time by ${amt} day${amt > 1 ? 's' : ''}`}
                >
                  +{amt}d
                </button>
              ))}
            </div>
          )}

          {/* Theme Selector Button & Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs font-mono border transition-colors ${
                isThemeDropdownOpen
                  ? 'bg-amber-950 border-amber-400 text-amber-200'
                  : 'bg-slate-900 border-amber-700/80 text-amber-300 hover:bg-amber-950/50'
              }`}
              title="Change UI Theme"
              aria-label="Change UI Theme"
              id="theme-selector-btn"
            >
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Theme</span>
              <div 
                className="w-2.5 h-2.5 rounded-full border border-slate-700 ml-0.5 shadow-xs" 
                style={{ backgroundColor: currentThemeConfig.primaryColor }}
              />
              <ChevronDown className={`w-3 h-3 text-amber-400 transition-transform ${isThemeDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Theme Quick Dropdown */}
            {isThemeDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-64 bg-slate-900 border-2 border-amber-600/90 rounded-sm shadow-2xl z-50 p-2 space-y-1 animate-in fade-in">
                <div className="px-2 py-1 border-b border-slate-800 text-[10px] font-mono text-amber-400 uppercase tracking-widest flex items-center justify-between">
                  <span>Imperial Theme</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsThemeDropdownOpen(false);
                      onOpenThemeModal();
                    }}
                    className="text-[10px] text-cyan-400 hover:underline"
                  >
                    View All
                  </button>
                </div>
                {Object.values(APP_THEMES).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      onChangeTheme(t.id);
                      setIsThemeDropdownOpen(false);
                    }}
                    className={`w-full px-2.5 py-2 text-left rounded-xs text-xs font-serif flex items-center justify-between transition-colors ${
                      theme === t.id
                        ? 'bg-amber-950/80 border border-amber-600/80 text-amber-200 font-bold'
                        : 'text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full border border-slate-600"
                        style={{ backgroundColor: t.primaryColor }}
                      />
                      <span>{t.name}</span>
                    </div>
                    {theme === t.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Legibility / Accessibility Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsA11yMenuOpen(!isA11yMenuOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm text-xs font-mono border transition-colors ${
                isA11yMenuOpen || isDyslexiaFont || isHighContrast
                  ? 'bg-cyan-950 border-cyan-400 text-cyan-200'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-cyan-200 hover:border-cyan-700'
              }`}
              title="Accessibility & Legibility Controls"
              aria-label="Accessibility settings"
              id="a11y-settings-toggle"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden xl:inline">Legibility</span>
            </button>

            <AccessibilityMenu
              isOpen={isA11yMenuOpen}
              isDyslexiaFont={isDyslexiaFont}
              onToggleDyslexiaFont={onToggleDyslexiaFont}
              isHighContrast={isHighContrast}
              onToggleHighContrast={onToggleHighContrast}
              accessibilityPalette={accessibilityPalette}
              onChangePalette={onChangePalette}
              fontSize={fontSize}
              onChangeFontSize={onChangeFontSize}
            />
          </div>

          {/* User Profile Badge & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <button
              type="button"
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-red-300 hover:bg-red-950/40 rounded-sm border border-transparent hover:border-red-900 transition-colors"
              title="Close Terminal Session (Logout)"
              aria-label="Logout"
              id="logout-btn"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
};

