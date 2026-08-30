import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Colony, Representative } from '../../types';
import { REPRESENTATIVE_TYPES } from '../../data/rulesReference';
import { UserCheck, AlertTriangle, Plus, Check } from 'lucide-react';

interface ChangeRepresentativeModalProps {
  isOpen: boolean;
  onClose: () => void;
  colony: Colony;
  representatives: Representative[];
  onAssignRepresentative: (colonyId: string, repId: string | null) => void;
  onOpenCreateRepresentative: () => void;
}

export const ChangeRepresentativeModal: React.FC<ChangeRepresentativeModalProps> = ({
  isOpen,
  onClose,
  colony,
  representatives,
  onAssignRepresentative,
  onOpenCreateRepresentative,
}) => {
  const [selectedRepId, setSelectedRepId] = useState<string>(colony.representativeId || '');

  const availableReps = representatives.filter(
    (r) => !r.assignedColonyId || r.assignedColonyId === colony.id
  );

  const handleConfirm = () => {
    onAssignRepresentative(colony.id, selectedRepId || null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reassign Colony Representative"
      subtitle={`Appoint a new magistrate or commander to oversee ${colony.name}`}
      maxWidth="lg"
    >
      <div className="space-y-4 font-mono text-xs">
        
        {/* Warning Banner */}
        <div className="p-3 bg-amber-950/40 border border-amber-800 rounded-xs flex items-start gap-2.5 text-amber-200">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold text-[11px] uppercase tracking-wider block">
              Administrative Protocol Notice
            </span>
            <p className="text-[11px] text-amber-300/90 leading-tight">
              Changing representative immediately removes the previous magistrate's personality traits and loss mitigation effects. Any conditional traits (e.g. Scholarly stat or Mad 1d5 order roll) will take effect from the newly appointed magistrate.
            </p>
          </div>
        </div>

        {/* Representative Candidates Selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase text-slate-400 block tracking-wider">
              Available Representatives in Dynasty Pool ({availableReps.length})
            </label>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreateRepresentative();
              }}
              className="text-[10px] text-cyan-300 hover:text-cyan-200 uppercase font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Commission New
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {/* Option to vacate representative post */}
            <button
              type="button"
              onClick={() => setSelectedRepId('')}
              aria-pressed={selectedRepId === ''}
              data-testid="vacate-post-option"
              className={`w-full p-3 text-left rounded-xs border transition-all flex items-center justify-between ${
                selectedRepId === ''
                  ? 'bg-amber-950/70 border-amber-500 text-amber-100'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="font-serif font-bold text-sm text-slate-200">
                  — Vacate Post (No Representative) —
                </div>
                <div className="text-[10px] text-slate-400">
                  Colony operates without a dedicated magistrate. No personality bonuses or loss mitigation.
                </div>
              </div>
              {selectedRepId === '' && <Check className="w-4 h-4 text-amber-400" />}
            </button>

            {availableReps.map((rep) => {
              const typeInfo = REPRESENTATIVE_TYPES[rep.type];
              const isSelected = selectedRepId === rep.id;
              const traitCount = rep.personalities.length;

              return (
                <button
                  key={rep.id}
                  type="button"
                  onClick={() => setSelectedRepId(rep.id)}
                  aria-pressed={isSelected}
                  data-testid={`rep-option-${rep.id}`}
                  className={`w-full p-3 text-left rounded-xs border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-cyan-950/80 border-cyan-400 text-cyan-100 shadow-xs'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-serif font-bold text-sm text-slate-100 flex items-center gap-2">
                      <span>{rep.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-900 border border-slate-700 text-cyan-300 rounded-xs">
                        {typeInfo?.displayName || rep.type}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {traitCount} {traitCount === 1 ? 'Trait' : 'Traits'} • WS {rep.characteristics.ws} / Fel {rep.characteristics.fel} (+{Math.floor(rep.characteristics.fel / 10)})
                    </div>
                    <div className="text-[10px] text-cyan-400 font-bold">
                      {typeInfo?.lossMitigationDescription}
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xs uppercase font-mono"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-1.5 bg-cyan-900 hover:bg-cyan-800 border border-cyan-500 text-cyan-100 rounded-xs uppercase font-bold tracking-wider flex items-center gap-1.5"
          >
            <UserCheck className="w-4 h-4" /> Confirm Appointment
          </button>
        </div>

      </div>
    </Modal>
  );
};
