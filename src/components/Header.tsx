import React from "react";
import { Colony } from "../types/colony";
import { SelectColonyDropdown } from "./SelectColonyDropdown";
import { ThemeDropdown } from "./ThemeDropdown";
import { LegibilityPopover, OpticsSettings } from "./LegibilityPopover";
import {
  Compass,
  FileText,
  User,
  Layers,
  Plus,
  Clock,
  LogOut,
  Cpu,
} from "lucide-react";

export type ActiveTab =
  | "overview"
  | "details"
  | "representative"
  | "representatives"
  | "plans"
  | "infrastructure";

interface HeaderProps {
  colonies: Colony[];
  selectedColony: Colony | null;
  onSelectColony: (colony: Colony) => void;
  onOpenNewColony: () => void;
  onAdvanceDays?: (days: number) => void;
  activeTab: ActiveTab;
  onSelectTab: (tab: any) => void;
  currentTheme?: string;
  theme?: string;
  onSelectTheme?: (theme: string) => void;
  onChangeTheme?: (theme: any) => void;
  opticsSettings: any;
  onUpdateOptics?: (settings: any) => void;
  onUpdateOpticsSettings?: (settings: any) => void;
  userRole?: string;
  userName?: string;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  colonies,
  selectedColony,
  onSelectColony,
  onOpenNewColony,
  onAdvanceDays,
  activeTab,
  onSelectTab,
  currentTheme,
  theme = "theme-grimdark",
  onSelectTheme,
  onChangeTheme,
  opticsSettings,
  onUpdateOptics,
  onUpdateOpticsSettings,
  userRole = "colony_manager",
  userName = "Alexis Valancius",
  onLogout,
}) => {
  const effectiveTheme = currentTheme || theme;
  const effectiveThemeHandler = onSelectTheme || onChangeTheme || (() => {});
  const effectiveOpticsHandler = onUpdateOptics || onUpdateOpticsSettings || (() => {});

  const getRolePresentation = (role: string) => {
    const r = role.toLowerCase();
    if (r === "admin" || r.includes("admin") || r.includes("magos")) {
      return {
        label: "ARCH MAGOS",
        classes: "bg-[#f59e0b]/15 text-[#fcd34d] border-[#f59e0b]/40",
      };
    }
    if (r === "colony_manager" || r.includes("manager") || r.includes("captain")) {
      return {
        label: "LORD CAPTAIN",
        classes: "bg-[#38bdf8]/15 text-[#7dd3fc] border-[#38bdf8]/40",
      };
    }
    return {
      label: "SERVITOR",
      classes: "bg-[#64748b]/20 text-[#cbd5e1] border-[#64748b]/40",
    };
  };

  const roleInfo = getRolePresentation(userRole);
  return (
    <header className="border-b border-[#1f293d] bg-[#090d16] sticky top-0 z-40 shadow-xl">
      {/* Top Banner Row */}
      <div className="border-b border-[#162033] px-4 py-1.5 bg-[#060910] text-[11px] font-mono-slate flex items-center justify-between">
        <div className="flex items-center space-x-2 text-[#94a3b8]">
          <Cpu className="w-3.5 h-3.5 text-[#f59e0b]" />
          <span className="text-[#cbd5e1] font-bold tracking-wider uppercase">
            WARHAMMER 40,000 ROGUE TRADER
          </span>
          <span className="text-[#475569]">•</span>
          <span className="text-[#38bdf8] uppercase tracking-widest hidden sm:inline">
            IMPERIAL COLONY OVERSEER SYSTEM
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-[10px] text-[#10b981]">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
            <span className="font-semibold uppercase tracking-wider">COGITATOR ONLINE</span>
          </div>
          <span className="text-[#334155]">|</span>
          <div className="flex items-center space-x-1.5">
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded font-mono-slate uppercase font-bold border ${roleInfo.classes}`}
            >
              {roleInfo.label}
            </span>
            <span className="text-[10px] text-[#cbd5e1] font-mono-slate font-medium">
              {userName}
            </span>
          </div>
        </div>
      </div>

      {/* Main Header Controls Row */}
      <div className="px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Colony Selector & Quick Found */}
        <div className="flex flex-wrap items-center gap-2">
          <SelectColonyDropdown
            colonies={colonies}
            selectedColony={selectedColony}
            onSelectColony={onSelectColony}
            onOpenNewColony={onOpenNewColony}
          />

          <button
            id="header-found-colony-button"
            onClick={onOpenNewColony}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-[#121929] hover:bg-[#1a233a] border border-[#f59e0b]/60 hover:border-[#f59e0b] text-xs font-gothic font-bold tracking-wider text-[#fef08a] uppercase rounded transition"
          >
            <Plus className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span>Found Colony</span>
          </button>

          {/* Time Advance Controls */}
          {selectedColony && (
            <div className="flex items-center space-x-1 pl-2 border-l border-[#1f293d]">
              <div className="flex items-center space-x-1 text-[11px] font-mono-slate text-[#94a3b8] mr-1 hidden md:flex">
                <Clock className="w-3 h-3 text-[#38bdf8]" />
                <span>ADVANCE:</span>
              </div>
              <button
                id="header-advance-1d"
                onClick={() => onAdvanceDays(1)}
                className="px-2 py-1 bg-[#101726] hover:bg-[#19243c] border border-[#23314d] text-[11px] font-mono-slate text-[#38bdf8] rounded transition"
                title="Advance Colony Age by 1 Days"
              >
                +1d
              </button>
              <button
                id="header-advance-5d"
                onClick={() => onAdvanceDays(5)}
                className="px-2 py-1 bg-[#101726] hover:bg-[#19243c] border border-[#23314d] text-[11px] font-mono-slate text-[#38bdf8] rounded transition"
                title="Advance Colony Age by 5 Days"
              >
                +5d
              </button>
              <button
                id="header-advance-10d"
                onClick={() => onAdvanceDays(10)}
                className="px-2 py-1 bg-[#101726] hover:bg-[#19243c] border border-[#23314d] text-[11px] font-mono-slate text-[#38bdf8] rounded transition"
                title="Advance Colony Age by 10 Days"
              >
                +10d
              </button>
            </div>
          )}
        </div>

        {/* Right: Theme, Legibility, Logout */}
        <div className="flex items-center space-x-2">
          <ThemeDropdown
            currentTheme={effectiveTheme}
            onSelectTheme={effectiveThemeHandler}
          />
          <LegibilityPopover
            settings={opticsSettings}
            onUpdateSettings={effectiveOpticsHandler}
          />
          <button
            id="header-logout-button"
            onClick={onLogout}
            className="p-1.5 bg-[#121622] hover:bg-[#1c2233] border border-[#2c364d] text-[#94a3b8] hover:text-[#f87171] rounded transition"
            title="Relock Terminal (Logout)"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="px-4 flex space-x-1 border-t border-[#162033] overflow-x-auto scrollbar-none">
        <button
          id="nav-tab-overview"
          onClick={() => onSelectTab("overview")}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-gothic font-bold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
            activeTab === "overview"
              ? "border-[#f59e0b] text-[#fef08a] bg-[#f59e0b]/10"
              : "border-transparent text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#121828]"
          }`}
        >
          <Compass className="w-4 h-4 text-[#f59e0b]" />
          <span>At a Glance</span>
        </button>

        <button
          id="nav-tab-details"
          onClick={() => onSelectTab("details")}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-gothic font-bold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
            activeTab === "details"
              ? "border-[#f59e0b] text-[#fef08a] bg-[#f59e0b]/10"
              : "border-transparent text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#121828]"
          }`}
        >
          <FileText className="w-4 h-4 text-[#38bdf8]" />
          <span>Colony Details</span>
        </button>

        <button
          id="nav-tab-infrastructure"
          onClick={() => onSelectTab("infrastructure")}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-gothic font-bold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
            activeTab === "infrastructure" || activeTab === "plans"
              ? "border-[#f59e0b] text-[#fef08a] bg-[#f59e0b]/10"
              : "border-transparent text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#121828]"
          }`}
        >
          <Layers className="w-4 h-4 text-[#10b981]" />
          <span>Infrastructure & Plans</span>
        </button>

        <button
          id="nav-tab-representative"
          onClick={() => onSelectTab("representatives")}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-gothic font-bold uppercase tracking-wider transition border-b-2 whitespace-nowrap ${
            activeTab === "representative" || activeTab === "representatives"
              ? "border-[#f59e0b] text-[#fef08a] bg-[#f59e0b]/10"
              : "border-transparent text-[#94a3b8] hover:text-[#e2e8f0] hover:bg-[#121828]"
          }`}
        >
          <User className="w-4 h-4 text-[#a855f7]" />
          <span>Representative</span>
        </button>
      </div>
    </header>
  );
};
