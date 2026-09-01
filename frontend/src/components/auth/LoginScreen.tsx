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
      setError('Astropathic contact channel (email) is required.');
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
        // Default to 'viewer' role - escalate via admin panel if needed
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

  // Helper for demo login - auto-registers if user doesn't exist
  const handleDemoLogin = async (demoUsername: string, demoPassword: string) => {
    try {
      await login({ username: demoUsername, password: demoPassword });
    } catch {
      // User doesn't exist, register them first
      try {
        await register({ 
          username: demoUsername, 
          email: `${demoUsername}@imperium.gov`, 
          password: demoPassword, 
          role: demoUsername === 'admin' ? 'admin' : 'viewer' 
        });
        await login({ username: demoUsername, password: demoPassword });
      } catch {
        setError('Demo account setup failed. Please register manually.');
      }
    }
  };

  const displayError = error || loginError || registerError;

  // Extract button content logic for clarity
  const getButtonContent = () => {
    if (isLoggingIn || isRegistering) {
      return (
        <>
          <Sparkles className="w-4 h-4 animate-spin" /> Authenticating...
        </>
      );
    }
    if (mode === 'login') {
      return (
        <>
          <KeyRound className="w-4 h-4" /> Authenticate Warrant
        </>
      );
    }
    return (
      <>
        <UserPlus className="w-4 h-4" /> Register New Account
      </>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden text-slate-100">
      
      {/* Background ambient grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
      <div className="absolute inset-0 bg-radial from-transparent via-slate-950/80 to-slate-950 pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md relative z-10 space-y-10">
        
        {/* Thematic Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 rounded-sm bg-slate-900 border-2 border-cyan-500/80 shadow-lg shadow-cyan-950/80 mb-4">
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
          <div className="text-[11px] font-mono text-slate-400 max-w-xs mx-auto pt-2 flex flex-col items-center gap-2">
            <span>Warrant of Trade Administrative Terminal</span>
            <span className="text-cyan-500 text-lg leading-none">•</span>
            <span>Koronus Expanse Domain Registry</span>
          </div>
        </div>

        {/* Themed Form Frame */}
        <OrnamentalFrame
          title={mode === 'login' ? "Security Clearance & Identity Cipher" : "New User Registration"}
          subtitle={mode === 'login' ? "Enter credentials to initialize Cogitator link" : "Request access to the Imperial database"}
        >
          {displayError && (
            <div className="mb-5 p-3 bg-red-950/80 border border-red-700 text-red-200 text-sm font-mono rounded-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8 font-mono text-sm">
            {mode === 'register' && (
              <div>
                <label 
                  htmlFor="email"
                  className="text-xs uppercase text-slate-400 block mb-3 font-semibold tracking-wide"
                >
                  Astropathic Contact Channel / Email
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-950 border-2 border-cyan-700 rounded-sm px-3 py-2.5 pl-11 text-slate-100 font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="name@imperium.gov"
                  />
                  <Compass className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}
            <div>
              <label 
                htmlFor="username"
                className="text-xs uppercase text-slate-400 block mb-3 font-semibold tracking-wide"
              >
                Dynasty Cipher / User ID
              </label>
              <div className="relative">
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-cyan-700 rounded-sm px-3 py-2.5 pl-11 text-slate-100 font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Enter User ID..."
                  autoComplete="username"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label 
                htmlFor="password"
                className="text-xs uppercase text-slate-400 block mb-3 font-semibold tracking-wide"
              >
                Inquisitorial Seal / Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border-2 border-cyan-700 rounded-sm px-3 py-2.5 pl-11 text-slate-100 font-mono text-sm focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Enter Password..."
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn || isRegistering}
              className="w-full py-3 bg-cyan-900 hover:bg-cyan-800 disabled:bg-cyan-950 disabled:cursor-not-allowed border-2 border-cyan-500 text-cyan-100 font-mono text-sm uppercase font-bold tracking-wider rounded-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-950/60 mt-6"
            >
              {getButtonContent()}
            </button>
          </form>

          {/* Toggle between login and register */}
          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
              }}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
            >
              {mode === 'login' 
                ? "Request new access credentials" 
                : "Already have clearance? Sign in"}
            </button>
          </div>

          {/* Quick Access Roles for Testing */}
          <div className="mt-12 pt-10 border-t border-slate-700">
            <span className="text-xs uppercase font-mono text-slate-400 block mb-5 text-center tracking-wider font-semibold">
              — Direct Clearance Bypass (Prototype Sandbox) —
            </span>
            <div className="grid grid-cols-2 gap-6 font-mono text-sm">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin', 'Admin123!')}
                className="p-5 bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-cyan-500 rounded-sm text-center text-slate-200 transition-all shadow-md"
              >
                <div className="font-serif font-bold text-cyan-300 text-base">Arch Magos</div>
                <div className="text-xs text-slate-400 mt-2">Full System Access</div>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('user', 'User123!')}
                className="p-5 bg-slate-900 hover:bg-slate-800 border-2 border-slate-700 hover:border-amber-500 rounded-sm text-center text-slate-200 transition-all shadow-md"
              >
                <div className="font-serif font-bold text-amber-300 text-base">Magos</div>
                <div className="text-xs text-slate-400 mt-2">Standard Access</div>
              </button>
            </div>
          </div>
        </OrnamentalFrame>

        {/* Footer */}
        <div className="text-center font-mono text-xs text-slate-600 mt-8">
          "The Emperor Protects, but the Warrant of Trade Provides."
        </div>

      </div>
    </div>
  );
};
