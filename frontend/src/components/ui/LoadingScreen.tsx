import React from 'react';

/**
 * LoadingScreen - Displayed during auth check and initial loading
 * Uses Mechanicum design system styling
 */
export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-4">
          {/* Mechanicum-style loading spinner */}
          <div className="w-16 h-16 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mx-auto" />
        </div>
        <p className="text-amber-500 font-mono text-lg animate-pulse">
          Establishing connection...
        </p>
        <p className="text-slate-500 font-mono text-sm mt-2">
          Authenticating with the Machine Spirit
        </p>
      </div>
    </div>
  );
}