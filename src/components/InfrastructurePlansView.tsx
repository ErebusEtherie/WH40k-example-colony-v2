import React from "react";
import {
  Colony,
  Infrastructure,
  SupportUpgrade,
  DevelopmentPlan,
  ColonyStatsBreakdown,
} from "../types/colony";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  TrendingUp,
  Flame,
  Shield,
  Smile,
  ShieldCheck,
} from "lucide-react";

interface InfrastructurePlansViewProps {
  colony: Colony;
  stats: ColonyStatsBreakdown;
  infrastructures: Infrastructure[];
  upgrades: SupportUpgrade[];
  plans: DevelopmentPlan[];
  onOpenCommissionSystem: () => void;
  onOpenInstallUpgrade: () => void;
  onOpenAddBlueprint: () => void;
  onUpdateInfrastructureState: (id: string, state: Infrastructure["state"]) => void;
  onUpdateUpgradeState: (id: string, state: SupportUpgrade["state"]) => void;
  onDeleteInfrastructure: (id: string) => void;
  onDeleteUpgrade: (id: string) => void;
  onDeletePlan: (id: string) => void;
  onPromotePlan: (plan: DevelopmentPlan) => void;
}

export const InfrastructurePlansView: React.FC<InfrastructurePlansViewProps> = ({
  colony,
  stats,
  infrastructures,
  upgrades,
  plans,
  onOpenCommissionSystem,
  onOpenInstallUpgrade,
  onOpenAddBlueprint,
  onUpdateInfrastructureState,
  onUpdateUpgradeState,
  onDeleteInfrastructure,
  onDeleteUpgrade,
  onDeletePlan,
  onPromotePlan,
}) => {
  const isCapped = upgrades.length >= stats.size.final;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* 1. Hard Infrastructure Systems */}
      <div className="gothic-bracket-box p-5 sm:p-6 rounded shadow-xl space-y-4">
        <div className="gothic-bracket-bottom-left" />
        <div className="gothic-bracket-bottom-right" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#222e46] pb-3">
          <div>
            <h2 className="font-gothic font-bold text-base sm:text-lg tracking-wider text-[#f59e0b] uppercase flex items-center space-x-2">
              <Layers className="w-4 h-4 text-[#f59e0b]" />
              <span>HARD INFRASTRUCTURE SYSTEMS</span>
            </h2>
            <p className="text-xs text-[#94a3b8] font-mono-slate mt-0.5">
              Essential Colonial Systems
            </p>
          </div>

          <button
            id="infra-commission-system-button"
            onClick={onOpenCommissionSystem}
            className="px-3.5 py-1.5 bg-[#f59e0b]/20 hover:bg-[#f59e0b]/30 text-[#fef08a] border border-[#f59e0b]/60 font-gothic font-bold text-xs uppercase tracking-wider rounded transition flex items-center space-x-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Commission System</span>
          </button>
        </div>

        {/* Hard Systems Rows */}
        <div className="space-y-3 font-mono-slate text-xs">
          {infrastructures.map((infra) => (
            <div
              key={infra.id}
              className="p-4 bg-[#0d121f] border border-[#1e293b] rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-gothic font-bold text-sm text-[#f8fafc] capitalize">
                    {infra.name || `${infra.infrastructure_type} System`}
                  </span>
                  <span className="px-2 py-0.5 bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 rounded text-[10px] uppercase font-bold">
                    {infra.infrastructure_type.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-[11px] text-[#94a3b8]">
                  {infra.notes || "Operational Imperial-grade standard network."}
                </p>

                {/* Active Effects */}
                {infra.active_effects && infra.active_effects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {infra.active_effects.map((eff, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30 rounded text-[10px] font-bold uppercase"
                      >
                        +{eff.value} {eff.stat}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Switcher & Delete */}
              <div className="flex items-center space-x-2 self-end md:self-center">
                <div className="flex rounded border border-[#23314d] p-0.5 bg-[#070a12]">
                  {(["working", "not_working", "in_progress", "needed"] as Infrastructure["state"][]).map(
                    (st) => (
                      <button
                        key={st}
                        onClick={() => onUpdateInfrastructureState(infra.id, st)}
                        className={`px-2 py-1 text-[10px] font-bold uppercase rounded transition ${
                          infra.state === st
                            ? st === "working"
                              ? "bg-[#10b981] text-[#06080e]"
                              : st === "not_working"
                              ? "bg-[#ef4444] text-white"
                              : st === "in_progress"
                              ? "bg-[#f59e0b] text-[#06080e]"
                              : "bg-[#64748b] text-white"
                            : "text-[#94a3b8] hover:text-white"
                        }`}
                      >
                        {st.replace(/_/g, " ")}
                      </button>
                    )
                  )}
                </div>

                <button
                  onClick={() => onDeleteInfrastructure(infra.id)}
                  className="p-1.5 text-[#64748b] hover:text-[#f87171] rounded transition"
                  title="Remove Infrastructure System"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Support Upgrades */}
      <div className="gothic-bracket-box p-5 sm:p-6 rounded shadow-xl space-y-4">
        <div className="gothic-bracket-bottom-left" />
        <div className="gothic-bracket-bottom-right" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#222e46] pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-gothic font-bold text-base sm:text-lg tracking-wider text-[#f59e0b] uppercase">
                SUPPORT UPGRADES
              </h2>
              {isCapped && (
                <span className="px-2 py-0.5 bg-[#f59e0b]/20 text-[#fef08a] border border-[#f59e0b]/50 rounded text-[10px] font-mono-slate font-bold">
                  CAPACITY FULL (SIZE {stats.size.final})
                </span>
              )}
            </div>
            <p className="text-xs text-[#94a3b8] font-mono-slate mt-0.5">
              Support Upgrades • Capacity: {upgrades.length} Installed / Max {stats.size.final} (Capped by Colony Size)
            </p>
          </div>

          <button
            id="infra-install-upgrade-button"
            onClick={onOpenInstallUpgrade}
            className="px-3.5 py-1.5 bg-[#f59e0b]/20 hover:bg-[#f59e0b]/30 text-[#fef08a] border border-[#f59e0b]/60 font-gothic font-bold text-xs uppercase tracking-wider rounded transition flex items-center space-x-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Install Upgrade</span>
          </button>
        </div>

        {/* Upgrades Rows */}
        <div className="space-y-3 font-mono-slate text-xs">
          {upgrades.length > 0 ? (
            upgrades.map((upg) => (
              <div
                key={upg.id}
                className="p-4 bg-[#0d121f] border border-[#1e293b] rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-gothic font-bold text-sm text-[#f8fafc] capitalize">
                      {upg.name || upg.upgrade_type.replace(/_/g, " ")}
                    </span>
                    <span className="px-2 py-0.5 bg-[#a855f7]/15 text-[#c084fc] border border-[#a855f7]/30 rounded text-[10px] uppercase font-bold">
                      {upg.upgrade_type.replace(/_/g, " ")}
                    </span>
                    {upg.custom_product && (
                      <span className="text-[10px] text-[#fef08a] bg-[#f59e0b]/10 px-1.5 py-0.5 rounded border border-[#f59e0b]/30">
                        Product: {upg.custom_product}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#cbd5e1]">{upg.description}</p>
                  {upg.mechanical_description && (
                    <p className="text-[11px] text-[#94a3b8] italic">
                      {upg.mechanical_description}
                    </p>
                  )}
                </div>

                {/* Status Switcher & Delete */}
                <div className="flex items-center space-x-2 self-end md:self-center">
                  <div className="flex rounded border border-[#23314d] p-0.5 bg-[#070a12]">
                    {(["working", "not_working", "in_progress"] as SupportUpgrade["state"][]).map(
                      (st) => (
                        <button
                          key={st}
                          onClick={() => onUpdateUpgradeState(upg.id, st)}
                          className={`px-2 py-1 text-[10px] font-bold uppercase rounded transition ${
                            upg.state === st
                              ? st === "working"
                                ? "bg-[#10b981] text-[#06080e]"
                                : st === "not_working"
                                ? "bg-[#ef4444] text-white"
                                : "bg-[#f59e0b] text-[#06080e]"
                              : "text-[#94a3b8] hover:text-white"
                          }`}
                        >
                          {st.replace(/_/g, " ")}
                        </button>
                      )
                    )}
                  </div>

                  <button
                    onClick={() => onDeleteUpgrade(upg.id)}
                    className="p-1.5 text-[#64748b] hover:text-[#f87171] rounded transition"
                    title="Remove Support Upgrade"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-[#64748b] italic">
              No support upgrades installed. Use "Install Upgrade" to add facilities.
            </div>
          )}
        </div>
      </div>

      {/* 3. Colony Development Plans */}
      <div className="gothic-bracket-box p-5 sm:p-6 rounded shadow-xl space-y-4">
        <div className="gothic-bracket-bottom-left" />
        <div className="gothic-bracket-bottom-right" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#222e46] pb-3">
          <div>
            <h2 className="font-gothic font-bold text-base sm:text-lg tracking-wider text-[#f59e0b] uppercase">
              COLONY DEVELOPMENT PLANS
            </h2>
            <p className="text-xs text-[#94a3b8] font-mono-slate mt-0.5">
              Long-term development plans, priority schedule (1–10)
            </p>
          </div>

          <button
            id="infra-add-blueprint-button"
            onClick={onOpenAddBlueprint}
            className="px-3.5 py-1.5 bg-[#f59e0b]/20 hover:bg-[#f59e0b]/30 text-[#fef08a] border border-[#f59e0b]/60 font-gothic font-bold text-xs uppercase tracking-wider rounded transition flex items-center space-x-1.5 whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Plan Blueprint</span>
          </button>
        </div>

        {/* Plans Rows */}
        <div className="space-y-3 font-mono-slate text-xs">
          {plans.length > 0 ? (
            plans.map((plan) => (
              <div
                key={plan.id}
                className="p-4 bg-[#0d121f] border border-[#1e293b] rounded-lg space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-gothic font-bold text-sm text-[#fef08a]">
                      {plan.name}
                    </span>
                    <span className="px-2 py-0.5 bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 rounded text-[10px] uppercase font-bold">
                      {plan.category}: {plan.specific_type}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-[#94a3b8]">
                      Priority: {plan.priority_rank}/10
                    </span>
                    <button
                      id={`promote-plan-${plan.id}`}
                      onClick={() => onPromotePlan(plan)}
                      className="flex items-center space-x-1 px-2.5 py-1 bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#34d399] border border-[#10b981]/60 rounded text-xs font-bold transition"
                      title="Promote directly into active working domain"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      <span>Promote</span>
                    </button>
                    <button
                      onClick={() => onDeletePlan(plan.id)}
                      className="p-1 text-[#64748b] hover:text-[#f87171] rounded transition"
                      title="Delete Blueprint"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-[#cbd5e1]">{plan.description}</p>

                {/* Progress Bar & Details */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-[#94a3b8]">
                    <span>
                      Progress: {plan.progress_percent || 0}% complete ({plan.progress_details || "active construction"})
                    </span>
                    <span className="uppercase font-bold text-[#38bdf8]">
                      {plan.status || "in_progress"}
                    </span>
                  </div>
                  <div className="w-full bg-[#070a12] rounded-full h-1.5 overflow-hidden border border-[#1e293b]">
                    <div
                      className="bg-gradient-to-r from-[#b45309] to-[#f59e0b] h-full rounded-full transition-all duration-300"
                      style={{ width: `${plan.progress_percent || 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-[#64748b] italic">
              No long-term development blueprints scheduled. Click "Add Plan Blueprint" to register new infrastructure projects.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
