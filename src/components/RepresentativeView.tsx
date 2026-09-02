import React, { useState } from "react";
import { Representative, Colony } from "../types/colony";
import {
  UserCheck,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  Shield,
  Award,
  BookOpen,
  Check,
  X,
  User,
} from "lucide-react";

interface RepresentativeViewProps {
  representatives: Representative[];
  selectedRepresentative: Representative | null;
  colonies: Colony[];
  onSelectRepresentative: (rep: Representative) => void;
  onOpenCommissionModal: () => void;
  onOpenReassignModal: (rep: Representative) => void;
  onUpdateCharacteristics: (repId: string, charKey: string, delta: number) => void;
  onAddSkill: (repId: string, skill: string) => void;
  onRemoveSkill: (repId: string, skill: string) => void;
  onAddTalent: (repId: string, talent: string) => void;
  onRemoveTalent: (repId: string, talent: string) => void;
  onRenameRepresentative: (repId: string, newName: string) => void;
}

export const RepresentativeView: React.FC<RepresentativeViewProps> = ({
  representatives,
  selectedRepresentative,
  colonies,
  onSelectRepresentative,
  onOpenCommissionModal,
  onOpenReassignModal,
  onUpdateCharacteristics,
  onAddSkill,
  onRemoveSkill,
  onAddTalent,
  onRemoveTalent,
  onRenameRepresentative,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [newSkillInput, setNewSkillInput] = useState("");
  const [newTalentInput, setNewTalentInput] = useState("");

  const rep = selectedRepresentative || representatives[0] || null;

  const assignedColony = rep?.assigned_colony_id
    ? colonies.find((c) => c.id === rep.assigned_colony_id)
    : null;

  const handleStartRename = () => {
    if (rep) {
      setEditedName(rep.name);
      setIsEditingName(true);
    }
  };

  const handleSaveRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (rep && editedName.trim()) {
      onRenameRepresentative(rep.id, editedName.trim());
      setIsEditingName(false);
    }
  };

  const handleSkillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rep && newSkillInput.trim()) {
      onAddSkill(rep.id, newSkillInput.trim());
      setNewSkillInput("");
    }
  };

  const handleTalentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rep && newTalentInput.trim()) {
      onAddTalent(rep.id, newTalentInput.trim());
      setNewTalentInput("");
    }
  };

  const charLabels: { [key: string]: string } = {
    ws: "Weapon Skill",
    bs: "Ballistic Skill",
    s: "Strength",
    t: "Toughness",
    ag: "Agility",
    int: "Intelligence",
    per: "Perception",
    wp: "Willpower",
    fel: "Fellowship",
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Top Selector Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-[#0d121f] border border-[#1e293b] rounded-lg font-mono-slate text-xs">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <User className="w-4 h-4 text-[#f59e0b] flex-shrink-0" />
          <span className="text-[#94a3b8] uppercase font-bold tracking-wider hidden md:inline">
            SELECTED REPRESENTATIVE DOSSIER:
          </span>
          <select
            id="rep-select-dropdown"
            value={rep?.id || ""}
            onChange={(e) => {
              const found = representatives.find((r) => r.id === e.target.value);
              if (found) onSelectRepresentative(found);
            }}
            className="bg-[#070a12] border border-[#252f44] text-[#fef08a] font-bold px-3 py-1.5 rounded focus:outline-none focus:border-[#f59e0b] flex-1 sm:w-80"
          >
            {representatives.map((r) => {
              const assigned = colonies.find((c) => c.id === r.assigned_colony_id);
              return (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.title || r.representative_type}) • {assigned ? `Governing ${assigned.name}` : "Unassigned"}
                </option>
              );
            })}
          </select>
        </div>

        <button
          id="rep-commission-button"
          onClick={onOpenCommissionModal}
          className="px-3.5 py-1.5 bg-[#f59e0b]/20 hover:bg-[#f59e0b]/30 text-[#fef08a] border border-[#f59e0b]/60 font-gothic font-bold text-xs uppercase tracking-wider rounded transition flex items-center space-x-1.5 whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Commission Representative</span>
        </button>
      </div>

      {rep ? (
        <>
          {/* 2. Representative Dossier */}
          <div className="gothic-bracket-box p-5 sm:p-6 rounded shadow-xl space-y-5">
            <div className="gothic-bracket-bottom-left" />
            <div className="gothic-bracket-bottom-right" />

            {/* Dossier Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#222e46] pb-3">
              <div className="flex items-center space-x-2">
                {isEditingName ? (
                  <form onSubmit={handleSaveRename} className="flex items-center space-x-2">
                    <input
                      id="edit-rep-name-input"
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="bg-[#070a12] border border-[#f59e0b] text-[#fef08a] font-gothic font-bold text-base px-2 py-1 rounded"
                    />
                    <button
                      type="submit"
                      className="p-1 bg-[#10b981]/20 text-[#34d399] border border-[#10b981]/50 rounded"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingName(false)}
                      className="p-1 bg-[#ef4444]/20 text-[#f87171] border border-[#ef4444]/50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center space-x-2">
                    <h2 className="font-gothic font-bold text-lg sm:text-xl tracking-wider text-[#fef08a] uppercase">
                      {rep.name}
                    </h2>
                    <button
                      id="rep-edit-name-trigger"
                      onClick={handleStartRename}
                      className="p-1 text-[#64748b] hover:text-[#f59e0b] rounded transition"
                      title="Rename Representative"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Assignment Status */}
              <div className="flex items-center space-x-2">
                {assignedColony ? (
                  <span className="px-3 py-1 bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/40 rounded text-xs font-mono-slate font-bold">
                    ● Governing {assignedColony.name}
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-[#64748b]/20 text-[#94a3b8] border border-[#64748b]/40 rounded text-xs font-mono-slate">
                    ○ Unassigned Domain
                  </span>
                )}
                <button
                  id="rep-assign-domain-button"
                  onClick={() => onOpenReassignModal(rep)}
                  className="px-2.5 py-1 bg-[#121828] hover:bg-[#1a233a] border border-[#23314d] text-xs font-mono-slate text-[#38bdf8] rounded transition"
                >
                  Reassign
                </button>
              </div>
            </div>

            {/* 3-Column Profile Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono-slate text-xs">
              {/* Type */}
              <div className="p-3.5 bg-[#0d121f] border border-[#1e293b] rounded space-y-1">
                <span className="text-[10px] text-[#64748b] tracking-wider uppercase block font-semibold">
                  REPRESENTATIVE TYPE
                </span>
                <span className="font-gothic font-bold text-sm text-[#38bdf8] block capitalize">
                  {rep.title || rep.representative_type}
                </span>
                <p className="text-[11px] text-[#94a3b8] leading-relaxed">
                  An administrator with strong organizational skills, increasing overall colony efficiency.
                </p>
              </div>

              {/* Special Mechanics */}
              <div className="p-3.5 bg-[#0d121f] border border-[#1e293b] rounded space-y-1">
                <span className="text-[10px] text-[#64748b] tracking-wider uppercase block font-semibold">
                  SPECIAL MECHANICS
                </span>
                <p className="text-xs text-[#cbd5e1] leading-relaxed">
                  {rep.special_mechanics || "None / +5 bonus to Acquisition Tests for purchasing goods on this particular Colony."}
                </p>
              </div>

              {/* Personality Traits */}
              <div className="p-3.5 bg-[#0d121f] border border-[#1e293b] rounded space-y-1.5">
                <span className="text-[10px] text-[#64748b] tracking-wider uppercase block font-semibold">
                  PERSONALITY MATRIX ({rep.personality_traits?.length || 1} TRAITS)
                </span>
                <div className="space-y-1.5">
                  {rep.personality_traits && rep.personality_traits.length > 0 ? (
                    rep.personality_traits.map((trait, idx) => (
                      <div
                        key={idx}
                        className="p-1.5 bg-[#070a12] border border-[#1b253b] rounded text-[11px]"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#fef08a]">{trait.name}</span>
                          {trait.stat_tag && (
                            <span className="text-[9px] px-1 py-0.2 bg-[#38bdf8]/15 text-[#38bdf8] rounded border border-[#38bdf8]/30">
                              {trait.stat_tag}
                            </span>
                          )}
                        </div>
                        {trait.effect && (
                          <span className="text-[#34d399] text-[10px] block mt-0.5 font-semibold">
                            {trait.effect}
                          </span>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-[#94a3b8] capitalize">{rep.personality || "Scholarly"}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Characteristics Table */}
          <div className="gothic-bracket-box p-5 sm:p-6 rounded shadow-xl space-y-4">
            <div className="gothic-bracket-bottom-left" />
            <div className="gothic-bracket-bottom-right" />

            <div className="border-b border-[#222e46] pb-3">
              <h3 className="font-gothic font-bold text-sm tracking-wider text-[#f59e0b] uppercase">
                CHARACTERISTICS
              </h3>
            </div>

            {/* 9 Characteristic Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2.5 font-mono-slate">
              {rep.characteristics &&
                Object.entries(rep.characteristics).map(([key, value]) => {
                  const bonus = Math.floor(value / 10);
                  return (
                    <div
                      key={key}
                      className="p-3 bg-[#0d121f] border border-[#1e293b] rounded text-center space-y-1.5 flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-[#f59e0b] uppercase block">
                          {key}
                        </span>
                        <span className="text-[9px] text-[#64748b] block truncate" title={charLabels[key]}>
                          {charLabels[key] || key}
                        </span>
                      </div>

                      <div className="my-1">
                        <span className="text-2xl font-gothic font-bold text-[#f8fafc] block">
                          {value}
                        </span>
                        <span className="text-[10px] text-[#38bdf8] font-semibold">
                          Bonus: {bonus}
                        </span>
                      </div>

                      {/* Advance buttons */}
                      <div className="flex items-center justify-center space-x-1 pt-1 border-t border-[#1b253b]">
                        <button
                          onClick={() => onUpdateCharacteristics(rep.id, key, -1)}
                          className="w-5 h-5 bg-[#141b2a] hover:bg-[#1f2a42] text-[#94a3b8] hover:text-white rounded border border-[#23314d] text-xs font-bold flex items-center justify-center"
                          title="Decrease"
                        >
                          -
                        </button>
                        <button
                          onClick={() => onUpdateCharacteristics(rep.id, key, 1)}
                          className="w-5 h-5 bg-[#141b2a] hover:bg-[#1f2a42] text-[#38bdf8] hover:text-[#7dd3fc] rounded border border-[#23314d] text-xs font-bold flex items-center justify-center"
                          title="Increase"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* 4. Skills & Lore Masteries */}
          <div className="gothic-bracket-box p-5 sm:p-6 rounded shadow-xl space-y-4">
            <div className="gothic-bracket-bottom-left" />
            <div className="gothic-bracket-bottom-right" />

            <div className="border-b border-[#222e46] pb-3">
              <h3 className="font-gothic font-bold text-sm tracking-wider text-[#f59e0b] uppercase">
                SKILLS
              </h3>
            </div>

            <form onSubmit={handleSkillSubmit} className="flex gap-2 font-mono-slate text-xs">
              <input
                id="add-skill-input"
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                placeholder="Add skill (e.g. Commerce +10, Scholastic Lore, Logic)..."
                className="flex-1 bg-[#070a12] border border-[#252f44] text-[#f8fafc] px-3 py-2 rounded focus:outline-none focus:border-[#f59e0b]"
              />
              <button
                id="add-skill-submit-button"
                type="submit"
                className="px-4 py-2 bg-[#f59e0b]/20 hover:bg-[#f59e0b]/30 text-[#fef08a] border border-[#f59e0b]/60 font-gothic font-bold text-xs uppercase tracking-wider rounded transition"
              >
                + Add Skill
              </button>
            </form>

            <div className="flex flex-wrap gap-2 pt-2">
              {rep.skills && rep.skills.length > 0 ? (
                rep.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-[#0d121f] border border-[#23314d] text-[#cbd5e1] rounded text-xs font-mono-slate flex items-center space-x-1.5 group"
                  >
                    <span>{skill}</span>
                    <button
                      onClick={() => onRemoveSkill(rep.id, skill)}
                      className="text-[#64748b] hover:text-[#f87171] ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#64748b] font-mono-slate italic">
                  No skills recorded yet.
                </span>
              )}
            </div>
          </div>

          {/* 5. Talents & Traits */}
          <div className="gothic-bracket-box p-5 sm:p-6 rounded shadow-xl space-y-4">
            <div className="gothic-bracket-bottom-left" />
            <div className="gothic-bracket-bottom-right" />

            <div className="border-b border-[#222e46] pb-3">
              <h3 className="font-gothic font-bold text-sm tracking-wider text-[#f59e0b] uppercase">
                TALENTS & TRAITS
              </h3>
            </div>

            <form onSubmit={handleTalentSubmit} className="flex gap-2 font-mono-slate text-xs">
              <input
                id="add-talent-input"
                type="text"
                value={newTalentInput}
                onChange={(e) => setNewTalentInput(e.target.value)}
                placeholder="Add talent (e.g. Peer (Nobility), Air of Authority, Master Orator)..."
                className="flex-1 bg-[#070a12] border border-[#252f44] text-[#f8fafc] px-3 py-2 rounded focus:outline-none focus:border-[#f59e0b]"
              />
              <button
                id="add-talent-submit-button"
                type="submit"
                className="px-4 py-2 bg-[#f59e0b]/20 hover:bg-[#f59e0b]/30 text-[#fef08a] border border-[#f59e0b]/60 font-gothic font-bold text-xs uppercase tracking-wider rounded transition"
              >
                + Add Talent
              </button>
            </form>

            <div className="flex flex-wrap gap-2 pt-2">
              {rep.talents && rep.talents.length > 0 ? (
                rep.talents.map((talent, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 bg-[#0d121f] border border-[#23314d] text-[#cbd5e1] rounded text-xs font-mono-slate flex items-center space-x-1.5 group"
                  >
                    <span>{talent}</span>
                    <button
                      onClick={() => onRemoveTalent(rep.id, talent)}
                      className="text-[#64748b] hover:text-[#f87171] ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              ) : (
                <span className="text-xs text-[#64748b] font-mono-slate italic">
                  No talents recorded yet.
                </span>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="p-8 text-center text-sm text-[#94a3b8] font-mono-slate bg-[#0d121f] rounded border border-[#1e293b]">
          No representative records found. Click "+ Commission Representative" to create one.
        </div>
      )}
    </div>
  );
};
