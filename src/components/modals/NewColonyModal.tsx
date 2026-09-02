import React, { useState } from "react";
import { ColonyType } from "../../types/colony";
import { COLONY_TYPES } from "../../data/rulesData";
import { X, Building2, Landmark, Check } from "lucide-react";

interface NewColonyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateColony: (colonyData: {
    name: string;
    star_system: string;
    colony_type: ColonyType;
    base_size: number;
    founder_name: string;
    notes: string;
  }) => void;
}

export const NewColonyModal: React.FC<NewColonyModalProps> = ({
  isOpen,
  onClose,
  onCreateColony,
}) => {
  const [name, setName] = useState("");
  const [starSystem, setStarSystem] = useState("Mundus Valancius");
  const [colonyType, setColonyType] = useState<ColonyType>("mining_and_industry");
  const [baseSize, setBaseSize] = useState(1);
  const [founderName, setFounderName] = useState("Von Valancius Dynasty");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please specify a valid colony designation.");
      return;
    }

    onCreateColony({
      name: name.trim(),
      star_system: starSystem.trim() || "Mundus Valancius",
      colony_type: colonyType,
      base_size: baseSize,
      founder_name: founderName.trim() || "Von Valancius Dynasty",
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="gothic-bracket-box w-full max-w-2xl bg-[#0a0e18] border border-[#f59e0b]/60 rounded-lg shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <div className="gothic-bracket-bottom-left" />
        <div className="gothic-bracket-bottom-right" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#222e46] pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Landmark className="w-5 h-5 text-[#f59e0b]" />
            <div>
              <h2 className="font-gothic font-bold text-base tracking-wider text-[#fef08a] uppercase">
                FOUND NEW IMPERIAL COLONY
              </h2>
              <p className="text-xs text-[#94a3b8] font-mono-slate">
                Charter a new planetary domain in the Koronus Expanse
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

        {error && (
          <div className="mb-4 p-2.5 bg-[#ef4444]/15 border border-[#ef4444]/50 rounded text-xs font-mono-slate text-[#fca5a5]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono-slate text-xs">
          {/* Row 1: Designation and Star System */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
                Colony Designation / Name *
              </label>
              <input
                id="modal-colony-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Castellax Secundus"
                className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
                Star System / Sector
              </label>
              <input
                id="modal-colony-system-input"
                type="text"
                value={starSystem}
                onChange={(e) => setStarSystem(e.target.value)}
                placeholder="e.g. Mundus Valancius"
                className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
              />
            </div>
          </div>

          {/* Row 2: Colony Charter Type Selector */}
          <div>
            <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1.5 font-semibold">
              Colony Charter Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {COLONY_TYPES.map((type) => {
                const isSelected = colonyType === type.name;
                return (
                  <button
                    key={type.name}
                    type="button"
                    onClick={() => setColonyType(type.name as ColonyType)}
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
                    <p className="text-[10px] text-[#94a3b8] mt-1 leading-snug">
                      {type.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Initial Size & Founder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
                Initial Settlement Size (0-10)
              </label>
              <input
                id="modal-colony-size-input"
                type="number"
                min="0"
                max="10"
                value={baseSize}
                onChange={(e) => setBaseSize(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
                Founding Dynasty / Founder
              </label>
              <input
                id="modal-colony-founder-input"
                type="text"
                value={founderName}
                onChange={(e) => setFounderName(e.target.value)}
                placeholder="Von Valancius Dynasty"
                className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
              />
            </div>
          </div>

          {/* Row 4: Notes */}
          <div>
            <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
              Colony Dossier Notes & Strategic Intent
            </label>
            <textarea
              id="modal-colony-notes-input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record planetary geology, strategic value, or dynasty edicts..."
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
              id="modal-found-colony-submit"
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-[#b45309] to-[#f59e0b] hover:from-[#d97706] hover:to-[#fcd34d] text-[#06080e] font-gothic font-bold text-xs uppercase tracking-wider rounded transition shadow-lg"
            >
              Establish Colony Charter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
