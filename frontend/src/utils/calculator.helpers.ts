import { ModifierItem, StatName } from '../types';
// eslint-disable-next-line no-unused-vars -- Used by exported helper functions
import { COLONY_TYPES, HARD_INFRASTRUCTURE_RULES, SUPPORT_UPGRADE_RULES } from '../data/rulesReference';

/**
 * Get modifiers for a specific personality
 */
// eslint-disable-next-line no-unused-vars -- Exported for use in calculator.ts
export function getPersonalityModifiers(
  personalityKey: string,
  personality: { chosenStat?: StatName; madOrderRoll?: number },
  index: number,
  representativeName: string
): ModifierItem[] {
  const mods: ModifierItem[] = [];
  const idPrefix = 'rep_pers_' + index;
  const source = 'Representative: ' + representativeName;

  switch (personalityKey) {
    case 'beloved':
      mods.push({ id: idPrefix, name: 'Beloved', stat: 'complacency', value: 1, source, category: 'permanent' });
      break;
    case 'military_minded':
      mods.push({ id: idPrefix, name: 'Military-Minded', stat: 'order', value: 1, source, category: 'permanent' });
      break;
    case 'corrupt':
      mods.push(
        { id: idPrefix + '_1', name: 'Corrupt', stat: 'productivity', value: 2, source, category: 'permanent' },
        { id: idPrefix + '_2', name: 'Corrupt (Penalty)', stat: 'order', value: -1, source, category: 'permanent' }
      );
      break;
    case 'idle':
      mods.push(
        { id: idPrefix + '_1', name: 'Idle', stat: 'complacency', value: 2, source, category: 'permanent' },
        { id: idPrefix + '_2', name: 'Idle (Penalty)', stat: 'productivity', value: -1, source, category: 'permanent' }
      );
      break;
    case 'ambitious':
      mods.push(
        { id: idPrefix + '_1', name: 'Ambitious', stat: 'productivity', value: 2, source, category: 'permanent' },
        { id: idPrefix + '_2', name: 'Ambitious (Penalty)', stat: 'complacency', value: -1, source, category: 'permanent' }
      );
      break;
    case 'zealous':
      mods.push({ id: idPrefix, name: 'Zealous', stat: 'piety', value: 1, source, category: 'permanent' });
      break;
    case 'patron_of_the_arts':
      mods.push(
        { id: idPrefix + '_1', name: 'Patron of the Arts', stat: 'complacency', value: 2, source, category: 'permanent' },
        { id: idPrefix + '_2', name: 'Patron of the Arts (Penalty)', stat: 'piety', value: -1, source, category: 'permanent' }
      );
      break;
    case 'unlucky':
      mods.push({ id: idPrefix, name: 'Unlucky (Calamitous +4)', stat: 'piety', value: 2, source, category: 'permanent' });
      break;
    case 'ties_with':
      if (personality.chosenStat) {
        mods.push({
          id: idPrefix,
          name: 'Ties With... (' + personality.chosenStat.toUpperCase() + ')',
          stat: personality.chosenStat,
          value: 1,
          source: source + ' (GM Choice)',
          category: 'permanent',
        });
      }
      break;
    case 'cruel':
      mods.push(
        { id: idPrefix + '_1', name: 'Cruel', stat: 'productivity', value: 2, source, category: 'permanent' },
        { id: idPrefix + '_2', name: 'Cruel (Penalty)', stat: 'complacency', value: -1, source, category: 'permanent' }
      );
      break;
    case 'spymaster':
      mods.push(
        { id: idPrefix + '_1', name: 'Spymaster', stat: 'order', value: 2, source, category: 'permanent' },
        { id: idPrefix + '_2', name: 'Spymaster (Penalty)', stat: 'complacency', value: -1, source, category: 'permanent' }
      );
      break;
    case 'generalissimo':
      mods.push(
        { id: idPrefix + '_1', name: 'Generalissimo', stat: 'order', value: 2, source, category: 'permanent' },
        { id: idPrefix + '_2', name: 'Generalissimo (Penalty)', stat: 'piety', value: -1, source, category: 'permanent' }
      );
      break;
    case 'paranoid':
      mods.push(
        { id: idPrefix + '_1', name: 'Paranoid', stat: 'order', value: 2, source, category: 'permanent' },
        { id: idPrefix + '_2', name: 'Paranoid (Penalty)', stat: 'productivity', value: -1, source, category: 'permanent' }
      );
      break;
    case 'mad': {
      const rollVal = personality.madOrderRoll || 3;
      mods.push(
        { id: idPrefix + '_1', name: 'Mad', stat: 'complacency', value: 1, source, category: 'permanent' },
        { id: idPrefix + '_2', name: 'Mad', stat: 'piety', value: 1, source, category: 'permanent' },
        { id: idPrefix + '_3', name: 'Mad', stat: 'productivity', value: 1, source, category: 'permanent' },
        { id: idPrefix + '_4', name: 'Mad (Order penalty from 1d5 physical roll: -' + rollVal + ')', stat: 'order', value: -rollVal, source: source + ' (GM Roll)', category: 'permanent' }
      );
      break;
    }
    case 'charitable':
      mods.push(
        { id: idPrefix + '_1', name: 'Charitable', stat: 'complacency', value: 1, source, category: 'permanent' },
        { id: idPrefix + '_2', name: 'Charitable', stat: 'piety', value: 1, source, category: 'permanent' },
        { id: idPrefix + '_3', name: 'Charitable (Penalty)', stat: 'productivity', value: -1, source, category: 'permanent' }
      );
      break;
    case 'vainglorious':
      mods.push(
        { id: idPrefix + '_1', name: 'Vainglorious', stat: 'productivity', value: 2, source, category: 'permanent' },
        { id: idPrefix + '_2', name: 'Vainglorious (Penalty)', stat: 'piety', value: -1, source, category: 'permanent' }
      );
      break;
    case 'scholarly':
      if (personality.chosenStat) {
        mods.push({
          id: idPrefix,
          name: 'Scholarly (Lowest stat bonus: ' + personality.chosenStat.toUpperCase() + ')',
          stat: personality.chosenStat,
          value: 1,
          source: source + ' (GM Assignment)',
          category: 'permanent',
        });
      }
      break;
    case 'avaricious':
      mods.push({ id: idPrefix, name: 'Avaricious', stat: 'productivity', value: 1, source, category: 'permanent' });
      break;
  }

  return mods;
}

/**
 * Get dynasty nepotism modifiers
 */
// eslint-disable-next-line no-unused-vars -- Exported for use in calculator.ts
export function getDynastyModifiers(dynastyOutcomeKey: string, representative: { name: string; personalities?: Array<{ chosenStat?: StatName }> }): ModifierItem[] {
  const source = 'Dynasty Nepotism: ' + representative.name;
  
  if (dynastyOutcomeKey === 'potential') {
    const chosen = representative.personalities?.[0]?.chosenStat || 'complacency';
    return [{
      id: 'rep_dynasty',
      name: 'That One Has Potential! (+1 ' + chosen.toUpperCase() + ')',
      stat: chosen,
      value: 1,
      source,
      category: 'permanent',
    }];
  } else if (dynastyOutcomeKey === 'eye_on') {
    return [{
      id: 'rep_dynasty',
      name: 'One To Keep An Eye On (+1 Productivity)',
      stat: 'productivity',
      value: 1,
      source,
      category: 'permanent',
    }];
  } else if (dynastyOutcomeKey === 'heroics') {
    return [{
      id: 'rep_dynasty',
      name: 'One For The Heroics (+1 Order)',
      stat: 'order',
      value: 1,
      source,
      category: 'permanent',
    }];
  } else if (dynastyOutcomeKey === 'spare') {
    return [{
      id: 'rep_dynasty',
      name: 'The Spare (+1 Complacency)',
      stat: 'complacency',
      value: 1,
      source,
      category: 'permanent',
    }];
  }

  return [];
}

/**
 * Get colony type permanent modifiers based on resources
 */
// eslint-disable-next-line no-unused-vars -- Exported for use in calculator.ts
export function getColonyTypeModifiers(colony: { colonyType: string; planetaryResources: Array<{ type: string; name: string }> }): ModifierItem[] {
  const mods: ModifierItem[] = [];

  if (colony.colonyType === 'mining_and_industry') {
    const hasMinerals = colony.planetaryResources.some(
      (r) => r.type.toLowerCase().includes('mineral') || r.name.toLowerCase().includes('ore') || r.name.toLowerCase().includes('metal')
    );
    if (hasMinerals) {
      mods.push({
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
      mods.push({
        id: 'spec_research_prod',
        name: 'Resource Experts (Rare Resource Exploitation)',
        stat: 'productivity',
        value: 2,
        source: 'Colony Specialty (Research Mission)',
        category: 'permanent',
      });
    }
  }

  if (colony.colonyType === 'ecclesiastical') {
    const colonyWithStat = colony as { colonyType: string; planetaryResources: Array<{ type: string; name: string }>; culturalImprovementStat?: string };
    if (colonyWithStat.culturalImprovementStat) {
/**
 * Get hard infrastructure modifiers
 */
// eslint-disable-next-line no-unused-vars -- Exported for use in calculator.ts
export function getInfrastructureModifiers(
  infra: { id: string; type: string; name?: string; status: 'working' | 'not_working' | 'needed' },
  rules: Record<string, { displayName: string; workingModifiers: Array<{ stat: string; value: number }>; notWorkingModifiers: Array<{ stat: string; value: number }> }>
): ModifierItem[] {
  const mods: ModifierItem[] = [];
  const rule = rules[infra.type];
  if (!rule) return mods;

  if (infra.status === 'working') {
    rule.workingModifiers.forEach((m, idx) => {
      mods.push({
        id: 'infra_' + infra.id + '_' + idx,
        name: (infra.name || rule.displayName) + ' (Working)',
        stat: m.stat,
        value: m.value,
        source: 'Hard Infrastructure: ' + rule.displayName,
        category: 'permanent',
      });
    });
  } else if (infra.status === 'not_working') {
    rule.notWorkingModifiers.forEach((m, idx) => {
      mods.push({
        id: 'infra_' + infra.id + '_' + idx,
        name: (infra.name || rule.displayName) + ' (Not Working)',
        stat: m.stat,
        value: m.value,
        source: 'Hard Infrastructure: ' + rule.displayName,
        category: 'permanent',
      });
    });
  } else if (infra.status === 'needed') {
    mods.push({
      id: 'infra_' + infra.id + '_needed',
      name: (infra.name || rule.displayName) + ' (Needed / Missing Penalty)',
      stat: 'complacency',
      value: -1,
      source: 'Hard Infrastructure: ' + rule.displayName,
      category: 'permanent',
    });
/**
 * Get support upgrade modifiers
 */
// eslint-disable-next-line no-unused-vars -- Exported for use in calculator.ts
export function getSupportUpgradeModifiers(
  upg: { id: string; type: string; name?: string; status: string; chosenStat?: string },
  colonyType: string,
  rules: Record<string, { displayName: string; statEffects: Array<{ stat: string; value: number }> }>
): ModifierItem[] {
  const mods: ModifierItem[] = [];
  const rule = rules[upg.type];
  if (!rule) return mods;

  if (upg.status === 'working') {
    if (upg.type === 'cultural_improvement' && upg.chosenStat) {
      mods.push({
        id: 'upg_' + upg.id,
        name: (upg.name || rule.displayName) + ' (+1 ' + upg.chosenStat.toUpperCase() + ')',
        stat: upg.chosenStat,
        value: 1,
        source: 'Support Upgrade: ' + rule.displayName,
        category: 'permanent',
      });
    } else if (upg.type === 'mechanicum_station') {
      let bonus = 1;
      if (colonyType === 'mining_and_industry') bonus = 2;
      if (colonyType === 'research_mission') bonus = 3;
      const colonyTypeNames: Record<string, string> = {
        mining_and_industry: 'Mining & Industry',
        research_mission: 'Research Mission',
        ecclesiastical: 'Ecclesiastical',
        frontier_world: 'Frontier World',
        feudal_world: 'Feudal World',
        death_world: 'Death World',
      };
      mods.push({
        id: 'upg_' + upg.id,
        name: (upg.name || rule.displayName) + ' (' + (colonyTypeNames[colonyType] || colonyType) + ' bonus)',
        stat: 'productivity',
        value: bonus,
        source: 'Support Upgrade: ' + rule.displayName,
        category: 'permanent',
      });
    } else {
      rule.statEffects.forEach((eff, idx) => {
        if (eff.stat !== 'custom_choice') {
          mods.push({
            id: 'upg_' + upg.id + '_' + idx,
            name: upg.name || rule.displayName,
            stat: eff.stat,
            value: eff.value,
            source: 'Support Upgrade: ' + rule.displayName,
            category: 'permanent',
          });
        }
      });
    }
  }

  return mods;
}
