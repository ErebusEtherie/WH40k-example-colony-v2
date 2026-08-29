import React from 'react';
import { 
  Colony, 
  ColonyCalculations, 
  Representative 
} from '../../types';
import { 
  COLONY_TYPES, 
  HARD_INFRASTRUCTURE_RULES, 
  SUPPORT_UPGRADE_RULES 
} from '../../data/rulesReference';
import { formatColonyAge } from '../../utils/calculator';
import { StateBadge } from '../common/StateBadge';
import { OrnamentalFrame } from '../common/OrnamentalFrame';
import { 
  Building2, 
  Coins, 
  Calendar, 
  User, 
  ArrowRight, 
  Sparkles, 
  Gem, 
  Crosshair, 
  Flame
} from 'lucide-react';

interface AtAGlancePanelProps {
  colony: Colony;
  calculations: ColonyCalculations;
  representative: Representative | null;
  onNavigateToDetails: () => void;
  onNavigateToRepresentative: () => void;
  onNavigateToInfrastructure: () => void;
}

export const AtAGlancePanel: React.FC<AtAGlancePanelProps> = ({
  colony,
  calculations,
  representative,
  onNavigateToDetails,
  onNavigateToRepresentative,
  onNavigateToInfrastructure,
}) => {
  const colonyTypeInfo = COLONY_TYPES[colony.colonyType] || COLONY_TYPES.research_mission;
  const formattedAge = formatColonyAge(colony.ageDays);

  const stats = [
    {
      key: 'size',
      name: 'Colony Size',
      value: calculations.size.finalValue,
      label: calculations.sizeLoreLabel,
      subtext: '0–10 Settlement Rank',
      accent: 'border-cyan-500/70 text-cyan-300 bg-cyan-950/40',
      badge: null,
      icon: <Building2 className="w-5 h-5 text-cyan-400" />,
    },
    {
      key: 'complacency',
      name: 'Complacency',
      value: calculations.complacency.finalValue,
      label: calculations.complacency.loreLabel,
      subtext: 'Target: > Size for Placated (+1 PF)',
      accent: calculations.complacency.isCrisis
        ? 'border-red-500 text-red-300 bg-red-950/40'
        : calculations.complacency.isPositive
        ? 'border-emerald-500 text-emerald-300 bg-emerald-950/40'
        : 'border-slate-700 text-slate-300 bg-slate-900/60',
      badge: (
        <StateBadge
          stat="complacency"
          state={calculations.complacency.loreState}
          label={calculations.complacency.loreLabel}
          type={
            calculations.complacency.isCrisis
              ? 'crisis'
              : calculations.complacency.isPositive
              ? 'positive'
              : 'stable'
          }
          size="sm"
        />
      ),
      icon: <Sparkles className="w-5 h-5" />,
    },
    {
      key: 'order',
      name: 'Order',
      value: calculations.order.finalValue,
      label: calculations.order.loreLabel,
      subtext: 'Target: > Size for Orderly (+2 PF)',
      accent: calculations.order.isCrisis
        ? 'border-red-500 text-red-300 bg-red-950/40'
        : calculations.order.isPositive
        ? 'border-emerald-500 text-emerald-300 bg-emerald-950/40'
        : 'border-slate-700 text-slate-300 bg-slate-900/60',
      badge: (
        <StateBadge
          stat="order"
          state={calculations.order.loreState}
          label={calculations.order.loreLabel}
          type={
            calculations.order.isCrisis
              ? 'crisis'
              : calculations.order.isPositive
              ? 'positive'
              : 'stable'
          }
          size="sm"
        />
      ),
      icon: <Crosshair className="w-5 h-5" />,
    },
    {
      key: 'productivity',
      name: 'Productivity',
      value: calculations.productivity.finalValue,
      label: calculations.productivity.loreLabel,
      subtext: 'Target: > Size for Productive (+2 PF)',
      accent: calculations.productivity.isCrisis
        ? 'border-red-500 text-red-300 bg-red-950/40'
        : calculations.productivity.isPositive
        ? 'border-emerald-500 text-emerald-300 bg-emerald-950/40'
        : 'border-slate-700 text-slate-300 bg-slate-900/60',
      badge: (
        <StateBadge
          stat="productivity"
          state={calculations.productivity.loreState}
          label={calculations.productivity.loreLabel}
          type={
            calculations.productivity.isCrisis
              ? 'crisis'
              : calculations.productivity.isPositive
              ? 'positive'
              : 'stable'
          }
          size="sm"
        />
      ),
      icon: <Coins className="w-5 h-5" />,
    },
    {
      key: 'piety',
      name: 'Piety',
      value: calculations.piety.finalValue,
      label: calculations.piety.loreLabel,
      subtext: 'Target: > Size for Pious (Holy Favor)',
      accent: calculations.piety.isCrisis
        ? 'border-red-500 text-red-300 bg-red-950/40'
        : calculations.piety.isPositive
        ? 'border-emerald-500 text-emerald-300 bg-emerald-950/40'
        : 'border-slate-700 text-slate-300 bg-slate-900/60',
      badge: (
        <StateBadge
          stat="piety"
          state={calculations.piety.loreState}
          label={calculations.piety.loreLabel}
          type={
            calculations.piety.isCrisis
              ? 'crisis'
              : calculations.piety.isPositive
              ? 'positive'
              : 'stable'
          }
          size="sm"
        />
      ),
      icon: <Flame className="w-5 h-5" />,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Banner: Colony Identity & Core Ledger */}
      <OrnamentalFrame
        title="Colony Dossier"
        subtitle="Imperial Registry Data-Slate • Colony Overview"
        actions={
          <button
            onClick={onNavigateToDetails}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-900/80 hover:bg-cyan-800 border border-cyan-500/60 rounded-xs text-xs font-mono text-cyan-100 uppercase tracking-wider transition-colors"
          >
            Audit Modifiers & Edit <ArrowRight className="w-3.5 h-3.5" />
          </button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Colony Identity */}
          <div className="space-y-1 bg-slate-950/60 border border-slate-800 p-3 rounded-xs">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              Colony Designation
            </span>
            <div className="font-serif text-lg font-bold text-slate-100 uppercase">
              {colony.name}
            </div>
            <div className="text-xs font-mono text-cyan-300 flex items-center gap-1">
              <span>{colony.starSystem}</span>
            </div>
          </div>

          {/* Colony Type & Specialty */}
          <div className="space-y-1 bg-slate-950/60 border border-slate-800 p-3 rounded-xs">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              Colony Charter Type
            </span>
            <div className="font-serif text-base font-bold text-cyan-200">
              {colonyTypeInfo.displayName}
            </div>
            <div className="text-[11px] text-slate-400 line-clamp-2">
              {colonyTypeInfo.specialEffect.tag}
            </div>
          </div>

          {/* Founder & Founding Age */}
          <div className="space-y-1 bg-slate-950/60 border border-slate-800 p-3 rounded-xs">
            <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              Founder & Founding Age
            </span>
            <div className="font-mono text-sm font-semibold text-slate-200">
              {colony.founder}
            </div>
            <div className="text-xs font-mono text-amber-300 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>{formattedAge} ({colony.ageDays} standard days)</span>
            </div>
          </div>

          {/* Current Representative */}
          <div className="space-y-1 bg-slate-950/60 border border-slate-800 p-3 rounded-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                Current Representative
              </span>
              <div className="font-mono text-sm font-bold text-slate-100">
                {representative ? representative.name : '— Unassigned —'}
              </div>
            </div>
            {representative ? (
              <button
                onClick={onNavigateToRepresentative}
                className="text-[11px] font-mono text-cyan-400 hover:text-cyan-200 flex items-center gap-1 self-start underline decoration-cyan-700 underline-offset-2"
              >
                <User className="w-3 h-3" /> View Character Sheet
              </button>
            ) : (
              <button
                onClick={onNavigateToDetails}
                className="text-[11px] font-mono text-amber-400 hover:text-amber-200 flex items-center gap-1 self-start"
              >
                + Appoint Representative
              </button>
            )}
          </div>

        </div>

        {/* Active Colony State Badges (Consolidated Active Lore States) */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              Colony Condition:
            </span>
            <div className="flex flex-wrap gap-2">
              {calculations.activeStateBadges.map((b) => (
                <StateBadge
                  key={b.stat}
                  stat={b.stat}
                  state={b.state}
                  label={b.label}
                  type={b.type}
                  showStatPrefix={true}
                  size="md"
                />
              ))}
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400">
            {colony.description && (
              <span className="italic">"{colony.description}"</span>
            )}
          </div>
        </div>
      </OrnamentalFrame>

      {/* Primary Characteristic Cards (Mechanicus Discipline Grid Style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        
        {/* Core Stats */}
        {stats.map((s) => (
          <div
            key={s.key}
            className={`p-4 rounded-sm border ${s.accent} transition-all duration-150 flex flex-col justify-between`}
          >
            <div>
              <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider opacity-80 mb-2">
                <span>{s.name}</span>
                {s.icon}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif font-black tracking-tight text-slate-100">
                  {s.value}
                </span>
                <span className="text-xs font-mono uppercase text-slate-300 truncate">
                  {s.label}
                </span>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/80 flex flex-col gap-1">
              {s.badge}
              <span className="text-[10px] font-mono text-slate-400">
                {s.subtext}
              </span>
            </div>
          </div>
        ))}

        {/* Profit Factor Hero Block */}
        <div className="p-4 rounded-sm border-2 border-amber-500/80 bg-gradient-to-br from-amber-950/50 via-slate-900 to-slate-950 text-amber-200 shadow-md shadow-amber-950/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-amber-400 mb-1">
              <span>Profit Factor</span>
              <Gem className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
              Total Generation
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-4xl font-serif font-black tracking-tight text-amber-300">
                +{calculations.profitFactor.total}
              </span>
              <span className="text-xs font-mono text-amber-400">
                PF
              </span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-amber-800/40 text-[10px] font-mono text-slate-300 space-y-0.5">
            <div>Base from Size {calculations.size.finalValue}: +{calculations.profitFactor.baseFromSize} PF</div>
            {calculations.profitFactor.stateBonuses.length > 0 && (
              <div className="text-emerald-400">
                +{calculations.profitFactor.stateBonuses.reduce((acc, b) => acc + b.value, 0)} PF active state bonuses
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Row: Quick Glance at Infrastructure & Planetary Wealth */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Infrastructure Status Quick-List */}
        <OrnamentalFrame
          title="Infrastructure Systems"
          subtitle={`${colony.hardInfrastructure.length} Hard Systems • ${colony.supportUpgrades.length} Support Upgrades`}
          actions={
            <button
              onClick={onNavigateToInfrastructure}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-200 flex items-center gap-1"
            >
              Manage Systems <ArrowRight className="w-3 h-3" />
            </button>
          }
        >
          <div className="space-y-3">
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">
                Hard Infrastructure
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {colony.hardInfrastructure.map((h) => {
                  const rule = HARD_INFRASTRUCTURE_RULES[h.type];
                  return (
                    <div
                      key={h.id}
                      className="p-2 bg-slate-950 border border-slate-800 rounded-xs flex items-center justify-between text-xs font-mono"
                    >
                      <span className="text-slate-200 font-serif truncate max-w-[140px]">
                        {rule?.displayName || h.type}
                      </span>
                      <span
                        className={`text-[10px] uppercase px-1.5 py-0.5 rounded-xs font-bold ${
                          h.status === 'working'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : h.status === 'not_working'
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : h.status === 'needed'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {h.status.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block">
                Installed Support Upgrades ({colony.supportUpgrades.length} / Max {calculations.size.finalValue})
              </span>
              {colony.supportUpgrades.length === 0 ? (
                <p className="text-xs font-mono text-slate-500 italic">No support upgrades commissioned.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {colony.supportUpgrades.map((u) => {
                    const rule = SUPPORT_UPGRADE_RULES[u.type];
                    return (
                      <span
                        key={u.id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-slate-950 border border-cyan-900/60 rounded-xs text-xs font-mono text-cyan-200"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        {rule?.displayName || u.name}
                        <span className="text-[10px] text-slate-400">({u.status})</span>
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </OrnamentalFrame>

        {/* Planetary Resources Quick-List */}
        <OrnamentalFrame
          title="Planetary Natural Resources"
          subtitle={`${colony.planetaryResources.length} Surveyed Resource Deposits`}
          actions={
            <button
              onClick={onNavigateToDetails}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-200 flex items-center gap-1"
            >
              Survey Deposits <ArrowRight className="w-3 h-3" />
            </button>
          }
        >
          {colony.planetaryResources.length === 0 ? (
            <p className="text-xs font-mono text-slate-500 italic p-3 bg-slate-950 border border-slate-800">
              No planetary resources logged. Add deposits via Colony Details.
            </p>
          ) : (
            <div className="space-y-2">
              {colony.planetaryResources.map((res) => (
                <div
                  key={res.id}
                  className="p-2.5 bg-slate-950 border border-slate-800 rounded-xs flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <div className="font-serif font-bold text-slate-200 text-sm">
                      {res.name}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {res.type} {res.subtype ? `• ${res.subtype}` : ''}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-cyan-950 border border-cyan-700/60 text-cyan-300 rounded-xs text-[11px] font-bold">
                      {res.abundance}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </OrnamentalFrame>

      </div>

    </div>
  );
};
