import React, { useState } from "react";
import { Colony, ColonyEvent, Modifier, ModifierStat } from "../types/colony";
import { Activity, Plus, Trash2, BookOpen, AlertOctagon, Flame } from "lucide-react";

interface ModifiersEventsManagerProps {
  colony: Colony;
  modifiers: Modifier[];
  events: ColonyEvent[];
  onAddModifier: (
    name: string,
    stat: ModifierStat,
    value: number,
    source: string,
    description?: string
  ) => void;
  onDeleteModifier: (modId: string) => void;
  onAddEvent: (
    name: string,
    type: "cycle" | "crisis" | "gm_ruling" | "trade",
    description: string,
    effects?: string
  ) => void;
}

export const ModifiersEventsManager: React.FC<ModifiersEventsManagerProps> = ({
  modifiers,
  events,
  onAddModifier,
  onDeleteModifier,
  onAddEvent,
}) => {
  const [showModModal, setShowModModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);

  // Modifier state
  const [modName, setModName] = useState("");
  const [modStat, setModStat] = useState<ModifierStat>("order");
  const [modValue, setModValue] = useState<number>(1);
  const [modSource, setModSource] = useState("GM Ruling");
  const [modDesc, setModDesc] = useState("");

  // Event state
  const [evtName, setEvtName] = useState("");
  const [evtType, setEvtType] = useState<"cycle" | "crisis" | "gm_ruling" | "trade">("cycle");
  const [evtDesc, setEvtDesc] = useState("");
  const [evtEffects, setEvtEffects] = useState("");

  const handleAddMod = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modName) return;
    onAddModifier(modName, modStat, Number(modValue), modSource, modDesc);
    setModName("");
    setModDesc("");
    setShowModModal(false);
  };

  const handleAddEvt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evtName || !evtDesc) return;
    onAddEvent(evtName, evtType, evtDesc, evtEffects);
    setEvtName("");
    setEvtDesc("");
    setEvtEffects("");
    setShowEventModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#121520] border border-[#262f44] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-[#fdba74]" />
            <h2 className="text-xl font-bold font-gothic text-[#f8fafc]">
              MODIFIERS & EVENT CHRONICLE
            </h2>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1">
            Log custom GM adjustments, planetary conditions, Warp phenomena, and historical narrative events that shape the colony's fate.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowModModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#b87333] hover:bg-[#9a5b22] text-[#0d0f17] font-semibold text-xs tracking-wider uppercase rounded transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Modifier</span>
          </button>
          <button
            onClick={() => setShowEventModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1e2538] hover:bg-[#2a344a] text-[#cbd5e1] font-semibold text-xs tracking-wider uppercase rounded border border-[#334155] transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record Event</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Modifiers Section */}
        <div className="space-y-3">
          <h3 className="font-gothic font-bold text-sm text-[#f8fafc] flex items-center space-x-2">
            <Flame className="w-4 h-4 text-[#fb923c]" />
            <span>ACTIVE GM & PLANETARY MODIFIERS ({modifiers.length})</span>
          </h3>

          <div className="space-y-2.5">
            {modifiers.map((mod) => (
              <div
                key={mod.id}
                className="bg-[#121520] border border-[#2a344a] rounded-xl p-4 flex items-start justify-between gap-3 shadow"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-[#f8fafc]">{mod.name}</span>
                    <span
                      className={`px-2 py-0.5 text-xs font-mono-slate font-bold rounded ${
                        mod.modifier_value >= 0
                          ? "bg-[#14532d]/40 text-[#86efac] border border-[#22c55e]/30"
                          : "bg-[#7f1d1d]/40 text-[#fca5a5] border border-[#ef4444]/30"
                      }`}
                    >
                      {mod.modifier_value >= 0 ? `+${mod.modifier_value}` : mod.modifier_value}{" "}
                      {mod.modifier_stat.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-[#94a3b8] leading-relaxed">{mod.description}</p>
                  <div className="text-[10px] text-[#64748b] font-mono-slate">
                    Source: {mod.source}
                  </div>
                </div>

                <button
                  onClick={() => onDeleteModifier(mod.id)}
                  title="Remove modifier"
                  className="text-[#64748b] hover:text-[#ef4444] transition p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {modifiers.length === 0 && (
              <div className="bg-[#121520] border border-dashed border-[#334155] rounded-xl p-6 text-center text-[#94a3b8] text-xs">
                No custom GM modifiers currently active on this world.
              </div>
            )}
          </div>
        </div>

        {/* Colony Event Log */}
        <div className="space-y-3">
          <h3 className="font-gothic font-bold text-sm text-[#f8fafc] flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-[#fdba74]" />
            <span>COLONY EVENT HISTORY ({events.length})</span>
          </h3>

          <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="bg-[#121520] border border-[#2a344a] rounded-xl p-4 space-y-1.5 shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-[#f8fafc]">{evt.event_name}</span>
                    <span className="px-2 py-0.5 text-[10px] uppercase font-mono-slate bg-[#1e2538] text-[#fdba74] rounded">
                      {evt.event_type}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#64748b] font-mono-slate">
                    {new Date(evt.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-[#94a3b8] leading-relaxed">{evt.description}</p>

                {evt.effects_applied && (
                  <div className="mt-1 p-2 bg-[#0b0d13] border border-[#1e2538] rounded text-[11px] text-[#86efac] font-mono-slate">
                    Outcome: {evt.effects_applied}
                  </div>
                )}
              </div>
            ))}

            {events.length === 0 && (
              <div className="bg-[#121520] border border-dashed border-[#334155] rounded-xl p-6 text-center text-[#94a3b8] text-xs">
                No historical events logged yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Modifier Modal */}
      {showModModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121520] border border-[#b87333]/50 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-gothic text-[#f8fafc]">
              APPLY CUSTOM GM MODIFIER
            </h3>

            <form onSubmit={handleAddMod} className="space-y-3">
              <div>
                <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                  Modifier Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ash Waste Storms, Tech-Heresy Purge"
                  value={modName}
                  onChange={(e) => setModName(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                    Target Characteristic
                  </label>
                  <select
                    value={modStat}
                    onChange={(e) => setModStat(e.target.value as any)}
                    className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                  >
                    <option value="size">Size</option>
                    <option value="complacency">Complacency</option>
                    <option value="order">Order</option>
                    <option value="productivity">Productivity</option>
                    <option value="piety">Piety</option>
                    <option value="profit_factor">Profit Factor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                    Modifier Value (+/-)
                  </label>
                  <input
                    type="number"
                    value={modValue}
                    onChange={(e) => setModValue(Number(e.target.value))}
                    className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc] font-mono-slate"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                  Source / Authority
                </label>
                <input
                  type="text"
                  placeholder="e.g. GM Ruling, Narrative Event, Planetary Trait"
                  value={modSource}
                  onChange={(e) => setModSource(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                  Narrative Justification
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain why this modifier has been instituted..."
                  value={modDesc}
                  onChange={(e) => setModDesc(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#1e2538]">
                <button
                  type="button"
                  onClick={() => setShowModModal(false)}
                  className="px-4 py-2 bg-[#1e2538] hover:bg-[#2a344a] text-xs font-semibold text-[#cbd5e1] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#b87333] hover:bg-[#9a5b22] text-xs font-semibold text-[#0d0f17] uppercase tracking-wider rounded"
                >
                  Apply Modifier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Event Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121520] border border-[#b87333]/50 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-gothic text-[#f8fafc]">
              RECORD HISTORICAL EVENT
            </h3>

            <form onSubmit={handleAddEvt} className="space-y-3">
              <div>
                <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Void Pirate Blockade, Miraculous Relic Exhumed"
                  value={evtName}
                  onChange={(e) => setEvtName(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                  Event Category
                </label>
                <select
                  value={evtType}
                  onChange={(e) => setEvtType(e.target.value as any)}
                  className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                >
                  <option value="cycle">90-Day Cycle Event</option>
                  <option value="crisis">Planetary Crisis</option>
                  <option value="gm_ruling">GM Narrative Decrees</option>
                  <option value="trade">Trade Fleet Arrival</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                  Event Description
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="Narrate the encounter, casualty reports, or political shifts..."
                  value={evtDesc}
                  onChange={(e) => setEvtDesc(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                  Mechanical Effects & Rewards (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. +100 Achievement Points, +1 Profit Factor"
                  value={evtEffects}
                  onChange={(e) => setEvtEffects(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#1e2538]">
                <button
                  type="button"
                  onClick={() => setShowEventModal(false)}
                  className="px-4 py-2 bg-[#1e2538] hover:bg-[#2a344a] text-xs font-semibold text-[#cbd5e1] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#b87333] hover:bg-[#9a5b22] text-xs font-semibold text-[#0d0f17] uppercase tracking-wider rounded"
                >
                  Commit to Chronicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
