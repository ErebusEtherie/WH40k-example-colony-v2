import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { 
  PersonalityKey, 
  Representative, 
  RepresentativeCharacteristics, 
  RepresentativePersonalityItem, 
  RepresentativeTypeKey, 
  StatName 
} from '../../types';
import { 
  CHARACTERISTICS_INFO, 
  PERSONALITY_RULES, 
  REPRESENTATIVE_TYPES 
} from '../../data/rulesReference';
import { 
  UserPlus, 
  Check, 
  ArrowRight, 
  ArrowLeft 
} from 'lucide-react';

interface RepresentativeCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRepresentative: (rep: Representative) => void;
}

export const RepresentativeCreationModal: React.FC<RepresentativeCreationModalProps> = ({
  isOpen,
  onClose,
  onCreateRepresentative,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [name, setName] = useState('');
  const [repType, setRepType] = useState<RepresentativeTypeKey>('satrap');
  const [selectedPersonalities, setSelectedPersonalities] = useState<RepresentativePersonalityItem[]>([
    { personalityKey: 'beloved' },
  ]);

  // Specific GM params for traits
  const [madRoll, setMadRoll] = useState<number>(3);
  const [scholarlyStat, setScholarlyStat] = useState<StatName>('order');
  const [tiesStat, setTiesStat] = useState<StatName>('productivity');

  // Characteristics
  const [characteristics, setCharacteristics] = useState<RepresentativeCharacteristics>({
    ws: 35,
    bs: 35,
    s: 30,
    t: 30,
    ag: 30,
    int: 45,
    per: 35,
    wp: 40,
    fel: 48,
  });

  // Skills & Talents
  const [skills, setSkills] = useState<string[]>(['Commerce', 'Common Lore (Imperial Creed)', 'Scholastic Lore (Imperial Warrants)']);
  const [talents, setTalents] = useState<string[]>(['Air of Authority', 'Peer (Merchants)']);
  const [skillInput, setSkillInput] = useState('');
  const [talentInput, setTalentInput] = useState('');

  const repTypeInfo = REPRESENTATIVE_TYPES[repType];

  const handleTogglePersonality = (pKey: PersonalityKey) => {
    const exists = selectedPersonalities.some((p) => p.personalityKey === pKey);
    if (exists) {
      if (selectedPersonalities.length > 1) {
        setSelectedPersonalities(selectedPersonalities.filter((p) => p.personalityKey !== pKey));
      }
    } else {
      if (selectedPersonalities.length < 4) {
        const newItem: RepresentativePersonalityItem = { personalityKey: pKey };
        if (pKey === 'mad') newItem.madOrderRoll = madRoll;
        if (pKey === 'scholarly') newItem.chosenStat = scholarlyStat;
        if (pKey === 'ties_with') newItem.chosenStat = tiesStat;
        setSelectedPersonalities([...selectedPersonalities, newItem]);
      }
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleAddTalent = () => {
    if (talentInput.trim() && !talents.includes(talentInput.trim())) {
      setTalents([...talents, talentInput.trim()]);
      setTalentInput('');
    }
  };

  const handleFinalSubmit = () => {
    if (!name.trim()) return;

    // Ensure custom params are attached to personalities
    const finalPersonalities = selectedPersonalities.map((p) => {
      if (p.personalityKey === 'mad') return { ...p, madOrderRoll: madRoll };
      if (p.personalityKey === 'scholarly') return { ...p, chosenStat: scholarlyStat };
      if (p.personalityKey === 'ties_with') return { ...p, chosenStat: tiesStat };
      return p;
    });

    const newRep: Representative = {
      id: `rep_${Date.now()}`,
      name: name.trim(),
      type: repType,
      personalities: finalPersonalities,
      characteristics,
      skills,
      talents,
      assignedColonyId: null,
    };

    onCreateRepresentative(newRep);
    onClose();
    setStep(1);
    setName('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Commission New Imperial Representative"
      subtitle="Appoint a magistrate or commander to oversee dynasty territories"
      maxWidth="4xl"
    >
      <div className="space-y-6">
        
        {/* Step Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 font-mono text-xs">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-2 pb-1 border-b-2 font-bold uppercase transition-colors ${
                step === 1 ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-[10px]">1</span>
              Identity & Type
            </button>
            <button
              onClick={() => setStep(2)}
              className={`flex items-center gap-2 pb-1 border-b-2 font-bold uppercase transition-colors ${
                step === 2 ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-[10px]">2</span>
              Personalities (1–4)
            </button>
            <button
              onClick={() => setStep(3)}
              className={`flex items-center gap-2 pb-1 border-b-2 font-bold uppercase transition-colors ${
                step === 3 ? 'border-cyan-400 text-cyan-300' : 'border-transparent text-slate-500'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center text-[10px]">3</span>
              Characteristics & Review
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* Step 1: Name & Type */}
        {/* ========================================================================= */}
        {step === 1 && (
          <div className="space-y-5 font-mono text-xs">
            <div>
              <label className="text-[10px] uppercase text-slate-400 block mb-1">
                Representative Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Magistrate Jeremiah Kroll"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-cyan-700 rounded-xs px-3 py-2 text-base text-slate-100 font-serif focus:outline-hidden focus:ring-1 focus:ring-cyan-400"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase text-slate-400 block tracking-wider">
                Select Representative Archetype * (Determines loss mitigation mechanic)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {(Object.keys(REPRESENTATIVE_TYPES) as RepresentativeTypeKey[]).map((key) => {
                  const info = REPRESENTATIVE_TYPES[key];
                  const isSelected = repType === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setRepType(key)}
                      className={`p-3 text-left rounded-xs border transition-all flex flex-col justify-between ${
                        isSelected
                          ? 'bg-cyan-950/90 border-cyan-400 text-cyan-100 shadow-md shadow-cyan-950/40'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-serif font-bold text-sm text-slate-100 flex items-center justify-between">
                          <span>{info.displayName}</span>
                          {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                          {info.description}
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-slate-900 text-[10px] text-amber-300 font-bold">
                        {info.lossMitigationDescription}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-cyan-900/60 rounded-xs space-y-1">
              <div className="text-cyan-300 font-bold uppercase text-[11px]">
                Active Archetype Profile: {repTypeInfo.displayName}
              </div>
              <div className="text-slate-300 text-xs">{repTypeInfo.lossMitigationDescription}</div>
              <div className="text-slate-400 text-[11px]">{repTypeInfo.specialRule}</div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={!name.trim()}
                className="px-4 py-2 bg-cyan-900 hover:bg-cyan-800 border border-cyan-500 text-cyan-100 font-mono text-xs uppercase font-bold rounded-xs flex items-center gap-1.5 disabled:opacity-50"
              >
                Proceed to Personalities <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* Step 2: Personalities (1-4) */}
        {/* ========================================================================= */}
        {step === 2 && (
          <div className="space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase text-slate-300">
                Select 1 to 4 Unique Personality Traits:
              </span>
              <span className="text-cyan-300 font-bold bg-cyan-950 px-2 py-0.5 rounded-xs border border-cyan-800">
                {selectedPersonalities.length} / 4 Selected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {(Object.keys(PERSONALITY_RULES) as PersonalityKey[]).map((pKey) => {
                const pInfo = PERSONALITY_RULES[pKey];
                const isSelected = selectedPersonalities.some((p) => p.personalityKey === pKey);

                return (
                  <button
                    key={pKey}
                    type="button"
                    onClick={() => handleTogglePersonality(pKey)}
                    className={`p-2.5 text-left rounded-xs border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-100 shadow-xs'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="font-serif font-bold text-xs text-slate-100 flex items-center justify-between">
                        <span>{pInfo.displayName}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                        {pInfo.description}
                      </div>
                    </div>
                    <div className="mt-2 pt-1 border-t border-slate-900 text-[10px] font-bold text-cyan-300">
                      {pInfo.statEffectsText}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* If Mad / Scholarly / Ties With is selected, render the physical roll / choice controls */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              {selectedPersonalities.some((p) => p.personalityKey === 'mad') && (
                <div className="p-3 bg-red-950/30 border border-red-800 rounded-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-red-300 uppercase text-[11px] block">
                      Mad Personality — Physical 1d5 Order Loss Roll
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Enter result rolled physically at table (1 to 5)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={madRoll}
                      onChange={(e) => setMadRoll(Number.parseInt(e.target.value) || 1)}
                      className="w-14 bg-slate-900 border border-red-700 rounded-xs px-2 py-1 text-center text-red-100 font-bold"
                    />
                  </div>
                </div>
              )}

              {selectedPersonalities.some((p) => p.personalityKey === 'scholarly') && (
                <div className="p-3 bg-cyan-950/30 border border-cyan-800 rounded-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-cyan-300 uppercase text-[11px] block">
                      Scholarly Personality — Target Colony Characteristic
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Explorers choose one characteristic for +1 Bonus
                    </span>
                  </div>
                  <select
                    value={scholarlyStat}
                    onChange={(e) => setScholarlyStat(e.target.value as StatName)}
                    className="bg-slate-900 border border-cyan-700 rounded-xs px-2 py-1 text-slate-100"
                  >
                    <option value="order">Order</option>
                    <option value="productivity">Productivity</option>
                    <option value="piety">Piety</option>
                    <option value="complacency">Complacency</option>
                  </select>
                </div>
              )}

              {selectedPersonalities.some((p) => p.personalityKey === 'ties_with') && (
                <div className="p-3 bg-amber-950/30 border border-amber-800 rounded-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-amber-300 uppercase text-[11px] block">
                      Ties With Personality — Allied Faction Characteristic
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Representative provides +1 to chosen stat, -1 to all others
                    </span>
                  </div>
                  <select
                    value={tiesStat}
                    onChange={(e) => setTiesStat(e.target.value as StatName)}
                    className="bg-slate-900 border border-amber-700 rounded-xs px-2 py-1 text-slate-100"
                  >
                    <option value="productivity">Productivity (Kasballica / Chartist)</option>
                    <option value="order">Order (Arbites / Battlefleet)</option>
                    <option value="piety">Piety (Ecclesiarchy)</option>
                    <option value="complacency">Complacency (Nobles / Guilds)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-between gap-3 pt-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs uppercase rounded-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 bg-cyan-900 hover:bg-cyan-800 border border-cyan-500 text-cyan-100 font-mono text-xs uppercase font-bold rounded-xs flex items-center gap-1.5"
              >
                Characteristics & Skills <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* Step 3: Characteristics, Skills, Talents */}
        {/* ========================================================================= */}
        {step === 3 && (
          <div className="space-y-5 font-mono text-xs">
            <div>
              <span className="text-[10px] uppercase text-slate-400 block mb-2 tracking-wider">
                Characteristics (Display: Value / Bonus: ⌊Value/10⌋)
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-9 gap-2">
                {CHARACTERISTICS_INFO.map((c) => {
                  const key = c.key as keyof RepresentativeCharacteristics;
                  const val = characteristics[key];
                  const bonus = Math.floor(val / 10);
                  return (
                    <div
                      key={c.key}
                      className="p-2 bg-slate-950 border border-slate-800 rounded-xs text-center"
                    >
                      <div className="text-[10px] uppercase text-slate-400 font-bold">{c.short}</div>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={val}
                        onChange={(e) =>
                          setCharacteristics({
                            ...characteristics,
                            [key]: Number.parseInt(e.target.value) || 20,
                          })
                        }
                        className="w-full bg-slate-900 border border-cyan-800 text-slate-100 text-center font-bold text-sm my-1 py-0.5 rounded-xs"
                      />
                      <div className="text-[10px] text-cyan-300 font-bold">Bonus: {bonus}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-slate-400 block">Skills</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add skill..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xs px-2.5 py-1 text-slate-100"
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="px-3 py-1 bg-slate-800 text-cyan-300 rounded-xs border border-slate-700 uppercase"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-900 border border-slate-800 text-slate-200 text-[11px] rounded-xs"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => setSkills(skills.filter((sk) => sk !== s))}
                      className="text-slate-500 hover:text-red-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Talents */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-slate-400 block">Talents & Traits</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add talent..."
                  value={talentInput}
                  onChange={(e) => setTalentInput(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xs px-2.5 py-1 text-slate-100"
                />
                <button
                  type="button"
                  onClick={handleAddTalent}
                  className="px-3 py-1 bg-slate-800 text-amber-300 rounded-xs border border-slate-700 uppercase"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {talents.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-900 border border-slate-800 text-amber-200 text-[11px] rounded-xs"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => setTalents(talents.filter((tk) => tk !== t))}
                      className="text-slate-500 hover:text-red-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-between gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs uppercase rounded-xs flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-5 py-2 bg-cyan-900 hover:bg-cyan-800 border border-cyan-500 text-cyan-100 font-mono text-xs uppercase font-bold tracking-wider rounded-xs flex items-center gap-2"
              >
                <UserPlus className="w-4 h-4" /> Commission Representative
              </button>
            </div>
          </div>
        )}

      </div>
    </Modal>
  );
};
