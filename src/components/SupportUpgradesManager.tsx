import React, { useState } from "react";
import { Colony, ModifierStat, SupportUpgrade } from "../types/colony";
import { SUPPORT_UPGRADE_TYPES } from "../data/rulesData";
import { Shield, Plus, Trash2, Award, Sparkles, AlertCircle } from "lucide-react";

interface SupportUpgradesManagerProps {
  colony: Colony;
  currentSize: number;
  upgrades: SupportUpgrade[];
  onAddUpgrade: (
    type: string,
    name: string,
    chosenStat?: ModifierStat,
    customProduct?: string,
    notes?: string
  ) => void;
  onDeleteUpgrade: (upgradeId: string) => void;
}

export const SupportUpgradesManager: React.FC<SupportUpgradesManagerProps> = ({
  currentSize,
  upgrades,
  onAddUpgrade,
  onDeleteUpgrade,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState(SUPPORT_UPGRADE_TYPES[0].name);
  const [customName, setCustomName] = useState("");
  const [chosenStat, setChosenStat] = useState<ModifierStat>("order");
  const [customProduct, setCustomProduct] = useState("");
  const [notes, setNotes] = useState("");

  const maxSlots = currentSize;
  const isAtCapacity = upgrades.length >= maxSlots;
  const currentConfig = SUPPORT_UPGRADE_TYPES.find((t) => t.name === selectedType);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentConfig) return;

    onAddUpgrade(
      selectedType,
      customName || currentConfig.display_name,
      selectedType === "cultural_improvement" ? chosenStat : undefined,
      selectedType === "industrial_facility" ? customProduct : undefined,
      notes
    );

    setCustomName("");
    setCustomProduct("");
    setNotes("");
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Banner & Slot Capacity */}
      <div className="bg-[#121520] border border-[#262f44] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-[#fdba74]" />
            <h2 className="text-xl font-bold font-gothic text-[#f8fafc]">
              SUPPORT UPGRADES & CITADELS
            </h2>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1">
            Non-essential institutions and specialized districts that elevate colony health, security, and prestige. Maximum capacity equals Colony Size ({maxSlots} max).
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="px-3.5 py-1.5 bg-[#0b0d13] border border-[#2a344a] rounded-lg text-right">
            <div className="text-[10px] uppercase font-mono-slate text-[#94a3b8]">Capacity</div>
            <div className="text-sm font-bold font-mono-slate">
              <span className={isAtCapacity ? "text-[#ef4444]" : "text-[#86efac]"}>
                {upgrades.length}
              </span>
              <span className="text-[#64748b]"> / {maxSlots} Slots</span>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            disabled={isAtCapacity}
            className={`flex items-center space-x-2 px-3.5 py-2 font-semibold text-xs tracking-wider uppercase rounded transition shrink-0 ${
              isAtCapacity
                ? "bg-[#334155] text-[#64748b] cursor-not-allowed"
                : "bg-[#b87333] hover:bg-[#9a5b22] text-[#0d0f17] shadow"
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Commission Upgrade</span>
          </button>
        </div>
      </div>

      {isAtCapacity && (
        <div className="p-3 bg-[#eab308]/10 border border-[#eab308]/30 rounded-lg flex items-center space-x-2 text-xs text-[#fde047]">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Colony is at maximum upgrade capacity (Size {currentSize}). Expand Colony Size via growth rolls or investments to unlock further upgrade slots.
          </span>
        </div>
      )}

      {/* Installed Upgrades Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {upgrades.map((upg) => {
          const config = SUPPORT_UPGRADE_TYPES.find((t) => t.name === upg.upgrade_type);
          return (
            <div
              key={upg.id}
              className="bg-[#121520] border border-[#2a344a] hover:border-[#b87333]/50 rounded-xl p-5 flex flex-col justify-between transition shadow-md"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono-slate uppercase tracking-widest text-[#fdba74] bg-[#b87333]/20 px-2 py-0.5 rounded">
                      {config?.display_name || upg.upgrade_type}
                    </span>
                    <h3 className="text-base font-bold text-[#f8fafc] mt-1">{upg.name}</h3>
                  </div>

                  <button
                    onClick={() => onDeleteUpgrade(upg.id)}
                    title="Dismantle"
                    className="text-[#64748b] hover:text-[#ef4444] transition p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-[#94a3b8] mt-2 leading-relaxed">
                  {upg.notes || config?.description}
                </p>

                {/* Special details */}
                {upg.chosen_stat && (
                  <div className="mt-2 text-xs text-[#86efac]">
                    <span className="text-[#94a3b8]">Allocated Characteristic:</span> +1 {upg.chosen_stat.toUpperCase()}
                  </div>
                )}
                {upg.custom_product && (
                  <div className="mt-2 text-xs text-[#fdba74]">
                    <span className="text-[#94a3b8]">Manufactured Output:</span> {upg.custom_product}
                  </div>
                )}

                {/* Mechanical Bonus box */}
                <div className="mt-3 p-3 bg-[#0b0d13] border border-[#1e2538] rounded-lg text-xs space-y-1">
                  <div className="flex items-center space-x-1.5 text-[#fdba74] font-semibold text-[11px]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>MECHANICAL BENEFIT</span>
                  </div>
                  <p className="text-xs text-[#cbd5e1] leading-relaxed">
                    {config?.mechanical_description || "Provides special bonuses to exploratory endeavors."}
                  </p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1e2538] flex items-center justify-between text-[11px] text-[#64748b] font-mono-slate">
                <span>Commissioned: {new Date(upg.installed_at).toLocaleDateString()}</span>
                <span className="text-[#a1a1aa] italic">{config?.lore}</span>
              </div>
            </div>
          );
        })}
      </div>

      {upgrades.length === 0 && (
        <div className="bg-[#121520] border border-dashed border-[#334155] rounded-xl p-8 text-center text-[#94a3b8]">
          <Award className="w-8 h-8 text-[#64748b] mx-auto mb-2" />
          <p className="text-sm font-semibold">No Support Upgrades constructed on this colony.</p>
          <p className="text-xs text-[#64748b] mt-1">
            Build Arbites Precincts, Cathedrals, Mechanicum Logic Shrines, or Garrisons.
          </p>
        </div>
      )}

      {/* Modal to add upgrade */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121520] border border-[#b87333]/50 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-gothic text-[#f8fafc]">
              COMMISSION SUPPORT UPGRADE
            </h3>

            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                  Upgrade Archetype
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                >
                  {SUPPORT_UPGRADE_TYPES.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                  Structure / Landmark Name
                </label>
                <input
                  type="text"
                  placeholder={`e.g. ${currentConfig?.display_name || "Imperial Installation"}`}
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                />
              </div>

              {selectedType === "cultural_improvement" && (
                <div>
                  <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                    Select Characteristic to Boost (+1)
                  </label>
                  <select
                    value={chosenStat}
                    onChange={(e) => setChosenStat(e.target.value as any)}
                    className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                  >
                    <option value="complacency">Complacency</option>
                    <option value="order">Order</option>
                    <option value="productivity">Productivity</option>
                    <option value="piety">Piety</option>
                  </select>
                </div>
              )}

              {selectedType === "industrial_facility" && (
                <div>
                  <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                    Export Product Definition
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lock-pattern Boltguns, Voidship Hull Plates"
                    value={customProduct}
                    onChange={(e) => setCustomProduct(e.target.value)}
                    className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                  Lore & Strategic Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Architectural style, commanding officer, or patron..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#1e2538]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#1e2538] hover:bg-[#2a344a] text-xs font-semibold text-[#cbd5e1] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#b87333] hover:bg-[#9a5b22] text-xs font-semibold text-[#0d0f17] uppercase tracking-wider rounded"
                >
                  Construct Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
