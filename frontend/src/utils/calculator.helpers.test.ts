import { describe, it, expect } from 'vitest';
import { 
  getPersonalityModifiers, 
  getDynastyModifiers,
  getColonyTypeModifiers,
  getInfrastructureModifiers,
  getSupportUpgradeModifiers
} from './calculator.helpers';
import { HARD_INFRASTRUCTURE_RULES, SUPPORT_UPGRADE_RULES } from '../data/rulesReference';
import type { StatName } from '../types';

describe('getPersonalityModifiers', () => {
  it('should return beloved modifier', () => {
    const mods = getPersonalityModifiers('beloved', {}, 0, 'Test Rep');
    expect(mods).toHaveLength(1);
    expect(mods[0].stat).toBe('complacency');
    expect(mods[0].value).toBe(1);
  });

  it('should return military-minded modifier', () => {
    const mods = getPersonalityModifiers('military_minded', {}, 0, 'Test Rep');
    expect(mods).toHaveLength(1);
    expect(mods[0].stat).toBe('order');
    expect(mods[0].value).toBe(1);
  });

  it('should return corrupt modifiers (bonus and penalty)', () => {
    const mods = getPersonalityModifiers('corrupt', {}, 0, 'Test Rep');
    expect(mods).toHaveLength(2);
    expect(mods.find(m => m.stat === 'productivity')?.value).toBe(2);
    expect(mods.find(m => m.stat === 'order')?.value).toBe(-1);
  });

  it('should return mad modifiers with custom roll', () => {
    const mods = getPersonalityModifiers('mad', { madOrderRoll: 4 }, 0, 'Test Rep');
    expect(mods).toHaveLength(4);
    const orderMod = mods.find(m => m.stat === 'order');
    expect(orderMod?.value).toBe(-4);
  });

  it('should return ties_with modifier with chosen stat', () => {
    const mods = getPersonalityModifiers('ties_with', { chosenStat: 'productivity' }, 0, 'Test Rep');
    expect(mods).toHaveLength(1);
    expect(mods[0].stat).toBe('productivity');
    expect(mods[0].value).toBe(1);
  });

  it('should return empty array for unknown personality', () => {
    const mods = getPersonalityModifiers('unknown', {}, 0, 'Test Rep');
    expect(mods).toHaveLength(0);
  });
});

describe('getDynastyModifiers', () => {
  const rep = { name: 'Test Rep', personalities: [{ chosenStat: 'order' as StatName }] };

  it.each([
    { outcome: 'potential', expectedStat: 'order', expectedValue: 1 },
    { outcome: 'eye_on', expectedStat: 'productivity', expectedValue: undefined },
    { outcome: 'heroics', expectedStat: 'piety', expectedValue: undefined },
    { outcome: 'grox', expectedStat: 'order', expectedValue: undefined },
    { outcome: 'volcano', expectedStat: 'complacency', expectedValue: undefined },
  ])('should return $outcome modifier', ({ outcome, expectedStat, expectedValue }) => {
    const mods = getDynastyModifiers(outcome, rep);
    expect(mods).toHaveLength(1);
    expect(mods[0].stat).toBe(expectedStat);
    if (expectedValue !== undefined) {
      expect(mods[0].value).toBe(expectedValue);
    }
  });

  it('should return empty array for unknown outcome', () => {
    const mods = getDynastyModifiers('unknown', rep);
    expect(mods).toHaveLength(0);
  });
});

describe('getColonyTypeModifiers', () => {
  it('should return mining bonus for mining_and_industry with minerals', () => {
    const colony = {
      colonyType: 'mining_and_industry',
      planetaryResources: [{ type: 'mineral', name: 'Iron Ore' }]
    };
    const mods = getColonyTypeModifiers(colony);
    expect(mods).toHaveLength(1);
    expect(mods[0].stat).toBe('productivity');
    expect(mods[0].value).toBe(2);
  });

  it('should return research bonus for research_mission with rare resources', () => {
    const colony = {
      colonyType: 'research_mission',
      planetaryResources: [{ type: 'archeotech', name: 'STC Fragment' }]
    };
    const mods = getColonyTypeModifiers(colony);
    expect(mods).toHaveLength(1);
    expect(mods[0].stat).toBe('productivity');
    expect(mods[0].value).toBe(2);
  });

  it('should return no modifiers for mining without minerals', () => {
    const colony = {
      colonyType: 'mining_and_industry',
      planetaryResources: [{ type: 'organic', name: 'Exotic Plants' }]
    };
    const mods = getColonyTypeModifiers(colony);
    expect(mods).toHaveLength(0);
  });
});

describe('getInfrastructureModifiers', () => {
  it('should return working modifiers', () => {
    const infra = { id: '1', type: 'food_production', name: 'Agri-Dome 1', status: 'working' as const };
    const mods = getInfrastructureModifiers(infra, HARD_INFRASTRUCTURE_RULES);
    expect(mods.length).toBeGreaterThan(0);
    expect(mods[0].source).toContain('Hard Infrastructure');
  });

  it('should return not_working modifiers', () => {
    const infra = { id: '1', type: 'food_production', name: 'Agri-Dome 1', status: 'not_working' as const };
    const mods = getInfrastructureModifiers(infra, HARD_INFRASTRUCTURE_RULES);
    expect(mods.length).toBeGreaterThan(0);
    expect(mods[0].name).toContain('Not Working');
  });

  it('should return needed penalty', () => {
    const infra = { id: '1', type: 'food_production', name: 'Agri-Dome 1', status: 'needed' as const };
    const mods = getInfrastructureModifiers(infra, HARD_INFRASTRUCTURE_RULES);
    expect(mods).toHaveLength(1);
    expect(mods[0].stat).toBe('complacency');
    expect(mods[0].value).toBe(-1);
  });

  it('should return empty array for unknown type', () => {
    const infra = { id: '1', type: 'unknown', name: 'Unknown', status: 'working' as const };
    const mods = getInfrastructureModifiers(infra, HARD_INFRASTRUCTURE_RULES);
    expect(mods).toHaveLength(0);
  });
});

describe('getSupportUpgradeModifiers', () => {
  it('should return cultural improvement modifier', () => {
    const upg = { id: '1', type: 'cultural_improvement', name: 'Cultural', status: 'working', chosenStat: 'piety' as StatName };
    const mods = getSupportUpgradeModifiers(upg, 'frontier_world', SUPPORT_UPGRADE_RULES);
    expect(mods).toHaveLength(1);
    expect(mods[0].stat).toBe('piety');
    expect(mods[0].value).toBe(1);
  });

  it('should return mechanicum_station with colony type bonus', () => {
    const upg = { id: '1', type: 'mechanicum_station', name: 'Mech', status: 'working' };
    const mods = getSupportUpgradeModifiers(upg, 'research_mission', SUPPORT_UPGRADE_RULES);
    expect(mods).toHaveLength(1);
    expect(mods[0].stat).toBe('productivity');
    expect(mods[0].value).toBe(3);
  });

  it('should return empty array for not_working upgrade', () => {
    const upg = { id: '1', type: 'cultural_improvement', name: 'Cultural', status: 'not_working', chosenStat: 'piety' as StatName };
    const mods = getSupportUpgradeModifiers(upg, 'frontier_world', SUPPORT_UPGRADE_RULES);
    expect(mods).toHaveLength(0);
  });
});