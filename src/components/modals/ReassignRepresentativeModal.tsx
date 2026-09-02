import React, { useState } from "react";
import { Representative, Colony } from "../../types/colony";
import { X, UserCheck, Check } from "lucide-react";

interface ReassignRepresentativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  colony: Colony;
  representatives: Representative[];
  currentRepresentative: Representative | null;
  onReassign: (repId: string | null) => void;
}

export const ReassignRepresentativeModal: React.FC<ReassignRepresentativeModalProps> = ({
  isOpen,
  onClose,
  colony,
  representatives,
  currentRepresentative,
  onReassign,
}) => {
  const [selectedRepId, setSelectedRepId] = useState<string | null>(
    currentRepresentative?.id || null
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReassign(selectedRepId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="gothic-bracket-box w-full max-w-lg bg-[#0a0e18] border border-[#f59e0b]/60 rounded-lg shadow-2xl p-6 relative">
        <div className="gothic-bracket-bottom-left" />
        <div className="gothic-bracket-bottom-right" />

        <div className="flex items-center justify-between border-b border-[#222e46] pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-[#f59e0b]" />
            <div>
              <h2 className="font-gothic font-bold text-base tracking-wider text-[#fef08a] uppercase">
                REASSIGN COLONY REPRESENTATIVE
              </h2>
              <p className="text-xs text-[#94a3b8] font-mono-slate">
                Assign or rotate governance for {colony.name}
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
          <div className="space-y-2">
            {/* Option for Unassigned */}
            <button
              type="button"
              onClick={() => setSelectedRepId(null)}
              className={`w-full p-3 rounded border text-left transition flex items-center justify-between ${
                selectedRepId === null
                  ? "bg-[#f59e0b]/20 border-[#f59e0b] text-[#fef08a]"
                  : "bg-[#0d121f] border-[#222e46] text-[#94a3b8] hover:border-[#38bdf8]/50"
              }`}
            >
              <div>
                <span className="font-bold block">Unassigned / Remove Viceroy</span>
                <span className="text-[11px] text-[#64748b]">No active representative bonuses applied</span>
              </div>
              {selectedRepId === null && <Check className="w-4 h-4 text-[#f59e0b]" />}
            </button>

            {/* List of Representatives */}
            {representatives.map((r) => {
              const isSelected = selectedRepId === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRepId(r.id)}
                  className={`w-full p-3 rounded border text-left transition flex items-center justify-between ${
                    isSelected
                      ? "bg-[#f59e0b]/20 border-[#f59e0b] text-[#fef08a]"
                      : "bg-[#0d121f] border-[#222e46] text-[#cbd5e1] hover:border-[#38bdf8]/50"
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="font-gothic font-bold text-sm block">
                      {r.name}
                    </span>
                    <span className="text-[11px] text-[#38bdf8] block capitalize">
                      {r.title || r.representative_type} • {r.personality || "Scholarly"}
                    </span>
                    <span className="text-[10px] text-[#94a3b8] block">
                      {r.special_mechanics || "+5 bonus to Acquisition tests"}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-[#f59e0b]" />}
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#222e46]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#121828] hover:bg-[#1a233a] border border-[#2c364d] text-xs text-[#94a3b8] hover:text-white rounded uppercase font-semibold transition"
            >
              Cancel
            </button>
            <button
              id="modal-reassign-submit"
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-[#b45309] to-[#f59e0b] hover:from-[#d97706] hover:to-[#fcd34d] text-[#06080e] font-gothic font-bold text-xs uppercase tracking-wider rounded transition shadow-lg"
            >
              Confirm Reassignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
