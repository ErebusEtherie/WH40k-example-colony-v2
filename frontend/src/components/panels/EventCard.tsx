import React from 'react';
import { Event } from '../../types';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  Edit3,
  Plus,
  Minus
} from 'lucide-react';

interface EventCardProps {
  event: Event;
  onToggleActive: (eventId: number, isActive: boolean) => void;
  onEdit: (event: Event) => void;
  onDelete: (eventId: number) => void;
}

const STAT_ICONS: Record<string, React.ElementType> = {
  size: Plus,
  complacency: CheckCircle2,
  order: AlertTriangle,
  productivity: Clock,
  piety: Minus,
};

const STAT_LABELS: Record<string, string> = {
  size: 'Size',
  complacency: 'Complacency',
  order: 'Order',
  productivity: 'Productivity',
  piety: 'Piety',
};

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onToggleActive,
  onEdit,
  onDelete,
}) => {
  const isActive = event.is_active;

  return (
    <div
      className={`p-3 border rounded-sm transition-colors ${
        isActive
          ? 'bg-slate-900/50 border-cyan-800/60 hover:border-cyan-700'
          : 'bg-slate-950 border-slate-800 hover:border-slate-700'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="font-serif font-bold text-sm text-slate-100">
              {event.name}
            </h4>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-xs font-mono uppercase ${
                isActive
                  ? 'bg-cyan-950 border border-cyan-700 text-cyan-300'
                  : 'bg-slate-800 border border-slate-600 text-slate-400'
              }`}
            >
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            {event.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onToggleActive(event.id, !isActive)}
            className={`p-1 rounded-xs transition-colors ${
              isActive
                ? 'text-cyan-400 hover:text-cyan-300'
                : 'text-slate-500 hover:text-slate-300'
            }`}
            title={isActive ? 'Deactivate event' : 'Activate event'}
          >
            {isActive ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => onEdit(event)}
            className="p-1 text-amber-400 hover:text-amber-300 rounded-xs transition-colors"
            title="Edit event"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onDelete(event.id)}
            className="p-1 text-red-400 hover:text-red-300 rounded-xs transition-colors"
            title="Delete event"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modifiers */}
      {event.modifiers.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-800">
          <div className="text-[10px] font-mono text-slate-500 uppercase mb-1">
            Modifiers ({event.modifiers.length})
          </div>
          <div className="space-y-1">
            {event.modifiers.map((mod) => {
              const Icon = STAT_ICONS[mod.stat] || Clock;
              const isPositive = mod.value > 0;
              const isNeutral = mod.value === 0;
              
              // Extract color class selection to avoid nested ternary
              const getValueColorClass = () => {
                if (isNeutral) return 'text-slate-400';
                return isPositive ? 'text-emerald-400' : 'text-red-400';
              };

              return (
                <div
                  key={`${mod.stat}-${mod.value}-${mod.description}`}
                  className="flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3 h-3 text-slate-500" />
                    <span className="text-slate-300">
                      {STAT_LABELS[mod.stat]}
                    </span>
                    <span className="text-slate-500 text-[10px]">
                      {mod.description}
                    </span>
                  </div>
                  <span
                    className={`font-bold ${getValueColorClass()}`}
                  >
                    {mod.value > 0 ? '+' : ''}
                    {mod.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};