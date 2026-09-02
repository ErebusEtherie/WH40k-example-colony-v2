import React, { useState } from "react";
import { COLONY_TYPES } from "../data/rulesData";
import { Shield, Plus } from "lucide-react";

interface NewColonyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateColony: (name: string, colonyType: string, baseSize: number, notes?: string) => void;
}

export const NewColonyModal: React.FC<NewColonyModalProps> = ({
  isOpen,
  onClose,
  onCreateColony,
}) => {
  const [name, setName] = useState("");
  const [colonyType, setColonyType] = useState(COLONY_TYPES[0].name);
  const [baseSize, setBaseSize] = useState<number>(1);
  const [notes, setNotes] = useState("");

  if (!isOpen) return null;

  const selectedTypeConfig = COLONY_TYPES.find((t) => t.name === colonyType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    onCreateColony(name, colonyType, Number(baseSize), notes);
    setName("");
    setNotes("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#121520] border border-[#b87333]/50 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4 gothic-corner">
        <div className="flex items-center space-x-2 text-[#fdba74]">
          <Shield className="w-5 h-5" />
          <h3 className="text-xl font-bold font-gothic text-[#f8fafc]">
            FOUND NEW ROGUE TRADER COLONY
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
              Colony Designation / World Name
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Aurelia Secundus, Port Wander Bastion"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                Colony Archetype
              </label>
              <select
                value={colonyType}
                onChange={(e) => setColonyType(e.target.value)}
                className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
              >
                {COLONY_TYPES.map((t) => (
                  <option key={t.name} value={t.name}>
                    {t.display_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                Initial Size (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={baseSize}
                onChange={(e) => setBaseSize(Number(e.target.value))}
                className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc] font-mono-slate"
              />
            </div>
          </div>

          {/* Archetype stats preview */}
          {selectedTypeConfig && (
            <div className="bg-[#0b0d13] p-3 rounded-lg border border-[#1e2538] space-y-2">
              <div className="text-xs text-[#cbd5e1]">{selectedTypeConfig.description}</div>
              <div className="flex flex-wrap gap-2 text-xs font-mono-slate">
                <span className="bg-[#1e2538] px-2 py-0.5 rounded text-[#fb923c]">
                  Base Complacency: {selectedTypeConfig.base_stats.complacency}
                </span>
                <span className="bg-[#1e2538] px-2 py-0.5 rounded text-[#60a5fa]">
                  Base Order: {selectedTypeConfig.base_stats.order}
                </span>
                <span className="bg-[#1e2538] px-2 py-0.5 rounded text-[#facc15]">
                  Base Productivity: {selectedTypeConfig.base_stats.productivity}
                </span>
                <span className="bg-[#1e2538] px-2 py-0.5 rounded text-[#c084fc]">
                  Base Piety: {selectedTypeConfig.base_stats.piety}
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
              Colony Charter Notes & Lore
            </label>
            <textarea
              rows={2}
              placeholder="Record climate, imperial tithe grade, planetary quirks..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-[#1e2538]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#1e2538] hover:bg-[#2a344a] text-xs font-semibold text-[#cbd5e1] rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-2 bg-[#b87333] hover:bg-[#9a5b22] text-xs font-semibold text-[#0d0f17] uppercase tracking-wider rounded"
            >
              <Plus className="w-4 h-4" />
              <span>Sanction Colony Charter</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
