import React, { useState } from "react";
import { Colony, Infrastructure, InfrastructureState } from "../types/colony";
import { INFRASTRUCTURE_TYPES } from "../data/rulesData";
import { Cpu, CheckCircle2, XCircle, Clock, Plus, Trash2 } from "lucide-react";

interface InfrastructureManagerProps {
  colony: Colony;
  infrastructures: Infrastructure[];
  onUpdateState: (infraId: string, newState: InfrastructureState) => void;
  onAddInfrastructure: (type: string, name: string, state: InfrastructureState, notes?: string) => void;
  onDeleteInfrastructure: (infraId: string) => void;
}

export const InfrastructureManager: React.FC<InfrastructureManagerProps> = ({
  infrastructures,
  onUpdateState,
  onAddInfrastructure,
  onDeleteInfrastructure,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedType, setSelectedType] = useState(INFRASTRUCTURE_TYPES[0].name);
  const [customName, setCustomName] = useState("");
  const [initialState, setInitialState] = useState<InfrastructureState>("working");
  const [notes, setNotes] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const config = INFRASTRUCTURE_TYPES.find((t) => t.name === selectedType);
    onAddInfrastructure(selectedType, customName || config?.display_name || selectedType, initialState, notes);
    setCustomName("");
    setNotes("");
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#121520] border border-[#262f44] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-[#fdba74]" />
            <h2 className="text-xl font-bold font-gothic text-[#f8fafc]">
              HARD INFRASTRUCTURE SYSTEMS
            </h2>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1">
            Core civil systems. Operational infrastructure yields bonuses to Productivity, Order, and Complacency; faulty or sabotaged infrastructure applies harsh penalties.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-3.5 py-2 bg-[#b87333] hover:bg-[#9a5b22] text-[#0d0f17] font-semibold text-xs tracking-wider uppercase rounded transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Install Infrastructure</span>
        </button>
      </div>

      {/* Installed Infrastructure List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {infrastructures.map((infra) => {
          const config = INFRASTRUCTURE_TYPES.find((t) => t.name === infra.infrastructure_type);
          return (
            <div
              key={infra.id}
              className={`bg-[#121520] border rounded-xl p-5 flex flex-col justify-between transition ${
                infra.state === "working"
                  ? "border-[#22c55e]/40 shadow-[0_0_15px_rgba(34,197,94,0.05)]"
                  : infra.state === "not_working"
                  ? "border-[#ef4444]/50 bg-[#2d0e0e]/20"
                  : "border-[#eab308]/40"
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono-slate uppercase tracking-widest text-[#94a3b8] bg-[#1a202c] px-2 py-0.5 rounded">
                      {config?.display_name || infra.infrastructure_type}
                    </span>
                    <h3 className="text-base font-bold text-[#f8fafc] mt-1">{infra.name}</h3>
                  </div>

                  <button
                    onClick={() => onDeleteInfrastructure(infra.id)}
                    title="Decommission"
                    className="text-[#64748b] hover:text-[#ef4444] transition p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-[#94a3b8] mt-2 leading-relaxed">
                  {infra.notes || config?.description}
                </p>

                {/* Modifiers readout */}
                <div className="mt-3 p-2.5 bg-[#0b0d13] border border-[#1e2538] rounded-lg text-xs space-y-1">
                  <div className="text-[10px] uppercase font-mono-slate text-[#64748b]">Active Mechanical Impact:</div>
                  {infra.state === "working" && (
                    <div className="flex flex-wrap gap-2 text-[#86efac] font-medium">
                      {config?.working_modifiers.map((m, idx) => (
                        <span key={idx} className="bg-[#14532d]/40 px-2 py-0.5 rounded border border-[#22c55e]/30">
                          +{m.value} {m.stat.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  )}
                  {infra.state === "not_working" && (
                    <div className="flex flex-wrap gap-2 text-[#fca5a5] font-medium">
                      {config?.not_working_modifiers.map((m, idx) => (
                        <span key={idx} className="bg-[#7f1d1d]/40 px-2 py-0.5 rounded border border-[#ef4444]/30">
                          {m.value} {m.stat.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  )}
                  {infra.state === "in_progress" && (
                    <span className="text-[#fde047] font-mono-slate">Under construction — no bonus or penalty.</span>
                  )}
                </div>
              </div>

              {/* Status Selector Bar */}
              <div className="mt-4 pt-3 border-t border-[#1e2538] flex items-center justify-between">
                <span className="text-[11px] font-mono-slate text-[#94a3b8]">Status:</span>
                <div className="flex space-x-1.5">
                  <button
                    onClick={() => onUpdateState(infra.id, "working")}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
                      infra.state === "working"
                        ? "bg-[#22c55e] text-[#052e16]"
                        : "bg-[#161a26] text-[#94a3b8] hover:bg-[#1e2538]"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Working</span>
                  </button>

                  <button
                    onClick={() => onUpdateState(infra.id, "not_working")}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
                      infra.state === "not_working"
                        ? "bg-[#ef4444] text-[#450a0a]"
                        : "bg-[#161a26] text-[#94a3b8] hover:bg-[#1e2538]"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Faulty</span>
                  </button>

                  <button
                    onClick={() => onUpdateState(infra.id, "in_progress")}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold transition ${
                      infra.state === "in_progress"
                        ? "bg-[#eab308] text-[#422006]"
                        : "bg-[#161a26] text-[#94a3b8] hover:bg-[#1e2538]"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>In-Prog</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {infrastructures.length === 0 && (
        <div className="bg-[#121520] border border-dashed border-[#334155] rounded-xl p-8 text-center text-[#94a3b8]">
          <Cpu className="w-8 h-8 text-[#64748b] mx-auto mb-2" />
          <p className="text-sm font-semibold">No Hard Infrastructure nodes installed on this colony.</p>
          <p className="text-xs text-[#64748b] mt-1">Install Transport, Power, Water, Food, or Comms to elevate colony output.</p>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121520] border border-[#b87333]/50 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold font-gothic text-[#f8fafc]">
              INSTALL INFRASTRUCTURE NODE
            </h3>

            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                  Infrastructure Classification
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                >
                  {INFRASTRUCTURE_TYPES.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                  Facility Designation / Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Omnissiah Plasma Core Alpha"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                  Initial Operational State
                </label>
                <select
                  value={initialState}
                  onChange={(e) => setInitialState(e.target.value as any)}
                  className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                >
                  <option value="working">Working (Bonuses active)</option>
                  <option value="in_progress">In-Progress (Constructing)</option>
                  <option value="not_working">Faulty / Incapacitated (Penalties active)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono-slate text-[#94a3b8] mb-1">
                  Notes & Lore
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe location, tech level, or machinery details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#0b0d13] border border-[#334155] rounded px-3 py-2 text-sm text-[#f8fafc]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-[#1e2538]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-[#1e2538] hover:bg-[#2a344a] text-xs font-semibold text-[#cbd5e1] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#b87333] hover:bg-[#9a5b22] text-xs font-semibold text-[#0d0f17] uppercase tracking-wider rounded"
                >
                  Confirm Installation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
