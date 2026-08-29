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

export function calculateColonyState(colony: Colony, representative: Representative | null): ColonyCalculations {
  const colonyTypeRule = COLONY_TYPES[colony.colonyType] || COLONY_TYPES.research_mission;
  
  // Step 1: Collect all raw modifiers across all sources
  const permanentMods: ModifierItem[] = [];
  const conditionalMods: ModifierItem[] = [];
  const customMods: ModifierItem[] = [];

  // A. Free starting grants / Colony Type permanent effects
  if (colony.colonyType === 'mining_and_industry') {
    // Has mineral resources bonus if any resource matches
    const hasMinerals = colony.planetaryResources.some(
      (r) => r.type.toLowerCase().includes('mineral') || r.name.toLowerCase().includes('ore') || r.name.toLowerCase().includes('metal')
    );
    if (hasMinerals) {
      permanentMods.push({
        id: 'spec_mining_prod',
        name: 'Industrial Powerhouse (Mineral Exploitation)',
        stat: 'productivity',
        value: 2,
        source: 'Colony Specialty (Mining & Industry)',
        category: 'permanent',
      });
    }
  }

  if (colony.colonyType === 'research_mission') {
    const hasRare = colony.planetaryResources.some(
      (r) => r.type.toLowerCase().includes('organic') || r.type.toLowerCase().includes('archeotech') || r.type.toLowerCase().includes('xenos')
    );
    if (hasRare) {
      permanentMods.push({
        id: 'spec_research_prod',
        name: 'Resource Experts (Rare Resource Exploitation)',
        stat: 'productivity',
        value: 2,
        source: 'Colony Specialty (Research Mission)',
        category: 'permanent',
      });
    }
  }

  // Free Cultural Improvement for Ecclesiastical
  if (colony.colonyType === 'ecclesiastical' && colony.culturalImprovementStat) {
    permanentMods.push({
      id: 'spec_eccl_cult',
      name: `Shield of Faith Free Cultural Improvement (${colony.culturalImprovementStat.toUpperCase()})`,
      stat: colony.culturalImprovementStat,
      value: 1,
      source: 'Colony Specialty (Ecclesiastical)',
      category: 'permanent',
    });
  }

  // B. Hard Infrastructure modifiers
  colony.hardInfrastructure.forEach((infra) => {
    const rule = HARD_INFRASTRUCTURE_RULES[infra.type];
    if (!rule) return;

    if (infra.status === 'working') {
      rule.workingModifiers.forEach((m, idx) => {
        permanentMods.push({
          id: `infra_${infra.id}_${idx}`,
          name: `${infra.name || rule.displayName} (Working)`,
          stat: m.stat,
          value: m.value,
          source: `Hard Infrastructure: ${rule.displayName}`,
          category: 'permanent',
        });
      });
    } else if (infra.status === 'not_working') {
      rule.notWorkingModifiers.forEach((m, idx) => {
        permanentMods.push({
          id: `infra_${infra.id}_${idx}`,
          name: `${infra.name || rule.displayName} (Not Working)`,
          stat: m.stat,
          value: m.value,
          source: `Hard Infrastructure: ${rule.displayName}`,
          category: 'permanent',
        });
      });
    } else if (infra.status === 'needed') {
      // Missing Infrastructure penalty: Complacency -1
      permanentMods.push({
        id: `infra_${infra.id}_needed`,
        name: `${infra.name || rule.displayName} (Needed / Missing Penalty)`,
        stat: 'complacency',
        value: -1,
        source: `Hard Infrastructure: ${rule.displayName}`,
        category: 'permanent',
      });
    }
  });

  // C. Support Upgrades modifiers
  colony.supportUpgrades.forEach((upg) => {
    const rule = SUPPORT_UPGRADE_RULES[upg.type];
    if (!rule) return;

    if (upg.status === 'working') {
      if (upg.type === 'cultural_improvement' && upg.chosenStat) {
        permanentMods.push({
          id: `upg_${upg.id}`,
          name: `${upg.name || rule.displayName} (+1 ${upg.chosenStat.toUpperCase()})`,
          stat: upg.chosenStat,
          value: 1,
          source: `Support Upgrade: ${rule.displayName}`,
          category: 'permanent',
        });
      } else if (upg.type === 'mechanicum_station') {
        // +1 standard, +2 Mining/Industry, +3 Research Mission
        let bonus = 1;
        if (colony.colonyType === 'mining_and_industry') bonus = 2;
        if (colony.colonyType === 'research_mission') bonus = 3;
        permanentMods.push({
          id: `upg_${upg.id}`,
          name: `${upg.name || rule.displayName} (${colonyTypeRule.displayName} bonus)`,
          stat: 'productivity',
          value: bonus,
          source: `Support Upgrade: ${rule.displayName}`,
          category: 'permanent',
        });
      } else {
        rule.statEffects.forEach((eff, idx) => {
          if (eff.stat !== 'custom_choice') {
            permanentMods.push({
              id: `upg_${upg.id}_${idx}`,
              name: upg.name || rule.displayName,
              stat: eff.stat,
              value: eff.value,
              source: `Support Upgrade: ${rule.displayName}`,
              category: 'permanent',
            });
          }
        });
      }
    }
  });

  // D. Representative Modifiers (Personalities, Nepotism, Loss mitigation)
  if (representative) {
    representative.personalities.forEach((pers, idx) => {
      const pKey = pers.personalityKey;
      if (pKey === 'beloved') {
        permanentMods.push({ id: `rep_pers_${idx}`, name: 'Beloved', stat: 'complacency', value: 1, source: `Representative: ${representative.name}`, category: 'permanent' });
      } else if (pKey === 'military_minded') {
        permanentMods.push({ id: `rep_pers_${idx}`, name: 'Military-Minded', stat: 'order', value: 1, source: `Representative: ${representative.name}`, category: 'permanent' });
      } else if (pKey === 'corrupt') {
        permanentMods.push({ id: `rep_pers_${idx}_1`, name: 'Corrupt', stat: 'productivity', value: 2, source: `Representative: ${representative.name}`, category: 'permanent' });
        permanentMods.push({ id: `rep_pers_${idx}_2`, name: 'Corrupt (Penalty)', stat: 'order', value: -1, source: `Representative: ${representative.name}`, category: 'permanent' });
      } else if (pKey === 'idle') {
        permanentMods.push({ id: `rep_pers_${idx}_1`, name: 'Idle', stat: 'complacency', value: 2, source: `Representative: ${representative.name}`, category: 'permanent' });
        permanentMods.push({ id: `rep_pers_${idx}_2`, name: 'Idle (Penalty)', stat: 'productivity', value: -1, source: `Representative: ${representative.name}`, category: 'permanent' });
      } else if (pKey === 'ambitious') {
        permanentMods.push({ id: `rep_pers_${idx}_1`, name: 'Ambitious', stat: 'productivity', value: 2, source: `Representative: ${representative.name}`, category: 'permanent' });
        permanentMods.push({ id: `rep_pers_${idx}_2`, name: 'Ambitious (Penalty)', stat: 'complacency', value: -1, source: `Representative: ${representative.name}`, category: 'permanent' });
      } else if (pKey === 'zealous') {
        permanentMods.push({ id: `rep_pers_${idx}`, name: 'Zealous', stat: 'piety', value: 1, source: `Representative: ${representative.name}`, category: 'permanent' });
      } else if (pKey === 'patron_of_the_arts') {
        permanentMods.push({ id: `rep_pers_${idx}_1`, name: 'Patron of the Arts', stat: 'complacency', value: 2, source: `Representative: ${representative.name}`, category: 'permanent' });
        permanentMods.push({ id: `rep_pers_${idx}_2`, name: 'Patron of the Arts (Penalty)', stat: 'piety', value: -1, source: `Representative: ${representative.name}`, category: 'permanent' });
      } else if (pKey === 'unlucky') {
        permanentMods.push({ id: `rep_pers_${idx}`, name: 'Unlucky (Calamitous +4)', stat: 'piety', value: 2, source: `Representative: ${representative.name}`, category: 'permanent' });
      } else if (pKey === 'ties_with' && pers.chosenStat) {
        permanentMods.push({ id: `rep_pers_${idx}`, name: `Ties With... (${pers.chosenStat.toUpperCase()})`, stat: pers.chosenStat, value: 1, source: `Representative: ${representative.name} (GM Choice)`, category: 'permanent' });
      } else if (pKey === 'cruel') {
        permanentMods.push({ id: `rep_pers_${idx}_1`, name: 'Cruel', stat: 'productivity', value: 2, source: `Representative: ${representative.name}`, category: 'permanent' });
        permanentMods.push({ id: `rep_pers_${idx}_2`, name: 'Cruel (Penalty)', stat: 'complacency', value: -1, source: `Representative: ${representative.name}`, category: 'permanent' });
      } else if (pKey === 'spymaster') {
        permanentMods.push({ id: `rep_pers_${idx}_1`, name: 'Spymaster', stat: 'order', value: 2, source: `Representative: ${representative.name}`, category: 'permanent' });
        permanentMods.push({ id: `rep_pers_${idx}_2`, name: 'Spymaster (Penalty)', stat: 'complacency', value: -1, source: `Representative: ${representative.name}`, category: 'permanent' });
      } else if (pKey === 'generalissimo') {
        permanentMods.push({ id: `rep_pers_${idx}_1`, name: 'Generalissimo', stat: 'order', value: 2, source: `Representative: ${representative.name}`, category: 'permanent' });
        permanentMods.push({ id: `rep_pers_${idx}_2`, name: 'Generalissimo (Penalty)', stat: 'piety', value: -1, source: `Representative: ${representative.name}`, category: 'permanent' });
      } else if (pKey === 'paranoid') {
        permanentMods.push({ id: `rep_pers_${idx}_1`, name: 'Paranoid', stat: 'order', value: 2, source: `Representative: ${representative.name}`, category: 'permanent' });
        permanentMods.push({ id: `rep_pers_${idx}_2`, name: 'Paranoid (Penalty)', stat: 'productivity', value: -1, source: `Representative: ${representative.name}`, category: 'permanent' });
      } else if (pKey === 'mad') {
        permanentMods.push({ id: `rep_pers_${idx}_1`, name: 'Mad', stat: 'complacency', value: 1, source: `Representative: ${representative.name}`, category: 'permanent' });
        permanentMods.push({ id: `rep_pers_${idx}_2`, name: 'Mad', stat: 'piety', value: 1, source: `Representative: ${representative.name}`, category: 'permanent' });
        permanentMods.push({ id: `rep_pers_${idx}_3`, name: 'Mad', stat: 'productivity', value: 1, source: `Representative: ${representative.name}`, category: 'permanent' });
        const rollVal = pers.madOrderRoll || 3;
        permanentMods.push({ id: `rep_pers_${idx}_4`, name: `Mad (Order penalty from 1d5 physical roll: -${rollVal})`, stat: 'order', value: -rollVal, source: `Representative: ${representative.name} (GM Roll)`, category: 'permanent' });
      } else if (pKey === 'charitable') {
        permanentMods.push({ id: `rep_pers_${idx}_1`, name: 'Charitable', stat: 'complacency', value: 1, source: `Representative: ${representative.name}`, category: 'permanent' });
        permanentMods.push({ id: `rep_pers_${idx}_2`, name: 'Charitable', stat: 'piety', value: 1, source: `Representative: ${representative.name}`, category: 'permanent' });
        permanentMods.push({ id: `rep_pers_${idx}_3`, name: 'Charitable (Penalty)', stat: 'productivity', value: -1, source: `Representative: ${representative.name}`, category: 'permanent' });
      } else if (pKey === 'vainglorious') {
        permanentMods.push({ id: `rep_pers_${idx}_1`, name: 'Vainglorious', stat: 'productivity', value: 2, source: `Representative: ${representative.name}`, category: 'permanent' });
        permanentMods.push({ id: `rep_pers_${idx}_2`, name: 'Vainglorious (Penalty)', stat: 'piety', value: -1, source: `Representative: ${representative.name}`, category: 'permanent' });
      } else if (pKey === 'scholarly' && pers.chosenStat) {
        permanentMods.push({ id: `rep_pers_${idx}`, name: `Scholarly (Lowest stat bonus: ${pers.chosenStat.toUpperCase()})`, stat: pers.chosenStat, value: 1, source: `Representative: ${representative.name} (GM Assignment)`, category: 'permanent' });
      } else if (pKey === 'avaricious') {
        permanentMods.push({ id: `rep_pers_${idx}`, name: 'Avaricious', stat: 'productivity', value: 1, source: `Representative: ${representative.name}`, category: 'permanent' });
      }
    });

    // Dynasty Member Nepotism
    if (representative.type === 'dynasty_member' && representative.dynastyOutcomeKey) {
      if (representative.dynastyOutcomeKey === 'potential') {
        const chosen = representative.personalities[0]?.chosenStat || 'complacency';
        permanentMods.push({ id: 'rep_dynasty', name: `That One Has Potential! (+1 ${chosen.toUpperCase()})`, stat: chosen, value: 1, source: `Dynasty Nepotism: ${representative.name}`, category: 'permanent' });
      } else if (representative.dynastyOutcomeKey === 'eye_on') {
        permanentMods.push({ id: 'rep_dynasty', name: 'One To Keep An Eye On (+1 Productivity)', stat: 'productivity', value: 1, source: `Dynasty Nepotism: ${representative.name}`, category: 'permanent' });
      } else if (representative.dynastyOutcomeKey === 'heroics') {
        permanentMods.push({ id: 'rep_dynasty', name: 'Thrilling Heroics (+1 Piety)', stat: 'piety', value: 1, source: `Dynasty Nepotism: ${representative.name}`, category: 'permanent' });
      } else if (representative.dynastyOutcomeKey === 'grox') {
        permanentMods.push({ id: 'rep_dynasty', name: "Come On, It's Just a Grox! (+1 Order)", stat: 'order', value: 1, source: `Dynasty Nepotism: ${representative.name}`, category: 'permanent' });
      } else if (representative.dynastyOutcomeKey === 'volcano') {
        permanentMods.push({ id: 'rep_dynasty', name: 'You Built the Palace on a Volcano?! (+1 Complacency)', stat: 'complacency', value: 1, source: `Dynasty Nepotism: ${representative.name}`, category: 'permanent' });
      }
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
