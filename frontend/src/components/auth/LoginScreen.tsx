import React, { useState } from 'react';
import { OrnamentalFrame } from '../common/OrnamentalFrame';
import { 
  ShieldCheck, 
  KeyRound, 
  Lock, 
  User, 
  Compass, 
  Sparkles, 
  AlertCircle, 
  ArrowRight,
  Terminal
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: (userRole: 'lord_captain' | 'game_master' | 'scribe') => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('LordCaptain');
  const [password, setPassword] = useState('••••••••');
  const [error, setError] = useState<string | null>(null);

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Imperial identification cipher cannot be blank.');
      return;
    }
    setError(null);
    onLogin('lord_captain');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden text-slate-100">
      
      {/* Background ambient grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
      <div className="absolute inset-0 bg-radial from-transparent via-slate-950/80 to-slate-950 pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Thematic Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-sm bg-slate-900 border-2 border-cyan-500/80 shadow-lg shadow-cyan-950/80 mb-2">
            <Compass className="w-8 h-8 text-cyan-400 animate-pulse" />
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-black uppercase tracking-widest text-slate-100 drop-shadow-md">
            Rogue Trader
          </h1>
          <div className="font-mono text-xs text-cyan-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
            <span>Imperial Data-Slate</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>Colony Manager</span>
          </div>
          <p className="text-[11px] font-mono text-slate-400 max-w-xs mx-auto pt-1">
            Warrant of Trade Administrative Terminal • Koronus Expanse Domain Registry
          </p>
        </div>

        {/* Themed Form Frame */}
        <OrnamentalFrame
          title="Security Clearance & Identity Cipher"
          subtitle="Enter credentials to initialize Cogitator link"
        >
          {error && (
            <div className="mb-4 p-3 bg-red-950/80 border border-red-700 text-red-200 text-xs font-mono rounded-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCustomLogin} className="space-y-4 font-mono text-xs">
            <div>
              <label className="text-[10px] uppercase text-slate-400 block mb-1">
                Dynasty Cipher / Scribe ID
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-cyan-800 rounded-xs px-3 py-2 pl-9 text-slate-100 font-mono focus:outline-hidden focus:ring-1 focus:ring-cyan-400"
                  placeholder="Enter User ID..."
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase text-slate-400 block mb-1">
                Inquisitorial Seal / Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-cyan-800 rounded-xs px-3 py-2 pl-9 text-slate-100 font-mono focus:outline-hidden focus:ring-1 focus:ring-cyan-400"
                  placeholder="Enter Password..."
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-cyan-900 hover:bg-cyan-800 border border-cyan-500 text-cyan-100 font-mono text-xs uppercase font-bold tracking-wider rounded-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-950/60 mt-2"
            >
              <KeyRound className="w-4 h-4" /> Authenticate Warrant
            </button>
          </form>

          {/* Quick Access Roles for Testing */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <span className="text-[10px] uppercase font-mono text-slate-500 block mb-2 text-center tracking-wider">
              — Direct Clearance Bypass (Prototype Sandbox) —
            </span>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={() => onLogin('lord_captain')}
                className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-600 rounded-xs text-left text-slate-300 transition-colors"
              >
                <div className="font-serif font-bold text-cyan-300">Lord Captain</div>
                <div className="text-[10px] text-slate-500">Dynasty Sovereign</div>
              </button>

              <button
                type="button"
                onClick={() => onLogin('game_master')}
                className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-600 rounded-xs text-left text-slate-300 transition-colors"
              >
                <div className="font-serif font-bold text-amber-300">Game Master (GM)</div>
                <div className="text-[10px] text-slate-500">Full Rule Arbiter</div>
              </button>
            </div>
          </div>
        </OrnamentalFrame>

        {/* Footer */}
        <div className="text-center font-mono text-[10px] text-slate-600">
          "The Emperor Protects, but the Warrant of Trade Provides."
        </div>

      </div>
    </div>
  );
};
