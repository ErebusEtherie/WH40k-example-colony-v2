import React, { useState } from "react";
import {
  Representative,
  RepresentativeType,
  Colony,
  Characteristics,
} from "../../types/colony";
import { REPRESENTATIVE_TYPES } from "../../data/rulesData";
import { X, UserCheck, Check, Shield } from "lucide-react";

interface CommissionRepresentativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  colonies: Colony[];
  onCommission: (repData: Omit<Representative, "id" | "created_at">) => void;
}

export const CommissionRepresentativeModal: React.FC<CommissionRepresentativeModalProps> = ({
  isOpen,
  onClose,
  colonies,
  onCommission,
}) => {
  const [name, setName] = useState("");
  const [repType, setRepType] = useState<RepresentativeType>("satrap");
  const [personality, setPersonality] = useState("scholarly");
  const [assignedColonyId, setAssignedColonyId] = useState<string>("");
  const [specialMechanics, setSpecialMechanics] = useState(
    "None / +5 bonus to Acquisition Tests for purchasing goods on this particular Colony."
  );
  const [chars, setChars] = useState<Characteristics>({
    ws: 35,
    bs: 40,
    s: 30,
    t: 38,
    ag: 35,
    int: 52,
    per: 45,
    wp: 48,
    fel: 55,
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const repTypeConfig = REPRESENTATIVE_TYPES.find((r) => r.name === repType);

    onCommission({
      name: name.trim(),
      title: repTypeConfig?.display_name || repType,
      representative_type: repType,
      theme: repTypeConfig?.special_rule || "General Administration",
      personality,
      assigned_colony_id: assignedColonyId ? assignedColonyId : null,
      stat_bonus: 5,
      special_mechanics: specialMechanics.trim(),
      characteristics: chars,
      personality_traits: [
        {
          id: personality,
          name: personality.charAt(0).toUpperCase() + personality.slice(1).replace(/_/g, " "),
          stat_tag: "PRODUCTIVITY",
          description: "Balances and stabilizes the colony.",
          effect: "+1 to lowest characteristic when installed",
        },
      ],
      skills: ["Commerce", "Scholastic Lore (Imperial Bureaucracy)", "Logic"],
      talents: ["Peer (Nobility)", "Air of Authority"],
      notes: "Appointed by Dynasty Warrant of Trade.",
    });

    onClose();
  };

  const handleCharChange = (key: keyof Characteristics, val: string) => {
    const num = parseInt(val, 10) || 0;
    setChars((prev) => ({ ...prev, [key]: num }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="gothic-bracket-box w-full max-w-2xl bg-[#0a0e18] border border-[#f59e0b]/60 rounded-lg shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <div className="gothic-bracket-bottom-left" />
        <div className="gothic-bracket-bottom-right" />

        <div className="flex items-center justify-between border-b border-[#222e46] pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-[#f59e0b]" />
            <div>
              <h2 className="font-gothic font-bold text-base tracking-wider text-[#fef08a] uppercase">
                COMMISSION NEW REPRESENTATIVE
              </h2>
              <p className="text-xs text-[#94a3b8] font-mono-slate">
                Appoint an Imperial administrator, military commander, or ecclesiarch
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
          {/* Row 1: Name and Assignment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
                Representative Full Name & Title *
              </label>
              <input
                id="modal-rep-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Arch-Satrap Alexis Valancius"
                className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
                Domain Colony Assignment
              </label>
              <select
                id="modal-rep-colony-select"
                value={assignedColonyId}
                onChange={(e) => setAssignedColonyId(e.target.value)}
                className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
              >
                <option value="">Unassigned (Ledger Reserve)</option>
                {colonies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.colony_type.replace(/_/g, " ")})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Role Archetype Selection */}
          <div>
            <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1.5 font-semibold">
              Role Archetype
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {REPRESENTATIVE_TYPES.map((type) => {
                const isSelected = repType === type.name;
                return (
                  <button
                    key={type.name}
                    type="button"
                    onClick={() => setRepType(type.name)}
                    className={`p-2 rounded border text-left transition ${
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
                    <span className="text-[10px] text-[#38bdf8] block">
                      {type.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Personality Profile */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
                Personality Matrix Archetype
              </label>
              <select
                id="modal-rep-personality-select"
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none capitalize"
              >
                <option value="scholarly">Scholarly (Productivity Boost)</option>
                <option value="zealous">Zealous (Piety & Order)</option>
                <option value="military_minded">Military Minded (Order & Defense)</option>
                <option value="ambitious">Ambitious (Profit Factor Focus)</option>
                <option value="cautious">Cautious (Risk Aversion)</option>
                <option value="greedy">Greedy (Trade Tariffs)</option>
              </select>
            </div>

            <div>
              <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
                Special Mechanics Note
              </label>
              <input
                id="modal-rep-special-input"
                type="text"
                value={specialMechanics}
                onChange={(e) => setSpecialMechanics(e.target.value)}
                className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
              />
            </div>
          </div>

          {/* Row 4: Characteristics Matrix (9 stats) */}
          <div>
            <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1.5 font-semibold">
              Initial Characteristics (0-100)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
              {(["ws", "bs", "s", "t", "ag", "int", "per", "wp", "fel"] as (keyof Characteristics)[]).map(
                (statKey) => (
                  <div key={statKey} className="p-1.5 bg-[#070a12] border border-[#1e293b] rounded text-center">
                    <span className="text-[10px] uppercase font-bold text-[#f59e0b] block mb-1">
                      {statKey}
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={chars[statKey]}
                      onChange={(e) => handleCharChange(statKey, e.target.value)}
                      className="w-full bg-transparent text-center font-bold text-xs text-[#f8fafc] focus:outline-none"
                    />
                  </div>
                )
              )}
            </div>
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
              id="modal-commission-submit"
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-[#b45309] to-[#f59e0b] hover:from-[#d97706] hover:to-[#fcd34d] text-[#06080e] font-gothic font-bold text-xs uppercase tracking-wider rounded transition shadow-lg"
            >
              Commission Representative
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
