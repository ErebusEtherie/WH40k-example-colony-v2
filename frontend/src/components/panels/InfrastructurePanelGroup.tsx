import React, { useState } from 'react';
import { 
  Colony, 
  ColonyCalculations, 
  DevelopmentPlanItem, 
  HardInfrastructureItem, 
  HardInfrastructureStatus, 
  HardInfrastructureTypeKey, 
  PlanStatus, 
  StatName, 
  SupportUpgradeItem, 
  SupportUpgradeStatus, 
  SupportUpgradeTypeKey 
} from '../../types';
import { 
  HARD_INFRASTRUCTURE_RULES, 
  SUPPORT_UPGRADE_RULES 
} from '../../data/rulesReference';
import { OrnamentalFrame } from '../common/OrnamentalFrame';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  ArrowUpRight
} from 'lucide-react';

interface InfrastructurePanelGroupProps {
  colony: Colony;
  calculations: ColonyCalculations;
  onUpdateColony: (updated: Partial<Colony>) => void;
}

export const InfrastructurePanelGroup: React.FC<InfrastructurePanelGroupProps> = ({
  colony,
  calculations,
  onUpdateColony,
}) => {
  // Hard Infrastructure modal/form state
  const [isAddingHardInfra, setIsAddingHardInfra] = useState(false);
  const [editingHardInfraId, setEditingHardInfraId] = useState<string | null>(null);
  const [hiName, setHiName] = useState('');
  const [hiType, setHiType] = useState<HardInfrastructureTypeKey>('transport');
  const [hiStatus, setHiStatus] = useState<HardInfrastructureStatus>('working');
  const [hiNotes, setHiNotes] = useState('');

  // Support Upgrade modal/form state
  const [isAddingUpgrade, setIsAddingUpgrade] = useState(false);
  const [editingUpgradeId, setEditingUpgradeId] = useState<string | null>(null);
  const [suName, setSuName] = useState('');
  const [suType, setSuType] = useState<SupportUpgradeTypeKey>('arbites_precinct');
  const [suStatus, setSuStatus] = useState<SupportUpgradeStatus>('working');
  const [suNotes, setSuNotes] = useState('');
  const [suChosenStat, setSuChosenStat] = useState<StatName>('order');
  const [suContactCount, setSuContactCount] = useState<number>(3);
  const [suContactDetails, setSuContactDetails] = useState('');

  // Development Plan form state
  const [isAddingPlan, setIsAddingPlan] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [dpName, setDpName] = useState('');
  const [dpCategory, setDpCategory] = useState<'hard_infrastructure' | 'support_upgrade'>('hard_infrastructure');
  const [dpType, setDpType] = useState<HardInfrastructureTypeKey | SupportUpgradeTypeKey>('transport');
  const [dpPriority, setDpPriority] = useState<number>(5);
  const [dpStatus, setDpStatus] = useState<PlanStatus>('planning');
  const [dpDesc, setDpDesc] = useState('');
  const [dpProgress, setDpProgress] = useState('');
  const [dpChosenStat, setDpChosenStat] = useState<StatName>('order');

  // Promotion Confirmation State
  const [promotingPlan, setPromotingPlan] = useState<DevelopmentPlanItem | null>(null);

  // Upgrade Limit Checks
  const currentSize = calculations.size.finalValue;
  const currentUpgradeCount = colony.supportUpgrades.length;
  const isGlobalUpgradeCapReached = currentUpgradeCount >= currentSize;

  // Check specific upgrade limits
  const isSingleLimitReached = (typeKey: SupportUpgradeTypeKey) => {
    const existing = colony.supportUpgrades.filter((u) => u.type === typeKey);
    const rule = SUPPORT_UPGRADE_RULES[typeKey];
    if (rule.limitRule === 'single' && existing.length >= 1) return true;
    return false;
  };

  // Hard Infrastructure Handlers
  const handleSaveHardInfra = (e: React.FormEvent) => {
    e.preventDefault();
    const rule = HARD_INFRASTRUCTURE_RULES[hiType];
    const finalName = hiName.trim() || rule.displayName;

    if (editingHardInfraId) {
      const updated = colony.hardInfrastructure.map((h) => {
        if (h.id === editingHardInfraId) {
          return {
            ...h,
            name: finalName,
            status: hiStatus,
            notes: hiNotes.trim(),
          };
        }
        return h;
      });
      onUpdateColony({ hardInfrastructure: updated });
      setEditingHardInfraId(null);
    } else {
      const newItem: HardInfrastructureItem = {
        id: `hi_${Date.now()}`,
        name: finalName,
        type: hiType,
        status: hiStatus,
        notes: hiNotes.trim(),
      };
      onUpdateColony({ hardInfrastructure: [...colony.hardInfrastructure, newItem] });
      setIsAddingHardInfra(false);
    }

    setHiName('');
    setHiNotes('');
    setHiStatus('working');
  };

  const handleQuickChangeHardStatus = (id: string, newStatus: HardInfrastructureStatus) => {
    const updated = colony.hardInfrastructure.map((h) => {
      if (h.id === id) return { ...h, status: newStatus };
      return h;
    });
    onUpdateColony({ hardInfrastructure: updated });
  };

  const handleDeleteHardInfra = (id: string) => {
    onUpdateColony({
      hardInfrastructure: colony.hardInfrastructure.filter((h) => h.id !== id),
    });
  };

  // Support Upgrade Handlers
  const handleSaveUpgrade = (e: React.FormEvent) => {
    e.preventDefault();
    const rule = SUPPORT_UPGRADE_RULES[suType];
    const finalName = suName.trim() || rule.displayName;

    if (editingUpgradeId) {
      const updated = colony.supportUpgrades.map((u) => {
        if (u.id === editingUpgradeId) {
          return {
            ...u,
            name: finalName,
            status: suStatus,
            notes: suNotes.trim(),
            chosenStat: suType === 'cultural_improvement' ? suChosenStat : undefined,
            contactCount: suType === 'contacts' ? suContactCount : undefined,
            contactDetails: suType === 'contacts' ? suContactDetails.trim() : undefined,
          };
        }
        return u;
      });
      onUpdateColony({ supportUpgrades: updated });
      setEditingUpgradeId(null);
    } else {
      const newItem: SupportUpgradeItem = {
        id: `su_${Date.now()}`,
        name: finalName,
        type: suType,
        status: suStatus,
        notes: suNotes.trim(),
        chosenStat: suType === 'cultural_improvement' ? suChosenStat : undefined,
        contactCount: suType === 'contacts' ? suContactCount : undefined,
        contactDetails: suType === 'contacts' ? suContactDetails.trim() : undefined,
      };
      onUpdateColony({ supportUpgrades: [...colony.supportUpgrades, newItem] });
      setIsAddingUpgrade(false);
    }

    setSuName('');
    setSuNotes('');
    setSuStatus('working');
    setSuContactDetails('');
  };

  const handleQuickChangeUpgradeStatus = (id: string, newStatus: SupportUpgradeStatus) => {
    const updated = colony.supportUpgrades.map((u) => {
      if (u.id === id) return { ...u, status: newStatus };
      return u;
    });
    onUpdateColony({ supportUpgrades: updated });
  };

  const handleDeleteUpgrade = (id: string) => {
    onUpdateColony({
      supportUpgrades: colony.supportUpgrades.filter((u) => u.id !== id),
    });
  };

  // Development Plan Handlers
  const handleSavePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dpName.trim()) return;

    if (editingPlanId) {
      const updated = colony.developmentPlans.map((p) => {
        if (p.id === editingPlanId) {
          return {
            ...p,
            name: dpName.trim(),
            category: dpCategory,
            type: dpType,
            priority: Math.max(1, Math.min(10, dpPriority)),
            status: dpStatus,
            description: dpDesc.trim(),
            progress: dpProgress.trim(),
            chosenStat: dpCategory === 'support_upgrade' && dpType === 'cultural_improvement' ? dpChosenStat : undefined,
          };
        }
        return p;
      });
      onUpdateColony({ developmentPlans: updated });
      setEditingPlanId(null);
    } else {
      const newPlan: DevelopmentPlanItem = {
        id: `plan_${Date.now()}`,
        name: dpName.trim(),
        category: dpCategory,
        type: dpType,
        priority: Math.max(1, Math.min(10, dpPriority)),
        status: dpStatus,
        description: dpDesc.trim(),
        progress: dpProgress.trim(),
        chosenStat: dpCategory === 'support_upgrade' && dpType === 'cultural_improvement' ? dpChosenStat : undefined,
      };
      onUpdateColony({ developmentPlans: [...colony.developmentPlans, newPlan] });
      setIsAddingPlan(false);
    }

    setDpName('');
    setDpDesc('');
    setDpProgress('');
    setDpPriority(5);
    setDpStatus('planning');
  };

  const handleTogglePlanStatus = (id: string) => {
    const updated = colony.developmentPlans.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          status: p.status === 'planning' ? ('in_progress' as PlanStatus) : ('planning' as PlanStatus),
        };
      }
      return p;
    });
    onUpdateColony({ developmentPlans: updated });
  };

  const handleDeletePlan = (id: string) => {
    onUpdateColony({
      developmentPlans: colony.developmentPlans.filter((p) => p.id !== id),
    });
  };

  // Promotion execution
  const handleExecutePromotion = (_archive: boolean) => {
    if (!promotingPlan) return;

    if (promotingPlan.category === 'hard_infrastructure') {
      const newHard: HardInfrastructureItem = {
        id: `hi_${Date.now()}`,
        name: promotingPlan.name,
        type: promotingPlan.type as HardInfrastructureTypeKey,
        status: 'working',
        notes: `Promoted from Development Plan: "${promotingPlan.name}". ${promotingPlan.description}`,
      };
      onUpdateColony({
        hardInfrastructure: [...colony.hardInfrastructure, newHard],
        developmentPlans: colony.developmentPlans.filter((p) => p.id !== promotingPlan.id),
      });
    } else {
      const newUpg: SupportUpgradeItem = {
        id: `su_${Date.now()}`,
        name: promotingPlan.name,
        type: promotingPlan.type as SupportUpgradeTypeKey,
        status: 'working',
        notes: `Promoted from Development Plan: "${promotingPlan.name}". ${promotingPlan.description}`,
        chosenStat: promotingPlan.chosenStat,
      };
      onUpdateColony({
        supportUpgrades: [...colony.supportUpgrades, newUpg],
        developmentPlans: colony.developmentPlans.filter((p) => p.id !== promotingPlan.id),
      });
    }

    setPromotingPlan(null);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      
      {/* ========================================================================= */}
      {/* 4a. Hard Infrastructure Sub-Panel */}
      {/* ========================================================================= */}
      <OrnamentalFrame
        title="Hard Infrastructure Systems"
        subtitle="5 Essential Imperial Systems (Transport, Power, Water, Food Production, Communications)"
        actions={
          <button
            onClick={() => {
              setHiName('');
              setHiNotes('');
              setHiStatus('working');
              setIsAddingHardInfra(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-900/80 hover:bg-cyan-800 border border-cyan-500 text-cyan-100 text-xs font-mono uppercase tracking-wider rounded-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Commission System
          </button>
        }
      >
        {/* Form Modal/Section for Adding/Editing Hard Infrastructure */}
        {(isAddingHardInfra || editingHardInfraId) && (
          <form
            onSubmit={handleSaveHardInfra}
            className="p-4 bg-slate-950 border border-cyan-700/80 rounded-xs mb-4 space-y-4 animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="font-serif font-bold text-xs uppercase text-cyan-200">
                {editingHardInfraId ? 'Edit Hard Infrastructure Entry' : 'Commission Hard Infrastructure'}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setIsAddingHardInfra(false);
                  setEditingHardInfraId(null);
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <label className="text-[10px] uppercase text-slate-400 block mb-1">System Custom Name</label>
                <input
                  type="text"
                  placeholder="e.g. Mag-Rail Expressway"
                  value={hiName}
                  onChange={(e) => setHiName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xs px-2.5 py-1.5 text-slate-100"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-slate-400 block mb-1">Infrastructure Type (5 Confirmed)</label>
                <select
                  value={hiType}
                  onChange={(e) => setHiType(e.target.value as HardInfrastructureTypeKey)}
                  disabled={!!editingHardInfraId}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xs px-2.5 py-1.5 text-slate-100"
                >
                  <option value="transport">Transport (Prod +1, Comp +1 / -2, -2)</option>
                  <option value="power">Power (Prod +2 / Prod -3, Comp -1)</option>
                  <option value="water">Water (Order +1, Comp +1 / -2, -2)</option>
                  <option value="food_production">Food Production (Prod +1, Comp +1 / -2, -2)</option>
                  <option value="communications">Communications (Prod +1, Order +1 / -2, -2)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase text-slate-400 block mb-1">Operational Status (4 States)</label>
                <select
                  value={hiStatus}
                  onChange={(e) => setHiStatus(e.target.value as HardInfrastructureStatus)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xs px-2.5 py-1.5 text-slate-100"
                >
                  <option value="working">Working (Bonuses active)</option>
                  <option value="not_working">Not Working (Severe penalties active)</option>
                  <option value="in_progress">In Progress (No modifiers)</option>
                  <option value="needed">Needed (Missing Penalty: Complacency -1)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase text-slate-400 block mb-1">Technical Notes & Deployment Context</label>
              <input
                type="text"
                placeholder="e.g. Connects sub-crustal boreholes to orbital relay..."
                value={hiNotes}
                onChange={(e) => setHiNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xs px-2.5 py-1.5 text-xs text-slate-100 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingHardInfra(false);
                  setEditingHardInfraId(null);
                }}
                className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-mono rounded-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1 bg-cyan-900 hover:bg-cyan-800 border border-cyan-500 text-cyan-100 text-xs font-mono uppercase rounded-xs"
              >
                {editingHardInfraId ? 'Save Changes' : 'Confirm System Commission'}
              </button>
            </div>
          </form>
        )}

        {/* Hard Infrastructure List */}
        <div className="space-y-3">
          {colony.hardInfrastructure.map((infra) => {
            const rule = HARD_INFRASTRUCTURE_RULES[infra.type];
            return (
              <div
                key={infra.id}
                className={`p-3.5 bg-slate-950 rounded-xs border transition-colors flex flex-wrap items-center justify-between gap-4 ${
                  infra.status === 'working'
                    ? 'border-emerald-900/60'
                    : infra.status === 'not_working'
                    ? 'border-red-900/80 bg-red-950/10'
                    : infra.status === 'needed'
                    ? 'border-amber-900/80 bg-amber-950/10'
                    : 'border-slate-800'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-serif font-bold text-sm text-slate-100">
                      {infra.name}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-slate-900 border border-slate-700 text-cyan-300 rounded-xs">
                      {rule?.displayName || infra.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {infra.notes || rule?.description}
                  </p>
                  
                  {/* System-derived active modifiers preview */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase">Active Effects:</span>
                    {infra.status === 'working' ? (
                      rule?.workingModifiers.map((m, idx) => (
                        <span key={idx} className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-950 px-1.5 py-0.5 rounded-xs border border-emerald-800">
                          +{m.value} {m.stat.toUpperCase()}
                        </span>
                      ))
                    ) : infra.status === 'not_working' ? (
                      rule?.notWorkingModifiers.map((m, idx) => (
                        <span key={idx} className="text-[10px] font-mono text-red-400 font-bold bg-red-950 px-1.5 py-0.5 rounded-xs border border-red-800">
                          {m.value} {m.stat.toUpperCase()}
                        </span>
                      ))
                    ) : infra.status === 'needed' ? (
                      <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-950 px-1.5 py-0.5 rounded-xs border border-amber-800">
                        -1 COMPLACENCY (Missing Penalty)
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-slate-400 italic">
                        In Progress (No active effects)
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Picker & Actions */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 p-1 rounded-xs">
                    {(['working', 'not_working', 'in_progress', 'needed'] as HardInfrastructureStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleQuickChangeHardStatus(infra.id, st)}
                        className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded-xs transition-colors ${
                          infra.status === st
                            ? st === 'working'
                              ? 'bg-emerald-900 text-emerald-100 font-bold'
                              : st === 'not_working'
                              ? 'bg-red-900 text-red-100 font-bold'
                              : st === 'needed'
                              ? 'bg-amber-900 text-amber-100 font-bold'
                              : 'bg-slate-700 text-slate-100 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
                    <button
                      onClick={() => {
                        setEditingHardInfraId(infra.id);
                        setHiName(infra.name);
                        setHiType(infra.type);
                        setHiStatus(infra.status);
                        setHiNotes(infra.notes);
                      }}
                      className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-xs"
                      title="Edit technical entry"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteHardInfra(infra.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-xs"
                      title="Decommission system"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </OrnamentalFrame>

      {/* ========================================================================= */}
      {/* 4b. Support Upgrades Sub-Panel */}
      {/* ========================================================================= */}
      <OrnamentalFrame
        title="Support Upgrades"
        subtitle={`10 Specialized Upgrades • Capacity: ${colony.supportUpgrades.length} Installed / Max ${currentSize} (Capped by Colony Size)`}
        badge={
          isGlobalUpgradeCapReached ? (
            <span className="px-2 py-0.5 bg-amber-950 border border-amber-800 text-amber-300 text-[10px] font-mono uppercase font-bold rounded-xs">
              Capacity Full (Size {currentSize})
            </span>
          ) : null
        }
        actions={
          <button
            onClick={() => {
              setSuName('');
              setSuNotes('');
              setSuStatus('working');
              setIsAddingUpgrade(true);
            }}
            disabled={isGlobalUpgradeCapReached}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-xs transition-colors ${
              isGlobalUpgradeCapReached
                ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-cyan-900/80 hover:bg-cyan-800 border border-cyan-500 text-cyan-100'
            }`}
            title={isGlobalUpgradeCapReached ? 'Total support upgrades cannot exceed current Colony Size' : 'Install new upgrade'}
          >
            <Plus className="w-3.5 h-3.5" /> Install Upgrade
          </button>
        }
      >
        {/* Support Upgrade Form */}
        {(isAddingUpgrade || editingUpgradeId) && (
          <form
            onSubmit={handleSaveUpgrade}
            className="p-4 bg-slate-950 border border-cyan-700/80 rounded-xs mb-4 space-y-4 animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="font-serif font-bold text-xs uppercase text-cyan-200">
                {editingUpgradeId ? 'Edit Support Upgrade' : 'Install Support Upgrade'}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setIsAddingUpgrade(false);
                  setEditingUpgradeId(null);
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <label className="text-[10px] uppercase text-slate-400 block mb-1">Upgrade Name</label>
                <input
                  type="text"
                  placeholder="e.g. High Altar Cathedral"
                  value={suName}
                  onChange={(e) => setSuName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xs px-2.5 py-1.5 text-slate-100"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-slate-400 block mb-1">Upgrade Type (10 Confirmed)</label>
                <select
                  value={suType}
                  onChange={(e) => setSuType(e.target.value as SupportUpgradeTypeKey)}
                  disabled={!!editingUpgradeId}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xs px-2.5 py-1.5 text-slate-100"
                >
                  <option value="arbites_precinct">Arbites Precinct (Order +1, Legal skill bonuses)</option>
                  <option value="ecclesiarchy_mission">Ecclesiarchy Mission (Piety +1, Faith tests)</option>
                  <option value="mechanicum_station" disabled={isSingleLimitReached('mechanicum_station')}>
                    Mechanicum Station (Prod +1/+2/+3, Max 1) {isSingleLimitReached('mechanicum_station') ? '[Limit Reached]' : ''}
                  </option>
                  <option value="infantry_garrison" disabled={isSingleLimitReached('infantry_garrison')}>
                    Infantry Garrison (Order +1, Max 1) {isSingleLimitReached('infantry_garrison') ? '[Limit Reached]' : ''}
                  </option>
                  <option value="imperial_navy_station" disabled={isSingleLimitReached('imperial_navy_station')}>
                    Imperial Navy Station (Order +1, Max 1) {isSingleLimitReached('imperial_navy_station') ? '[Limit Reached]' : ''}
                  </option>
                  <option value="cultural_improvement">Cultural Improvement (+1 to chosen stat, Max 1/stat)</option>
                  <option value="industrial_facility">Industrial Facility (Prod +1, Custom product)</option>
                  <option value="personal_lodgings" disabled={isSingleLimitReached('personal_lodgings')}>
                    Personal Lodgings (Order +1, Max 1) {isSingleLimitReached('personal_lodgings') ? '[Limit Reached]' : ''}
                  </option>
                  <option value="contacts">Contacts (Affiliated NPC ties, 1-5 contacts)</option>
                  <option value="trappings">Trappings (Complacency +1, Golden effigies)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase text-slate-400 block mb-1">Status (3 States)</label>
                <select
                  value={suStatus}
                  onChange={(e) => setSuStatus(e.target.value as SupportUpgradeStatus)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xs px-2.5 py-1.5 text-slate-100"
                >
                  <option value="working">Working (Bonuses active)</option>
                  <option value="not_working">Not Working (Incapacitated)</option>
                  <option value="in_progress">In Progress (Under construction)</option>
                </select>
              </div>
            </div>

            {/* Cultural Improvement Chosen Stat */}
            {suType === 'cultural_improvement' && (
              <div className="p-3 bg-slate-900 border border-cyan-800/60 rounded-xs space-y-1">
                <label className="text-[10px] font-mono uppercase text-cyan-300 block">
                  Chosen Colony Characteristic (+1 Bonus)
                </label>
                <select
                  value={suChosenStat}
                  onChange={(e) => setSuChosenStat(e.target.value as StatName)}
                  className="bg-slate-950 border border-cyan-700 rounded-xs px-2 py-1 text-xs text-slate-100 font-mono"
                >
                  <option value="complacency">Complacency</option>
                  <option value="order">Order</option>
                  <option value="productivity">Productivity</option>
                  <option value="piety">Piety</option>
                </select>
                <p className="text-[11px] text-slate-400">
                  Explorers choose one characteristic (other than Size). Purchasable once per characteristic.
                </p>
              </div>
            )}

            {/* Contacts Extra Fields */}
            {suType === 'contacts' && (
              <div className="p-3 bg-slate-900 border border-cyan-800/60 rounded-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono uppercase text-cyan-300 block mb-1">
                    Contact Count (Result of 1d5, rolled physically: 1–5) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={suContactCount}
                    onChange={(e) => setSuContactCount(Number.parseInt(e.target.value) || 1)}
                    className="w-full bg-slate-950 border border-cyan-700 rounded-xs px-2 py-1 text-xs text-slate-100 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono uppercase text-cyan-300 block mb-1">
                    Contact Details & Affiliated Group *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Guild of Chartist Scribes, Kasballica Broker"
                    value={suContactDetails}
                    onChange={(e) => setSuContactDetails(e.target.value)}
                    className="w-full bg-slate-950 border border-cyan-700 rounded-xs px-2 py-1 text-xs text-slate-100 font-mono"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] uppercase text-slate-400 block mb-1">Notes & Mechanical Context</label>
              <input
                type="text"
                placeholder="e.g. Enforces tithes; produces specialized void ammunition..."
                value={suNotes}
                onChange={(e) => setSuNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xs px-2.5 py-1.5 text-xs text-slate-100 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingUpgrade(false);
                  setEditingUpgradeId(null);
                }}
                className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-mono rounded-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1 bg-cyan-900 hover:bg-cyan-800 border border-cyan-500 text-cyan-100 text-xs font-mono uppercase rounded-xs"
              >
                {editingUpgradeId ? 'Save Upgrade' : 'Install Upgrade'}
              </button>
            </div>
          </form>
        )}

        {/* Upgrades List */}
        <div className="space-y-3">
          {colony.supportUpgrades.map((upg) => {
            const rule = SUPPORT_UPGRADE_RULES[upg.type];
            return (
              <div
                key={upg.id}
                className="p-3.5 bg-slate-950 rounded-xs border border-slate-800 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-sm text-slate-100">
                      {upg.name}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-cyan-950 border border-cyan-800 text-cyan-300 rounded-xs">
                      {rule?.displayName || upg.type}
                    </span>
                    {upg.chosenStat && (
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 bg-amber-950 border border-amber-800 text-amber-300 rounded-xs">
                        +{upg.chosenStat}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {upg.notes || rule?.description}
                  </p>
                  
                  {/* Mechanical rules text */}
                  <div className="text-[10px] font-mono text-cyan-300 flex items-center gap-2">
                    <span>{rule?.mechanicalEffect}</span>
                    {upg.contactCount && (
                      <span className="text-amber-300 font-bold">
                        ({upg.contactCount} NPCs: {upg.contactDetails})
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Toggle & Actions */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 p-1 rounded-xs">
                    {(['working', 'not_working', 'in_progress'] as SupportUpgradeStatus[]).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleQuickChangeUpgradeStatus(upg.id, st)}
                        className={`px-2 py-0.5 text-[10px] font-mono uppercase rounded-xs transition-colors ${
                          upg.status === st
                            ? st === 'working'
                              ? 'bg-emerald-900 text-emerald-100 font-bold'
                              : st === 'not_working'
                              ? 'bg-red-900 text-red-100 font-bold'
                              : 'bg-slate-700 text-slate-100 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {st.replace('_', ' ')}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
                    <button
                      onClick={() => {
                        setEditingUpgradeId(upg.id);
                        setSuName(upg.name);
                        setSuType(upg.type);
                        setSuStatus(upg.status);
                        setSuNotes(upg.notes);
                        if (upg.chosenStat) setSuChosenStat(upg.chosenStat);
                        if (upg.contactCount) setSuContactCount(upg.contactCount);
                        if (upg.contactDetails) setSuContactDetails(upg.contactDetails);
                      }}
                      className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-xs"
                      title="Edit upgrade"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteUpgrade(upg.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-xs"
                      title="Dismantle upgrade"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {colony.supportUpgrades.length === 0 && (
            <p className="text-xs font-mono text-slate-500 italic p-3 bg-slate-950 border border-slate-800">
              No support upgrades installed. Use "+ Install Upgrade" to commission sanctums and facilities.
            </p>
          )}
        </div>
      </OrnamentalFrame>

      {/* ========================================================================= */}
      {/* 4c. Development Plan Sub-Panel */}
      {/* ========================================================================= */}
      <OrnamentalFrame
        title="Colony Development Plans"
        subtitle="Long-term construction blueprints, priority schedule (1–10), and promotion to active domain"
        actions={
          <button
            onClick={() => {
              setDpName('');
              setDpDesc('');
              setDpProgress('');
              setDpPriority(5);
              setDpStatus('planning');
              setIsAddingPlan(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-900/80 hover:bg-cyan-800 border border-cyan-500 text-cyan-100 text-xs font-mono uppercase tracking-wider rounded-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Plan Blueprint
          </button>
        }
      >
        {/* Development Plan Form */}
        {(isAddingPlan || editingPlanId) && (
          <form
            onSubmit={handleSavePlan}
            className="p-4 bg-slate-950 border border-cyan-700/80 rounded-xs mb-4 space-y-4 animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h4 className="font-serif font-bold text-xs uppercase text-cyan-200">
                {editingPlanId ? 'Edit Blueprint Item' : 'New Colony Development Blueprint'}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setIsAddingPlan(false);
                  setEditingPlanId(null);
                }}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <label className="text-[10px] uppercase text-slate-400 block mb-1">Blueprint Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Spire Observation Dome"
                  value={dpName}
                  onChange={(e) => setDpName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xs px-2.5 py-1.5 text-slate-100"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-slate-400 block mb-1">Target Category</label>
                <select
                  value={dpCategory}
                  onChange={(e) => {
                    const newCat = e.target.value as 'hard_infrastructure' | 'support_upgrade';
                    setDpCategory(newCat);
                    setDpType(newCat === 'hard_infrastructure' ? 'transport' : 'arbites_precinct');
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xs px-2.5 py-1.5 text-slate-100"
                >
                  <option value="hard_infrastructure">Hard Infrastructure</option>
                  <option value="support_upgrade">Support Upgrade</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase text-slate-400 block mb-1">Specific Type</label>
                {dpCategory === 'hard_infrastructure' ? (
                  <select
                    value={dpType}
                    onChange={(e) => setDpType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xs px-2.5 py-1.5 text-slate-100"
                  >
                    <option value="transport">Transport</option>
                    <option value="power">Power</option>
                    <option value="water">Water</option>
                    <option value="food_production">Food Production</option>
                    <option value="communications">Communications</option>
                  </select>
                ) : (
                  <select
                    value={dpType}
                    onChange={(e) => setDpType(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xs px-2.5 py-1.5 text-slate-100"
                  >
                    <option value="arbites_precinct">Arbites Precinct</option>
                    <option value="ecclesiarchy_mission">Ecclesiarchy Mission</option>
                    <option value="mechanicum_station">Mechanicum Station</option>
                    <option value="infantry_garrison">Infantry Garrison</option>
                    <option value="imperial_navy_station">Imperial Navy Station</option>
                    <option value="cultural_improvement">Cultural Improvement</option>
                    <option value="industrial_facility">Industrial Facility</option>
                    <option value="personal_lodgings">Personal Lodgings</option>
                    <option value="contacts">Contacts</option>
                    <option value="trappings">Trappings</option>
                  </select>
                )}
              </div>

              <div>
                <label className="text-[10px] uppercase text-slate-400 block mb-1">
                  Priority Rank (1–10: {dpPriority})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={dpPriority}
                    onChange={(e) => setDpPriority(parseInt(e.target.value) || 1)}
                    className="w-full accent-cyan-400"
                  />
                  <span className="font-bold text-cyan-300 w-6 text-center">{dpPriority}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <label className="text-[10px] uppercase text-slate-400 block mb-1">Description & Strategic Intent</label>
                <textarea
                  rows={2}
                  placeholder="Architectural specs and expected benefits..."
                  value={dpDesc}
                  onChange={(e) => setDpDesc(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xs p-2 text-slate-100"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase text-slate-400 block mb-1">Current Construction Progress</label>
                <textarea
                  rows={2}
                  placeholder="Stage 2 of 4: Prefab foundations poured..."
                  value={dpProgress}
                  onChange={(e) => setDpProgress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xs p-2 text-slate-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase font-mono text-slate-400">Initial Status:</span>
                <button
                  type="button"
                  onClick={() => setDpStatus(dpStatus === 'planning' ? 'in_progress' : 'planning')}
                  className={`px-2.5 py-1 text-xs font-mono uppercase rounded-xs border ${
                    dpStatus === 'in_progress'
                      ? 'bg-cyan-950 border-cyan-500 text-cyan-200 font-bold'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  {dpStatus === 'in_progress' ? 'In Progress' : 'Planning'}
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingPlan(false);
                    setEditingPlanId(null);
                  }}
                  className="px-3 py-1 bg-slate-800 text-slate-300 text-xs font-mono rounded-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-cyan-900 hover:bg-cyan-800 border border-cyan-500 text-cyan-100 text-xs font-mono uppercase rounded-xs"
                >
                  {editingPlanId ? 'Save Blueprint' : 'Authorize Blueprint'}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Plans Table / List */}
        <div className="space-y-3">
          {colony.developmentPlans
            .slice()
            .sort((a, b) => b.priority - a.priority)
            .map((plan) => (
              <div
                key={plan.id}
                className="p-4 bg-slate-950 border border-slate-800 rounded-xs flex flex-wrap items-center justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-serif font-bold text-sm text-slate-100">
                      {plan.name}
                    </span>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-slate-900 border border-slate-700 text-slate-300 rounded-xs">
                      {plan.category === 'hard_infrastructure' ? 'Hard Infra' : 'Support Upgrade'}: {plan.type.replace('_', ' ')}
                    </span>
                    
                    {/* Priority Bar Scale (1-10) */}
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-900 border border-cyan-900/60 rounded-xs text-[10px] font-mono">
                      <span className="text-slate-400">Priority:</span>
                      <span className="font-bold text-cyan-300">{plan.priority}/10</span>
                      <div className="w-12 h-1.5 bg-slate-800 rounded-full overflow-hidden flex ml-1">
                        <div
                          className="bg-cyan-400 h-full"
                          style={{ width: `${(plan.priority / 10) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {plan.description && (
                    <p className="text-xs text-slate-300 font-mono">
                      {plan.description}
                    </p>
                  )}

                  {plan.progress && (
                    <div className="text-[11px] font-mono text-cyan-300/90 flex items-center gap-1.5">
                      <span className="text-slate-500">Progress:</span>
                      <span>{plan.progress}</span>
                    </div>
                  )}
                </div>

                {/* Plan Status Toggle & Actions */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleTogglePlanStatus(plan.id)}
                    className={`px-3 py-1 text-xs font-mono uppercase rounded-xs border transition-colors ${
                      plan.status === 'in_progress'
                        ? 'bg-cyan-950 border-cyan-500 text-cyan-200 font-bold'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                    }`}
                    title="Toggle between Planning and In Progress"
                  >
                    {plan.status === 'in_progress' ? 'In Progress' : 'Planning'}
                  </button>

                  {/* Promote Action */}
                  <button
                    onClick={() => setPromotingPlan(plan)}
                    className="flex items-center gap-1 px-3 py-1 bg-emerald-950 hover:bg-emerald-900 border border-emerald-600 text-emerald-200 text-xs font-mono uppercase rounded-xs transition-colors"
                    title="Promote plan into real operational system"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" /> Promote
                  </button>

                  <div className="flex items-center gap-1 border-l border-slate-800 pl-2">
                    <button
                      onClick={() => {
                        setEditingPlanId(plan.id);
                        setDpName(plan.name);
                        setDpCategory(plan.category);
                        setDpType(plan.type);
                        setDpPriority(plan.priority);
                        setDpStatus(plan.status);
                        setDpDesc(plan.description);
                        setDpProgress(plan.progress);
                        if (plan.chosenStat) setDpChosenStat(plan.chosenStat);
                      }}
                      className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-xs"
                      title="Edit blueprint"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 rounded-xs"
                      title="Cancel blueprint"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

          {colony.developmentPlans.length === 0 && (
            <p className="text-xs font-mono text-slate-500 italic p-3 bg-slate-950 border border-slate-800">
              No active development blueprints. Use "+ Add Plan Blueprint" to queue future construction.
            </p>
          )}
        </div>
      </OrnamentalFrame>

      {/* Promotion Workflow Modal */}
      {promotingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border-2 border-emerald-600 rounded-sm shadow-2xl p-6 space-y-4 text-slate-100">
            <div className="flex items-center gap-3 text-emerald-400 border-b border-slate-800 pb-3">
              <ArrowUpRight className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="font-serif text-base font-bold uppercase">
                  Promote Development Plan
                </h3>
                <p className="text-xs font-mono text-slate-400">
                  Convert blueprint into active operational infrastructure
                </p>
              </div>
            </div>

            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xs space-y-2 text-xs font-mono">
              <div>
                <span className="text-slate-400">Project:</span>{' '}
                <span className="font-serif font-bold text-slate-100 text-sm">{promotingPlan.name}</span>
              </div>
              <div>
                <span className="text-slate-400">Category:</span>{' '}
                <span className="text-cyan-300 font-bold uppercase">{promotingPlan.category.replace('_', ' ')}</span>
              </div>
              <div>
                <span className="text-slate-400">System Type:</span>{' '}
                <span className="text-slate-200">{promotingPlan.type.replace('_', ' ')}</span>
              </div>
              <p className="text-slate-400 pt-2 border-t border-slate-900">
                Promoting creates a new <span className="text-emerald-300 font-bold">Working</span> entry in your active {promotingPlan.category.replace('_', ' ')} list. The blueprint item will be retired.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPromotingPlan(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-mono rounded-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => handleExecutePromotion(true)}
                className="px-4 py-1.5 bg-emerald-900 hover:bg-emerald-800 border border-emerald-500 text-emerald-100 text-xs font-mono uppercase font-bold rounded-xs flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Confirm System Activation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
