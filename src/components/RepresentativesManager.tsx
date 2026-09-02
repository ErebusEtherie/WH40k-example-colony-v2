import React, { useState } from "react";
import { Colony, Representative } from "../types/colony";
import { PERSONALITIES, REPRESENTATIVE_TYPES, LEADERSHIP_MODIFIERS } from "../data/rulesData";
import { User, Shield, UserCheck, Plus, Trash2, Award, Sparkles } from "lucide-react";

interface RepresentativesManagerProps {
  colony: Colony;
  allRepresentatives: Representative[];
  onAssign: (repId: string, colonyId: string | null) => void;
  onCreateRepresentative: (data: Partial<Representative>) => void;
  onDeleteRepresentative: (repId: string) => void;
}

export const RepresentativesManager: React.FC<RepresentativesManagerProps> = ({
  colony,
  allRepresentatives,
  onAssign,
  onCreateRepresentative,
  onDeleteRepresentative,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [repType, setRepType] = useState(REPRESENTATIVE_TYPES[0].name);
  const [personality, setPersonality] = useState(PERSONALITIES[0].name);
  const [statBonus, setStatBonus] = useState<number>(4);
  const [notes, setNotes] = useState("");

  const assignedRep = allRepresentatives.find((r) => r.assigned_colony_id === colony.id);
  const availableReps = allRepresentatives.filter((r) => r.assigned_colony_id !== colony.id);

  const selectedTypeConfig = REPRESENTATIVE_TYPES.find((t) => t.name === repType);
  const selectedPersonalityConfig = PERSONALITIES.find((p) => p.name === personality);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    onCreateRepresentative({
      name,
      title: title || selectedTypeConfig?.display_name || "Imperial Representative",
      representative_type: repType,
      theme: selectedTypeConfig?.special_rule || "Exploration",
      personality,
      stat_bonus: Number(statBonus),
      notes,
      assigned_colony_id: colony.id, // Auto-assign to current colony if desired
    });

    setName("");
    setTitle("");
    setNotes("");
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#121520] border border-[#262f44] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-[#fdba74]" />
            <h2 className="text-xl font-bold font-gothic text-[#f8fafc]">
              REPRESENTATIVES & GOVERNANCE
            </h2>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1">
            Appointed leaders, arbiters, tech-priests, and clergy who govern on behalf of the Rogue Trader dynasty. Their personality and leadership modify stats and cycle Profit Factor.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-3.5 py-2 bg-[#b87333] hover:bg-[#9a5b22] text-[#0d0f17] font-semibold text-xs tracking-wider uppercase rounded transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Recruit Representative</span>
        </button>
      </div>

      {/* Active Colony Governor Card */}
      <div className="bg-[#121520] border border-[#b87333]/40 rounded-xl p-6 shadow-xl relative overflow-hidden gothic-corner">
        <div className="text-xs uppercase font-mono-slate tracking-widest text-[#fdba74] mb-3 flex items-center space-x-1.5">
          <UserCheck className="w-4 h-4" />
          <span>Appointed Governor for {colony.name}</span>
        </div>

        {assignedRep ? (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <h3 className="text-2xl font-bold text-[#f8fafc] font-gothic">
                  {assignedRep.name}
                </h3>
                <span className="px-2.5 py-0.5 bg-[#b87333]/20 text-[#fdba74] border border-[#b87333]/40 text-xs font-semibold rounded">
                  {assignedRep.title}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-0.5 bg-[#1e2538] text-[#cbd5e1] rounded font-mono-slate">
                  Type: {assignedRep.representative_type.toUpperCase()}
                </span>
                <span className="px-2 py-0.5 bg-[#1e2538] text-[#fdba74] rounded font-mono-slate">
                  Personality: {assignedRep.personality.replace(/_/g, " ").toUpperCase()}
                </span>
                <span className="px-2 py-0.5 bg-[#1e2538] text-[#86efac] rounded font-mono-slate">
                  Stat Bonus: {assignedRep.stat_bonus} (
                  {LEADERSHIP_MODIFIERS[assignedRep.stat_bonus] >= 0
                    ? `+${LEADERSHIP_MODIFIERS[assignedRep.stat_bonus]}`
                    : LEADERSHIP_MODIFIERS[assignedRep.stat_bonus]}{" "}
                  PF)
                </span>
              </div>

              <p className="text-xs text-[#94a3b8] max-w-2xl leading-relaxed">
                {assignedRep.notes ||
                  PERSONALITIES.find((p) => p.name === assignedRep.personality)?.description}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3 shrink-0">
              <button
                onClick={() => onAssign(assignedRep.id, null)}
                className="px-3.5 py-1.5 bg-[#450a0a]/60 hover:bg-[#7f1d1d] text-xs font-semibold text-[#fca5a5] border border-[#dc2626]/40 rounded transition"
              >
                Recall from Post
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 border border-dashed border-[#334155] rounded-lg">
            <User className="w-8 h-8 text-[#64748b] mx-auto mb-2" />
            <p className="text-sm font-semibold text-[#f1f5f9]">No Governor Appointed</p>
            <p className="text-xs text-[#64748b] mt-1">
              Select an unassigned representative from the roster below or recruit a new dignitary.
            </p>
          </div>
        )}
      </div>

      {/* Available Roster Section */}
      <div className="space-y-3">
        <h3 className="font-gothic font-bold text-sm text-[#f8fafc] flex items-center space-x-2">
          <Award className="w-4 h-4 text-[#fdba74]" />
          <span>DYNASTY REPRESENTATIVE ROSTER ({allRepresentatives.length} Personnel)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allRepresentatives.map((rep) => {
            const isCurrentGovernor = rep.assigned_colony_id === colony.id;
            const personalityObj = PERSONALITIES.find((p) => p.name === rep.personality);
            return (
              <div
                key={rep.id}
                className={`bg-[#121520] border rounded-xl p-4 flex flex-col justify-between transition ${
                  isCurrentGovernor ? "border-[#b87333] shadow-md" : "border-[#2a344a]"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-base font-bold text-[#f8fafc]">{rep.name}</h4>
                      <div className="text-xs text-[#fdba74] font-medium">{rep.title}</div>
                    </div>

                    <button
                      onClick={() => onDeleteRepresentative(rep.id)}
                      title="Dismiss from Dynasty"
                      className="text-[#64748b] hover:text-[#ef4444] p-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="mt-2.5 space-y-1 text-xs">
                    <div className="text-[#cbd5e1]">
                      <span className="text-[#64748b]">Personality:</span>{" "}
                      <span className="text-[#fdba74] font-medium">
                        {personalityObj?.display_name || rep.personality}
                      </span>
                    </div>
                    <div className="text-[#cbd5e1]">
                      <span className="text-[#64748b]">Stat Bonus:</span>{" "}
                      <span className="font-mono-slate font-semibold">{rep.stat_bonus}</span> (
                      {LEADERSHIP_MODIFIERS[rep.stat_bonus] >= 0
                        ? `+${LEADERSHIP_MODIFIERS[rep.stat_bonus]}`
                        : LEADERSHIP_MODIFIERS[rep.stat_bonus]}{" "}
                      PF)
                    </div>
                    <p className="text-[11px] text-[#94a3b8] mt-1 line-clamp-2">
                      {personalityObj?.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#1e2538] flex items-center justify-between">
                  <span className="text-[11px] font-mono-slate text-[#64748b]">
                    {rep.assigned_colony_id
                      ? isCurrentGovernor
                        ? "Governing this world"
                        : "Assigned elsewhere"
                      : "Awaiting assignment"}
                  </span>

                  {!isCurrentGovernor && (
                    <button
                      onClick={() => onAssign(rep.id, colony.id)}
                      className="px-2.5 py-1 bg-[#b87333]/20 hover:bg-[#b87333] text-[#fdba74] hover:text-[#0d0f17] border border-[#b87333]/50 text-xs font-semibold rounded transition"
                    >
                      Appoint Governor
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recruitment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121520] border border-[#b87333]/50 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-gothic text-[#f8fafc]">
              RECRUIT DYNASTY REPRESENTATIVE
            </h3>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                  Representative Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Commander Ignatius Drake"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                  Imperial Title / Rank
                </label>
                <input
                  type="text"
                  placeholder="e.g. High Arbiter, Arch-Magos, Void Marshal"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                    Archetype / Role
                  </label>
                  <select
                    value={repType}
                    onChange={(e) => setRepType(e.target.value)}
                    className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                  >
                    {REPRESENTATIVE_TYPES.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.display_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                    Personality
                  </label>
                  <select
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                  >
                    {PERSONALITIES.map((p) => (
                      <option key={p.name} value={p.name}>
                        {p.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                  Leadership Stat Bonus: {statBonus} (
                  {LEADERSHIP_MODIFIERS[statBonus] >= 0
                    ? `+${LEADERSHIP_MODIFIERS[statBonus]}`
                    : LEADERSHIP_MODIFIERS[statBonus]}{" "}
                  PF Modifier)
                </label>
                <input
                  type="range"
                  min="2"
                  max="6"
                  value={statBonus}
                  onChange={(e) => setStatBonus(Number(e.target.value))}
                  className="w-full accent-[#b87333]"
                />
                <div className="flex justify-between text-[10px] text-[#64748b] font-mono-slate">
                  <span>2 (-2 PF)</span>
                  <span>3 (-1 PF)</span>
                  <span>4 (0 PF)</span>
                  <span>5 (+1 PF)</span>
                  <span>6 (+2 PF)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                  Background Lore & History
                </label>
                <textarea
                  rows={2}
                  placeholder="Record credentials, allegiances, or past deeds..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#1e2538]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-[#1e2538] hover:bg-[#2a344a] text-xs font-semibold text-[#cbd5e1] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#b87333] hover:bg-[#9a5b22] text-xs font-semibold text-[#0d0f17] uppercase tracking-wider rounded"
                >
                  Confirm Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
