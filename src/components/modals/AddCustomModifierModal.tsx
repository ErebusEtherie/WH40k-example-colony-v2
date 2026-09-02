import React, { useState } from "react";
import { Modifier, ColonyStatKey } from "../../types/colony";
import { X, Plus, Sparkles } from "lucide-react";

interface AddCustomModifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  colonyId: string;
  onAddModifier: (modifierData: Omit<Modifier, "id" | "created_at">) => void;
}

export const AddCustomModifierModal: React.FC<AddCustomModifierModalProps> = ({
  isOpen,
  onClose,
  colonyId,
  onAddModifier,
}) => {
  const [name, setName] = useState("");
  const [targetStat, setTargetStat] = useState<ColonyStatKey>("order");
  const [value, setValue] = useState(1);
  const [source, setSource] = useState("GM Ruling");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddModifier({
      colony_id: colonyId,
      name: name.trim(),
      modifier_stat: targetStat,
      modifier_value: value,
      source: source.trim() || "GM Ruling",
      description: description.trim(),
      is_active: isActive,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="gothic-bracket-box w-full max-w-xl bg-[#0a0e18] border border-[#f59e0b]/60 rounded-lg shadow-2xl p-6 relative">
        <div className="gothic-bracket-bottom-left" />
        <div className="gothic-bracket-bottom-right" />

        <div className="flex items-center justify-between border-b border-[#222e46] pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#f59e0b]" />
            <div>
              <h2 className="font-gothic font-bold text-base tracking-wider text-[#fef08a] uppercase">
                ADD CUSTOM GM MODIFIER
              </h2>
              <p className="text-xs text-[#94a3b8] font-mono-slate">
                Record custom tabletop event outcomes and situational modifiers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#64748b] hover:text-white p-1 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 font-mono-slate text-xs">
          {/* Modifier Name */}
          <div>
            <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
              Modifier Title / Name *
            </label>
            <input
              id="modal-modifier-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lord Captain Warrant of Trade Imperial Mandate"
              className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
            />
          </div>

          {/* Target Stat & Value */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
                Target Characteristic / Stat
              </label>
              <select
                id="modal-modifier-stat-select"
                value={targetStat}
                onChange={(e) => setTargetStat(e.target.value as ColonyStatKey)}
                className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none uppercase font-bold"
              >
                <option value="complacency">Complacency</option>
                <option value="order">Order</option>
                <option value="productivity">Productivity</option>
                <option value="piety">Piety</option>
                <option value="size">Colony Size</option>
                <option value="profit_factor">Profit Factor (PF)</option>
              </select>
            </div>

            <div>
              <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
                Modifier Value (+ / -)
              </label>
              <input
                id="modal-modifier-value-input"
                type="number"
                value={value}
                onChange={(e) => setValue(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
              />
            </div>
          </div>

          {/* Source Rationale */}
          <div>
            <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
              Source Rationale
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. GM Ruling, Dynasty Edict, Tabletop Event"
              className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
              Detailed Context & Lore Rationale
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Record the in-game event that triggered this modifier..."
              className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="modifier-active-checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded bg-[#070a12] border-[#252f44] text-[#f59e0b] focus:ring-0"
            />
            <label htmlFor="modifier-active-checkbox" className="text-[#cbd5e1] uppercase text-[11px] font-semibold cursor-pointer">
              Enable modifier immediately in active calculations
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#222e46]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#121828] hover:bg-[#1a233a] border border-[#2c364d] text-xs text-[#94a3b8] hover:text-white rounded uppercase font-semibold transition"
            >
              Cancel
            </button>
            <button
              id="modal-add-modifier-submit"
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-[#b45309] to-[#f59e0b] hover:from-[#d97706] hover:to-[#fcd34d] text-[#06080e] font-gothic font-bold text-xs uppercase tracking-wider rounded transition shadow-lg"
            >
              Register Modifier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
