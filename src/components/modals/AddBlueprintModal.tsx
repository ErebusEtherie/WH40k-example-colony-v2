import React, { useState } from "react";
import { DevelopmentPlan } from "../../types/colony";
import { X, Layers, Plus } from "lucide-react";

interface AddBlueprintModalProps {
  isOpen: boolean;
  onClose: () => void;
  colonyId: string;
  onAddPlan: (planData: Omit<DevelopmentPlan, "id">) => void;
}

export const AddBlueprintModal: React.FC<AddBlueprintModalProps> = ({
  isOpen,
  onClose,
  colonyId,
  onAddPlan,
}) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"Hard Infrastructure" | "Support Upgrade" | "Specialty Project">("Support Upgrade");
  const [specificType, setSpecificType] = useState("INFANTRY GARRISON");
  const [priorityRank, setPriorityRank] = useState(1);
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressDetails, setProgressDetails] = useState("Initial site excavation underway");
  const [description, setDescription] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddPlan({
      colony_id: colonyId,
      name: name.trim(),
      category,
      specific_type: specificType.trim().toUpperCase(),
      priority_rank: priorityRank,
      progress_percent: progressPercent,
      progress_details: progressDetails.trim(),
      status: progressPercent >= 100 ? "completed" : "in_progress",
      description: description.trim() || "Long-term dynasty strategic construction.",
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="gothic-bracket-box w-full max-w-xl bg-[#0a0e18] border border-[#f59e0b]/60 rounded-lg shadow-2xl p-6 relative">
        <div className="gothic-bracket-bottom-left" />
        <div className="gothic-bracket-bottom-right" />

        <div className="flex items-center justify-between border-b border-[#222e46] pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-[#f59e0b]" />
            <div>
              <h2 className="font-gothic font-bold text-base tracking-wider text-[#fef08a] uppercase">
                ADD PLAN BLUEPRINT
              </h2>
              <p className="text-xs text-[#94a3b8] font-mono-slate">
                Register a new long-term development construction project
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

        <form onSubmit={handleSubmit} className="space-y-4 font-mono-slate text-xs">
          {/* Project Name */}
          <div>
            <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
              Project Designation / Name *
            </label>
            <input
              id="modal-plan-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Imperial Guard Garrison Bastion"
              className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
            />
          </div>

          {/* Category & Specific Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
                Blueprint Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
              >
                <option value="Support Upgrade">Support Upgrade</option>
                <option value="Hard Infrastructure">Hard Infrastructure</option>
                <option value="Specialty Project">Specialty Project</option>
              </select>
            </div>

            <div>
              <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
                Specific System / Upgrade Type
              </label>
              <input
                type="text"
                value={specificType}
                onChange={(e) => setSpecificType(e.target.value)}
                placeholder="e.g. INFANTRY GARRISON"
                className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none uppercase"
              />
            </div>
          </div>

          {/* Priority Rank & Progress Percent */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
                Priority Rank (1-10)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={priorityRank}
                onChange={(e) => setPriorityRank(parseInt(e.target.value, 10) || 1)}
                className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
                Current Construction Progress (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={progressPercent}
                onChange={(e) => setProgressPercent(parseInt(e.target.value, 10) || 0)}
                className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
              />
            </div>
          </div>

          {/* Progress Details Note */}
          <div>
            <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
              Progress Status Note
            </label>
            <input
              type="text"
              value={progressDetails}
              onChange={(e) => setProgressDetails(e.target.value)}
              placeholder="e.g. 65% complete (plasteel foundations poured)"
              className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3 py-2 rounded focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1 font-semibold">
              Project Description & Strategic Intent
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Garrison capacity, strategic doctrine, or supply requirements..."
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
              id="modal-add-blueprint-submit"
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-[#b45309] to-[#f59e0b] hover:from-[#d97706] hover:to-[#fcd34d] text-[#06080e] font-gothic font-bold text-xs uppercase tracking-wider rounded transition shadow-lg"
            >
              Register Blueprint
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
