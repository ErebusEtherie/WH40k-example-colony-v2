import React, { useState } from 'react';
import { useAuth } from '../../api/useAuth';
import { OrnamentalFrame } from '../common/OrnamentalFrame';
import { 
  KeyRound, 
  Lock, 
  User, 
  Compass, 
  Sparkles, 
  AlertCircle, 
  UserPlus
} from 'lucide-react';

interface LoginScreenProps {
  // No props needed - navigation handled internally via useAuth hook
}

export const LoginScreen: React.FC<LoginScreenProps> = () => {
  const { login, register, isLoggingIn, isRegistering, loginError, registerError } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!username.trim()) {
      setError('Imperial identification cipher cannot be blank.');
      return;
    }
    
    if (mode === 'register' && !email.trim()) {
      setError('Astropathic contact frequency (email) is required.');
      return;
    }
    
    if (password.length < 8) {
      setError('Inquisitorial Seal must be at least 8 characters.');
      return;
    }
    
    try {
      if (mode === 'login') {
        await login({ username, password });
        // Navigation handled automatically by App.tsx auth state gate
      } else {
        // Register first, then login
        await register({ username, email, password, role: 'viewer' });
        // Registration succeeded - now attempt login
        try {
          await login({ username, password });
          // Navigation handled automatically by App.tsx auth state gate
        } catch {
          // Login failed after successful registration
          setError('Registration successful, but login failed. Please try logging in manually.');
          setMode('login'); // Switch to login mode so they can try again
        }
      }
    } catch {
      // Error is handled by the hook for login, or caught above for registration
    }
  };

  const displayError = error || loginError || registerError;

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
          title={mode === 'login' ? "Security Clearance & Identity Cipher" : "New User Registration"}
          subtitle={mode === 'login' ? "Enter credentials to initialize Cogitator link" : "Request access to the Imperial database"}
        >
          {displayError && (
            <div className="mb-4 p-3 bg-red-950/80 border border-red-700 text-red-200 text-xs font-mono rounded-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            {mode === 'register' && (
              <div>
                <label className="text-[10px] uppercase text-slate-400 block mb-1">
                  Astropathic Contact Frequency (Email)
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-cyan-800 rounded-xs px-3 py-2 pl-9 text-slate-100 font-mono focus:outline-hidden focus:ring-1 focus:ring-cyan-400"
                    placeholder="name@imperium.gov"
                  />
                  <Compass className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                </div>
              </div>
            )}
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
                  autoComplete="username"
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
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || isRegistering}
              className="w-full py-2.5 bg-cyan-900 hover:bg-cyan-800 disabled:bg-cyan-950 disabled:cursor-not-allowed border border-cyan-500 text-cyan-100 font-mono text-xs uppercase font-bold tracking-wider rounded-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-950/60 mt-2"
            >
              {isLoggingIn || isRegistering ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" /> Authenticating...
                </>
              ) : mode === 'login' ? (
                <>
                  <KeyRound className="w-4 h-4" /> Authenticate Warrant
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Register New Account
                </>
              )}
            </button>
          </form>

          {/* Toggle between login and register */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
              }}
              className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
            >
              {mode === 'login' 
                ? "Request new access credentials" 
                : "Already have clearance? Sign in"}
            </button>
          </div>

          {/* Quick Access Roles for Testing */}
          <div className="mt-5 pt-4 border-t border-slate-800">
            <span className="text-[10px] uppercase font-mono text-slate-500 block mb-2 text-center tracking-wider">
              — Direct Clearance Bypass (Prototype Sandbox) —
            </span>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await login({ username: 'admin', password: 'admin123' });
                    // Navigation handled automatically by App.tsx auth state gate
                  } catch {
                    setError('Demo account not available. Please register.');
                  }
                }}
                className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-cyan-600 rounded-xs text-left text-slate-300 transition-colors"
              >
                <div className="font-serif font-bold text-cyan-300">Arch Magos</div>
                <div className="text-[10px] text-slate-500">Full System Access</div>
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    await login({ username: 'user', password: 'user123' });
                    // Navigation handled automatically by App.tsx auth state gate
                  } catch {
                    setError('Demo account not available. Please register.');
                  }
                }}
                className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-amber-600 rounded-xs text-left text-slate-300 transition-colors"
              >
                <div className="font-serif font-bold text-amber-300">Magos</div>
                <div className="text-[10px] text-slate-500">Standard Access</div>
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
