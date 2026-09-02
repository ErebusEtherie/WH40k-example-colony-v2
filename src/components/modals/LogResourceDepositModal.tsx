import React, { useState } from "react";
import { ColonyResource } from "../../types/colony";
import { X, Sparkles, Plus } from "lucide-react";

interface LogResourceDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  colonyId: string;
  onLogResource: (resourceData: Omit<ColonyResource, "id">) => void;
}

export const LogResourceDepositModal: React.FC<LogResourceDepositModalProps> = ({
  isOpen,
  onClose,
  colonyId,
  onLogResource,
}) => {
  const [name, setName] = useState("");
  const [resourceType, setResourceType] = useState("Mineral");
  const [abundance, setAbundance] = useState<"Scarce" | "Moderate" | "Abundant" | "Plentiful" | "Rich">("Abundant");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onLogResource({
      colony_id: colonyId,
      name: name.trim(),
      resource_type: resourceType,
      category: `${resourceType} Resources`,
      abundance,
      productivity_bonus: 0,
      pf_bonus: 0,
      description: description.trim() || "Surveyed planetary deposit.",
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="gothic-bracket-box w-full max-w-lg bg-[#0a0e18] border border-[#f59e0b]/60 rounded-lg shadow-2xl p-6 relative">
        <div className="gothic-bracket-bottom-left" />
        <div className="gothic-bracket-bottom-right" />

        <div className="flex items-center justify-between border-b border-[#222e46] pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#f59e0b]" />
            <div>
              <h2 className="font-gothic font-bold text-base tracking-wider text-[#fef08a] uppercase">
                LOG NATURAL RESOURCE DEPOSIT
              </h2>
              <p className="text-xs text-[#94a3b8] font-mono-slate">
                Record surveyed ore veins, promethium reserves, or archeotech caches
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
          {/* Deposit Name */}
          <div>
            <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
              Deposit Name / Vein Designation *
            </label>
            <input
              id="modal-resource-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Adamantium Ore Veins"
              className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
            />
          </div>

          {/* Type & Abundance */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
                Resource Category / Type
              </label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
              >
                <option value="Mineral">Mineral / Heavy Metals</option>
                <option value="Fuel / Energy">Fuel / Promethium</option>
                <option value="Archeotech">Archeotech / STC Vaults</option>
                <option value="Agriculture / Flora">Agricultural / Bio-matter</option>
                <option value="Exotic Organics">Exotic Organics / Xenotech</option>
              </select>
            </div>

            <div>
              <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
                Abundance Rating
              </label>
              <select
                value={abundance}
                onChange={(e) => setAbundance(e.target.value as any)}
                className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none uppercase font-bold"
              >
                <option value="Abundant">Abundant</option>
                <option value="Plentiful">Plentiful</option>
                <option value="Moderate">Moderate</option>
                <option value="Scarce">Scarce</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
              Survey & Extraction Details
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Core extraction complexes, mining shafts, or refinery conduits..."
              className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
            />
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
              id="modal-log-resource-submit"
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-[#b45309] to-[#f59e0b] hover:from-[#d97706] hover:to-[#fcd34d] text-[#06080e] font-gothic font-bold text-xs uppercase tracking-wider rounded transition shadow-lg"
            >
              Log Deposit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
