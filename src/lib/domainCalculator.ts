/**
 * Domain-level colony state calculator
 * 
 * This module implements the core game logic for calculating colony stats
 * based on infrastructure, upgrades, representatives, modifiers, and resources.
 * 
 * Per 02-domain-modeling.md: Rule tables should be data, not code.
 * This is a stub implementation - full logic to be implemented based on
 * config/rule_tables.yaml
 */

import type {
  Colony,
  Infrastructure,
  SupportUpgrade,
  Representative,
  Modifier,
  ColonyResource,
  ColonyStatsBreakdown,
  StatBreakdown,
} from "../types/colony";

const createStatBreakdown = (
  base: number,
  modifiers: number = 0,
  isLocked: boolean = false,
  lockReason?: string
): StatBreakdown => {
  const final = isLocked ? 0 : base + modifiers;
  return {
    base,
    modifiersTotal: modifiers,
    final,
    isLocked,
    lockReason,
    contributions: [
      { source: "Base", sourceType: "base", value: base },
      ...(modifiers !== 0 ? [{ source: "Modifiers", value: modifiers }] : []),
    ],
  };
};

/**
 * Calculate colony state breakdown
 * 
 * @param colony - Base colony data
 * @param infrastructures - Active infrastructure
 * @param upgrades - Active support upgrades
 * @param representative - Assigned representative (if any)
 * @param modifiers - Active modifiers
 * @param resources - Colony resources
 * @returns Complete stat breakdown with states
 */
export const calculateColonyState = (
  colony: Colony,
  infrastructures: Infrastructure[],
  upgrades: SupportUpgrade[],
  representative: Representative | null,
  modifiers: Modifier[],
  resources: ColonyResource[]
): ColonyStatsBreakdown => {
  // STUB IMPLEMENTATION
  // TODO: Implement full rule engine per config/rule_tables.yaml
  
  const size = colony.base_size ?? 0;
  const complacency = colony.base_complacency ?? 0;
  const order = colony.base_order ?? 0;
  const productivity = colony.base_productivity ?? 0;
  const piety = colony.base_piety ?? 0;
  
  // Calculate Profit Factor from size (stub formula)
  const basePF = Math.floor(size / 5) + 3;
  
  // Determine states based on thresholds
  const isPlacated = complacency > size;
  const hasAnarchy = order === 0;
  const isHalted = productivity === 0;
  const isProductive = productivity >= 10 && !isHalted;
  const isOrderly = order >= 10 && !hasAnarchy;
  const isPious = piety >= 10;
  
  // Apply penalty multiplier for PF
  let penaltyMultiplier = 1;
  if (hasAnarchy) {
    penaltyMultiplier = 0;
  } else if (isHalted) {
    penaltyMultiplier = 0.5;
  }
  
  const finalPF = Math.floor(basePF * penaltyMultiplier);
  
  return {
    size: createStatBreakdown(size),
    complacency: createStatBreakdown(complacency),
    order: createStatBreakdown(order, 0, hasAnarchy, "Anarchy - Order locked at 0"),
    productivity: createStatBreakdown(productivity, 0, isHalted, "Halted - Productivity locked at 0"),
    piety: createStatBreakdown(piety),
    profitFactor: {
      baseFromSize: basePF,
      placatedBonus: isPlacated ? 1 : 0,
      productiveBonus: isProductive ? 1 : 0,
      orderlyBonus: isOrderly ? 1 : 0,
      leadershipModifier: representative?.stat_bonus ?? 0,
      modifiersTotal: 0,
      penaltyMultiplier,
      final: finalPF,
      contributions: [],
    },
    states: {
      isPlacated,
      isProductive,
      isOrderly,
      isPious,
      hasAnarchy,
      isHalted,
      hasRiots: order < 3 && !hasAnarchy,
      isHeretical: piety < 3,
    },
  };
};