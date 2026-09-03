import React, { useState, useEffect } from "react";
import {
  Colony,
  Representative,
  Infrastructure,
  SupportUpgrade,
  Modifier,
  ColonyResource,
  DevelopmentPlan,
  OpticsSettings,
  User,
} from "./types/colony";
import { authStorage, useCurrentUser, useLogin, useLogout, apiFetch } from "./lib/api";
import {
  INITIAL_COLONIES,
  INITIAL_REPRESENTATIVES,
  INITIAL_INFRASTRUCTURES,
  INITIAL_UPGRADES,
  INITIAL_MODIFIERS,
  INITIAL_RESOURCES,
  INITIAL_PLANS,
} from "./data/seedData";
import { calculateColonyStats } from "./lib/statCalculator";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ColonyOverview } from "./components/ColonyOverview";
import { ColonyDetailsView } from "./components/ColonyDetailsView";
import { RepresentativeView } from "./components/RepresentativeView";
import { InfrastructurePlansView } from "./components/InfrastructurePlansView";
import { LoginScreen } from "./components/LoginScreen";

// Modals
import { NewColonyModal } from "./components/modals/NewColonyModal";
import { CommissionRepresentativeModal } from "./components/modals/CommissionRepresentativeModal";
import { ReassignRepresentativeModal } from "./components/modals/ReassignRepresentativeModal";
import { CommissionHardInfrastructureModal } from "./components/modals/CommissionHardInfrastructureModal";
import { AddSupportUpgradeModal } from "./components/modals/AddSupportUpgradeModal";
import { AddBlueprintModal } from "./components/modals/AddBlueprintModal";
import { AddCustomModifierModal } from "./components/modals/AddCustomModifierModal";
import { LogResourceDepositModal } from "./components/modals/LogResourceDepositModal";
import { EditCharterModal } from "./components/modals/EditCharterModal";

export function App() {
  // Use TanStack Query for authentication state
  const { data: currentUser, isLoading: authLoading } = useCurrentUser();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  
  const isLoggedIn = !!currentUser;
  
  // Global App States
  const [colonies, setColonies] = useState<Colony[]>(INITIAL_COLONIES);
  const [selectedColonyId, setSelectedColonyId] = useState<string>(
    INITIAL_COLONIES[0]?.id || "colony-1"
  );
  const [activeTab, setActiveTab] = useState<
    "overview" | "details" | "infrastructure" | "representatives"
  >("overview");

  const [representatives, setRepresentatives] = useState<Representative[]>(
    INITIAL_REPRESENTATIVES
  );
  const [selectedRepId, setSelectedRepId] = useState<string>(
    INITIAL_REPRESENTATIVES[0]?.id || "rep-1"
  );

  const [infrastructures, setInfrastructures] = useState<Infrastructure[]>(
    INITIAL_INFRASTRUCTURES
  );
  const [upgrades, setUpgrades] = useState<SupportUpgrade[]>(INITIAL_UPGRADES);
  const [modifiers, setModifiers] = useState<Modifier[]>(INITIAL_MODIFIERS);
  const [resources, setResources] = useState<ColonyResource[]>(INITIAL_RESOURCES);
  const [plans, setPlans] = useState<DevelopmentPlan[]>(INITIAL_PLANS);

  // Chronometer & Turn System
  const [currentTurnYear, setCurrentTurnYear] = useState(814);
  const [currentTurnQuarter, setCurrentTurnQuarter] = useState(1);
  const [isChronometerRunning, setIsChronometerRunning] = useState(false);
  const [chronometerSpeed, setChronometerSpeed] = useState(1);

  // Visual Theme & Accessibility
  const [theme, setTheme] = useState<
    "theme-grimdark" | "theme-mechanicus" | "theme-inquisition"
  >("theme-grimdark");

  const [opticsSettings, setOpticsSettings] = useState<OpticsSettings>({
    high_contrast: false,
    large_text: false,
    dyslexia_font: false,
    crt_flicker: true,
    audio_chimes: true,
  });

  // Modals state
  const [isNewColonyOpen, setIsNewColonyOpen] = useState(false);
  const [isCommissionRepOpen, setIsCommissionRepOpen] = useState(false);
  const [isReassignRepOpen, setIsReassignRepOpen] = useState(false);
  const [isCommissionSystemOpen, setIsCommissionSystemOpen] = useState(false);
  const [isInstallUpgradeOpen, setIsInstallUpgradeOpen] = useState(false);
  const [isAddBlueprintOpen, setIsAddBlueprintOpen] = useState(false);
  const [isAddModifierOpen, setIsAddModifierOpen] = useState(false);
  const [isLogResourceOpen, setIsLogResourceOpen] = useState(false);
  const [isEditCharterOpen, setIsEditCharterOpen] = useState(false);

  // Sync Data with Backend on initial load
  useEffect(() => {
    apiFetch("/api/v1/colonies")
      .then((res) => (res.ok ? res.json() : null))
      .then((coloniesList) => {
        if (coloniesList && Array.isArray(coloniesList) && coloniesList.length > 0) {
          setColonies(coloniesList);
          if (!coloniesList.some((c: Colony) => c.id === selectedColonyId)) {
            setSelectedColonyId(coloniesList[0].id);
          }

          // Fetch nested details (infrastructure, upgrades, modifiers, resources, plans) for each colony
          coloniesList.forEach((c: Colony) => {
            apiFetch(`/api/v1/colonies/${c.id}`)
              .then((res) => (res.ok ? res.json() : null))
              .then((details) => {
                if (!details) return;
                if (Array.isArray(details.infrastructure) && details.infrastructure.length > 0) {
                  setInfrastructures((prev) => [
                    ...prev.filter((i) => i.colony_id !== c.id),
                    ...details.infrastructure,
                  ]);
                }
                if (Array.isArray(details.upgrades) && details.upgrades.length > 0) {
                  setUpgrades((prev) => [
                    ...prev.filter((u) => u.colony_id !== c.id),
                    ...details.upgrades,
                  ]);
                }
                if (Array.isArray(details.modifiers) && details.modifiers.length > 0) {
                  setModifiers((prev) => [
                    ...prev.filter((m) => m.colony_id !== c.id),
                    ...details.modifiers,
                  ]);
                }
                if (Array.isArray(details.resources) && details.resources.length > 0) {
                  setResources((prev) => [
                    ...prev.filter((r) => r.colony_id !== c.id),
                    ...details.resources,
                  ]);
                }
                if (Array.isArray(details.plans) && details.plans.length > 0) {
                  setPlans((prev) => [
                    ...prev.filter((p) => p.colony_id !== c.id),
                    ...details.plans,
                  ]);
                }
              })
              .catch((err) => console.log(`Fetch colony ${c.id} details error:`, err));
          });
        }
      })
      .catch((err) => console.log("Initial fetch colonies error:", err));

    apiFetch("/api/v1/representatives")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setRepresentatives(data);
        }
      })
      .catch((err) => console.log("Fetch reps error:", err));
  }, []);

  // Chronometer timer
  useEffect(() => {
    let interval: any = null;
    if (isChronometerRunning) {
      interval = setInterval(() => {
        handleAdvanceQuarter();
      }, 5000 / chronometerSpeed);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isChronometerRunning, chronometerSpeed, currentTurnQuarter, currentTurnYear]);

  // Active Colony
  const currentColony =
    colonies.find((c) => c.id === selectedColonyId) || colonies[0] || INITIAL_COLONIES[0];

  // Active Representative for this colony
  const currentRep =
    representatives.find((r) => r.assigned_colony_id === currentColony?.id) || null;

  // Selected Representative for Representative View
  const selectedRep =
    representatives.find((r) => r.id === selectedRepId) ||
    representatives[0] ||
    INITIAL_REPRESENTATIVES[0];

  // Filtered collections for active colony
  const colonyInfrastructures = infrastructures.filter(
    (i) => i.colony_id === currentColony?.id
  );
  const colonyUpgrades = upgrades.filter((u) => u.colony_id === currentColony?.id);
  const colonyModifiers = modifiers.filter((m) => m.colony_id === currentColony?.id);
  const colonyResources = resources.filter((r) => r.colony_id === currentColony?.id);
  const colonyPlans = plans.filter((p) => p.colony_id === currentColony?.id);

  // Real-time calculation breakdown
  const colonyStats = calculateColonyStats(
    currentColony,
    currentRep ? [currentRep] : [],
    colonyInfrastructures,
    colonyUpgrades,
    colonyModifiers
  );

  // Turn Advance Handler
  const handleAdvanceQuarter = () => {
    let nextQuarter = currentTurnQuarter + 1;
    let nextYear = currentTurnYear;
    if (nextQuarter > 4) {
      nextQuarter = 1;
      nextYear += 1;
    }
    setCurrentTurnQuarter(nextQuarter);
    setCurrentTurnYear(nextYear);

    // Call backend endpoint to increment age for all colonies
    if (currentColony) {
      apiFetch(`/api/v1/colonies/${currentColony.id}/advance-age`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quarters: 1 }),
      })
        .then((res) => res.json())
        .then((updated) => {
          if (updated && updated.id) {
            setColonies((prev) =>
              prev.map((c) => (c.id === updated.id ? updated : c))
            );
          }
        })
        .catch((err) => console.log("Advance age error:", err));
    }
  };

  const handleAdvanceDays = (days: number) => {
    if (!currentColony) return;
    if (currentUser?.role === "viewer") {
      alert("Clearance Denied: Servitor clearance is read-only. Lord Captain or Arch Magos clearance required.");
      return;
    }

    setColonies((prev) =>
      prev.map((c) =>
        c.id === currentColony.id
          ? { ...c, founding_days: (c.founding_days || 0) + days }
          : c
      )
    );

    apiFetch(`/api/v1/colonies/${currentColony.id}/advance-age`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ days }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((updated) => {
        if (updated && updated.id) {
          setColonies((prev) =>
            prev.map((c) => (c.id === updated.id ? updated : c))
          );
        }
      })
      .catch((err) => console.error("Advance age error:", err));
  };

  // Reset Seed Data
  const handleResetData = async () => {
    if (currentUser?.role === "viewer") {
      alert("Clearance Denied: Resetting canonical database requires Lord Captain or Arch Magos clearance.");
      return;
    }
    try {
      const res = await apiFetch("/api/v1/reset-seed", { method: "POST" });
      if (res.ok) {
        setColonies(INITIAL_COLONIES);
        setRepresentatives(INITIAL_REPRESENTATIVES);
        setInfrastructures(INITIAL_INFRASTRUCTURES);
        setUpgrades(INITIAL_UPGRADES);
        setModifiers(INITIAL_MODIFIERS);
        setResources(INITIAL_RESOURCES);
        setPlans(INITIAL_PLANS);
        setSelectedColonyId(INITIAL_COLONIES[0].id);
        setSelectedRepId(INITIAL_REPRESENTATIVES[0].id);
        setCurrentTurnYear(814);
        setCurrentTurnQuarter(1);
      }
    } catch (err) {
      console.log("Reset error:", err);
    }
  };

  // Export & Import Database JSON
  const handleExportData = () => {
    const backupData = {
      colonies,
      representatives,
      infrastructures,
      upgrades,
      modifiers,
      resources,
      plans,
      currentTurnYear,
      currentTurnQuarter,
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wh40k_colony_dynasty_records_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed.colonies) setColonies(parsed.colonies);
        if (parsed.representatives) setRepresentatives(parsed.representatives);
        if (parsed.infrastructures) setInfrastructures(parsed.infrastructures);
        if (parsed.upgrades) setUpgrades(parsed.upgrades);
        if (parsed.modifiers) setModifiers(parsed.modifiers);
        if (parsed.resources) setResources(parsed.resources);
        if (parsed.plans) setPlans(parsed.plans);
        if (parsed.currentTurnYear) setCurrentTurnYear(parsed.currentTurnYear);
        if (parsed.currentTurnQuarter) setCurrentTurnQuarter(parsed.currentTurnQuarter);
      } catch (err) {
        console.error("Invalid import JSON:", err);
      }
    };
    reader.readAsText(file);
  };

  // --- CRUD Handlers ---

  // Colonies
  const handleCreateColony = async (colonyData: any) => {
    if (currentUser?.role === "viewer") {
      alert("Clearance Denied: Servitor clearance is read-only. Lord Captain or Arch Magos clearance required to charter colonies.");
      return;
    }

    const newColony: Colony = {
      id: `colony-${Date.now()}`,
      name: colonyData.name,
      star_system: colonyData.star_system,
      colony_type: colonyData.colony_type,
      base_size: colonyData.base_size || 1,
      base_complacency: colonyData.base_complacency || 0,
      base_order: colonyData.base_order || 0,
      base_productivity: colonyData.base_productivity || 0,
      base_piety: colonyData.base_piety || 0,
      founder_name: colonyData.founder_name || "Von Valancius Dynasty",
      founding_days: 0,
      notes: colonyData.notes,
      quote: colonyData.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setColonies((prev) => [...prev, newColony]);
    setSelectedColonyId(newColony.id);

    // Add default infrastructure according to type
    apiFetch("/api/v1/colonies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newColony),
    }).catch(console.error);
  };

  const handleSaveCharter = (updates: Partial<Colony>) => {
    if (!currentColony) return;
    if (currentUser?.role === "viewer") {
      alert("Clearance Denied: Servitor clearance is read-only.");
      return;
    }
    const updated = { ...currentColony, ...updates };
    setColonies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

    apiFetch(`/api/v1/colonies/${updated.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).catch(console.error);
  };

  // Representatives
  const handleCommissionRepresentative = (
    repData: Omit<Representative, "id" | "created_at">
  ) => {
    if (currentUser?.role === "viewer") {
      alert("Clearance Denied: Servitor clearance is read-only.");
      return;
    }
    const newRep: Representative = {
      id: `rep-${Date.now()}`,
      ...repData,
      created_at: new Date().toISOString(),
    };

    setRepresentatives((prev) => [...prev, newRep]);
    setSelectedRepId(newRep.id);

    apiFetch("/api/v1/representatives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRep),
    }).catch(console.error);
  };

  const handleReassignRepresentative = (repId: string | null) => {
    if (!currentColony) return;
    if (currentUser?.role === "viewer") {
      alert("Clearance Denied: Servitor clearance is read-only.");
      return;
    }

    // Unassign previous rep
    setRepresentatives((prev) =>
      prev.map((r) => {
        if (r.assigned_colony_id === currentColony.id) {
          return { ...r, assigned_colony_id: null };
        }
        if (repId && r.id === repId) {
          return { ...r, assigned_colony_id: currentColony.id };
        }
        return r;
      })
    );

    if (repId) {
      apiFetch(`/api/v1/representatives/${repId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colony_id: currentColony.id }),
      }).catch(console.error);
    } else {
      const prevRep = representatives.find((r) => r.assigned_colony_id === currentColony.id);
      if (prevRep) {
        apiFetch(`/api/v1/representatives/${prevRep.id}/assign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ colony_id: null }),
        }).catch(console.error);
      }
    }
  };

  const syncRepresentativeUpdate = (repId: string, updates: Partial<Representative>) => {
    if (currentUser?.role === "viewer") return;
    apiFetch(`/api/v1/representatives/${repId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).catch(console.error);
  };

  const handleUpdateCharacteristics = (
    repId: string,
    charKey: string,
    delta: number
  ) => {
    setRepresentatives((prev) =>
      prev.map((r) => {
        if (r.id === repId && r.characteristics) {
          const currentVal = (r.characteristics as any)[charKey] || 30;
          const updatedChars = {
            ...r.characteristics,
            [charKey]: Math.max(1, Math.min(100, currentVal + delta)),
          };
          syncRepresentativeUpdate(repId, { characteristics: updatedChars });
          return {
            ...r,
            characteristics: updatedChars,
          };
        }
        return r;
      })
    );
  };

  const handleAddSkill = (repId: string, skill: string) => {
    setRepresentatives((prev) =>
      prev.map((r) => {
        if (r.id === repId) {
          const updatedSkills = [...(r.skills || []), skill];
          syncRepresentativeUpdate(repId, { skills: updatedSkills });
          return {
            ...r,
            skills: updatedSkills,
          };
        }
        return r;
      })
    );
  };

  const handleRemoveSkill = (repId: string, skill: string) => {
    setRepresentatives((prev) =>
      prev.map((r) => {
        if (r.id === repId) {
          const updatedSkills = (r.skills || []).filter((s) => s !== skill);
          syncRepresentativeUpdate(repId, { skills: updatedSkills });
          return {
            ...r,
            skills: updatedSkills,
          };
        }
        return r;
      })
    );
  };

  const handleAddTalent = (repId: string, talent: string) => {
    setRepresentatives((prev) =>
      prev.map((r) => {
        if (r.id === repId) {
          const updatedTalents = [...(r.talents || []), talent];
          syncRepresentativeUpdate(repId, { talents: updatedTalents });
          return {
            ...r,
            talents: updatedTalents,
          };
        }
        return r;
      })
    );
  };

  const handleRemoveTalent = (repId: string, talent: string) => {
    setRepresentatives((prev) =>
      prev.map((r) => {
        if (r.id === repId) {
          const updatedTalents = (r.talents || []).filter((t) => t !== talent);
          syncRepresentativeUpdate(repId, { talents: updatedTalents });
          return {
            ...r,
            talents: updatedTalents,
          };
        }
        return r;
      })
    );
  };

  const handleRenameRepresentative = (repId: string, newName: string) => {
    setRepresentatives((prev) =>
      prev.map((r) => (r.id === repId ? { ...r, name: newName } : r))
    );
    syncRepresentativeUpdate(repId, { name: newName });
  };

  // Infrastructure
  const handleCommissionInfrastructure = (
    infraData: Omit<Infrastructure, "id">
  ) => {
    if (currentUser?.role === "viewer") {
      alert("Clearance Denied: Servitor clearance is read-only.");
      return;
    }
    const newInfra: Infrastructure = {
      id: `infra-${Date.now()}`,
      ...infraData,
    };
    setInfrastructures((prev) => [...prev, newInfra]);
    apiFetch(`/api/v1/colonies/${newInfra.colony_id}/infrastructure`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newInfra),
    }).catch(console.error);
  };

  const handleUpdateInfrastructureState = (
    id: string,
    state: Infrastructure["state"]
  ) => {
    if (currentUser?.role === "viewer") {
      alert("Clearance Denied: Servitor clearance is read-only.");
      return;
    }
    const target = infrastructures.find((i) => i.id === id);
    setInfrastructures((prev) =>
      prev.map((i) => (i.id === id ? { ...i, state } : i))
    );
    if (target) {
      apiFetch(`/api/v1/colonies/${target.colony_id}/infrastructure/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      }).catch(console.error);
    }
  };

  const handleDeleteInfrastructure = (id: string) => {
    if (currentUser?.role === "viewer") {
      alert("Clearance Denied: Servitor clearance is read-only.");
      return;
    }
    const target = infrastructures.find((i) => i.id === id);
    setInfrastructures((prev) => prev.filter((i) => i.id !== id));
    if (target) {
      apiFetch(`/api/v1/colonies/${target.colony_id}/infrastructure/${id}`, {
        method: "DELETE",
      }).catch(console.error);
    }
  };

  // Support Upgrades
  const handleInstallUpgrade = (upgradeData: Omit<SupportUpgrade, "id">) => {
    if (currentUser?.role === "viewer") {
      alert("Clearance Denied: Servitor clearance is read-only.");
      return;
    }
    const newUpgrade: SupportUpgrade = {
      id: `upg-${Date.now()}`,
      ...upgradeData,
    };
    setUpgrades((prev) => [...prev, newUpgrade]);
    apiFetch(`/api/v1/colonies/${newUpgrade.colony_id}/upgrades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newUpgrade),
    }).catch(console.error);
  };

  const handleUpdateUpgradeState = (
    id: string,
    state: SupportUpgrade["state"]
  ) => {
    if (currentUser?.role === "viewer") {
      alert("Clearance Denied: Servitor clearance is read-only.");
      return;
    }
    const target = upgrades.find((u) => u.id === id);
    setUpgrades((prev) => prev.map((u) => (u.id === id ? { ...u, state } : u)));
    if (target) {
      apiFetch(`/api/v1/colonies/${target.colony_id}/upgrades/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      }).catch(console.error);
    }
  };

  const handleDeleteUpgrade = (id: string) => {
    if (currentUser?.role === "viewer") {
      alert("Clearance Denied: Servitor clearance is read-only.");
      return;
    }
    const target = upgrades.find((u) => u.id === id);
    setUpgrades((prev) => prev.filter((u) => u.id !== id));
    if (target) {
      apiFetch(`/api/v1/colonies/${target.colony_id}/upgrades/${id}`, {
        method: "DELETE",
      }).catch(console.error);
    }
  };

  // Plans & Blueprints
  const handleAddPlan = (planData: Omit<DevelopmentPlan, "id">) => {
    if (currentUser?.role === "viewer") {
      alert("Clearance Denied: Servitor clearance is read-only.");
      return;
    }
    const newPlan: DevelopmentPlan = {
      id: `plan-${Date.now()}`,
      ...planData,
    };
    setPlans((prev) => [...prev, newPlan]);
    apiFetch(`/api/v1/colonies/${newPlan.colony_id}/plans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPlan),
    }).catch(console.error);
  };

  const handleDeletePlan = (id: string) => {
    if (currentUser?.role === "viewer") {
      alert("Clearance Denied: Servitor clearance is read-only.");
      return;
    }
    const target = plans.find((p) => p.id === id);
    setPlans((prev) => prev.filter((p) => p.id !== id));
    if (target) {
      apiFetch(`/api/v1/colonies/${target.colony_id}/plans/${id}`, {
        method: "DELETE",
      }).catch(console.error);
    }
  };

  const handlePromotePlan = (plan: DevelopmentPlan) => {
    if (currentUser?.role === "viewer") {
      alert("Clearance Denied: Servitor clearance is read-only.");
      return;
    }
    // If it's a support upgrade, add it to upgrades
    handleInstallUpgrade({
      colony_id: plan.colony_id,
      upgrade_type: (plan.specific_type.toLowerCase().replace(/ /g, "_") as any) || "garrison",
      name: plan.name,
      state: "working",
      description: plan.description,
      installed_at: new Date().toISOString(),
    });
    // Remove from plans
    handleDeletePlan(plan.id);
  };

  // Modifiers
  const handleAddModifier = (
    modifierData: Omit<Modifier, "id" | "created_at">
  ) => {
    if (currentUser?.role === "viewer") {
      alert("Clearance Denied: Servitor clearance is read-only.");
      return;
    }
    const newMod: Modifier = {
      id: `mod-${Date.now()}`,
      ...modifierData,
      created_at: new Date().toISOString(),
    };
    setModifiers((prev) => [...prev, newMod]);
    apiFetch(`/api/v1/colonies/${newMod.colony_id}/modifiers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMod),
    }).catch(console.error);
  };

  const handleToggleModifier = (id: string) => {
    if (currentUser?.role === "viewer") {
      alert("Clearance Denied: Servitor clearance is read-only.");
      return;
    }
    const target = modifiers.find((m) => m.id === id);
    if (!target) return;
    const nextActive = !target.is_active;
    setModifiers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_active: nextActive } : m))
    );
    apiFetch(`/api/v1/colonies/${target.colony_id}/modifiers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: nextActive }),
    }).catch(console.error);
  };

  const handleDeleteModifier = (id: string) => {
    if (currentUser?.role === "viewer") {
      alert("Clearance Denied: Servitor clearance is read-only.");
      return;
    }
    const target = modifiers.find((m) => m.id === id);
    setModifiers((prev) => prev.filter((m) => m.id !== id));
    if (target) {
      apiFetch(`/api/v1/colonies/${target.colony_id}/modifiers/${id}`, {
        method: "DELETE",
      }).catch(console.error);
    }
  };

  // Resources
  const handleLogResource = (resourceData: Omit<ColonyResource, "id">) => {
    if (currentUser?.role === "viewer") {
      alert("Clearance Denied: Servitor clearance is read-only.");
      return;
    }
    const newRes: ColonyResource = {
      id: `res-${Date.now()}`,
      ...resourceData,
    };
    setResources((prev) => [...prev, newRes]);
    apiFetch(`/api/v1/colonies/${newRes.colony_id}/resources`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newRes),
    }).catch(console.error);
  };

  const handleDeleteResource = (id: string) => {
    if (currentUser?.role === "viewer") {
      alert("Clearance Denied: Servitor clearance is read-only.");
      return;
    }
    const target = resources.find((r) => r.id === id);
    setResources((prev) => prev.filter((r) => r.id !== id));
    if (target) {
      apiFetch(`/api/v1/colonies/${target.colony_id}/resources/${id}`, {
        method: "DELETE",
      }).catch(console.error);
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#04060b] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[#f59e0b]/30 border-t-[#f59e0b] rounded-full animate-spin mx-auto" />
          <p className="text-[#f59e0b] font-mono-slate text-sm tracking-wider">AUTHENTICATING...</p>
        </div>
      </div>
    );
  }

  // If not logged in, display login screen
  if (!isLoggedIn) {
    return (
      <LoginScreen
        onLogin={(user) => {
          // TanStack Query will automatically refetch currentUser on successful login
          // because loginMutation invalidates the auth queries
        }}
      />
    );
  }

  const handleLogout = async () => {
    logoutMutation.mutate();
  };

  // Accessibility classes applied to the root container
  const accessibilityClasses = [
    theme,
    opticsSettings.high_contrast ? "high-contrast" : "",
    opticsSettings.large_text ? "large-text" : "",
    opticsSettings.dyslexia_font ? "dyslexia-font" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`min-h-screen bg-[#04060b] text-[#f8fafc] flex flex-col justify-between selection:bg-[#f59e0b] selection:text-black ${accessibilityClasses}`}
    >
      {/* Optional CRT scanline / flicker effect */}
      {opticsSettings.crt_flicker && (
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-40 opacity-70" />
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col">
        {/* 1. Global Header */}
        <Header
          colonies={colonies}
          selectedColony={currentColony}
          activeTab={activeTab}
          theme={theme}
          opticsSettings={opticsSettings}
          onSelectColony={(colony) => setSelectedColonyId(colony.id)}
          onSelectTab={setActiveTab}
          onAdvanceDays={handleAdvanceDays}
          onOpenNewColony={() => {
            if (currentUser?.role === "viewer") {
              alert("Clearance Denied: Servitor clearance is read-only. Lord Captain or Arch Magos clearance required.");
              return;
            }
            setIsNewColonyOpen(true);
          }}
          onChangeTheme={setTheme}
          onUpdateOpticsSettings={setOpticsSettings}
          userRole={currentUser?.role || "colony_manager"}
          userName={currentUser?.username || "Alexis Valancius"}
          onLogout={handleLogout}
        />

        {/* 2. Main Tab Viewports */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {activeTab === "overview" && (
            <ColonyOverview
              colony={currentColony}
              stats={colonyStats}
              representative={currentRep}
              infrastructures={colonyInfrastructures}
              upgrades={colonyUpgrades}
              modifiers={colonyModifiers}
              resources={colonyResources}
              plans={colonyPlans}
              currentYear={currentTurnYear}
              currentQuarter={currentTurnQuarter}
              isChronometerRunning={isChronometerRunning}
              chronometerSpeed={chronometerSpeed}
              onToggleChronometer={() => setIsChronometerRunning((prev) => !prev)}
              onChangeSpeed={(spd) => setChronometerSpeed(spd)}
              onAdvanceAge={handleAdvanceQuarter}
              onOpenEditCharter={() => setIsEditCharterOpen(true)}
              onOpenCommissionRepresentative={() => setIsCommissionRepOpen(true)}
              onOpenReassignRepresentative={() => setIsReassignRepOpen(true)}
              onOpenAddPlan={() => setIsAddBlueprintOpen(true)}
              onOpenAddModifier={() => setIsAddModifierOpen(true)}
              onOpenLogResource={() => setIsLogResourceOpen(true)}
              onToggleModifier={handleToggleModifier}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === "details" && (
            <ColonyDetailsView
              colony={currentColony}
              stats={colonyStats}
              infrastructures={colonyInfrastructures}
              upgrades={colonyUpgrades}
              modifiers={colonyModifiers}
              resources={colonyResources}
              plans={colonyPlans}
              representative={currentRep}
              onOpenAddModifier={() => setIsAddModifierOpen(true)}
              onOpenLogResource={() => setIsLogResourceOpen(true)}
              onOpenAddBlueprint={() => setIsAddBlueprintOpen(true)}
              onToggleModifier={handleToggleModifier}
              onDeleteModifier={handleDeleteModifier}
              onDeleteResource={handleDeleteResource}
            />
          )}

          {activeTab === "infrastructure" && (
            <InfrastructurePlansView
              colony={currentColony}
              stats={colonyStats}
              infrastructures={colonyInfrastructures}
              upgrades={colonyUpgrades}
              plans={colonyPlans}
              onOpenCommissionSystem={() => setIsCommissionSystemOpen(true)}
              onOpenInstallUpgrade={() => setIsInstallUpgradeOpen(true)}
              onOpenAddBlueprint={() => setIsAddBlueprintOpen(true)}
              onUpdateInfrastructureState={handleUpdateInfrastructureState}
              onUpdateUpgradeState={handleUpdateUpgradeState}
              onDeleteInfrastructure={handleDeleteInfrastructure}
              onDeleteUpgrade={handleDeleteUpgrade}
              onDeletePlan={handleDeletePlan}
              onPromotePlan={handlePromotePlan}
            />
          )}

          {activeTab === "representatives" && (
            <RepresentativeView
              representatives={representatives}
              selectedRepresentative={selectedRep}
              colonies={colonies}
              onSelectRepresentative={(rep) => setSelectedRepId(rep.id)}
              onOpenCommissionModal={() => setIsCommissionRepOpen(true)}
              onOpenReassignModal={(rep) => {
                setSelectedRepId(rep.id);
                setIsReassignRepOpen(true);
              }}
              onUpdateCharacteristics={handleUpdateCharacteristics}
              onAddSkill={handleAddSkill}
              onRemoveSkill={handleRemoveSkill}
              onAddTalent={handleAddTalent}
              onRemoveTalent={handleRemoveTalent}
              onRenameRepresentative={handleRenameRepresentative}
            />
          )}
        </main>
      </div>

      {/* 3. Global Footer */}
      <Footer
        colonyCount={colonies.length}
        activeColonyName={currentColony?.name || "None"}
        onResetSeedData={handleResetData}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />

      {/* 4. Modals */}
      <NewColonyModal
        isOpen={isNewColonyOpen}
        onClose={() => setIsNewColonyOpen(false)}
        onCreateColony={handleCreateColony}
      />

      <CommissionRepresentativeModal
        isOpen={isCommissionRepOpen}
        onClose={() => setIsCommissionRepOpen(false)}
        colonies={colonies}
        onCommission={handleCommissionRepresentative}
      />

      <ReassignRepresentativeModal
        isOpen={isReassignRepOpen}
        onClose={() => setIsReassignRepOpen(false)}
        colony={currentColony}
        representatives={representatives}
        currentRepresentative={currentRep}
        onReassign={handleReassignRepresentative}
      />

      <CommissionHardInfrastructureModal
        isOpen={isCommissionSystemOpen}
        onClose={() => setIsCommissionSystemOpen(false)}
        colonyId={currentColony?.id || "colony-1"}
        onCommission={handleCommissionInfrastructure}
      />

      <AddSupportUpgradeModal
        isOpen={isInstallUpgradeOpen}
        onClose={() => setIsInstallUpgradeOpen(false)}
        colonyId={currentColony?.id || "colony-1"}
        onInstall={handleInstallUpgrade}
      />

      <AddBlueprintModal
        isOpen={isAddBlueprintOpen}
        onClose={() => setIsAddBlueprintOpen(false)}
        colonyId={currentColony?.id || "colony-1"}
        onAddPlan={handleAddPlan}
      />

      <AddCustomModifierModal
        isOpen={isAddModifierOpen}
        onClose={() => setIsAddModifierOpen(false)}
        colonyId={currentColony?.id || "colony-1"}
        onAddModifier={handleAddModifier}
      />

      <LogResourceDepositModal
        isOpen={isLogResourceOpen}
        onClose={() => setIsLogResourceOpen(false)}
        colonyId={currentColony?.id || "colony-1"}
        onLogResource={handleLogResource}
      />

      {currentColony && (
        <EditCharterModal
          isOpen={isEditCharterOpen}
          onClose={() => setIsEditCharterOpen(false)}
          colony={currentColony}
          onSaveCharter={handleSaveCharter}
        />
      )}
    </div>
  );
}

export default App;
