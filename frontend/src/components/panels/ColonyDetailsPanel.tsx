import React, { useState } from 'react';
import { 
  Colony, 
  ColonyCalculations, 
  ModifierItem, 
  PlanetaryResource, 
  Representative, 
  StatName 
} from '../../types';
import { 
  COLONY_TYPES, 
  PERSONALITY_RULES, 
  REPRESENTATIVE_TYPES 
} from '../../data/rulesReference';
import { formatColonyAge } from '../../utils/calculator';
import { OrnamentalFrame } from '../common/OrnamentalFrame';
import { 
  Building2, 
  Calendar, 
  Plus, 
  Trash2, 
  Edit3, 
  UserCheck, 
  ArrowRight, 
  Sparkles, 
  Check, 
  X, 
  Coins, 
  Crosshair, 
  Flame, 
  Gem,
  Info
} from 'lucide-react';

interface ColonyDetailsPanelProps {
  colony: Colony;
  calculations: ColonyCalculations;
  representative: Representative | null;
  onUpdateColony: (updated: Partial<Colony>) => void;
  onOpenAddCustomModifier: () => void;
  onOpenChangeRepresentative: () => void;
  onNavigateToRepresentative: () => void;
  onNavigateToInfrastructure: () => void;
}

export const ColonyDetailsPanel: React.FC<ColonyDetailsPanelProps> = ({
  colony,
  calculations,
  representative,
  onUpdateColony,
  onOpenAddCustomModifier,
  onOpenChangeRepresentative,
  onNavigateToRepresentative,
  onNavigateToInfrastructure,
}) => {
  // Editing state for basic fields
  const [isEditingBasics, setIsEditingBasics] = useState(false);
  const [nameInput, setNameInput] = useState(colony.name);
  const [starSystemInput, setStarSystemInput] = useState(colony.starSystem);
  const [founderInput, setFounderInput] = useState(colony.founder);
  const [descInput, setDescInput] = useState(colony.description || '');

  // Age Incrementer state
  const [customDaysAdd, setCustomDaysAdd] = useState<number>(30);

  // New Planetary Resource form state
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [resName, setResName] = useState('');
  const [resType, setResType] = useState('Mineral Resources');
  const [resSubtype, setResSubtype] = useState('');
  const [resAbundance, setResAbundance] = useState<'Scarce' | 'Moderate' | 'Plentiful' | 'Abundant' | 'Rich'>('Plentiful');
  const [resNotes, setResNotes] = useState('');

  const colonyTypeInfo = COLONY_TYPES[colony.colonyType] || COLONY_TYPES.research_mission;
  const repTypeInfo = representative ? REPRESENTATIVE_TYPES[representative.type] : null;

  const handleSaveBasics = () => {
    onUpdateColony({
      name: nameInput.trim() || colony.name,
      starSystem: starSystemInput.trim() || colony.starSystem,
      founder: founderInput.trim() || colony.founder,
      description: descInput.trim(),
    });
    setIsEditingBasics(false);
  };

  const handleAddDays = (days: number) => {
    onUpdateColony({
      ageDays: Math.max(0, colony.ageDays + days),
    });
  };

  const handleToggleModifierActive = (modId: string) => {
    const updated = colony.customModifiers.map((m) => {
      if (m.id === modId) {
        return { ...m, isActive: !m.isActive };
      }
      return m;
    });
    onUpdateColony({ customModifiers: updated });
  };

  const handleDeleteModifier = (modId: string) => {
    const updated = colony.customModifiers.filter((m) => m.id !== modId);
    onUpdateColony({ customModifiers: updated });
  };

  const handleCreateResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resName.trim()) return;

    const newRes: PlanetaryResource = {
      id: `res_${Date.now()}`,
      name: resName.trim(),
      type: resType,
      subtype: resSubtype.trim() || undefined,
      abundance: resAbundance,
      notes: resNotes.trim() || undefined,
    };

    onUpdateColony({
      planetaryResources: [...colony.planetaryResources, newRes],
    });

    setResName('');
    setResSubtype('');
    setResNotes('');
    setIsAddingResource(false);
  };

  const handleDeleteResource = (resId: string) => {
    onUpdateColony({
      planetaryResources: colony.planetaryResources.filter((r) => r.id !== resId),
    });
  };

  // Helper for rendering transparent stat breakdown box
  const renderModifierBreakdown = (
    statName: StatName,
    title: string,
    calcData: {
      baseValue: number;
      modifiers: ModifierItem[];
      total: number;
      finalValue: number;
      loreState: string;
      loreLabel: string;
      isCrisis: boolean;
      isPositive: boolean;
    },
    icon: React.ReactNode
  ) => {
    const perms = calcData.modifiers.filter((m) => m.category === 'permanent');
    const conds = calcData.modifiers.filter((m) => m.category === 'conditional');
    const customs = calcData.modifiers.filter((m) => m.category === 'custom');

    return (
      <div className="bg-slate-950 border border-slate-800 rounded-sm p-4 flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-slate-900 border border-slate-800 text-cyan-400">
                {icon}
              </span>
              <div>
                <h4 className="font-serif font-bold text-sm text-slate-100 uppercase tracking-wide">
                  {title}
                </h4>
                <div className="text-[10px] font-mono text-slate-400">
                  Lore State: <span className="font-bold text-cyan-300">{calcData.loreLabel}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-serif font-black text-slate-100">
                {calcData.finalValue}
              </div>
              <span className="text-[10px] font-mono text-slate-400">Final Clamped</span>
            </div>
          </div>

          {/* Breakdown Items List */}
          <div className="space-y-1.5 text-xs font-mono">
            
            {/* Base */}
            <div className="flex justify-between items-center text-slate-300 py-0.5 border-b border-slate-900">
              <span className="text-slate-400">Base ({colonyTypeInfo.displayName}):</span>
              <span className="font-bold text-slate-200">+{calcData.baseValue}</span>
            </div>

            {/* Permanent Modifiers */}
            {perms.map((m) => (
              <div key={m.id} className="flex justify-between items-start text-[11px] text-cyan-300/90 py-0.5">
                <span className="pr-2 leading-tight">
                  <span className="text-slate-400">[Perm]</span> {m.name}
                  <span className="block text-[10px] text-slate-500">{m.source}</span>
                </span>
                <span className={`font-bold shrink-0 ${m.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {m.value >= 0 ? `+${m.value}` : m.value}
                </span>
              </div>
            ))}

            {/* Conditional Modifiers */}
            {conds.map((m) => (
              <div key={m.id} className="flex justify-between items-start text-[11px] text-amber-300/90 py-0.5">
                <span className="pr-2 leading-tight">
                  <span className="text-slate-400">[Cond]</span> {m.name}
                  <span className="block text-[10px] text-slate-500">{m.source}</span>
                </span>
                <span className={`font-bold shrink-0 ${m.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {m.value >= 0 ? `+${m.value}` : m.value}
                </span>
              </div>
            ))}

            {/* Custom Active Modifiers */}
            {customs.map((m) => (
              <div key={m.id} className="flex justify-between items-start text-[11px] text-purple-300/90 py-0.5">
                <span className="pr-2 leading-tight">
                  <span className="text-slate-400">[Custom]</span> {m.name}
                  <span className="block text-[10px] text-slate-500">{m.source}</span>
                </span>
                <span className={`font-bold shrink-0 ${m.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {m.value >= 0 ? `+${m.value}` : m.value}
                </span>
              </div>
            ))}

            {calcData.modifiers.length === 0 && (
              <div className="text-[11px] text-slate-500 italic py-1">
                No active external modifiers.
              </div>
            )}
          </div>
        </div>

        {/* Sum footer */}
        <div className="mt-3 pt-2 border-t-2 border-slate-800 flex justify-between items-center text-xs font-mono font-bold">
          <span className="text-slate-400 uppercase">Calculated Total:</span>
          <span className="text-cyan-200">{calcData.total}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Editable Administrative Registry Panel */}
      <OrnamentalFrame
        title="Colony Administrative Record"
        subtitle="Modify colony charter parameters or increment age cycle"
        actions={
          !isEditingBasics ? (
            <button
              onClick={() => setIsEditingBasics(true)}
              className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xs text-xs font-mono text-cyan-200 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit Charter
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveBasics}
                className="flex items-center gap-1 px-3 py-1 bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-500 text-emerald-100 text-xs font-mono rounded-xs transition-colors"
              >
                <Check className="w-3.5 h-3.5" /> Save
              </button>
              <button
                onClick={() => setIsEditingBasics(false)}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 text-xs font-mono rounded-xs transition-colors"
              >
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          )
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Colony Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              Colony Designation {isEditingBasics && <span className="text-red-400">*</span>}
            </label>
            {!isEditingBasics ? (
              <div className="font-serif text-base font-bold text-slate-100 uppercase">
                {colony.name}
              </div>
            ) : (
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full bg-slate-950 border border-cyan-700 rounded-xs px-2 py-1 text-sm text-slate-100 font-serif focus:outline-hidden focus:ring-1 focus:ring-cyan-400"
              />
            )}
          </div>

          {/* Star System */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              Star System / Sector {isEditingBasics && <span className="text-red-400">*</span>}
            </label>
            {!isEditingBasics ? (
              <div className="font-mono text-sm text-cyan-300">
                {colony.starSystem}
              </div>
            ) : (
              <input
                type="text"
                value={starSystemInput}
                onChange={(e) => setStarSystemInput(e.target.value)}
                className="w-full bg-slate-950 border border-cyan-700 rounded-xs px-2 py-1 text-sm text-slate-100 font-mono focus:outline-hidden focus:ring-1 focus:ring-cyan-400"
              />
            )}
          </div>

          {/* Founder */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
              Colony Founder {isEditingBasics && <span className="text-red-400">*</span>}
            </label>
            {!isEditingBasics ? (
              <div className="font-mono text-sm font-semibold text-slate-200">
                {colony.founder}
              </div>
            ) : (
              <input
                type="text"
                value={founderInput}
                onChange={(e) => setFounderInput(e.target.value)}
                className="w-full bg-slate-950 border border-cyan-700 rounded-xs px-2 py-1 text-sm text-slate-100 font-mono focus:outline-hidden focus:ring-1 focus:ring-cyan-400"
              />
            )}
          </div>

          {/* Colony Charter Type (Read-only per game rules) */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1">
              Colony Type <span className="text-[9px] text-slate-500">(Fixed at Charter)</span>
            </label>
            <div className="font-serif text-sm font-bold text-amber-300">
              {colonyTypeInfo.displayName}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Initial Invest: {colonyTypeInfo.initialInvestmentPf} PF
            </div>
          </div>

        </div>

        {/* Description field */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <label className="text-[10px] font-mono uppercase text-slate-400 tracking-wider block mb-1">
            Imperial Records & Description
          </label>
          {!isEditingBasics ? (
            <p className="text-xs font-mono text-slate-300 italic">
              {colony.description || 'No descriptive record entered in data-slate.'}
            </p>
          ) : (
            <textarea
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              rows={2}
              className="w-full bg-slate-950 border border-cyan-700 rounded-xs p-2 text-xs text-slate-200 font-mono focus:outline-hidden focus:ring-1 focus:ring-cyan-400"
            />
          )}
        </div>

        {/* Age Incrementer Control Bar (+N Days) */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950/60 p-3 rounded-xs border border-cyan-950">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <div className="text-xs font-mono text-slate-300">
                Founding Chronometer: <span className="font-bold text-amber-300">{colony.ageDays} standard days</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Formatted: {formatColonyAge(colony.ageDays)}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono uppercase text-slate-400">Advance Age:</span>
            {[1, 5, 10].map((amt) => (
              <button
                key={amt}
                onClick={() => handleAddDays(amt)}
                className="px-2.5 py-1 bg-slate-900 hover:bg-cyan-900/60 border border-cyan-800 text-cyan-200 text-xs font-mono rounded-xs transition-colors"
                title={`Advance colony age by ${amt} standard days`}
              >
                +{amt}d
              </button>
            ))}
            <div className="flex items-center gap-1 pl-2 border-l border-slate-800">
              <input
                type="number"
                min="1"
                max="9999"
                value={customDaysAdd}
                onChange={(e) => setCustomDaysAdd(parseInt(e.target.value) || 1)}
                className="w-16 bg-slate-950 border border-slate-700 rounded-xs px-2 py-0.5 text-xs text-slate-100 font-mono text-center"
              />
              <button
                onClick={() => handleAddDays(customDaysAdd)}
                className="px-2 py-1 bg-cyan-950 hover:bg-cyan-900 border border-cyan-600 text-cyan-100 text-xs font-mono uppercase rounded-xs"
              >
                +Add
              </button>
            </div>
          </div>
        </div>
      </OrnamentalFrame>

      {/* Representative Summary & Reassignment Block */}
      <OrnamentalFrame
        title="Colony Representative Summary"
        subtitle="Appointed Rogue Trader Representative"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenChangeRepresentative}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/70 text-amber-200 text-xs font-mono uppercase rounded-xs transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" /> Reassign Representative
            </button>
            {representative && (
              <button
                onClick={onNavigateToRepresentative}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-200 text-xs font-mono uppercase rounded-xs transition-colors"
              >
                Full Sheet <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        }
      >
        {representative ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950 p-4 border border-slate-800 rounded-xs">
              
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Name & Role</span>
                <div className="font-serif text-base font-bold text-slate-100">
                  {representative.name}
                </div>
                <div className="text-xs font-mono text-cyan-300 mt-0.5">
                  {repTypeInfo?.displayName}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Special Mechanics</span>
                <div className="text-xs font-mono text-slate-200 mt-1">
                  {repTypeInfo?.lossMitigationDescription || 'None'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {repTypeInfo?.specialRule}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Characteristics</span>
                <div className="text-xs font-mono text-slate-300 mt-1 space-x-2">
                  <span>WS: {representative.characteristics.ws}</span>
                  <span>BS: {representative.characteristics.bs}</span>
                  <span>Int: {representative.characteristics.int}</span>
                  <span className="text-cyan-300 font-bold">Fel: {representative.characteristics.fel}</span>
                </div>
              </div>

            </div>

            {/* Personalities Table */}
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2 block">
                Applied Personality Traits ({representative.personalities.length})
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {representative.personalities.map((p, idx) => {
                  const pRule = PERSONALITY_RULES[p.personalityKey];
                  return (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-950 border border-slate-800 rounded-xs text-xs font-mono flex flex-col justify-between"
                    >
                      <div>
                        <div className="font-serif font-bold text-cyan-200">
                          {pRule?.displayName || p.personalityKey}
                          {p.chosenStat && (
                            <span className="text-xs font-mono text-amber-300 ml-1">
                              ({p.chosenStat.toUpperCase()})
                            </span>
                          )}
                          {p.madOrderRoll && (
                            <span className="text-xs font-mono text-red-300 ml-1">
                              (Order roll: -{p.madOrderRoll})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {pRule?.description}
                        </div>
                      </div>
                      <div className="mt-2 pt-1 border-t border-slate-900 text-cyan-300 font-bold text-[11px]">
                        Effect: {pRule?.statEffectsText}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-slate-950 border border-amber-900/60 rounded-xs text-center space-y-3">
            <Info className="w-8 h-8 text-amber-400 mx-auto" />
            <div>
              <h4 className="font-serif font-bold text-slate-200">No Representative Assigned</h4>
              <p className="text-xs font-mono text-slate-400 max-w-md mx-auto mt-1">
                Colony is currently governed without an appointed Representative. Personality bonuses and loss mitigation are not active.
              </p>
            </div>
            <button
              onClick={onOpenChangeRepresentative}
              className="px-4 py-2 bg-amber-900 hover:bg-amber-800 border border-amber-500 text-amber-100 text-xs font-mono uppercase tracking-wider rounded-xs inline-flex items-center gap-2"
            >
              <UserCheck className="w-4 h-4" /> Appoint Representative Now
            </button>
          </div>
        )}
      </OrnamentalFrame>

      {/* Comprehensive Modifier Breakdowns (Audit View) */}
      <OrnamentalFrame
        title="Colony Characteristics Modifier Audit"
        subtitle="Transparent breakdown of Base, Permanent, Conditional, and Custom modifiers for all 6 stats"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Complacency */}
          {renderModifierBreakdown('complacency', 'Complacency', calculations.complacency, <Sparkles className="w-4 h-4" />)}

          {/* Order */}
          {renderModifierBreakdown('order', 'Order', calculations.order, <Crosshair className="w-4 h-4" />)}

          {/* Productivity */}
          {renderModifierBreakdown('productivity', 'Productivity', calculations.productivity, <Coins className="w-4 h-4" />)}

          {/* Piety */}
          {renderModifierBreakdown('piety', 'Piety', calculations.piety, <Flame className="w-4 h-4" />)}

          {/* Size (0-10) */}
          {renderModifierBreakdown('size', 'Colony Size (Capped 0–10)', calculations.size, <Building2 className="w-4 h-4" />)}

          {/* Profit Factor */}
          <div className="bg-slate-950 border-2 border-amber-700/60 rounded-sm p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-amber-900/60 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-amber-950 border border-amber-800 text-amber-400">
                    <Gem className="w-4 h-4" />
                  </span>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-amber-200 uppercase tracking-wide">
                      Profit Factor
                    </h4>
                    <div className="text-[10px] font-mono text-slate-400">
                      Dynasty Revenue Yield
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-serif font-black text-amber-300">
                    +{calculations.profitFactor.total} PF
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">Calculated Yield</span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between items-center text-slate-300 py-0.5 border-b border-slate-900">
                  <span className="text-slate-400">Base from Size {calculations.size.finalValue} ({calculations.size.loreLabel}):</span>
                  <span className="font-bold text-amber-300">+{calculations.profitFactor.baseFromSize} PF</span>
                </div>

                {calculations.profitFactor.stateBonuses.map((b, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[11px] text-emerald-300 py-0.5">
                    <span>[State Bonus] {b.name}:</span>
                    <span className="font-bold">+{b.value} PF</span>
                  </div>
                ))}

                {calculations.profitFactor.modifiers.map((m) => (
                  <div key={m.id} className="flex justify-between items-center text-[11px] text-purple-300 py-0.5">
                    <span>[Custom] {m.name}:</span>
                    <span className="font-bold">+{m.value} PF</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 pt-2 border-t-2 border-amber-900/60 flex justify-between items-center text-xs font-mono font-bold">
              <span className="text-slate-400 uppercase">Total Dynasty Contribution:</span>
              <span className="text-amber-300">+{calculations.profitFactor.total} PF</span>
            </div>
          </div>

        </div>
      </OrnamentalFrame>

      {/* Custom Modifiers Management (Add Custom Modifier Dialog Entry Point) */}
      <OrnamentalFrame
        title="Custom GM Modifiers Management"
        subtitle="Physical tabletop event outcomes and custom situational bonuses/penalties"
        actions={
          <button
            onClick={onOpenAddCustomModifier}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-900/80 hover:bg-cyan-800 border border-cyan-500 text-cyan-100 text-xs font-mono uppercase tracking-wider rounded-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Custom Modifier
          </button>
        }
      >
        {colony.customModifiers.length === 0 ? (
          <div className="p-4 bg-slate-950 border border-slate-800 text-center text-xs font-mono text-slate-500 italic rounded-xs">
            No custom modifiers recorded for this colony. Use "+ Add Custom Modifier" to enter tabletop outcomes.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Modifier Name</th>
                  <th className="p-2.5">Target Stat</th>
                  <th className="p-2.5">Value</th>
                  <th className="p-2.5">Source & Details</th>
                  <th className="p-2.5">Date Logged</th>
                  <th className="p-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {colony.customModifiers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="p-2.5">
                      <button
                        onClick={() => handleToggleModifierActive(m.id)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-bold uppercase transition-colors ${
                          m.isActive
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                            : 'bg-slate-900 text-slate-500 border border-slate-800'
                        }`}
                        title="Toggle active status"
                      >
                        {m.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="p-2.5 font-serif font-bold text-slate-100">
                      {m.name}
                    </td>
                    <td className="p-2.5 uppercase font-semibold text-cyan-300">
                      {m.stat.replace('_', ' ')}
                    </td>
                    <td className="p-2.5">
                      <span className={`px-1.5 py-0.5 rounded-xs font-bold ${m.value > 0 ? 'text-emerald-400 bg-emerald-950' : 'text-red-400 bg-red-950'}`}>
                        {m.value > 0 ? `+${m.value}` : m.value}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-300">
                      <div>{m.source}</div>
                      {m.notes && <div className="text-[10px] text-slate-500 italic">{m.notes}</div>}
                    </td>
                    <td className="p-2.5 text-[11px] text-slate-400">
                      {m.dateApplied ? new Date(m.dateApplied).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        onClick={() => handleDeleteModifier(m.id)}
                        className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-950/60 rounded-xs transition-colors"
                        title="Delete custom modifier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </OrnamentalFrame>

      {/* Planetary Resources Section */}
      <OrnamentalFrame
        title="Planetary Resources Survey"
        subtitle="Natural resources, minerals, and archeotech exploited by the colony"
        actions={
          <button
            onClick={() => setIsAddingResource(!isAddingResource)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-200 text-xs font-mono uppercase rounded-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Log Deposit
          </button>
        }
      >
        {isAddingResource && (
          <form onSubmit={handleCreateResource} className="p-4 bg-slate-950 border border-cyan-800/80 rounded-xs mb-4 space-y-3">
            <h4 className="font-serif font-bold text-xs uppercase text-cyan-200">
              Add Surveyed Resource Deposit
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <label className="text-[10px] uppercase text-slate-400 block mb-1">Resource Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Promethium Geysers"
                  value={resName}
                  onChange={(e) => setResName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xs px-2 py-1 text-slate-100"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-slate-400 block mb-1">Resource Category</label>
                <select
                  value={resType}
                  onChange={(e) => setResType(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xs px-2 py-1 text-slate-100"
                >
                  <option value="Mineral Resources">Mineral Resources</option>
                  <option value="Organic Compounds">Organic Compounds</option>
                  <option value="Archeotech">Archeotech</option>
                  <option value="Xenos Ruins">Xenos Ruins</option>
                  <option value="Agricultural Biomass">Agricultural Biomass</option>
                  <option value="Energy Reservoir">Energy Reservoir</option>
                  <option value="Holy Relics">Holy Relics</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase text-slate-400 block mb-1">Subtype / Grade</label>
                <input
                  type="text"
                  placeholder="e.g. Rare Heavy Metals"
                  value={resSubtype}
                  onChange={(e) => setResSubtype(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xs px-2 py-1 text-slate-100"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-slate-400 block mb-1">Abundance Rating</label>
                <select
                  value={resAbundance}
                  onChange={(e) => setResAbundance(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xs px-2 py-1 text-slate-100"
                >
                  <option value="Scarce">Scarce</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Plentiful">Plentiful</option>
                  <option value="Abundant">Abundant</option>
                  <option value="Rich">Rich</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase text-slate-400 block mb-1">Survey Notes & Exploitation Details</label>
              <input
                type="text"
                placeholder="e.g. Requires deep drilling shafts; grants +2 Prod to Mining Charter."
                value={resNotes}
                onChange={(e) => setResNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xs px-2 py-1 text-xs text-slate-100 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingResource(false)}
                className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-mono rounded-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-cyan-900 hover:bg-cyan-800 text-cyan-100 text-xs font-mono uppercase rounded-xs"
              >
                Save Deposit
              </button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {colony.planetaryResources.map((res) => (
            <div
              key={res.id}
              className="p-3 bg-slate-950 border border-slate-800 rounded-xs flex flex-wrap items-center justify-between gap-3 text-xs font-mono"
            >
              <div>
                <div className="font-serif font-bold text-sm text-slate-100 flex items-center gap-2">
                  {res.name}
                  <span className="text-[10px] font-mono px-1.5 py-0.5 bg-cyan-950 border border-cyan-800 text-cyan-300 rounded-xs">
                    {res.type}
                  </span>
                  {res.subtype && (
                    <span className="text-[10px] text-slate-400">
                      ({res.subtype})
                    </span>
                  )}
                </div>
                {res.notes && (
                  <p className="text-[11px] text-slate-400 mt-1">{res.notes}</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 bg-slate-900 border border-slate-700 text-slate-200 rounded-xs font-bold text-xs">
                  {res.abundance}
                </span>
                <button
                  onClick={() => handleDeleteResource(res.id)}
                  className="p-1 text-slate-500 hover:text-red-400 rounded-xs"
                  title="Remove resource record"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </OrnamentalFrame>

      {/* Quick Links to Hard Infrastructure & Upgrades */}
      <div className="p-4 bg-slate-950 border border-cyan-900/60 rounded-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 className="font-serif font-bold text-sm text-slate-100 uppercase">
            Looking to configure Hard Infrastructure, Support Upgrades, or Development Plans?
          </h4>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Full editable systems, upgrade limits, and promotion workflows reside in the Infrastructure tab.
          </p>
        </div>
        <button
          onClick={onNavigateToInfrastructure}
          className="px-4 py-2 bg-cyan-900 hover:bg-cyan-800 border border-cyan-500 text-cyan-100 text-xs font-mono uppercase tracking-wider rounded-xs flex items-center gap-2 transition-colors"
        >
          Open Infrastructure Group <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
