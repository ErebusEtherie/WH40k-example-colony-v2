import React, { useState, useRef, useEffect } from "react";
import { Eye, Check, X } from "lucide-react";

export interface OpticsSettings {
  dyslexicFont: boolean;
  highContrast: boolean;
  colorBlindMode: "default" | "monochrome" | "deuteranopia" | "tritanopia";
  displayScale: "100" | "115" | "130";
}

interface LegibilityPopoverProps {
  settings: OpticsSettings;
  onUpdateSettings: (newSettings: Partial<OpticsSettings>) => void;
}

export const LegibilityPopover: React.FC<LegibilityPopoverProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
        id="legibility-popover-trigger"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-1.5 px-2.5 py-1.5 border text-xs font-mono-slate rounded transition shadow-sm ${
          settings.dyslexicFont || settings.highContrast || settings.colorBlindMode !== "default" || settings.displayScale !== "100"
            ? "bg-[#00d4ff]/15 text-[#38bdf8] border-[#00d4ff]/60"
            : "bg-[#121622] text-[#94a3b8] hover:text-[#e2e8f0] border-[#2c364d] hover:bg-[#1a2133]"
        }`}
        title="Optics & Legibility Controls"
      >
        <Eye className="w-3.5 h-3.5 text-[#38bdf8]" />
        <span>Legibility</span>
      </button>

      {isOpen && (
        <div
          id="legibility-controls-menu"
          className="absolute right-0 mt-2 w-80 bg-[#0c101a] border border-[#00d4ff]/50 rounded shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Header */}
          <div className="px-3 py-2 bg-[#101726] border-b border-[#1f2b42] flex items-center justify-between">
            <div>
              <span className="font-gothic font-bold text-xs tracking-wider text-[#38bdf8] uppercase block">
                Accessibility & Optics
              </span>
              <span className="text-[10px] text-[#64748b] font-mono-slate">
                WCAG AA Compliant Display Tuning
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#64748b] hover:text-white p-0.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 space-y-3.5 font-mono-slate text-xs">
            {/* Dyslexic Font Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[#e2e8f0] font-medium block">Dyslexia-Optimized Font</span>
                <span className="text-[10px] text-[#94a3b8]">Enhanced tracking & glyph clarity</span>
              </div>
              <button
                id="toggle-dyslexic-font"
                onClick={() => onUpdateSettings({ dyslexicFont: !settings.dyslexicFont })}
                className={`w-10 h-5 rounded-full p-0.5 transition ${
                  settings.dyslexicFont ? "bg-[#38bdf8]" : "bg-[#252f44]"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.dyslexicFont ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* High-Contrast Boost */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[#e2e8f0] font-medium block">High-Contrast Boost</span>
                <span className="text-[10px] text-[#94a3b8]">Sharper border lines & contrast ratio</span>
              </div>
              <button
                id="toggle-high-contrast"
                onClick={() => onUpdateSettings({ highContrast: !settings.highContrast })}
                className={`w-10 h-5 rounded-full p-0.5 transition ${
                  settings.highContrast ? "bg-[#f59e0b]" : "bg-[#252f44]"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.highContrast ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Color Blind Profile */}
            <div>
              <span className="text-[#e2e8f0] font-medium block mb-1.5">Color-Blind Palette Profile</span>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: "default", label: "Default" },
                  { id: "monochrome", label: "Monochrome" },
                  { id: "deuteranopia", label: "Deuter/Prot" },
                  { id: "tritanopia", label: "Tritanopia" },
                ].map((profile) => (
                  <button
                    key={profile.id}
                    id={`cb-profile-${profile.id}`}
                    onClick={() =>
                      onUpdateSettings({
                        colorBlindMode: profile.id as OpticsSettings["colorBlindMode"],
                      })
                    }
                    className={`px-2 py-1.5 text-center text-[11px] rounded border transition ${
                      settings.colorBlindMode === profile.id
                        ? "bg-[#38bdf8]/20 border-[#38bdf8] text-[#38bdf8] font-bold"
                        : "bg-[#141b2a] border-[#252f44] text-[#94a3b8] hover:text-white"
                    }`}
                  >
                    {profile.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Scale */}
            <div>
              <span className="text-[#e2e8f0] font-medium block mb-1.5">Display Scale</span>
              <div className="flex space-x-1.5">
                {[
                  { id: "100", label: "100%" },
                  { id: "115", label: "115%" },
                  { id: "130", label: "130%" },
                ].map((scale) => (
                  <button
                    key={scale.id}
                    id={`scale-${scale.id}`}
                    onClick={() =>
                      onUpdateSettings({
                        displayScale: scale.id as OpticsSettings["displayScale"],
                      })
                    }
                    className={`flex-1 py-1 text-center text-[11px] rounded border transition ${
                      settings.displayScale === scale.id
                        ? "bg-[#f59e0b]/20 border-[#f59e0b] text-[#fcd34d] font-bold"
                        : "bg-[#141b2a] border-[#252f44] text-[#94a3b8] hover:text-white"
                    }`}
                  >
                    {scale.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
