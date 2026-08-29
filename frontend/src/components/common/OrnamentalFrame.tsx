import React from 'react';

interface OrnamentalFrameProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  variant?: 'cyan' | 'amber' | 'crimson' | 'emerald' | 'gold' | 'muted';
  className?: string;
  id?: string;
}

export const OrnamentalFrame: React.FC<OrnamentalFrameProps> = ({
  children,
  title,
  subtitle,
  badge,
  actions,
  variant = 'amber',
  className = '',
  id,
}) => {
  const variantBorder = {
    cyan: 'border-cyan-800/60 bg-slate-900/90 shadow-lg shadow-cyan-950/20',
    amber: 'border-amber-700/60 bg-slate-900/90 shadow-lg shadow-amber-950/20',
    gold: 'border-amber-500/80 bg-slate-900/95 shadow-lg shadow-amber-950/30',
    crimson: 'border-red-800/60 bg-slate-900/90 shadow-lg shadow-red-950/20',
    emerald: 'border-emerald-700/60 bg-slate-900/90 shadow-lg shadow-emerald-950/20',
    muted: 'border-slate-800 bg-slate-900/80',
  };

  const cornerColor = {
    cyan: 'border-cyan-400 text-cyan-400',
    amber: 'border-amber-400 text-amber-400',
    gold: 'border-amber-400 text-amber-400',
    crimson: 'border-red-400 text-red-400',
    emerald: 'border-emerald-400 text-emerald-400',
    muted: 'border-slate-600 text-slate-500',
  };

  const headerBorder = {
    cyan: 'border-b border-cyan-900/60 bg-gradient-to-r from-cyan-950/50 via-slate-900 to-transparent',
    amber: 'border-b border-amber-900/60 bg-gradient-to-r from-amber-950/50 via-slate-900 to-transparent',
    gold: 'border-b border-amber-800/80 bg-gradient-to-r from-amber-950/70 via-slate-900 to-transparent',
    crimson: 'border-b border-red-900/60 bg-gradient-to-r from-red-950/50 via-slate-900 to-transparent',
    emerald: 'border-b border-emerald-900/60 bg-gradient-to-r from-emerald-950/50 via-slate-900 to-transparent',
    muted: 'border-b border-slate-800 bg-slate-900',
  };

  const accentPip = {
    cyan: 'bg-cyan-400',
    amber: 'bg-amber-400',
    gold: 'bg-amber-400',
    crimson: 'bg-red-400',
    emerald: 'bg-emerald-400',
    muted: 'bg-slate-500',
  };

  return (
    <div
      id={id}
      className={`ornamental-frame relative rounded-sm border ${variantBorder[variant]} ${className}`}
    >
      {/* Corner Bracket Accents (Cult Mechanicus / Data-Slate Terminal Motif) */}
      <div className={`ornamental-corner absolute -top-[2px] -left-[2px] w-2.5 h-2.5 border-t-2 border-l-2 ${cornerColor[variant]} pointer-events-none`} />
      <div className={`ornamental-corner absolute -top-[2px] -right-[2px] w-2.5 h-2.5 border-t-2 border-r-2 ${cornerColor[variant]} pointer-events-none`} />
      <div className={`ornamental-corner absolute -bottom-[2px] -left-[2px] w-2.5 h-2.5 border-b-2 border-l-2 ${cornerColor[variant]} pointer-events-none`} />
      <div className={`ornamental-corner absolute -bottom-[2px] -right-[2px] w-2.5 h-2.5 border-b-2 border-r-2 ${cornerColor[variant]} pointer-events-none`} />

      {/* Header bar if title or actions provided */}
      {(title || actions || badge) && (
        <div className={`ornamental-header px-4 py-3 flex flex-wrap items-center justify-between gap-3 ${headerBorder[variant]}`}>
          <div className="flex items-center gap-2.5">
            {title && (
              <div>
                <h3 className="font-serif tracking-wider font-bold text-slate-100 text-sm sm:text-base uppercase flex items-center gap-2">
                  <span className={`ornamental-pip inline-block w-1.5 h-3 ${accentPip[variant]}`} />
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{subtitle}</p>
                )}
              </div>
            )}
            {badge}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  );
};
