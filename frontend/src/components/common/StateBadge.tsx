import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles
} from 'lucide-react';
import { StatName } from '../../types';

interface StateBadgeProps {
  stat: StatName;
  state: string;
  label: string;
  type: 'positive' | 'crisis' | 'stable';
  showStatPrefix?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const StateBadge: React.FC<StateBadgeProps> = ({
  stat,
  state: _state,
  label,
  type,
  showStatPrefix = false,
  size = 'md',
}) => {
  const getIcon = () => {
    if (type === 'crisis') {
      return <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
    }
    if (type === 'positive') {
      return <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />;
    }
    return <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-slate-400" aria-hidden="true" />;
  };

  // Color-blind safe redundant styles (distinct background, border, icon, and text)
  const getStyles = () => {
    switch (type) {
      case 'crisis':
        return 'bg-red-950/80 border-2 border-red-500 text-red-200 shadow-sm shadow-red-900/50';
      case 'positive':
        return 'bg-emerald-950/80 border-2 border-emerald-400 text-emerald-200 shadow-sm shadow-emerald-900/40';
      case 'stable':
      default:
        return 'bg-slate-900/90 border border-cyan-800/80 text-cyan-200';
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium tracking-wide',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold tracking-wider',
  };

  const statNames: Record<StatName, string> = {
    complacency: 'Complacency',
    order: 'Order',
    productivity: 'Productivity',
    piety: 'Piety',
    size: 'Size',
    profit_factor: 'Profit Factor',
  };

  return (
    <span
      className={`inline-flex items-center rounded-sm uppercase font-mono ${sizeClasses[size]} ${getStyles()}`}
      role="status"
      title={`${statNames[stat]}: ${label} (${type.toUpperCase()})`}
    >
      {getIcon()}
      {showStatPrefix && (
        <span className="opacity-70 text-[10px] font-sans lowercase tracking-normal">
          {statNames[stat]}:
        </span>
      )}
      <span className="font-semibold">{label}</span>
      {type === 'crisis' && (
        <span className="ml-0.5 text-[10px] bg-red-800 text-white px-1 rounded-xs font-sans font-bold">
          CRISIS
        </span>
      )}
    </span>
  );
};
