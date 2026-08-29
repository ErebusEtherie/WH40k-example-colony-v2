import React from 'react';
import { 
  Compass, 
  FileSpreadsheet, 
  UserCheck, 
  Layers
} from 'lucide-react';
import { NavTab } from '../../types';

export type TabKey = NavTab;

interface TabNavigationProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  representativeAssigned: boolean;
  activePlanCount: number;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  representativeAssigned,
  activePlanCount,
}) => {
  const tabs = [
    {
      key: 'at_a_glance' as TabKey,
      label: 'At a Glance',
      sublabel: 'Summary Sheet',
      icon: <Compass className="w-4 h-4" />,
    },
    {
      key: 'colony_details' as TabKey,
      label: 'Colony Details',
      sublabel: 'Modifier Audit & Resources',
      icon: <FileSpreadsheet className="w-4 h-4" />,
    },
    {
      key: 'representative' as TabKey,
      label: 'Representative',
      sublabel: representativeAssigned ? 'Assigned' : 'Vacant',
      icon: <UserCheck className="w-4 h-4" />,
    },
    {
      key: 'infrastructure' as TabKey,
      label: 'Infrastructure & Plans',
      sublabel: `${activePlanCount} Plans`,
      icon: <Layers className="w-4 h-4" />,
    },
  ];

  return (
    <nav className="tab-navigation-bar bg-slate-950 border-b border-amber-800/60 sticky top-[57px] z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-thin">
          {tabs.map((t) => {
            const isActive = activeTab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => onTabChange(t.key)}
                className={`tab-button group relative flex items-center gap-2.5 px-3 sm:px-4 py-2 text-left rounded-sm font-mono transition-all shrink-0 border ${
                  isActive
                    ? 'tab-active bg-gradient-to-b from-amber-950/70 to-slate-900 border-amber-500 text-amber-100 shadow-md shadow-amber-950/40'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 hover:bg-slate-900'
                }`}
                aria-selected={isActive}
                role="tab"
                id={`tab-btn-${t.key}`}
              >
                <div
                  className={`tab-icon-box p-1.5 rounded-xs transition-colors ${
                    isActive ? 'text-amber-400 bg-amber-950 border border-amber-600/40' : 'text-slate-400 group-hover:text-amber-300'
                  }`}
                >
                  {t.icon}
                </div>
                <div>
                  <div className="tab-title font-serif text-xs sm:text-sm font-bold tracking-wide uppercase">
                    {t.label}
                  </div>
                  <div className="tab-sublabel text-[10px] text-slate-400 font-sans leading-none">
                    {t.sublabel}
                  </div>
                </div>
                {isActive && (
                  <span className="tab-indicator absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
