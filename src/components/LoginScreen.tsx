import React, { useState } from "react";
import { Key, Cpu, Loader2, ShieldCheck, Eye } from "lucide-react";
import { loginApi } from "../lib/api";
import { User } from "../types/colony";

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState("LordCaptain");
  const [password, setPassword] = useState("WarrantOfTrade");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performLogin = async (uname: string, pword: string) => {
    setError(null);
    setLoading(true);
    try {
      const user = await loginApi(uname, pword);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || "Failed to authenticate cipher credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Please provide a valid Dynasty Cipher / Scribe ID");
      return;
    }
    performLogin(username.trim(), password);
  };

  return (
    <div className="min-h-screen bg-[#06080e] flex flex-col items-center justify-center p-4 selection:bg-[#f59e0b]/30 selection:text-[#fef08a] relative overflow-hidden">
      {/* Background Ambience / Scanlines */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1e1b4b]/20 via-[#06080e] to-[#040508] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#11182715_1px,transparent_1px),linear-gradient(to_bottom,#11182715_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-lg z-10 space-y-6">
        {/* Imperial Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded border border-[#f59e0b]/60 bg-[#0d121f] shadow-[0_0_25px_rgba(245,158,11,0.2)] mb-2">
            <Cpu className="w-8 h-8 text-[#f59e0b]" />
          </div>

          <div className="text-[11px] font-mono-slate text-[#f59e0b] tracking-[0.3em] uppercase">
            WARHAMMER 40,000
          </div>
          <h1 className="text-3xl sm:text-4xl font-gothic font-bold text-[#fef08a] tracking-wider drop-shadow-md">
            ROGUE TRADER
          </h1>
          <div className="text-xs font-mono-slate text-[#38bdf8] tracking-widest uppercase">
            IMPERIAL DATA-SLATE • COLONY MANAGER
          </div>
          <p className="text-xs text-[#94a3b8] font-mono-slate">
            Warrant of Trade Administrative Terminal • Koronus Expanse Domain Registry
          </p>
        </div>

        {/* Login Gothic Box */}
        <div className="gothic-bracket-box p-6 sm:p-8 rounded shadow-2xl space-y-6">
          <div className="gothic-bracket-bottom-left" />
          <div className="gothic-bracket-bottom-right" />

          <div className="border-b border-[#1e293b] pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-gothic font-bold text-sm tracking-wider text-[#f59e0b] uppercase">
                SECURITY CLEARANCE & IDENTITY CIPHER
              </h2>
              <p className="text-xs text-[#94a3b8] font-mono-slate mt-0.5">
                Acquire JWT Bearer clearance for Colony Cogitator access
              </p>
            </div>
            <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#10b981]/10 border border-[#10b981]/30 text-[10px] font-mono-slate text-[#34d399]">
              <ShieldCheck className="w-3 h-3 text-[#34d399]" />
              <span>RBAC SECURED</span>
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-[#ef4444]/15 border border-[#ef4444]/50 rounded text-xs font-mono-slate text-[#fca5a5]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-mono-slate text-xs">
            <div>
              <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1.5 font-medium">
                Dynasty Cipher / Cogitator ID
              </label>
              <input
                id="login-username"
                type="text"
                disabled={loading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3.5 py-2.5 rounded focus:outline-none transition disabled:opacity-50"
                placeholder="e.g. LordCaptain, ArchMagos, or Servitor"
              />
            </div>

            <div>
              <label className="block text-[#cbd5e1] uppercase tracking-wider mb-1.5 font-medium">
                Inquisitorial Seal / Password
              </label>
              <input
                id="login-password"
                type="password"
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#070a12] border border-[#252f44] focus:border-[#f59e0b] text-[#f8fafc] px-3.5 py-2.5 rounded focus:outline-none transition disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>

            <button
              id="login-submit-button"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-[#b45309] via-[#d97706] to-[#f59e0b] hover:from-[#d97706] hover:to-[#fcd34d] text-[#06080e] font-gothic font-bold text-xs uppercase tracking-widest rounded transition shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 text-[#06080e] animate-spin" />
                  <span>Transmitting Security Cipher...</span>
                </>
              ) : (
                <>
                  <Key className="w-4 h-4 text-[#06080e]" />
                  <span>Authenticate Warrant Token</span>
                </>
              )}
            </button>
          </form>

          {/* Preset Clearance Identities */}
          <div className="pt-4 border-t border-[#1e293b] space-y-2.5">
            <div className="text-center text-[10px] text-[#64748b] font-mono-slate tracking-wider uppercase">
              — SELECT AUTHORIZATION CLEARANCE TIER —
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                id="bypass-login-arch-magos"
                type="button"
                disabled={loading}
                onClick={() => {
                  setUsername("ArchMagos");
                  setPassword("WarrantOfTrade");
                  performLogin("ArchMagos", "WarrantOfTrade");
                }}
                className="p-2 bg-[#121828] hover:bg-[#1a233a] border border-[#252f44] hover:border-[#f59e0b]/50 rounded text-left transition disabled:opacity-50 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-gothic font-bold text-xs text-[#fef08a] block">
                    Arch Magos
                  </span>
                  <span className="text-[9px] px-1 py-0.2 bg-[#f59e0b]/20 text-[#fcd34d] rounded font-mono-slate uppercase">
                    Admin
                  </span>
                </div>
                <span className="text-[10px] text-[#94a3b8] font-mono-slate block mt-0.5">
                  High Tech-Priest
                </span>
              </button>

              <button
                id="bypass-login-lord-captain"
                type="button"
                disabled={loading}
                onClick={() => {
                  setUsername("LordCaptain");
                  setPassword("WarrantOfTrade");
                  performLogin("LordCaptain", "WarrantOfTrade");
                }}
                className="p-2 bg-[#121828] hover:bg-[#1a233a] border border-[#252f44] hover:border-[#38bdf8]/50 rounded text-left transition disabled:opacity-50 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-gothic font-bold text-xs text-[#38bdf8] block">
                    Lord Captain
                  </span>
                  <span className="text-[9px] px-1 py-0.2 bg-[#38bdf8]/20 text-[#7dd3fc] rounded font-mono-slate uppercase">
                    Colony Manager
                  </span>
                </div>
                <span className="text-[10px] text-[#94a3b8] font-mono-slate block mt-0.5">
                  Alexis Valancius
                </span>
              </button>

              <button
                id="bypass-login-servitor"
                type="button"
                disabled={loading}
                onClick={() => {
                  setUsername("Servitor");
                  setPassword("WarrantOfTrade");
                  performLogin("Servitor", "WarrantOfTrade");
                }}
                className="p-2 bg-[#121828] hover:bg-[#1a233a] border border-[#252f44] hover:border-[#94a3b8]/50 rounded text-left transition disabled:opacity-50 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-gothic font-bold text-xs text-[#cbd5e1] block">
                    Servitor
                  </span>
                  <span className="text-[9px] px-1 py-0.2 bg-[#94a3b8]/20 text-[#e2e8f0] rounded font-mono-slate uppercase">
                    Viewer
                  </span>
                </div>
                <span className="text-[10px] text-[#94a3b8] font-mono-slate block mt-0.5 flex items-center space-x-1">
                  <Eye className="w-2.5 h-2.5" />
                  <span>Read-Only</span>
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Quote */}
        <div className="text-center text-xs font-mono-slate text-[#64748b] italic">
          "The Emperor Protects, but the Warrant of Trade Provides."
        </div>
      </div>
    </div>
  );
};
