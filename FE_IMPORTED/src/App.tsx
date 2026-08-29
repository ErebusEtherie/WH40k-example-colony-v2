import React, { useState, useEffect } from 'react';
import { 
  Colony, 
  ColorPalette, 
  CustomModifierItem, 
  FontSizeSetting,
  NavTab, 
  Representative,
  AppTheme
} from './types';
import { SEED_COLONIES, SEED_REPRESENTATIVES } from './data/seedData';
import { calculateColonyState } from './utils/calculator';
import { ApiClient } from './utils/apiClient';
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

  // Backend Sync & Data Store State
  const [backendStatus, setBackendStatus] = useState<'connected' | 'syncing' | 'offline'>('syncing');

  const [colonies, setColonies] = useState<Colony[]>(() => {
    const saved = localStorage.getItem('rt_colonies_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved colonies', e);
      }
    }
    return SEED_COLONIES;
  });

  const [representatives, setRepresentatives] = useState<Representative[]>(() => {
    const saved = localStorage.getItem('rt_representatives_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved reps', e);
      }
    }
    return SEED_REPRESENTATIVES;
  });

  const [selectedColonyId, setSelectedColonyId] = useState<string>(() => {
    return colonies[0]?.id || SEED_COLONIES[0].id;
  });

  const [selectedRepId, setSelectedRepId] = useState<string | null>(() => {
    return representatives[0]?.id || null;
  });

  // Modals state
  const [isCreateColonyOpen, setIsCreateColonyOpen] = useState(false);
  const [isCreateRepOpen, setIsCreateRepOpen] = useState(false);
  const [isAddCustomModOpen, setIsAddCustomModOpen] = useState(false);
  const [isChangeRepOpen, setIsChangeRepOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  const [fontSize, setFontSize] = useState<FontSizeSetting>('standard');

  // Initial Backend Data Synchronization
  useEffect(() => {
    let isMounted = true;

    async function initBackendSync() {
      try {
        setBackendStatus('syncing');
        const isHealthy = await ApiClient.checkHealth();
        if (!isHealthy) {
          if (isMounted) setBackendStatus('offline');
          return;
        }

        const [backendColonies, backendReps] = await Promise.all([
          ApiClient.getColonies().catch(() => []),
          ApiClient.getRepresentatives().catch(() => []),
        ]);

        if (isMounted) {
          if (backendColonies && backendColonies.length > 0) {
            setColonies(backendColonies);
            if (!backendColonies.some((c: any) => c.id === selectedColonyId)) {
              setSelectedColonyId(backendColonies[0].id);
            }
          }
          if (backendReps && backendReps.length > 0) {
            setRepresentatives(backendReps);
            if (!selectedRepId) {
              setSelectedRepId(backendReps[0].id);
            }
          }
          setBackendStatus('connected');
        }
      } catch (err) {
        console.warn('Backend sync failed, running with local cache', err);
        if (isMounted) setBackendStatus('offline');
      }
    }

    initBackendSync();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('rt_theme_v1', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('rt_colonies_v1', JSON.stringify(colonies));
  }, [colonies]);

  useEffect(() => {
    localStorage.setItem('rt_representatives_v1', JSON.stringify(representatives));
  }, [representatives]);

  useEffect(() => {
    localStorage.setItem('rt_dyslexic_font', String(isDyslexicFont));
  }, [isDyslexicFont]);

  useEffect(() => {
    localStorage.setItem('rt_high_contrast', String(isHighContrast));
  }, [isHighContrast]);

  useEffect(() => {
    localStorage.setItem('rt_palette', palette);
  }, [palette]);

  // Current Colony & Rep derivation
  const currentColony = colonies.find((c) => c.id === selectedColonyId) || colonies[0] || SEED_COLONIES[0];
  const currentRepresentative = representatives.find((r) => r.id === currentColony.representativeId) || null;
  const currentCalculations = calculateColonyState(currentColony, currentRepresentative);

  // Total Dynasty Profit Factor calculation
  const totalDynastyProfitFactor = colonies.reduce((acc, c) => {
    const rep = representatives.find((r) => r.id === c.representativeId) || null;
    const calc = calculateColonyState(c, rep);
    return acc + calc.profitFactor.total;
  }, 0);

  // Handlers with Optimistic Updates & Backend Persistence
  const handleUpdateColony = (updatedFields: Partial<Colony>) => {
    setColonies((prev) =>
      prev.map((c) => (c.id === currentColony.id ? { ...c, ...updatedFields } : c))
    );
    // Sync to backend asynchronously
    ApiClient.updateColony(currentColony.id, updatedFields).catch((e) => {
      console.warn('Backend update failed:', e);
    });
  };

  const handleAdvanceDays = (days: number) => {
    handleUpdateColony({ ageDays: currentColony.ageDays + days });
    ApiClient.advanceColonyAge(currentColony.id, days).catch((e) => {
      console.warn('Backend age advance failed:', e);
    });
  };

  const handleCreateColony = async (newColony: Colony) => {
    setColonies((prev) => [newColony, ...prev]);
    setSelectedColonyId(newColony.id);
    setActiveTab('at_a_glance');

    // If representative was chosen at colony creation, link them
    if (newColony.representativeId) {
      setRepresentatives((prev) =>
        prev.map((r) => (r.id === newColony.representativeId ? { ...r, assignedColonyId: newColony.id } : r))
      );
    }

    try {
      await ApiClient.createColony(newColony);
      if (newColony.representativeId) {
        await ApiClient.assignRepresentative(newColony.representativeId, newColony.id);
      }
    } catch (e) {
      console.warn('Backend colony create error:', e);
    }
  };

  const handleDeleteColony = (colonyId: string) => {
    if (colonies.length <= 1) return;
    setColonies((prev) => prev.filter((c) => c.id !== colonyId));
    // Clear rep assignment
    setRepresentatives((prev) =>
      prev.map((r) => (r.assignedColonyId === colonyId ? { ...r, assignedColonyId: null } : r))
    );
    if (selectedColonyId === colonyId) {
      const remaining = colonies.filter((c) => c.id !== colonyId);
      setSelectedColonyId(remaining[0].id);
    }
    ApiClient.deleteColony(colonyId).catch((e) => {
      console.warn('Backend delete colony error:', e);
    });
  };

  const handleCreateRepresentative = async (newRep: Representative) => {
    setRepresentatives((prev) => [newRep, ...prev]);
    setSelectedRepId(newRep.id);
    try {
      await ApiClient.createRepresentative(newRep);
    } catch (e) {
      console.warn('Backend create representative error:', e);
    }
  };

  const handleUpdateRepresentative = (repId: string, updatedFields: Partial<Representative>) => {
    setRepresentatives((prev) =>
      prev.map((r) => (r.id === repId ? { ...r, ...updatedFields } : r))
    );
    ApiClient.updateRepresentative(repId, updatedFields).catch((e) => {
      console.warn('Backend update representative error:', e);
    });
  };

  const handleAssignRepresentative = (colonyId: string, repId: string | null) => {
    // Update colony's representativeId
    setColonies((prev) =>
      prev.map((c) => {
        if (c.id === colonyId) {
          return { ...c, representativeId: repId };
        }
        // If another colony had this rep, clear it
        if (repId && c.representativeId === repId && c.id !== colonyId) {
          return { ...c, representativeId: null };
        }
        return c;
      })
    );

    // Update representatives' assignedColonyId
    setRepresentatives((prev) =>
      prev.map((r) => {
        if (r.id === repId) {
          return { ...r, assignedColonyId: colonyId };
        }
        if (r.assignedColonyId === colonyId && r.id !== repId) {
          return { ...r, assignedColonyId: null };
        }
        return r;
      })
    );

    if (repId) {
      ApiClient.assignRepresentative(repId, colonyId).catch((e) => {
        console.warn('Backend assign representative error:', e);
      });
    } else {
      // Find unassigned rep
      const repToUnassign = representatives.find((r) => r.assignedColonyId === colonyId);
      if (repToUnassign) {
        ApiClient.assignRepresentative(repToUnassign.id, null).catch((e) => {
          console.warn('Backend unassign representative error:', e);
        });
      }
    }
  };

  const handleAddCustomModifier = (newMod: CustomModifierItem) => {
    handleUpdateColony({
      customModifiers: [...currentColony.customModifiers, newMod],
    });
    ApiClient.addModifier(currentColony.id, newMod).catch((e) => {
      console.warn('Backend add modifier error:', e);
    });
  };

  const handleResetToSeedData = () => {
    if (window.confirm('Reset all colony data and representatives back to initial Imperial seed data?')) {
      setColonies(SEED_COLONIES);
      setRepresentatives(SEED_REPRESENTATIVES);
      setSelectedColonyId(SEED_COLONIES[0].id);
      setSelectedRepId(SEED_REPRESENTATIVES[0].id);
      localStorage.removeItem('rt_colonies_v1');
      localStorage.removeItem('rt_representatives_v1');
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
        backendStatus={backendStatus}
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
