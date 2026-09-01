import { 
  Colony, 
  ColonyCalculations, 
  ModifierItem, 
  Representative, 
  StatCalculation, 
  StatName 
} from '../types';
import { 
  COLONY_TYPES, 
  HARD_INFRASTRUCTURE_RULES, 
  SIZE_TO_PF_TABLE, 
  SUPPORT_UPGRADE_RULES 
} from '../data/rulesReference';
import { 
  getPersonalityModifiers, 
  getDynastyModifiers,
  getColonyTypeModifiers,
  getInfrastructureModifiers,
  getSupportUpgradeModifiers
} from './calculator.helpers';

export function calculateColonyState(colony: Colony, representative: Representative | null): ColonyCalculations {
  const colonyTypeRule = COLONY_TYPES[colony.colonyType] || COLONY_TYPES.research_mission;
  
  // Step 1: Collect all raw modifiers across all sources
  const permanentMods: ModifierItem[] = [];
  const conditionalMods: ModifierItem[] = [];
  const customMods: ModifierItem[] = [];

  // A. Free starting grants / Colony Type permanent effects (extracted to helper)
  const colonyTypeMods = getColonyTypeModifiers(colony);
  permanentMods.push(...colonyTypeMods);

  // B. Hard Infrastructure modifiers (extracted to helper)
  colony.hardInfrastructure.forEach((infra) => {
    const infraMods = getInfrastructureModifiers(infra, HARD_INFRASTRUCTURE_RULES);
    permanentMods.push(...infraMods);
  });

  // C. Support Upgrades modifiers (extracted to helper)
  colony.supportUpgrades.forEach((upg) => {
    const upgMods = getSupportUpgradeModifiers(upg, colony.colonyType, SUPPORT_UPGRADE_RULES);
    permanentMods.push(...upgMods);
  });

  // D. Representative Modifiers (Personalities, Nepotism, Loss mitigation) - extracted to helpers
  if (representative) {
    // Personality modifiers - extracted to helper function
    representative.personalities.forEach((pers, idx) => {
      const persMods = getPersonalityModifiers(pers.personalityKey, pers, idx, representative.name);
      permanentMods.push(...persMods);
    });

    // Dynasty Member Nepotism - extracted to helper function
    if (representative.type === 'dynasty_member' && representative.dynastyOutcomeKey) {
      const dynastyMods = getDynastyModifiers(representative.dynastyOutcomeKey, representative);
      permanentMods.push(...dynastyMods);
    }
  }

  // E. Custom Modifiers (User/GM created)
  colony.customModifiers.forEach((m) => {
    if (m.isActive) {
      customMods.push({
        ...m,
        category: 'custom',
      });
    }
  });

  // Calculate Size first so conditional checks have an accurate Size
  const sizeBase = colonyTypeRule.baseStats.size;
  const sizeMods = [...permanentMods.filter((m) => m.stat === 'size'), ...customMods.filter((m) => m.stat === 'size')];
  const sizeRaw = sizeBase + sizeMods.reduce((acc, m) => acc + m.value, 0);
  const sizeFinal = Math.min(10, Math.max(0, sizeRaw));
  const sizeLookup = SIZE_TO_PF_TABLE.find((t) => t.size === sizeFinal) || SIZE_TO_PF_TABLE[1];
  const sizeLoreLabel = `${sizeLookup.label} (Size ${sizeFinal})`;

  // Calculate Preliminary Order to evaluate Administrative Expert (Productivity +2 only while Order > Size)
  const orderBase = colonyTypeRule.baseStats.order;
  const orderModsPrelim = [...permanentMods.filter((m) => m.stat === 'order'), ...customMods.filter((m) => m.stat === 'order')];
  const orderPrelim = Math.max(0, orderBase + orderModsPrelim.reduce((acc, m) => acc + m.value, 0));

  if (representative) {
    const hasAdminExpert = representative.personalities.some((p) => p.personalityKey === 'administrative_expert');
    if (hasAdminExpert) {
      if (orderPrelim > sizeFinal) {
        conditionalMods.push({
          id: 'rep_admin_expert_active',
          name: `Administrative Expert (Order ${orderPrelim} > Size ${sizeFinal})`,
          stat: 'productivity',
          value: 2,
          source: `Representative: ${representative.name} (Conditional)`,
          category: 'conditional',
        });
      }
    }
  }

  // Helper to compile a StatCalculation
  function buildStatCalc(stat: StatName, base: number): StatCalculation {
    const statPerms = permanentMods.filter((m) => m.stat === stat);
    const statConds = conditionalMods.filter((m) => m.stat === stat);
    const statCustoms = customMods.filter((m) => m.stat === stat);
    const allMods = [...statPerms, ...statConds, ...statCustoms];

    const rawTotal = base + allMods.reduce((acc, m) => acc + m.value, 0);
    const finalValue = Math.max(0, rawTotal);

    let loreState = 'stable';
    let loreLabel = 'Stable';
    let isCrisis = false;
    let isPositive = false;

    if (stat === 'complacency') {
      if (finalValue === 0) {
        loreState = 'riots_and_unrest';
        loreLabel = 'Riots and Unrest';
        isCrisis = true;
      } else if (finalValue > sizeFinal) {
        loreState = 'placated';
        loreLabel = 'Placated';
        isPositive = true;
      } else {
        loreState = 'stable';
        loreLabel = 'Stable';
      }
    } else if (stat === 'order') {
      if (finalValue === 0) {
        loreState = 'anarchy';
        loreLabel = 'Anarchy';
        isCrisis = true;
      } else if (finalValue > sizeFinal) {
        loreState = 'orderly';
        loreLabel = 'Orderly';
        isPositive = true;
      } else {
        loreState = 'stable';
        loreLabel = 'Stable';
      }
    } else if (stat === 'productivity') {
      if (finalValue === 0) {
        loreState = 'halted';
        loreLabel = 'Halted';
        isCrisis = true;
      } else if (finalValue > sizeFinal) {
        loreState = 'productive';
        loreLabel = 'Productive';
        isPositive = true;
      } else {
        loreState = 'stable';
        loreLabel = 'Stable';
      }
    } else if (stat === 'piety') {
      if (finalValue === 0) {
        loreState = 'heretical';
        loreLabel = 'Heretical';
        isCrisis = true;
      } else if (finalValue > sizeFinal) {
        loreState = 'pious';
        loreLabel = 'Pious';
        isPositive = true;
      } else {
        loreState = 'stable';
        loreLabel = 'Stable';
      }
    }

    return {
      stat,
      baseValue: base,
      modifiers: allMods,
      total: rawTotal,
      finalValue,
      loreState,
      loreLabel,
      isCrisis,
      isPositive,
    };
  }

  const complacencyCalc = buildStatCalc('complacency', colonyTypeRule.baseStats.complacency);
  const orderCalc = buildStatCalc('order', colonyTypeRule.baseStats.order);
  const productivityCalc = buildStatCalc('productivity', colonyTypeRule.baseStats.productivity);
  const pietyCalc = buildStatCalc('piety', colonyTypeRule.baseStats.piety);

  // Profit Factor Calculation
  const pfBase = sizeLookup.profitFactor;
  const pfStateBonuses: { name: string; value: number }[] = [];

  if (complacencyCalc.loreState === 'placated') {
    pfStateBonuses.push({ name: 'Placated Population Bonus', value: 1 });
  }
  if (productivityCalc.loreState === 'productive') {
    pfStateBonuses.push({ name: 'Productive Economy Bonus', value: 2 });
  }
  if (orderCalc.loreState === 'orderly') {
    pfStateBonuses.push({ name: 'Orderly Administration Bonus', value: 2 });
  }

  // Colony Type resource PF bonuses
  if (colony.colonyType === 'mining_and_industry') {
    const hasMinerals = colony.planetaryResources.some((r) => r.type.toLowerCase().includes('mineral') || r.name.toLowerCase().includes('ore'));
    if (hasMinerals) {
      pfStateBonuses.push({ name: 'Industrial Powerhouse (Mineral PF Bonus)', value: 2 });
    }
  }
  if (colony.colonyType === 'research_mission') {
    const hasRare = colony.planetaryResources.some((r) => r.type.toLowerCase().includes('organic') || r.type.toLowerCase().includes('archeotech') || r.type.toLowerCase().includes('xenos'));
    if (hasRare) {
      pfStateBonuses.push({ name: 'Resource Experts (Rare Resource PF Bonus)', value: 1 });
    }
  }

  const pfCustomMods = customMods.filter((m) => m.stat === 'profit_factor');
  const pfTotal = Math.max(
    0,
    pfBase +
      pfStateBonuses.reduce((acc, b) => acc + b.value, 0) +
      pfCustomMods.reduce((acc, m) => acc + m.value, 0)
  );

  const activeStateBadges: { stat: StatName; state: string; label: string; type: 'positive' | 'crisis' | 'stable' }[] = [
    {
      stat: 'complacency',
      state: complacencyCalc.loreState,
      label: complacencyCalc.loreLabel,
      type: complacencyCalc.isCrisis ? 'crisis' : complacencyCalc.isPositive ? 'positive' : 'stable',
    },
    {
      stat: 'order',
      state: orderCalc.loreState,
      label: orderCalc.loreLabel,
      type: orderCalc.isCrisis ? 'crisis' : orderCalc.isPositive ? 'positive' : 'stable',
    },
    {
      stat: 'productivity',
      state: productivityCalc.loreState,
      label: productivityCalc.loreLabel,
      type: productivityCalc.isCrisis ? 'crisis' : productivityCalc.isPositive ? 'positive' : 'stable',
    },
    {
      stat: 'piety',
      state: pietyCalc.loreState,
      label: pietyCalc.loreLabel,
      type: pietyCalc.isCrisis ? 'crisis' : pietyCalc.isPositive ? 'positive' : 'stable',
    },
  ];

  return {
    size: {
      stat: 'size',
      baseValue: sizeBase,
      modifiers: sizeMods,
      total: sizeRaw,
      finalValue: sizeFinal,
      loreState: sizeFinal.toString(),
      loreLabel: sizeLookup.label,
      isCrisis: false,
      isPositive: false,
    },
    sizeLoreLabel,
    complacency: complacencyCalc,
    order: orderCalc,
    productivity: productivityCalc,
    piety: pietyCalc,
    profitFactor: {
      baseFromSize: pfBase,
      stateBonuses: pfStateBonuses,
      modifiers: pfCustomMods,
      total: pfTotal,
    },
    activeStateBadges,
  };
}

export function formatColonyAge(days: number): string {
  if (days <= 0) return '0 days';
  const years = Math.floor(days / 365);
  const remainingDaysAfterYears = days % 365;
  const months = Math.floor(remainingDaysAfterYears / 30);
  const remainingDays = remainingDaysAfterYears % 30;

  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`);
  if (months > 0) parts.push(`${months} ${months === 1 ? 'month' : 'months'}`);
  if (remainingDays > 0 || parts.length === 0) parts.push(`${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`);

  return parts.join(' ');
}
