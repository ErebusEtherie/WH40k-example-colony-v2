import React, { useState } from 'react';
import { 
  Colony, 
  Representative, 
  RepresentativeCharacteristics
} from '../../types';
import { 
  CHARACTERISTICS_INFO, 
  PERSONALITY_RULES, 
  REPRESENTATIVE_TYPES 
} from '../../data/rulesReference';
import { OrnamentalFrame } from '../common/OrnamentalFrame';
import { 
  User, 
  UserCheck, 
  Plus, 
  Edit3, 
  Check, 
  X, 
  ShieldAlert
} from 'lucide-react';

interface RepresentativePanelProps {
  representatives: Representative[];
  selectedRepId: string | null;
  onSelectRep: (repId: string) => void;
  onUpdateRepresentative: (repId: string, updated: Partial<Representative>) => void;
  onOpenCreateRepresentative: () => void;
  colonies: Colony[];
  currentColony: Colony;
  onAssignToColony: (repId: string, colonyId: string | null) => void;
}

export const RepresentativePanel: React.FC<RepresentativePanelProps> = ({
  representatives,
  selectedRepId,
  onSelectRep,
  onUpdateRepresentative,
  onOpenCreateRepresentative,
  colonies,
  currentColony: _currentColony,
  onAssignToColony,
}) => {
  const activeRep = representatives.find((r) => r.id === selectedRepId) || representatives[0];

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(activeRep?.name || '');

  // New Skill / Talent tag input state
  const [newSkillInput, setNewSkillInput] = useState('');
  const [newTalentInput, setNewTalentInput] = useState('');

  if (!activeRep) {
    return (
      <div className="p-8 bg-slate-950 border border-slate-800 text-center space-y-4 rounded-sm">
        <User className="w-10 h-10 text-cyan-400 mx-auto" />
        <h3 className="font-serif text-lg font-bold text-slate-100 uppercase">
          No Representatives in Dynasty Registry
        </h3>
        <p className="text-xs font-mono text-slate-400 max-w-md mx-auto">
          Recruit a magistrate, judge, cardinal, or military commander to govern your colonies.
        </p>
        <button
          onClick={onOpenCreateRepresentative}
          className="px-4 py-2 bg-cyan-900 hover:bg-cyan-800 border border-cyan-500 text-cyan-100 font-mono text-xs uppercase tracking-wider rounded-xs inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Commission New Representative
        </button>
      </div>
    );
  }

  const repTypeInfo = REPRESENTATIVE_TYPES[activeRep.type] || REPRESENTATIVE_TYPES.satrap;
  const assignedColony = colonies.find((c) => c.id === activeRep.assignedColonyId);

  const handleSaveName = () => {
    if (nameInput.trim()) {
      onUpdateRepresentative(activeRep.id, { name: nameInput.trim() });
    }
    setIsEditingName(false);
  };

  const handleCharacteristicChange = (statKey: keyof RepresentativeCharacteristics, delta: number) => {
    const current = activeRep.characteristics[statKey];
    const updatedVal = Math.max(1, Math.min(100, current + delta));
    onUpdateRepresentative(activeRep.id, {
      characteristics: {
        ...activeRep.characteristics,
        [statKey]: updatedVal,
      },
    });
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSkillInput.trim()) return;
    if (activeRep.skills.includes(newSkillInput.trim())) return;

    onUpdateRepresentative(activeRep.id, {
      skills: [...activeRep.skills, newSkillInput.trim()],
    });
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skill: string) => {
    onUpdateRepresentative(activeRep.id, {
      skills: activeRep.skills.filter((s) => s !== skill),
    });
  };

  const handleAddTalent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTalentInput.trim()) return;
    if (activeRep.talents.includes(newTalentInput.trim())) return;

    onUpdateRepresentative(activeRep.id, {
      talents: [...activeRep.talents, newTalentInput.trim()],
    });
    setNewTalentInput('');
  };

  const handleRemoveTalent = (talent: string) => {
    onUpdateRepresentative(activeRep.id, {
      talents: activeRep.talents.filter((t) => t !== talent),
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      
      {/* Top Header: Representative Selector & Quick Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950 p-4 border border-cyan-900/80 rounded-sm shadow-md">
        
        {/* Selector Dropdown */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-cyan-950 border border-cyan-800 text-cyan-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block tracking-wider">
              Selected Representative Ledger
            </label>
            <div className="relative inline-block">
              <select
                value={activeRep.id}
                onChange={(e) => {
                  onSelectRep(e.target.value);
                  const found = representatives.find((r) => r.id === e.target.value);
                  if (found) setNameInput(found.name);
                }}
                className="bg-slate-900 border border-cyan-700 text-slate-100 font-serif font-bold text-sm sm:text-base rounded-xs px-3 py-1 pr-8 focus:outline-hidden focus:ring-1 focus:ring-cyan-400"
              >
                {representatives.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({REPRESENTATIVE_TYPES[r.type]?.displayName}) {r.assignedColonyId ? '• Assigned' : '• Unassigned'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action button to recruit new */}
        <button
          onClick={onOpenCreateRepresentative}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-900/80 hover:bg-cyan-800 border border-cyan-500 text-cyan-100 text-xs font-mono uppercase tracking-wider rounded-xs transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Commission Representative
        </button>

      </div>

      {/* Living Character Sheet: Header & Type Profile */}
      <OrnamentalFrame
        title="Representative Dossier"
        subtitle="Magistrate profile, loss mitigation, and personality matrix"
        actions={
          <div className="flex items-center gap-2">
            {assignedColony ? (
              <span className="px-2.5 py-1 bg-cyan-950 border border-cyan-700 text-cyan-300 text-xs font-mono rounded-xs flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" /> Governing {assignedColony.name}
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-amber-950 border border-amber-800 text-amber-300 text-xs font-mono rounded-xs">
                Unassigned (Available in Pool)
              </span>
            )}
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Identity & Editable Name */}
          <div className="space-y-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block tracking-wider">
                Representative Name
              </span>
              {!isEditingName ? (
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="font-serif text-lg font-bold text-slate-100 uppercase">
                    {activeRep.name}
                  </h3>
                  <button
                    onClick={() => {
                      setNameInput(activeRep.name);
                      setIsEditingName(true);
                    }}
                    className="text-slate-400 hover:text-cyan-300 p-1"
                    title="Edit name"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="bg-slate-950 border border-cyan-600 rounded-xs px-2 py-1 text-sm font-serif text-slate-100 focus:outline-hidden"
                  />
                  <button
                    onClick={handleSaveName}
                    className="p-1 bg-emerald-900 text-emerald-200 rounded-xs"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="p-1 bg-slate-800 text-slate-300 rounded-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Role & Archetype */}
            <div className="bg-slate-950 p-3 border border-slate-800 rounded-xs space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Representative Type
              </span>
              <div className="font-serif text-base font-bold text-cyan-200">
                {repTypeInfo.displayName}
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {repTypeInfo.description}
              </p>
            </div>
          </div>

          {/* Special Mechanics */}
          <div className="space-y-3">
            <div className="bg-slate-950 p-3 border border-cyan-950 rounded-xs space-y-2">
              <span className="text-[10px] font-mono uppercase text-cyan-400 tracking-wider flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Special Mechanics
              </span>
              <div className="text-xs font-mono text-slate-200 font-semibold">
                {repTypeInfo.lossMitigationDescription}
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                {repTypeInfo.specialRule}
              </p>
            </div>

            {/* Assignment Controls */}
            <div className="bg-slate-950 p-3 border border-slate-800 rounded-xs space-y-2">
              <span className="text-[10px] font-mono uppercase text-slate-400 block">
                Assign to Domain
              </span>
              <div className="flex items-center gap-2">
                <select
                  value={activeRep.assignedColonyId || ''}
                  onChange={(e) => onAssignToColony(activeRep.id, e.target.value || null)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xs px-2 py-1 text-xs text-slate-100 font-mono"
                >
                  <option value="">— Unassigned (In Pool) —</option>
                  {colonies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Personality Summary */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase text-slate-400 block tracking-wider">
              Personality Matrix ({activeRep.personalities.length} Traits)
            </span>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {activeRep.personalities.map((p, idx) => {
                const pRule = PERSONALITY_RULES[p.personalityKey];
                return (
                  <div
                    key={idx}
                    className="p-2 bg-slate-950 border border-slate-800 rounded-xs text-xs font-mono"
                  >
                    <div className="font-serif font-bold text-cyan-200 flex items-center justify-between">
                      <span>{pRule?.displayName || p.personalityKey}</span>
                      {p.chosenStat && (
                        <span className="text-[10px] text-amber-300 font-mono">
                          [{p.chosenStat.toUpperCase()}]
                        </span>
                      )}
                      {p.madOrderRoll && (
                        <span className="text-[10px] text-red-300 font-mono">
                          [-{p.madOrderRoll} Order]
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-cyan-400 mt-0.5 font-bold">
                      {pRule?.statEffectsText}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </OrnamentalFrame>

      {/* 9 Characteristics Grid (Mechanicus Stat Screen Reference) */}
      <OrnamentalFrame
        title="Characteristics"
        subtitle="Display: Name: Value (Bonus), Bonus = ⌊Value/10⌋ • Increasable via table advancements"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2.5">
          {CHARACTERISTICS_INFO.map((c) => {
            const statKey = c.key as keyof RepresentativeCharacteristics;
            const val = activeRep.characteristics[statKey];
            const bonus = Math.floor(val / 10);
            return (
              <div
                key={c.key}
                className="p-2.5 bg-slate-950 border border-cyan-900/60 rounded-xs flex flex-col justify-between text-center hover:border-cyan-500/80 transition-colors"
              >
                <div>
                  <div className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                    {c.short}
                  </div>
                  <div className="text-[9px] text-slate-500 font-mono truncate" title={c.name}>
                    {c.name}
                  </div>
                  <div className="text-xl font-serif font-black text-slate-100 my-1">
                    {val}
                  </div>
                  <div className="text-[11px] font-mono font-bold text-cyan-300 bg-cyan-950/60 py-0.5 rounded-xs border border-cyan-800/40">
                    Bonus: {bonus}
                  </div>
                </div>

                {/* Increasable Controls */}
                <div className="flex items-center justify-center gap-1 mt-2 pt-2 border-t border-slate-900">
                  <button
                    onClick={() => handleCharacteristicChange(statKey, -1)}
                    className="w-5 h-5 flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-mono rounded-xs border border-slate-800"
                    title={`Decrease ${c.name}`}
                  >
                    -
                  </button>
                  <button
                    onClick={() => handleCharacteristicChange(statKey, 1)}
                    className="w-5 h-5 flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-cyan-400 hover:text-cyan-200 text-xs font-mono rounded-xs border border-slate-800"
                    title={`Increase ${c.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </OrnamentalFrame>

      {/* Skills and Talents Tag Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Skills */}
        <OrnamentalFrame
          title="Skills"
          subtitle="Proficiencies and lore masteries"
        >
          <div className="space-y-4">
            <form onSubmit={handleAddSkill} className="flex gap-2">
              <input
                type="text"
                placeholder="Add skill (e.g. Commerce +10, Tech-Use)..."
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xs px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-hidden focus:ring-1 focus:ring-cyan-400"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-cyan-900 hover:bg-cyan-800 border border-cyan-500 text-cyan-100 text-xs font-mono uppercase rounded-xs"
              >
                Add Skill
              </button>
            </form>

            <div className="flex flex-wrap gap-2 min-h-[60px]">
              {activeRep.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-cyan-800/80 text-cyan-200 text-xs font-mono rounded-xs shadow-xs"
                >
                  <span>{skill}</span>
                  <button
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-slate-500 hover:text-red-400"
                    title={`Remove ${skill}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {activeRep.skills.length === 0 && (
                <p className="text-xs font-mono text-slate-500 italic">No skills recorded.</p>
              )}
            </div>
          </div>
        </OrnamentalFrame>

        {/* Talents */}
        <OrnamentalFrame
          title="Talents & Traits"
          subtitle="Talents and traits"
        >
          <div className="space-y-4">
            <form onSubmit={handleAddTalent} className="flex gap-2">
              <input
                type="text"
                placeholder="Add talent (e.g. Air of Authority, Master Orator)..."
                value={newTalentInput}
                onChange={(e) => setNewTalentInput(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xs px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-hidden focus:ring-1 focus:ring-cyan-400"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-cyan-900 hover:bg-cyan-800 border border-cyan-500 text-cyan-100 text-xs font-mono uppercase rounded-xs"
              >
                Add Talent
              </button>
            </form>

            <div className="flex flex-wrap gap-2 min-h-[60px]">
              {activeRep.talents.map((talent) => (
                <span
                  key={talent}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 border border-amber-800/80 text-amber-200 text-xs font-mono rounded-xs shadow-xs"
                >
                  <span>{talent}</span>
                  <button
                    onClick={() => handleRemoveTalent(talent)}
                    className="text-slate-500 hover:text-red-400"
                    title={`Remove ${talent}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
              {activeRep.talents.length === 0 && (
                <p className="text-xs font-mono text-slate-500 italic">No talents recorded.</p>
              )}
            </div>
          </div>
        </OrnamentalFrame>

      </div>

    </div>
  );
};
