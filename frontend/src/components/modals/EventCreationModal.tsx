import React, { useState, useEffect } from 'react';
import { Event, EventModifier, ModifierStat } from '../../types';
import { Modal } from '../common/Modal';
import { Plus, Trash2, Info } from 'lucide-react';

interface EventCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (eventData: { name: string; description: string; modifiers: EventModifier[] }) => void;
  existingEvent?: Event | null;
}

const STAT_OPTIONS: { value: ModifierStat; label: string }[] = [
  { value: 'size', label: 'Size' },
  { value: 'complacency', label: 'Complacency' },
  { value: 'order', label: 'Order' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'piety', label: 'Piety' },
];

export const EventCreationModal: React.FC<EventCreationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingEvent,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [modifiers, setModifiers] = useState<EventModifier[]>([]);

  const [newStat, setNewStat] = useState<ModifierStat>('order');
  const [newValue, setNewValue] = useState<number>(0);
  const [newDescription, setNewDescription] = useState('');

  // Reset form when modal opens with different event
  useEffect(() => {
    if (isOpen) {
      setName(existingEvent?.name || '');
      setDescription(existingEvent?.description || '');
      setModifiers(existingEvent?.modifiers || []);
    }
  }, [isOpen, existingEvent]);

  const handleAddModifier = () => {
    if (!newDescription.trim() || newValue === 0) return;
    setModifiers([...modifiers, { stat: newStat, value: newValue, description: newDescription }]);
    setNewDescription('');
    setNewValue(0);
  };

  const handleRemoveModifier = (index: number) => {
    setModifiers(modifiers.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ name, description, modifiers });
    handleClose();
  };

  const handleClose = () => {
    onClose();
  };

  const isEditing = !!existingEvent;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEditing ? 'Edit Event' : 'Create Event'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
            Event Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xs px-3 py-2 text-sm text-slate-100 font-mono"
            placeholder="e.g., Warp Storm"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xs px-3 py-2 text-sm text-slate-100 font-mono"
            rows={3}
            placeholder="Describe what happened..."
          />
        </div>

        <div>
          <label className="block text-xs font-mono text-slate-300 uppercase mb-2">
            Modifiers
          </label>

          {modifiers.length > 0 && (
            <div className="space-y-2 mb-3">
              {modifiers.map((mod, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 bg-slate-900 border border-slate-700 rounded-xs"
                >
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-cyan-300 font-bold">
                      {mod.value > 0 ? '+' : ''}{mod.value}
                    </span>
                    <span className="text-slate-300">{mod.stat}</span>
                    <span className="text-slate-500">— {mod.description}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveModifier(idx)}
                    className="p-1 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xs space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                  Stat
                </label>
                <select
                  value={newStat}
                  onChange={(e) => setNewStat(e.target.value as ModifierStat)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xs px-2 py-1.5 text-xs text-slate-100 font-mono"
                >
                  {STAT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                  Value
                </label>
                <input
                  type="number"
                  value={newValue}
                  onChange={(e) => setNewValue(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xs px-2 py-1.5 text-xs text-slate-100 font-mono"
                  min={-10}
                  max={10}
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleAddModifier}
                  disabled={!newDescription.trim() || newValue === 0}
                  className="w-full px-3 py-1.5 bg-cyan-900 hover:bg-cyan-800 disabled:bg-slate-800 disabled:text-slate-500 text-cyan-100 text-xs font-mono uppercase rounded-xs transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">
                Description
              </label>
              <input
                type="text"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xs px-2 py-1.5 text-xs text-slate-100 font-mono"
                placeholder="Why this modifier?"
              />
            </div>
          </div>
        </div>

        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xs text-[11px] text-slate-400 flex items-start gap-2">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <span>
            Events are GM-created occurrences that affect colony stats. Create modifiers to represent the mechanical effects of this event.
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 bg-slate-800 text-slate-300 text-xs font-mono rounded-xs hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim()}
            className="px-4 py-2 bg-cyan-900 hover:bg-cyan-800 disabled:bg-slate-800 disabled:text-slate-500 text-cyan-100 text-xs font-mono uppercase rounded-xs transition-colors"
          >
            {isEditing ? 'Save Changes' : 'Create Event'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
