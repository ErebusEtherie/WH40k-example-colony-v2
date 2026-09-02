import React, { useState } from "react";
import { SupportUpgrade, UpgradeType } from "../../types/colony";
import { UPGRADE_TYPES } from "../../data/rulesData";
import { X, Shield, Check } from "lucide-react";

interface AddSupportUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  colonyId: string;
  onInstall: (upgradeData: Omit<SupportUpgrade, "id">) => void;
}

export const AddSupportUpgradeModal: React.FC<AddSupportUpgradeModalProps> = ({
  isOpen,
  onClose,
  colonyId,
  onInstall,
}) => {
  const [upgradeType, setUpgradeType] = useState<UpgradeType>("arbites_precinct");
  const [name, setName] = useState("");
  const [state, setState] = useState<SupportUpgrade["state"]>("working");
  const [customProduct, setCustomProduct] = useState("");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const typeConfig = UPGRADE_TYPES.find((u) => u.name === upgradeType);

    onInstall({
      colony_id: colonyId,
      upgrade_type: upgradeType,
      name: name.trim() || typeConfig?.display_name || upgradeType.replace(/_/g, " "),
      state,
      custom_product: upgradeType === "industrial_facility" ? customProduct.trim() : undefined,
      description: description.trim() || typeConfig?.description || "Specialized Imperial installation.",
      mechanical_description: typeConfig?.mechanical_description,
      installed_at: new Date().toISOString(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="gothic-bracket-box w-full max-w-2xl bg-[#0a0e18] border border-[#f59e0b]/60 rounded-lg shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <div className="gothic-bracket-bottom-left" />
        <div className="gothic-bracket-bottom-right" />

        <div className="flex items-center justify-between border-b border-[#222e46] pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-[#f59e0b]" />
            <div>
              <h2 className="font-gothic font-bold text-base tracking-wider text-[#fef08a] uppercase">
                INSTALL SUPPORT UPGRADE
              </h2>
              <p className="text-xs text-[#94a3b8] font-mono-slate">
                Commission Arbites precincts, logic shrines, orbital docks, or garrisons
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
          {/* Upgrade Type Grid */}
          <div>
            <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1.5 font-semibold">
              Select Upgrade Facility
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {UPGRADE_TYPES.map((type) => {
                const isSelected = upgradeType === type.name;
                return (
                  <button
                    key={type.name}
                    type="button"
                    onClick={() => {
                      setUpgradeType(type.name);
                      if (!name) setName(type.display_name);
                    }}
                    className={`p-2.5 rounded border text-left transition ${
                      isSelected
                        ? "bg-[#f59e0b]/20 border-[#f59e0b] text-[#fef08a]"
                        : "bg-[#0d121f] border-[#222e46] text-[#cbd5e1] hover:border-[#38bdf8]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-gothic font-bold text-xs uppercase block">
                        {type.display_name}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#f59e0b]" />}
                    </div>
                    <p className="text-[10px] text-[#94a3b8] mt-0.5 leading-tight">
                      {type.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Upgrade Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
                Facility Designation / Name
              </label>
              <input
                id="modal-upgrade-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Adeptus Arbites Fortress-Precinct"
                className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
                Operational Status
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value as SupportUpgrade["state"])}
                className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none uppercase font-bold"
              >
                <option value="working">WORKING</option>
                <option value="not_working">NOT WORKING</option>
                <option value="in_progress">IN PROGRESS</option>
              </select>
            </div>
          </div>

          {/* Industrial Product (if industrial facility) */}
          {upgradeType === "industrial_facility" && (
            <div>
              <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
                Manufactured Product
              </label>
              <input
                type="text"
                value={customProduct}
                onChange={(e) => setCustomProduct(e.target.value)}
                placeholder="e.g. Macro-cannon Shells & Void Armor Plating"
                className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
              Facility Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Operational details, garrison roster, or tech specs..."
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
              id="modal-install-upgrade-submit"
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-[#b45309] to-[#f59e0b] hover:from-[#d97706] hover:to-[#fcd34d] text-[#06080e] font-gothic font-bold text-xs uppercase tracking-wider rounded transition shadow-lg"
            >
              Install Upgrade
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
