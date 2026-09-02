import React, { useState } from "react";
import { Infrastructure, InfrastructureType } from "../../types/colony";
import { INFRASTRUCTURE_TYPES } from "../../data/rulesData";
import { X, Layers, Check } from "lucide-react";

interface CommissionHardInfrastructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  colonyId: string;
  onCommission: (infraData: Omit<Infrastructure, "id">) => void;
}

export const CommissionHardInfrastructureModal: React.FC<CommissionHardInfrastructureModalProps> = ({
  isOpen,
  onClose,
  colonyId,
  onCommission,
}) => {
  const [infraType, setInfraType] = useState<InfrastructureType>("transport");
  const [name, setName] = useState("");
  const [state, setState] = useState<Infrastructure["state"]>("working");
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const typeConfig = INFRASTRUCTURE_TYPES.find((i) => i.name === infraType);

    onCommission({
      colony_id: colonyId,
      infrastructure_type: infraType,
      name: name.trim() || `${typeConfig?.display_name || infraType} System`,
      state,
      notes: notes.trim() || typeConfig?.description || "Imperial standard installation.",
      active_effects: typeConfig?.working_modifiers.map((e) => ({
        stat: e.stat as any,
        value: e.value,
      })) || [],
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
            <Layers className="w-5 h-5 text-[#f59e0b]" />
            <div>
              <h2 className="font-gothic font-bold text-base tracking-wider text-[#fef08a] uppercase">
                COMMISSION HARD INFRASTRUCTURE
              </h2>
              <p className="text-xs text-[#94a3b8] font-mono-slate">
                Deploy primary planetary logistics, power, transport, or communications
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
          {/* Infrastructure Type Grid */}
          <div>
            <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1.5 font-semibold">
              Select Infrastructure Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INFRASTRUCTURE_TYPES.map((type) => {
                const isSelected = infraType === type.name;
                return (
                  <button
                    key={type.name}
                    type="button"
                    onClick={() => {
                      setInfraType(type.name);
                      if (!name) setName(`${type.display_name} System`);
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
                    <p className="text-[10px] text-[#94a3b8] mt-0.5">
                      {type.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* System Name */}
          <div>
            <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
              Custom System Designation / Name
            </label>
            <input
              id="modal-infra-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maglev Ore Chutes & Spaceport Alpha"
              className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
            />
          </div>

          {/* Initial Status */}
          <div>
            <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
              Initial Operational Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["working", "not_working", "in_progress", "needed"] as Infrastructure["state"][]).map(
                (st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setState(st)}
                    className={`py-2 rounded border text-center uppercase font-bold text-[11px] transition ${
                      state === st
                        ? st === "working"
                          ? "bg-[#10b981] text-[#06080e] border-[#10b981]"
                          : st === "not_working"
                          ? "bg-[#ef4444] text-white border-[#ef4444]"
                          : st === "in_progress"
                          ? "bg-[#f59e0b] text-[#06080e] border-[#f59e0b]"
                          : "bg-[#64748b] text-white border-[#64748b]"
                        : "bg-[#0d121f] border-[#222e46] text-[#94a3b8] hover:text-white"
                    }`}
                  >
                    {st.replace(/_/g, " ")}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Operational Notes */}
          <div>
            <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
              Operational Notes
            </label>
            <textarea
              id="modal-infra-notes-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Technical specs, power output, or maintenance cycle..."
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
              id="modal-commission-infra-submit"
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-[#b45309] to-[#f59e0b] hover:from-[#d97706] hover:to-[#fcd34d] text-[#06080e] font-gothic font-bold text-xs uppercase tracking-wider rounded transition shadow-lg"
            >
              Commission System
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
