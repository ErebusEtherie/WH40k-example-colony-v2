import React, { useState } from "react";
import { Colony, ColonyResource, DevelopmentPlan } from "../types/colony";
import { Target, Plus, Trash2, Gem, CheckCircle, ChevronUp, ChevronDown } from "lucide-react";

interface DevelopmentPlansResourcesProps {
  colony: Colony;
  plans: DevelopmentPlan[];
  resources: ColonyResource[];
  onAddPlan: (name: string, targetStat: string, targetVal: number, reqPoints: number, desc?: string) => void;
  onUpdatePlanProgress: (planId: string, delta: number) => void;
  onAddResource: (name: string, type: string, prodBonus: number, pfBonus: number, desc?: string) => void;
  onDeleteResource: (resId: string) => void;
}

export const DevelopmentPlansResources: React.FC<DevelopmentPlansResourcesProps> = ({
  plans,
  resources,
  onAddPlan,
  onUpdatePlanProgress,
  onAddResource,
  onDeleteResource,
}) => {
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showResModal, setShowResModal] = useState(false);

  // Plan state
  const [planName, setPlanName] = useState("");
  const [targetStat, setTargetStat] = useState("order");
  const [targetVal, setTargetVal] = useState(5);
  const [reqPoints, setReqPoints] = useState(100);
  const [planDesc, setPlanDesc] = useState("");

  // Resource state
  const [resName, setResName] = useState("");
  const [resType, setResType] = useState("mineral_resources");
  const [prodBonus, setProdBonus] = useState(1);
  const [pfBonus, setPfBonus] = useState(1);
  const [resDesc, setResDesc] = useState("");

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!planName) return;
    onAddPlan(planName, targetStat, Number(targetVal), Number(reqPoints), planDesc);
    setPlanName("");
    setPlanDesc("");
    setShowPlanModal(false);
  };

  const handleCreateRes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resName) return;
    onAddResource(resName, resType, Number(prodBonus), Number(pfBonus), resDesc);
    setResName("");
    setResDesc("");
    setShowResModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#121520] border border-[#262f44] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-[#fdba74]" />
            <h2 className="text-xl font-bold font-gothic text-[#f8fafc]">
              ENDEAVOURS & PLANETARY RESOURCES
            </h2>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1">
            Track multi-year dynasty development projects and chart discovered mineral veins, archeotech caches, and agricultural biomes.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowPlanModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#b87333] hover:bg-[#9a5b22] text-[#0d0f17] font-semibold text-xs tracking-wider uppercase rounded transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Endeavour</span>
          </button>
          <button
            onClick={() => setShowResModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1e2538] hover:bg-[#2a344a] text-[#cbd5e1] font-semibold text-xs tracking-wider uppercase rounded border border-[#334155] transition"
          >
            <Plus className="w-4 h-4" />
            <span>Charter Resource</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Endeavours Section */}
        <div className="space-y-3">
          <h3 className="font-gothic font-bold text-sm text-[#f8fafc] flex items-center space-x-2">
            <Target className="w-4 h-4 text-[#fdba74]" />
            <span>ACTIVE COLONY ENDEAVOURS ({plans.length})</span>
          </h3>

          <div className="space-y-3">
            {plans.map((plan) => {
              const progressPct = Math.min(100, Math.round((plan.progress_points / plan.required_points) * 100));
              const isCompleted = plan.progress_points >= plan.required_points || plan.status === "completed";

              return (
                <div
                  key={plan.id}
                  className={`bg-[#121520] border rounded-xl p-4 space-y-3 shadow ${
                    isCompleted ? "border-[#22c55e]/50" : "border-[#2a344a]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-base font-bold text-[#f8fafc]">{plan.name}</h4>
                        {isCompleted && (
                          <span className="flex items-center space-x-1 px-2 py-0.5 bg-[#14532d]/60 text-[#86efac] border border-[#22c55e]/40 rounded text-[10px] font-semibold">
                            <CheckCircle className="w-3 h-3" />
                            <span>Accomplished</span>
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#fdba74] font-mono-slate mt-0.5">
                        Target: {plan.target_stat.toUpperCase()} &rarr; {plan.target_value}
                      </div>
                    </div>

                    {/* Quick increment buttons */}
                    {!isCompleted && (
                      <div className="flex items-center space-x-1 bg-[#0b0d13] border border-[#2a344a] rounded p-1">
                        <button
                          onClick={() => onUpdatePlanProgress(plan.id, 10)}
                          title="+10 Progress Points"
                          className="px-2 py-0.5 bg-[#1e2538] hover:bg-[#b87333] hover:text-[#0d0f17] rounded text-xs font-mono-slate font-bold transition"
                        >
                          +10 AP
                        </button>
                        <button
                          onClick={() => onUpdatePlanProgress(plan.id, -10)}
                          title="-10 Progress Points"
                          className="px-2 py-0.5 bg-[#1e2538] hover:bg-[#7f1d1d] hover:text-white rounded text-xs font-mono-slate font-bold transition"
                        >
                          -10
                        </button>
                      </div>
                    )}
                  </div>

                  {plan.description && (
                    <p className="text-xs text-[#94a3b8] leading-relaxed">{plan.description}</p>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono-slate text-[#94a3b8]">
                      <span>Progress: {plan.progress_points} / {plan.required_points} AP</span>
                      <span className="font-bold text-[#f1f5f9]">{progressPct}%</span>
                    </div>
                    <div className="w-full bg-[#0b0d13] h-2 rounded-full overflow-hidden border border-[#1e2538]">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isCompleted ? "bg-[#22c55e]" : "bg-gradient-to-r from-[#b87333] to-[#fdba74]"
                        }`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {plans.length === 0 && (
              <div className="bg-[#121520] border border-dashed border-[#334155] rounded-xl p-6 text-center text-[#94a3b8] text-xs">
                No active development endeavours chartered.
              </div>
            )}
          </div>
        </div>

        {/* Exploited Resources Section */}
        <div className="space-y-3">
          <h3 className="font-gothic font-bold text-sm text-[#f8fafc] flex items-center space-x-2">
            <Gem className="w-4 h-4 text-[#fdba74]" />
            <span>EXPLOITED PLANETARY RESOURCES ({resources.length})</span>
          </h3>

          <div className="space-y-2.5">
            {resources.map((res) => (
              <div
                key={res.id}
                className="bg-[#121520] border border-[#2a344a] rounded-xl p-4 flex items-start justify-between gap-3 shadow"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-[#f8fafc]">{res.name}</span>
                    <span className="px-2 py-0.5 text-[10px] uppercase font-mono-slate bg-[#1e2538] text-[#fdba74] rounded">
                      {res.resource_type.replace(/_/g, " ")}
                    </span>
                  </div>

                  <p className="text-xs text-[#94a3b8]">{res.description}</p>

                  <div className="flex space-x-3 text-xs font-mono-slate pt-1">
                    {res.productivity_bonus > 0 && (
                      <span className="text-[#fde047]">+{res.productivity_bonus} Productivity</span>
                    )}
                    {res.pf_bonus > 0 && (
                      <span className="text-[#86efac]">+{res.pf_bonus} Profit Factor</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onDeleteResource(res.id)}
                  title="Remove resource"
                  className="text-[#64748b] hover:text-[#ef4444] transition p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {resources.length === 0 && (
              <div className="bg-[#121520] border border-dashed border-[#334155] rounded-xl p-6 text-center text-[#94a3b8] text-xs">
                No planetary resources chartered yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Endeavour Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121520] border border-[#b87333]/50 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-gothic text-[#f8fafc]">
              INITIATE COLONY ENDEAVOUR
            </h3>

            <form onSubmit={handleCreatePlan} className="space-y-3">
              <div>
                <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                  Endeavour Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Orbital Defense Grid Phase I"
                  value={planName}
                  onChange={(e) => setPlanName(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                    Target Characteristic
                  </label>
                  <select
                    value={targetStat}
                    onChange={(e) => setTargetStat(e.target.value)}
                    className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                  >
                    <option value="size">Size</option>
                    <option value="order">Order</option>
                    <option value="productivity">Productivity</option>
                    <option value="complacency">Complacency</option>
                    <option value="piety">Piety</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                    Target Score Value
                  </label>
                  <input
                    type="number"
                    value={targetVal}
                    onChange={(e) => setTargetVal(Number(e.target.value))}
                    className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc] font-mono-slate"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                  Achievement Points Required
                </label>
                <input
                  type="number"
                  value={reqPoints}
                  onChange={(e) => setReqPoints(Number(e.target.value))}
                  className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc] font-mono-slate"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                  Endeavour Scope & Milestones
                </label>
                <textarea
                  rows={2}
                  placeholder="Outline logistics, contractor guilds, or labor forces..."
                  value={planDesc}
                  onChange={(e) => setPlanDesc(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#1e2538]">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 bg-[#1e2538] hover:bg-[#2a344a] text-xs font-semibold text-[#cbd5e1] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#b87333] hover:bg-[#9a5b22] text-xs font-semibold text-[#0d0f17] uppercase tracking-wider rounded"
                >
                  Authorize Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resource Modal */}
      {showResModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121520] border border-[#b87333]/50 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-gothic text-[#f8fafc]">
              CHARTER PLANETARY RESOURCE
            </h3>

            <form onSubmit={handleCreateRes} className="space-y-3">
              <div>
                <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                  Resource Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Subterranean Promethium Reservoirs"
                  value={resName}
                  onChange={(e) => setResName(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                  Resource Type
                </label>
                <select
                  value={resType}
                  onChange={(e) => setResType(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                >
                  <option value="mineral_resources">Mineral Resources (Metals & Gems)</option>
                  <option value="organic_compounds">Organic Compounds (Flora & Fauna)</option>
                  <option value="archeotech">Pre-Heresy Archeotech</option>
                  <option value="fuel_reserves">Fuel & Promethium Reserves</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                    Productivity Bonus
                  </label>
                  <input
                    type="number"
                    value={prodBonus}
                    onChange={(e) => setProdBonus(Number(e.target.value))}
                    className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc] font-mono-slate"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                    Profit Factor Export Bonus
                  </label>
                  <input
                    type="number"
                    value={pfBonus}
                    onChange={(e) => setPfBonus(Number(e.target.value))}
                    className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc] font-mono-slate"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                  Geological / Biological Survey Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Geological purity, extraction difficulty..."
                  value={resDesc}
                  onChange={(e) => setResDesc(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#1e2538]">
                <button
                  type="button"
                  onClick={() => setShowResModal(false)}
                  className="px-4 py-2 bg-[#1e2538] hover:bg-[#2a344a] text-xs font-semibold text-[#cbd5e1] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#b87333] hover:bg-[#9a5b22] text-xs font-semibold text-[#0d0f17] uppercase tracking-wider rounded"
                >
                  Charter Resource
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
