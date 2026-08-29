import React, { useState, useMemo } from 'react';
import { 
  Colony, 
  ColorPalette, 
  CustomModifierItem, 
  FontSizeSetting,
  NavTab, 
  Representative,
  AppTheme
} from './types';
import { calculateColonyState } from './utils/calculator';
import { apiClient } from './utils/apiClient';
import { Header } from './components/common/Header';
import { TabNavigation } from './components/common/TabNavigation';
import { AtAGlancePanel } from './components/panels/AtAGlancePanel';
import { ColonyDetailsPanel } from './components/panels/ColonyDetailsPanel';
import { RepresentativePanel } from './components/panels/RepresentativePanel';
import { InfrastructurePanelGroup } from './components/panels/InfrastructurePanelGroup';
import { ColonyCreationModal } from './components/modals/ColonyCreationModal';
import { RepresentativeCreationModal } from './components/modals/RepresentativeCreationModal';
import { AddCustomModifierModal } from './components/modals/AddCustomModifierModal';
import { ChangeRepresentativeModal } from './components/modals/ChangeRepresentativeModal';
import { ThemeSelectorModal } from './components/modals/ThemeSelectorModal';
import { LoginScreen } from './components/auth/LoginScreen';
import {
  useColonies,
  useCreateColony,
  useUpdateColony,
  useDeleteColony,
  useRepresentatives,
  useCreateRepresentative,
  useUpdateRepresentative,
  useAssignRepresentative,
} from './api';

export default function App() {
  // Authentication State (defaults to true for instant interactive preview)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('rt_colony_auth') !== 'false';
  });
  const [userRole, setUserRole] = useState<'lord_captain' | 'game_master' | 'scribe'>('lord_captain');

  // Theme State
  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('rt_theme_v1') as AppTheme;
    return saved || 'mechanicus_amber';
  });

  // Accessibility State
  const [isDyslexicFont, setIsDyslexicFont] = useState<boolean>(() => {
    return localStorage.getItem('rt_dyslexic_font') === 'true';
  });
  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('rt_high_contrast') === 'true';
  });
  const [palette, setPalette] = useState<ColorPalette>(() => {
    return (localStorage.getItem('rt_palette') as ColorPalette) || 'mechanicus';
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState<NavTab>('at_a_glance');

  // Modals state
  const [isCreateColonyOpen, setIsCreateColonyOpen] = useState(false);
  const [isCreateRepOpen, setIsCreateRepOpen] = useState(false);
  const [isAddCustomModOpen, setIsAddCustomModOpen] = useState(false);
  const [isChangeRepOpen, setIsChangeRepOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  const [fontSize, setFontSize] = useState<FontSizeSetting>('standard');

  // React Query hooks for server state
  const { data: colonies = [], isLoading: coloniesLoading } = useColonies();
  const { data: representatives = [], isLoading: repsLoading } = useRepresentatives();

  // Mutations
  const createColonyMutation = useCreateColony();
  const updateColonyMutation = useUpdateColony();
  const deleteColonyMutation = useDeleteColony();
  const createRepresentativeMutation = useCreateRepresentative();
  const updateRepresentativeMutation = useUpdateRepresentative();
  const assignRepresentativeMutation = useAssignRepresentative();

  // Selection state (UI-only, not persisted to server)
  const [selectedColonyId, setSelectedColonyId] = useState<string | null>(null);
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);

  // Initialize selected colony/rep when data loads
  React.useEffect(() => {
    if (colonies.length > 0 && !selectedColonyId) {
      setSelectedColonyId(colonies[0].id);
    }
  }, [colonies, selectedColonyId]);

  React.useEffect(() => {
    if (representatives.length > 0 && !selectedRepId) {
      setSelectedRepId(representatives[0].id);
    }
  }, [representatives, selectedRepId]);

  // Current Colony & Rep derivation
  const currentColony = colonies.find((c: Colony) => c.id === selectedColonyId) || colonies[0];
  const currentRepresentative = currentColony
    ? representatives.find((r: Representative) => r.id === currentColony.representativeId) || null
    : null;
  const currentCalculations = currentColony ? calculateColonyState(currentColony, currentRepresentative) : null;

  // Total Dynasty Profit Factor calculation
  const totalDynastyProfitFactor = colonies.reduce((acc: number, c: Colony) => {
    const rep = representatives.find((r: Representative) => r.id === c.representativeId) || null;
    const calc = calculateColonyState(c, rep);
    return acc + calc.profitFactor.total;
  }, 0);

  // Loading state
  if (coloniesLoading || repsLoading || !currentColony || !currentCalculations) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-amber-400 font-mono text-lg">Loading cogitation data...</div>
      </div>
    );
  }

  // Handlers with mutations
  const handleUpdateColony = (updatedFields: Partial<Colony>) => {
    if (!currentColony) return;
    updateColonyMutation.mutate(
      { colonyId: Number(currentColony.id), data: updatedFields },
      {
        onError: (e: Error) => {
          console.warn('Backend update failed:', e);
        },
      }
    );
  };

  const handleAdvanceDays = (days: number) => {
    if (!currentColony) return;
    handleUpdateColony({ ageDays: currentColony.ageDays + days });
  };

  const handleCreateColony = (newColony: Colony) => {
    createColonyMutation.mutate(newColony, {
      onSuccess: (created: Colony) => {
        setSelectedColonyId(created.id);
        setActiveTab('at_a_glance');
        // If representative was chosen at colony creation, link them
        if (newColony.representativeId) {
          handleAssignRepresentative(created.id, newColony.representativeId);
        }
      },
    });
  };

  const handleDeleteColony = (colonyId: string) => {
    if (colonies.length <= 1) return;
    if (selectedColonyId === colonyId) {
      const remaining = colonies.filter((c: Colony) => c.id !== colonyId);
      setSelectedColonyId(remaining[0]?.id || null);
    }
    deleteColonyMutation.mutate(Number(colonyId));
  };

  const handleCreateRepresentative = (newRep: Representative) => {
    createRepresentativeMutation.mutate(newRep, {
      onSuccess: (created: Representative) => {
        setSelectedRepId(created.id);
      },
    });
  };

  const handleUpdateRepresentative = (repId: string, updatedFields: Partial<Representative>) => {
    updateRepresentativeMutation.mutate(
      { representativeId: Number(repId), data: updatedFields },
      {
        onError: (e: Error) => {
          console.warn('Backend update representative error:', e);
        },
      }
    );
  };

  const handleAssignRepresentative = (colonyId: string, repId: string | null) => {
    assignRepresentativeMutation.mutate(
      { colonyId: Number(colonyId), representativeId: repId ? Number(repId) : null },
      {
        onError: (e: Error) => {
          console.warn('Backend assign representative error:', e);
        },
      }
    );
  };

  const handleAddCustomModifier = (newMod: CustomModifierItem) => {
    if (!currentColony) return;
    // Note: useCreateModifier requires colonyId at hook level, so we call apiClient directly here
    // This is acceptable since custom modifiers are a secondary feature compared to colony/rep updates
    apiClient.addModifier(currentColony.id, newMod).catch((e: Error) => {
      console.warn('Backend add modifier error:', e);
    });
  };

  const handleResetToSeedData = () => {
    if (window.confirm('Reset all colony data and representatives back to initial Imperial seed data?')) {
      // Note: This requires backend support - for now just clear local cache
      // TODO: Implement backend reset endpoint
      console.warn('Reset to seed data not yet implemented on backend');
    }
  };

  const handleLogin = (role: 'lord_captain' | 'game_master' | 'scribe') => {
    setUserRole(role);
    setIsAuthenticated(true);
    localStorage.setItem('rt_colony_auth', 'true');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.setItem('rt_colony_auth', 'false');
  };

  // If not logged in, render Login screen
  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  // Accessibility classes application
  const paletteClass = 
    palette === 'high_contrast' 
      ? 'contrast-125 saturate-150' 
      : palette === 'protanopia' 
      ? 'protanopia-palette' 
      : palette === 'tritanopia'
      ? 'tritanopia-palette'
      : '';

  const fontSizeClass = 
    fontSize === 'large' 
      ? 'text-base' 
      : fontSize === 'xlarge' 
      ? 'text-lg' 
      : 'text-sm';

  return (
    <div
      className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950 theme-${theme} ${
        isDyslexicFont ? 'font-dyslexic' : 'font-sans'
      } ${isHighContrast ? 'border-2 border-amber-400' : ''} ${paletteClass} ${fontSizeClass}`}
    >
      
      {/* Top Global Navigation Bar & Accessibility Controls */}
      <Header
        colonies={colonies}
        selectedColony={currentColony}
        onSelectColony={setSelectedColonyId}
        onOpenCreateColony={() => setIsCreateColonyOpen(true)}
        theme={theme}
        onChangeTheme={setTheme}
        onOpenThemeModal={() => setIsThemeModalOpen(true)}
        onAdvanceDays={handleAdvanceDays}
        accessibilityPalette={palette}
        onChangePalette={setPalette}
        isDyslexiaFont={isDyslexicFont}
        onToggleDyslexiaFont={() => setIsDyslexicFont(!isDyslexicFont)}
        fontSize={fontSize}
        onChangeFontSize={setFontSize}
        isHighContrast={isHighContrast}
        onToggleHighContrast={() => setIsHighContrast(!isHighContrast)}
        username={userRole === 'lord_captain' ? 'Lord Captain' : userRole === 'game_master' ? 'Game Master' : 'Scribe'}
        onLogout={handleLogout}
      />

      {/* Main Colony Contextual Tab Navigation */}
      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        representativeAssigned={!!currentColony.representativeId}
        activePlanCount={currentColony.supportUpgrades.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Tab View Switcher */}
        {activeTab === 'at_a_glance' && (
          <AtAGlancePanel
            colony={currentColony}
            calculations={currentCalculations}
            representative={currentRepresentative}
            onNavigateToDetails={() => setActiveTab('colony_details')}
            onNavigateToRepresentative={() => {
              if (currentRepresentative) {
                setSelectedRepId(currentRepresentative.id);
              }
              setActiveTab('representative');
            }}
            onNavigateToInfrastructure={() => setActiveTab('infrastructure')}
          />
        )}

        {activeTab === 'colony_details' && (
          <ColonyDetailsPanel
            colony={currentColony}
            calculations={currentCalculations}
            representative={currentRepresentative}
            onUpdateColony={handleUpdateColony}
            onOpenAddCustomModifier={() => setIsAddCustomModOpen(true)}
            onOpenChangeRepresentative={() => setIsChangeRepOpen(true)}
            onNavigateToRepresentative={() => {
              if (currentRepresentative) {
                setSelectedRepId(currentRepresentative.id);
              }
              setActiveTab('representative');
            }}
            onNavigateToInfrastructure={() => setActiveTab('infrastructure')}
          />
        )}

        {activeTab === 'representative' && (
          <RepresentativePanel
            representatives={representatives}
            selectedRepId={selectedRepId || currentRepresentative?.id || representatives[0]?.id || null}
            onSelectRep={setSelectedRepId}
            onUpdateRepresentative={handleUpdateRepresentative}
            onOpenCreateRepresentative={() => setIsCreateRepOpen(true)}
            colonies={colonies}
            currentColony={currentColony}
            onAssignToColony={(repId, colId) => {
              if (colId) {
                handleAssignRepresentative(colId, repId);
              } else {
                // Unassign
                handleAssignRepresentative(currentColony.id, null);
              }
            }}
          />
        )}

        {activeTab === 'infrastructure' && (
          <InfrastructurePanelGroup
            colony={currentColony}
            calculations={currentCalculations}
            onUpdateColony={handleUpdateColony}
          />
        )}

      </main>

      {/* Footer info & Data Reset Action */}
      <footer className="border-t border-slate-900 bg-slate-950 p-4 text-center font-mono text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-4 max-w-7xl w-full mx-auto">
        <div>
          <span>Rogue Trader Colony Cogitation Engine, by Magos Theta Ryzer Sabrador. 2026</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="text-amber-400 hover:text-amber-300 underline transition-colors font-serif uppercase tracking-wider"
          >
            Switch Theme
          </button>
          <button
            onClick={handleResetToSeedData}
            className="text-slate-500 hover:text-amber-300 underline transition-colors"
          >
            Reset Seed Data
          </button>
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-red-400 underline transition-colors"
          >
            Relock Terminal (Logout)
          </button>
        </div>
      </footer>

      {/* Global Modals */}
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        currentTheme={theme}
        onSelectTheme={setTheme}
      />

      <ColonyCreationModal
        isOpen={isCreateColonyOpen}
        onClose={() => setIsCreateColonyOpen(false)}
        onCreateColony={handleCreateColony}
        unassignedRepresentatives={representatives.filter((r) => !r.assignedColonyId)}
        onOpenCreateRepresentative={() => {
          setIsCreateColonyOpen(false);
          setIsCreateRepOpen(true);
        }}
      />

      <RepresentativeCreationModal
        isOpen={isCreateRepOpen}
        onClose={() => setIsCreateRepOpen(false)}
        onCreateRepresentative={handleCreateRepresentative}
      />

      <AddCustomModifierModal
        isOpen={isAddCustomModOpen}
        onClose={() => setIsAddCustomModOpen(false)}
        onAddModifier={handleAddCustomModifier}
      />

      <ChangeRepresentativeModal
        isOpen={isChangeRepOpen}
        onClose={() => setIsChangeRepOpen(false)}
        colony={currentColony}
        representatives={representatives}
        onAssignRepresentative={handleAssignRepresentative}
        onOpenCreateRepresentative={() => {
          setIsChangeRepOpen(false);
          setIsCreateRepOpen(true);
        }}
      />

    </div>
  );
}
