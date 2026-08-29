import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { 
  Colony, 
  ColonyTypeKey, 
  Representative 
} from '../../types';
import { COLONY_TYPES } from '../../data/rulesReference';
import { 
  Building2, 
  Sparkles, 
  Check, 
  User, 
  ShieldCheck, 
  Info 
} from 'lucide-react';

interface ColonyCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateColony: (newColony: Colony) => void;
  unassignedRepresentatives: Representative[];
  onOpenCreateRepresentative: () => void;
}

export const ColonyCreationModal: React.FC<ColonyCreationModalProps> = ({
  isOpen,
  onClose,
  onCreateColony,
  unassignedRepresentatives,
  onOpenCreateRepresentative,
}) => {
  const [name, setName] = useState('');
  const [starSystem, setStarSystem] = useState('');
  const [colonyType, setColonyType] = useState<ColonyTypeKey>('mining_and_industry');
  const [founder, setFounder] = useState('Lady Captain Valéria von Valancius');
  const [description, setDescription] = useState('');
  const [selectedRepId, setSelectedRepId] = useState<string>('');

  const typeInfo = COLONY_TYPES[colonyType];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !starSystem.trim() || !founder.trim()) return;

    const newColony: Colony = {
      id: `colony_${Date.now()}`,
      name: name.trim(),
      starSystem: starSystem.trim(),
      colonyType,
      founder: founder.trim(),
      description: description.trim() || undefined,
      ageDays: 0,
      representativeId: selectedRepId || null,
      planetaryResources: [],
      hardInfrastructure: [
        {
          id: `hi_${Date.now()}_1`,
          name: 'Colony Core Sub-Station',
          type: 'power',
          status: 'working',
          notes: 'Standard initial prefabricated generator unit.',
        },
      ],
      supportUpgrades: [],
      developmentPlans: [],
      customModifiers: [],
    };

    // If Mining and Industry, GM ruling grants free Industrial Facility upgrade
    if (colonyType === 'mining_and_industry') {
      newColony.supportUpgrades.push({
        id: `su_${Date.now()}_free_ind`,
        name: 'Charter Industrial Facility (Free Starting Grant)',
        type: 'industrial_facility',
        status: 'working',
        notes: 'Granted free per Mining & Industry Colony Charter specialty.',
      });
    }

    // If Ecclesiastical, GM ruling grants free Cultural Improvement upgrade
    if (colonyType === 'ecclesiastical') {
      newColony.culturalImprovementStat = 'piety';
      newColony.supportUpgrades.push({
        id: `su_${Date.now()}_free_cult`,
        name: 'Charter Cultural Improvement (Free Starting Grant)',
        type: 'cultural_improvement',
        status: 'working',
        chosenStat: 'piety',
        notes: 'Granted free per Ecclesiastical Colony Charter specialty (+1 Piety).',
      });
    }

    onCreateColony(newColony);
    onClose();

    // Reset form
    setName('');
    setStarSystem('');
    setDescription('');
    setSelectedRepId('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Charter New Rogue Trader Colony"
      subtitle="Establish a permanent Imperial domain in the Koronus Expanse"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Basic Identification */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <label className="text-[10px] uppercase text-slate-400 block mb-1">
              Colony Designation *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Aurelia Reach Manufactorum"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-cyan-700/80 rounded-xs px-3 py-2 text-sm text-slate-100 font-serif focus:outline-hidden focus:ring-1 focus:ring-cyan-400"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase text-slate-400 block mb-1">
              Star System / Sector *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Footfall Reach, Undiscovered Grid"
              value={starSystem}
              onChange={(e) => setStarSystem(e.target.value)}
              className="w-full bg-slate-950 border border-cyan-700/80 rounded-xs px-3 py-2 text-sm text-slate-100 font-mono focus:outline-hidden focus:ring-1 focus:ring-cyan-400"
            />
          </div>
        </div>

        {/* Colony Type Selector with Live Preview */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-mono text-slate-400 block tracking-wider">
            Colony Charter Type * (Determines starting characteristics and specialties)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
            {(Object.keys(COLONY_TYPES) as ColonyTypeKey[]).map((key) => {
              const info = COLONY_TYPES[key];
              const isSelected = colonyType === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setColonyType(key)}
                  className={`p-3 text-left rounded-xs border transition-all ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-100 shadow-md shadow-cyan-950/40'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between font-serif font-bold text-sm text-slate-100">
                    <span>{info.displayName}</span>
                    {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {info.description}
                  </div>
                  <div className="mt-2 text-[10px] font-bold text-cyan-300">
                    Invest: {info.initialInvestmentPf} PF
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Preview of Starting Stats */}
        <div className="p-3.5 bg-slate-950 border border-cyan-900/60 rounded-xs space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between text-cyan-300 font-bold uppercase text-[11px]">
            <span>Starting Base Stats Preview</span>
            <span>All Colonies start at Size 1</span>
          </div>
          <div className="grid grid-cols-5 gap-2 text-center">
            <div className="bg-slate-900 p-2 rounded-xs border border-slate-800">
              <span className="text-[9px] uppercase text-slate-400 block">Size</span>
              <span className="text-sm font-bold text-slate-100">1</span>
            </div>
            <div className="bg-slate-900 p-2 rounded-xs border border-slate-800">
              <span className="text-[9px] uppercase text-slate-400 block">Complacency</span>
              <span className="text-sm font-bold text-slate-100">{typeInfo.baseStats.complacency}</span>
            </div>
            <div className="bg-slate-900 p-2 rounded-xs border border-slate-800">
              <span className="text-[9px] uppercase text-slate-400 block">Order</span>
              <span className="text-sm font-bold text-slate-100">{typeInfo.baseStats.order}</span>
            </div>
            <div className="bg-slate-900 p-2 rounded-xs border border-slate-800">
              <span className="text-[9px] uppercase text-slate-400 block">Productivity</span>
              <span className="text-sm font-bold text-slate-100">{typeInfo.baseStats.productivity}</span>
            </div>
            <div className="bg-slate-900 p-2 rounded-xs border border-slate-800">
              <span className="text-[9px] uppercase text-slate-400 block">Piety</span>
              <span className="text-sm font-bold text-slate-100">{typeInfo.baseStats.piety}</span>
            </div>
          </div>
          <div className="text-[11px] text-amber-300/90 pt-1">
            <span className="font-bold">Specialty Rule:</span> {typeInfo.specialEffect.description}
          </div>
        </div>

        {/* Founder & Description */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <label className="text-[10px] uppercase text-slate-400 block mb-1">
              Colony Founder *
            </label>
            <input
              type="text"
              required
              value={founder}
              onChange={(e) => setFounder(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xs px-3 py-2 text-slate-100"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase text-slate-400 block mb-1">
              Appoint Representative (Optional)
            </label>
            <div className="flex gap-2">
              <select
                value={selectedRepId}
                onChange={(e) => setSelectedRepId(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xs px-2 py-2 text-xs text-slate-100"
              >
                <option value="">— Skip (Assign Later) —</option>
                {unassignedRepresentatives.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.type})
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={onOpenCreateRepresentative}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] uppercase rounded-xs border border-slate-700"
                title="Create new representative now"
              >
                + New
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase text-slate-400 block mb-1 font-mono">
            Colony Description (Optional Lore & Strategic Notes)
          </label>
          <textarea
            rows={2}
            placeholder="A clandestine outpost established on the rim of a sulfur sea..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xs p-2 text-xs text-slate-200 font-mono"
          />
        </div>

        {/* Modal Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs uppercase rounded-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 bg-cyan-900 hover:bg-cyan-800 border border-cyan-500 text-cyan-100 font-mono text-xs uppercase font-bold tracking-wider rounded-xs flex items-center gap-2"
          >
            <Building2 className="w-4 h-4" /> Issue Colony Charter
          </button>
        </div>

      </form>
    </Modal>
  );
};
