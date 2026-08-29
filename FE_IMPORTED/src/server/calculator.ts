/**
 * Colony Calculator & Rules Engine (TypeScript port matching repo Python rules)
 * Implements domain rules for:
 * - Size calculation & Size -> Base PF lookup
 * - Lore state resolution (Placated, Anarchy, Productive, Halted, Pious, Heretical, etc.)
 * - Hard infrastructure stat penalties/bonuses
 * - Support upgrade effects (with conditional Mechanicum & free Ecclesiastical benefits)
 * - Representative characteristics & leadership bonuses
 * - Profit factor formula with anarchy, halted, and crisis penalties
 */

import { ColonyEntity, db, ModifierEntity, RepresentativeEntity } from './db';

export const SIZE_TO_PF: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 5,
  5: 7,
  6: 10,
  7: 13,
  8: 17,
  9: 21,
  10: 26,
};

export const SIZE_LORE_NAMES: Record<number, string> = {
  1: 'Outpost',
  2: 'Settlement',
  3: 'Freehold',
  4: 'Township',
  5: 'Major Habitat',
  6: 'Colony World',
  7: 'Developed Hive',
  8: 'Metropolis Core',
  9: 'Prime Sector',
  10: 'Apex Imperial World',
};

export interface ResolvedColonyState {
  size: {
    base: number;
    current: number;
    lore_state: string;
    lore_name: string;
  };
  complacency: {
    base: number;
    current: number;
    lore_state: 'stable' | 'placated' | 'riots_and_unrest';
    is_crisis: boolean;
  };
  order: {
    base: number;
    current: number;
    lore_state: 'stable' | 'orderly' | 'anarchy';
    is_crisis: boolean;
  };
  productivity: {
    base: number;
    current: number;
    lore_state: 'stable' | 'productive' | 'halted';
    is_crisis: boolean;
  };
  piety: {
    base: number;
    current: number;
    lore_state: 'stable' | 'pious' | 'heretical';
    is_crisis: boolean;
  };
  profit_factor: {
    base: number;
    total: number;
    leadership_bonus: number;
    state_bonuses: {
      placated: number;
      productive: number;
      orderly: number;
    };
    breakdown: Array<{ name: string; value: number }>;
  };
  modifiers: Array<{
    id: number;
    name: string;
    stat: string;
    value: number;
    category: string;
    source: string;
  }>;
}

export function computeColonyState(colonyId: number): ResolvedColonyState {
  const colony = db.colonies.find((c) => c.id === colonyId);
  if (!colony) {
    throw new Error(`Colony ${colonyId} not found`);
  }

  const rep = colony.representative_id
    ? db.representatives.find((r) => r.id === colony.representative_id) || null
    : null;

  const activeModifiers = db.modifiers.filter((m) => m.colony_id === colonyId && m.is_active);
  const infrastructure = db.infrastructure.filter((i) => i.colony_id === colonyId);
  const supportUpgrades = db.support_upgrades.filter((s) => s.colony_id === colonyId && s.status === 'working');

  // 1. Calculate Size
  const size = Math.max(1, colony.base_size);
  const basePF = SIZE_TO_PF[size] || size * 2;

  // 2. Tally Modifiers by Stat
  const statMods: Record<string, number> = {
    complacency: 0,
    order: 0,
    productivity: 0,
    piety: 0,
    profit_factor: 0,
  };

  const allComputedMods: Array<{
    id: number;
    name: string;
    stat: string;
    value: number;
    category: string;
    source: string;
  }> = [];

  // A. Type Permanent Specialties
  if (colony.colony_type === 'mining_and_industry') {
    statMods.productivity += 2;
    allComputedMods.push({
      id: 9001,
      name: 'Industrial Powerhouse (Mining Specialty)',
      stat: 'productivity',
      value: 2,
      category: 'permanent',
      source: 'Colony Type',
    });
  } else if (colony.colony_type === 'research_mission') {
    statMods.productivity += 2;
    allComputedMods.push({
      id: 9002,
      name: 'Resource Experts (Research Specialty)',
      stat: 'productivity',
      value: 2,
      category: 'permanent',
      source: 'Colony Type',
    });
  } else if (colony.colony_type === 'ecclesiastical') {
    const targetStat = colony.cultural_improvement_stat || 'piety';
    statMods[targetStat] = (statMods[targetStat] || 0) + 1;
    allComputedMods.push({
      id: 9003,
      name: `Shield of Faith Free Cultural (${targetStat.toUpperCase()})`,
      stat: targetStat,
      value: 1,
      category: 'permanent',
      source: 'Colony Type',
    });
  }

  // B. Hard Infrastructure Effects
  infrastructure.forEach((infra) => {
    if (infra.state === 'working') {
      if (infra.infrastructure_type === 'transport') {
        statMods.productivity += 1;
        allComputedMods.push({
          id: 8000 + infra.id,
          name: 'Transport Infrastructure (Working)',
          stat: 'productivity',
          value: 1,
          category: 'permanent',
          source: 'Infrastructure',
        });
      } else if (infra.infrastructure_type === 'power') {
        statMods.productivity += 1;
        allComputedMods.push({
          id: 8000 + infra.id,
          name: 'Power Grid (Working)',
          stat: 'productivity',
          value: 1,
          category: 'permanent',
          source: 'Infrastructure',
        });
      } else if (infra.infrastructure_type === 'food_production') {
        statMods.complacency += 1;
        allComputedMods.push({
          id: 8000 + infra.id,
          name: 'Agrarium Food Production (Working)',
          stat: 'complacency',
          value: 1,
          category: 'permanent',
          source: 'Infrastructure',
        });
      } else if (infra.infrastructure_type === 'communications') {
        statMods.order += 1;
        allComputedMods.push({
          id: 8000 + infra.id,
          name: 'Vox Communications Array (Working)',
          stat: 'order',
          value: 1,
          category: 'permanent',
          source: 'Infrastructure',
        });
      }
    } else if (infra.state === 'not_working' || infra.state === 'needed') {
      statMods.complacency -= 1;
      allComputedMods.push({
        id: 8500 + infra.id,
        name: `${infra.infrastructure_type.replace('_', ' ')} (${infra.state.toUpperCase()})`,
        stat: 'complacency',
        value: -1,
        category: 'conditional',
        source: 'Infrastructure Deficit',
      });
    }
  });

  // C. Support Upgrades
  supportUpgrades.forEach((upg) => {
    switch (upg.upgrade_type) {
      case 'arbites_precinct':
        statMods.order += 2;
        allComputedMods.push({
          id: 7000 + upg.id,
          name: 'Arbites Precinct Garrison',
          stat: 'order',
          value: 2,
          category: 'permanent',
          source: 'Support Upgrade',
        });
        break;
      case 'ecclesiarchy_mission':
        statMods.piety += 2;
        allComputedMods.push({
          id: 7000 + upg.id,
          name: 'Ecclesiarchy Mission Cathedral',
          stat: 'piety',
          value: 2,
          category: 'permanent',
          source: 'Support Upgrade',
        });
        break;
      case 'mechanicum_station':
        if (colony.colony_type === 'mining_and_industry' || colony.colony_type === 'research_mission') {
          statMods.productivity += 2;
          allComputedMods.push({
            id: 7000 + upg.id,
            name: 'Mechanicum Station (Forgework Synergy)',
            stat: 'productivity',
            value: 2,
            category: 'permanent',
            source: 'Support Upgrade',
          });
        } else {
          statMods.productivity += 1;
          allComputedMods.push({
            id: 7000 + upg.id,
            name: 'Mechanicum Station Standard',
            stat: 'productivity',
            value: 1,
            category: 'permanent',
            source: 'Support Upgrade',
          });
        }
        break;
      case 'infantry_garrison':
        statMods.order += 1;
        allComputedMods.push({
          id: 7000 + upg.id,
          name: 'Imperial Guard Infantry Garrison',
          stat: 'order',
          value: 1,
          category: 'permanent',
          source: 'Support Upgrade',
        });
        break;
      case 'cultural_improvement':
        if (upg.custom_stat_choice) {
          const chosen = upg.custom_stat_choice.toLowerCase();
          statMods[chosen] = (statMods[chosen] || 0) + 1;
          allComputedMods.push({
            id: 7000 + upg.id,
            name: `Cultural Improvement (${chosen.toUpperCase()})`,
            stat: chosen,
            value: 1,
            category: 'permanent',
            source: 'Support Upgrade',
          });
        }
        break;
      case 'industrial_facility':
        statMods.productivity += 2;
        allComputedMods.push({
          id: 7000 + upg.id,
          name: 'Heavy Industrial Facility',
          stat: 'productivity',
          value: 2,
          category: 'permanent',
          source: 'Support Upgrade',
        });
        break;
    }
  });

  // D. Custom Database Modifiers
  activeModifiers.forEach((m) => {
    const s = m.modifier_stat.toLowerCase();
    statMods[s] = (statMods[s] || 0) + m.modifier_value;
    allComputedMods.push({
      id: m.id,
      name: m.modifier_description,
      stat: m.modifier_stat,
      value: m.modifier_value,
      category: m.modifier_category,
      source: m.modifier_source_type,
    });
  });

  // 3. Compute Current Stat Values
  const curComplacency = Math.max(0, colony.base_complacency + statMods.complacency);
  const curOrder = Math.max(0, colony.base_order + statMods.order);
  const curProductivity = Math.max(0, colony.base_productivity + statMods.productivity);
  const curPiety = Math.max(0, colony.base_piety + statMods.piety);

  // 4. Resolve Lore States
  const compLore: 'stable' | 'placated' | 'riots_and_unrest' =
    curComplacency === 0 ? 'riots_and_unrest' : curComplacency > size ? 'placated' : 'stable';
  const orderLore: 'stable' | 'orderly' | 'anarchy' =
    curOrder === 0 ? 'anarchy' : curOrder > size ? 'orderly' : 'stable';
  const prodLore: 'stable' | 'productive' | 'halted' =
    curProductivity === 0 ? 'halted' : curProductivity > size ? 'productive' : 'stable';
  const pietyLore: 'stable' | 'pious' | 'heretical' =
    curPiety === 0 ? 'heretical' : curPiety > size ? 'pious' : 'stable';

  // 5. Representative Leadership Bonus
  let leadershipBonus = 0;
  if (rep) {
    try {
      const stats = JSON.parse(rep.stats);
      const fel = stats.fel || 30;
      leadershipBonus = Math.max(0, Math.floor((fel - 30) / 10));
    } catch {
      leadershipBonus = 1;
    }
  }

  // 6. Profit Factor Calculations
  const stateBonuses = {
    placated: compLore === 'placated' ? 1 : 0,
    productive: prodLore === 'productive' ? 2 : 0,
    orderly: orderLore === 'orderly' ? 2 : 0,
  };

  let rawPF =
    basePF +
    stateBonuses.placated +
    stateBonuses.productive +
    stateBonuses.orderly +
    leadershipBonus +
    (statMods.profit_factor || 0);

  // Severe Imperial State Modifiers
  if (curOrder === 0) {
    rawPF = 0; // Anarchy destroys all profit flow
  } else if (curProductivity === 0) {
    rawPF = Math.floor(rawPF / 2); // Halted halves total colony revenue
  }

  const finalPF = Math.max(0, rawPF);

  return {
    size: {
      base: colony.base_size,
      current: size,
      lore_state: 'stable',
      lore_name: SIZE_LORE_NAMES[size] || 'Imperial Colony',
    },
    complacency: {
      base: colony.base_complacency,
      current: curComplacency,
      lore_state: compLore,
      is_crisis: curComplacency === 0,
    },
    order: {
      base: colony.base_order,
      current: curOrder,
      lore_state: orderLore,
      is_crisis: curOrder === 0,
    },
    productivity: {
      base: colony.base_productivity,
      current: curProductivity,
      lore_state: prodLore,
      is_crisis: curProductivity === 0,
    },
    piety: {
      base: colony.base_piety,
      current: curPiety,
      lore_state: pietyLore,
      is_crisis: curPiety === 0,
    },
    profit_factor: {
      base: basePF,
      total: finalPF,
      leadership_bonus: leadershipBonus,
      state_bonuses: stateBonuses,
      breakdown: [
        { name: `Base Size PF (Size ${size})`, value: basePF },
        ...(stateBonuses.placated > 0 ? [{ name: 'Placated Populace Bonus', value: stateBonuses.placated }] : []),
        ...(stateBonuses.productive > 0 ? [{ name: 'High Productivity Bonus', value: stateBonuses.productive }] : []),
        ...(stateBonuses.orderly > 0 ? [{ name: 'Iron Order Bonus', value: stateBonuses.orderly }] : []),
        ...(leadershipBonus > 0 ? [{ name: 'Representative Fellowship Bonus', value: leadershipBonus }] : []),
        ...(statMods.profit_factor !== 0 ? [{ name: 'Custom PF Modifiers', value: statMods.profit_factor }] : []),
      ],
    },
    modifiers: allComputedMods,
  };
}
