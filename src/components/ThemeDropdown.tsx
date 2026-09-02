import React, { useState, useRef, useEffect } from "react";
import { Palette, Check, ChevronDown } from "lucide-react";

export interface ThemeOption {
  id: string;
  name: string;
  dotColor: string;
  bgClass: string;
}

export const THEMES: ThemeOption[] = [
  { id: "canonical", name: "Mechanicum Data-Slate (Canonical)", dotColor: "#b87333", bgClass: "theme-canonical" },
  { id: "dataslate", name: "Mechanicum Data-Slate", dotColor: "#f59e0b", bgClass: "theme-dataslate" },
  { id: "forge", name: "Omnissiah Shrine & Forge", dotColor: "#ea580c", bgClass: "theme-forge" },
  { id: "voidfarer", name: "Gothic Voidfarer", dotColor: "#0284c7", bgClass: "theme-voidfarer" },
  { id: "inquisition", name: "Inquisition Sanctum", dotColor: "#dc2626", bgClass: "theme-inquisition" },
  { id: "auspex", name: "Tactical Auspex", dotColor: "#16a34a", bgClass: "theme-auspex" },
  { id: "parchment", name: "Imperial Parchment", dotColor: "#d97706", bgClass: "theme-parchment" },
];

interface ThemeDropdownProps {
  currentTheme: string;
  onSelectTheme: (themeId: string) => void;
}

export const ThemeDropdown: React.FC<ThemeDropdownProps> = ({
  currentTheme,
  onSelectTheme,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeTheme = THEMES.find((t) => t.id === currentTheme) || THEMES[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <button
        id="theme-dropdown-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-[#121622] hover:bg-[#1a2133] border border-[#2c364d] text-xs font-mono-slate text-[#cbd5e1] rounded transition shadow-sm"
        title="Select Imperial Visual Theme"
      >
        <Palette className="w-3.5 h-3.5 text-[#f59e0b]" />
        <span>Theme</span>
        <span
          className="w-2.5 h-2.5 rounded-full inline-block"
          style={{ backgroundColor: activeTheme.dotColor }}
        />
        <ChevronDown className="w-3.5 h-3.5 text-[#94a3b8]" />
      </button>

      {isOpen && (
        <div
          id="theme-selection-menu"
          className="absolute right-0 mt-2 w-72 bg-[#0c101a] border border-[#f59e0b]/50 rounded shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-2 bg-[#121726] border-b border-[#252f44] flex items-center justify-between">
            <span className="font-gothic font-bold text-xs tracking-wider text-[#f59e0b] uppercase">
              Imperial Theme
            </span>
            <span className="text-[10px] text-[#94a3b8] font-mono-slate">View All</span>
          </div>

          <div className="py-1">
            {THEMES.map((theme) => {
              const isSelected = theme.id === currentTheme;
              return (
                <button
                  key={theme.id}
                  id={`theme-option-${theme.id}`}
                  onClick={() => {
                    onSelectTheme(theme.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs font-mono-slate transition ${
                    isSelected
                      ? "bg-[#f59e0b]/15 text-[#fcd34d] font-semibold"
                      : "text-[#cbd5e1] hover:bg-[#161d2e] hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span
                      className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                      style={{ backgroundColor: theme.dotColor }}
                    />
                    <span>{theme.name}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#f59e0b]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
