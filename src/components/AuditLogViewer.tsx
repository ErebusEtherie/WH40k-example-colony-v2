import React from "react";
import { AuditLog } from "../types/colony";
import { BookOpen, ShieldCheck, UserCheck, Wrench, PlusCircle } from "lucide-react";

interface AuditLogViewerProps {
  logs: AuditLog[];
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({ logs }) => {
  const getActionIcon = (action: string) => {
    if (action.includes("INFRASTRUCTURE")) return Wrench;
    if (action.includes("REPRESENTATIVE") || action.includes("GOVERNOR")) return UserCheck;
    if (action.includes("COLONY")) return PlusCircle;
    return ShieldCheck;
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#121520] border border-[#262f44] rounded-xl p-5">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-[#fdba74]" />
          <h2 className="text-xl font-bold font-gothic text-[#f8fafc]">
            ADMINISTRATUM AUDIT CHRONICLE
          </h2>
        </div>
        <p className="text-xs text-[#94a3b8] mt-1">
          Immutable historical audit ledger tracking all administrative actions, construction milestones, and imperial edicts.
        </p>
      </div>

      <div className="bg-[#121520] border border-[#2a344a] rounded-xl overflow-hidden shadow">
        <div className="divide-y divide-[#1e2538]">
          {logs.map((log) => {
            const Icon = getActionIcon(log.action);
            return (
              <div key={log.id} className="p-4 hover:bg-[#161a26] transition flex items-start space-x-3.5">
                <div className="p-2 bg-[#1e2538] text-[#fdba74] rounded-lg shrink-0 mt-0.5 border border-[#334155]">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono-slate font-bold text-[#f8fafc]">
                      {log.action.replace(/_/g, " ")}
                    </span>
                    <span className="text-[11px] text-[#64748b] font-mono-slate shrink-0">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-[#cbd5e1] mt-1 leading-relaxed">{log.details}</p>
                  <div className="text-[10px] text-[#94a3b8] font-mono-slate mt-1">
                    Signatory: <span className="text-[#fdba74]">{log.actor}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {logs.length === 0 && (
            <div className="p-8 text-center text-[#94a3b8] text-xs">
              No audit logs recorded for this colony.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
