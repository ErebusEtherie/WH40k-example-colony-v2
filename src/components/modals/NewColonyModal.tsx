import React, { useState } from "react";
import { ColonyType } from "../../types/colony";
import { useColonyTypes } from "../../lib/api";
import { normalizeApiError } from "../../lib/error";
import { X, Landmark, Check, Loader2 } from "lucide-react";

interface NewColonyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateColony: (colonyData: {
    name: string;
    star_system: string;
    colony_type: ColonyType;
    base_size: number;
    founder_name: string;
    notes: string;
  }) => void;
}

function StatCell({
  label,
  value,
  testId,
}: {
  label: string;
  value: number;
  testId: string;
}) {
  return (
    <div className="bg-[#070a12] border border-[#252f44] rounded p-2 text-center">
      <div className="text-[10px] uppercase tracking-wider text-[#94a3b8] mb-1">
        {label}
      </div>
      <div data-testid={testId} className="text-lg font-gothic text-[#f8fafc]">
        {value}
      </div>
    </div>
  );
}

export const NewColonyModal: React.FC<NewColonyModalProps> = ({
  isOpen,
  onClose,
  onCreateColony,
}) => {
  const [name, setName] = useState("");
  const [starSystem, setStarSystem] = useState("");
  const [colonyType, setColonyType] = useState<ColonyType>("mining_and_industry");
  const [baseSize, setBaseSize] = useState(1);
  const [founderName, setFounderName] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Backend is the single source of truth for colony-type data (stats and
  // special effects) — the modal renders what /config/colony-types returns.
  const {
    data: colonyTypes,
    isLoading: colonyTypesLoading,
    isError: colonyTypesError,
    error: colonyTypesErrorInfo,
  } = useColonyTypes();

  const selectedType = colonyTypes?.find((t) => t.id === colonyType);

  if (!isOpen) return null;

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please specify a valid colony designation.");
      return;
    }
    // founder_name is a required, non-empty field on the backend (ColonyCreate
    // enforces min_length=1), so collect it from the GM rather than defaulting
    // to a dynasty placeholder.
    if (!founderName.trim()) {
      setError("Please specify a founding dynasty or founder.");
      return;
    }

    onCreateColony({
      name: name.trim(),
      star_system: starSystem.trim(),
      colony_type: colonyType,
      base_size: baseSize,
      founder_name: founderName.trim(),
      notes: notes.trim(),
    });

    onClose();
  };

  // Colony-type effects are sorted into the Starting Benefits and Conditional
  // Bonuses sections by their flags: an upgrade-granting effect goes under
  // Starting Benefits, while a resource-exploit/bonus effect goes under
  // Conditional Bonuses. Because each effect carries only its own section's
  // full description, no per-item label is needed inside either section.
  const startingBenefits = (selectedType?.special_effects ?? []).filter(
    (effect) => effect.starts_with_upgrade
  );
  const conditionalBonuses = (selectedType?.special_effects ?? []).filter(
    (effect) =>
      (effect.resource_types?.length ?? 0) > 0 ||
      effect.productivity_bonus != null ||
      effect.additional_pf != null ||
      effect.famine_resilience_roll != null
  );

  const loadError = colonyTypesError
    ? normalizeApiError(colonyTypesErrorInfo)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="gothic-bracket-box w-full max-w-2xl bg-[#0a0e18] border border-[#f59e0b]/60 rounded-lg shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <div className="gothic-bracket-bottom-left" />
        <div className="gothic-bracket-bottom-right" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#222e46] pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Landmark className="w-5 h-5 text-[#f59e0b]" />
            <div>
              <h2 className="font-gothic font-bold text-base tracking-wider text-[#fef08a] uppercase">
                FOUND NEW IMPERIAL COLONY
              </h2>
              <p className="text-xs text-[#94a3b8] font-mono-slate">
                Charter a new planetary domain in the Koronus Expanse
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#64748b] hover:text-white p-1 rounded transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-[#ef4444]/15 border border-[#ef4444]/50 rounded text-xs font-mono-slate text-[#fca5a5]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono-slate text-xs">
          {/* Row 1: Designation and Star System */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="modal-colony-name-input"
                className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold"
              >
                Colony Name *
              </label>
              <input
                id="modal-colony-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Castellax Secundus"
                className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="modal-colony-system-input"
                className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold"
              >
                Star System
              </label>
              <input
                id="modal-colony-system-input"
                type="text"
                value={starSystem}
                onChange={(e) => setStarSystem(e.target.value)}
                placeholder="e.g. Mundus Valancius"
                className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
              />
            </div>
          </div>

          {/* Row 2: Colony Type Selector + persistent preview panel */}
          <div>
            <div className="block text-[#cbd5e1] uppercase tracking-wider mb-1.5 font-semibold">
              Colony Type
            </div>

            {colonyTypesLoading ? (
              <div
                data-testid="colony-types-loading"
                className="flex items-center gap-2 p-4 bg-[#0d121f] border border-[#222e46] rounded-lg text-xs text-[#94a3b8]"
              >
                <Loader2 className="w-4 h-4 animate-spin text-[#f59e0b]" />
                Establishing vox-link to colony directory...
              </div>
            ) : colonyTypesError ? (
              <div
                data-testid="colony-types-error"
                className="p-4 bg-[#ef4444]/10 border border-[#ef4444]/40 rounded-lg text-xs font-mono-slate text-[#fca5a5]"
              >
                Failed to load colony types: {loadError?.message}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {(colonyTypes ?? []).map((type) => {
                  const isSelected = colonyType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setColonyType(type.id)}
                      className={`p-4 rounded-lg border text-left transition ${
                        isSelected
                          ? "bg-[#f59e0b]/20 border-[#f59e0b] text-[#fef08a]"
                          : "bg-[#0d121f] border-[#222e46] text-[#cbd5e1] hover:border-[#38bdf8]/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-gothic font-bold text-sm uppercase block">
                          {type.name}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-[#f59e0b]" />}
                      </div>
                      <p className="text-xs text-[#94a3b8] mt-2 leading-snug">
                        {type.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedType && (
              <div className="mt-4 space-y-4 bg-[#0d121f] border border-[#222e46] rounded-lg p-4">
                {/* Starting base stats (Size omitted per project decision) */}
                <div>
                  <div className="text-[#cbd5e1] uppercase tracking-wider text-[11px] font-semibold mb-2">
                    Starting Base Stats
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <StatCell
                      label="Productivity"
                      value={selectedType.base_stats.productivity}
                      testId="stat-productivity"
                    />
                    <StatCell
                      label="Piety"
                      value={selectedType.base_stats.piety}
                      testId="stat-piety"
                    />
                    <StatCell
                      label="Order"
                      value={selectedType.base_stats.order}
                      testId="stat-order"
                    />
                    <StatCell
                      label="Complacency"
                      value={selectedType.base_stats.complacency}
                      testId="stat-complacency"
                    />
                  </div>
                </div>

                {startingBenefits.length > 0 && (
                  <div data-testid="starting-benefits">
                    <div className="text-[#fef08a] uppercase tracking-wider text-[11px] font-semibold mb-1.5">
                      Starting Benefits
                    </div>
                    <ul className="space-y-1.5">
                      {startingBenefits.map((effect) => (
                        <li
                          key={effect.name}
                          className="text-xs text-[#cbd5e1] leading-snug"
                        >
                          {effect.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {conditionalBonuses.length > 0 && (
                  <div data-testid="conditional-bonuses">
                    <div className="text-[#38bdf8] uppercase tracking-wider text-[11px] font-semibold mb-1.5">
                      Conditional Bonuses
                    </div>
                    <ul className="space-y-1.5">
                      {conditionalBonuses.map((effect) => (
                        <li
                          key={effect.name}
                          className="text-xs text-[#cbd5e1] leading-snug"
                        >
                          {effect.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Row 3: Initial Size & Founder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="modal-colony-size-input"
                className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold"
              >
                Initial Settlement Size (0-10)
              </label>
              <input
                id="modal-colony-size-input"
                type="number"
                min="0"
                max="10"
                value={baseSize}
                onChange={(e) => setBaseSize(Number.parseInt(e.target.value, 10) || 1)}
                className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="modal-colony-founder-input"
                className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold"
              >
                Founding Dynasty / Founder
              </label>
              <input
                id="modal-colony-founder-input"
                type="text"
                value={founderName}
                onChange={(e) => setFounderName(e.target.value)}
                placeholder="e.g. Von Valancius Dynasty"
                className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
              />
            </div>
          </div>

          {/* Row 4: Notes */}
          <div>
            <label
              htmlFor="modal-colony-notes-input"
              className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold"
            >
              Colony Dossier Notes & Strategic Intent
            </label>
            <textarea
              id="modal-colony-notes-input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Record planetary geology, strategic value, or dynasty edicts..."
              className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-[#222e46]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#121828] hover:bg-[#1a233a] border border-[#2c364d] text-xs text-[#94a3b8] hover:text-white rounded uppercase font-semibold transition"
            >
              Cancel
            </button>
            <button
              id="modal-found-colony-submit"
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-[#b45309] to-[#f59e0b] hover:from-[#d97706] hover:to-[#fcd34d] text-[#06080e] font-gothic font-bold text-xs uppercase tracking-wider rounded transition shadow-lg"
            >
              Establish New Colony
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
