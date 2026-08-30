import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { CustomModifierItem, StatName } from '../../types';
import { Check } from 'lucide-react';

interface AddCustomModifierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddModifier: (newModifier: CustomModifierItem) => void;
}

export const AddCustomModifierModal: React.FC<AddCustomModifierModalProps> = ({
  isOpen,
  onClose,
  onAddModifier,
}) => {
  const [name, setName] = useState('');
  const [stat, setStat] = useState<StatName | 'profit_factor'>('complacency');
  const [value, setValue] = useState<number>(1);
  const [source, setSource] = useState('Tabletop GM Ruling');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !source.trim() || value === 0) return;

    const newMod: CustomModifierItem = {
      id: `custom_mod_${Date.now()}`,
      name: name.trim(),
      category: 'custom',
      stat,
      value,
      source: source.trim(),
      notes: notes.trim() || undefined,
      isActive: false, // Per Section 7 rule: "created with isActive = false"
      dateApplied: new Date().toISOString(),
    };

    onAddModifier(newMod);
    onClose();

    // Reset
    setName('');
    setValue(1);
    setSource('Tabletop GM Ruling');
    setNotes('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Custom Modifier"
      subtitle="Log tabletop narrative event outcomes and GM situational modifiers"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
        
        <div>
          <label htmlFor="modifier-title" className="text-[10px] uppercase text-slate-400 block mb-1">
            Modifier Title / Event Designation *
          </label>
          <input
            id="modifier-title"
            type="text"
            required
            placeholder="e.g. Planetary Triumph Festival"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-950 border border-cyan-700/80 rounded-xs px-3 py-2 text-sm text-slate-100 font-serif focus:outline-hidden focus:ring-1 focus:ring-cyan-400"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="target-stat" className="text-[10px] uppercase text-slate-400 block mb-1">
              Target Characteristic *
            </label>
            <select
              id="target-stat"
              value={stat}
              onChange={(e) => setStat(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xs px-2.5 py-1.5 text-slate-100 uppercase"
            >
              <option value="complacency">Complacency</option>
              <option value="order">Order</option>
              <option value="productivity">Productivity</option>
              <option value="piety">Piety</option>
              <option value="size">Size (0–10)</option>
              <option value="profit_factor">Profit Factor (PF)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase text-slate-400 block mb-1">
              Value Modifier (Signed Integer != 0) *
            </label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                required
                value={value}
                onChange={(e) => setValue(Number.parseInt(e.target.value) || 0)}
                className={`w-full bg-slate-950 border rounded-xs px-2.5 py-1.5 font-bold text-center ${
                  value > 0
                    ? 'border-emerald-700 text-emerald-300'
                    : value < 0
                    ? 'border-red-700 text-red-300'
                    : 'border-slate-700 text-slate-400'
                }`}
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase text-slate-400 block mb-1">
            Modifier Source / Tabletop Ruling *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Session 14 — Subdued Cult Uprising"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xs px-3 py-1.5 text-slate-100"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase text-slate-400 block mb-1">
            Lore & Mechanical Notes (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Additional narrative details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-xs p-2 text-slate-100"
          />
        </div>

        <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xs text-[11px] text-slate-400">
          <span className="font-bold text-cyan-300">Imperial Protocol:</span> Custom modifiers are created in an <span className="text-amber-300">Inactive</span> state and can be toggled on/off on the Colony Details audit table at any time.
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xs uppercase font-mono"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={value === 0}
            className="px-4 py-1.5 bg-cyan-900 hover:bg-cyan-800 border border-cyan-500 text-cyan-100 rounded-xs uppercase font-bold tracking-wider flex items-center gap-1.5 disabled:opacity-50"
          >
            <Check className="w-4 h-4" /> Log Custom Modifier
          </button>
        </div>

      </form>
    </Modal>
  );
};
