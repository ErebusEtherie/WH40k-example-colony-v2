// Stub stat calculator module for initial Docker build
// TODO: This should call backend API for stat calculations per 07-frontend-architecture.md
// The frontend should NOT reimplement game logic - all colony math belongs to backend

import type {
  Colony,
  Representative,
  Infrastructure,
  SupportUpgrade,
  Modifier,
  ColonyStatsBreakdown,
  StatBreakdown,
} from "../types/colony";

const createStubStatBreakdown = (baseValue: number, sourceName: string): StatBreakdown => ({
  base: baseValue,
  modifiersTotal: 0,
  final: baseValue,
  isLocked: false,
  contributions: [
    {
      source: sourceName,
      sourceType: "base",
      value: baseValue,
      description: "Base value from colony charter",
    },
  ],
});

export const calculateColonyStats = (
  colony: Colony,
  representatives: Representative[],
  infrastructures: Infrastructure[],
  upgrades: SupportUpgrade[],
  modifiers: Modifier[]
): ColonyStatsBreakdown => {
  // STUB IMPLEMENTATION - returns base colony stats with minimal breakdown
  // Real implementation should call backend API endpoint /colonies/{id}/state
  
  const size = colony.base_size ?? 0;
  const complacency = colony.base_complacency ?? 0;
  const order = colony.base_order ?? 0;
  const productivity = colony.base_productivity ?? 0;
  const piety = colony.base_piety ?? 0;
  
  // Calculate basic Profit Factor from size (stub formula)
  const basePF = Math.floor(size / 5) + 3;
  
  return {
    size: createStubStatBreakdown(size, "Colony Size"),
    complacency: createStubStatBreakdown(complacency, "Complacency"),
    order: createStubStatBreakdown(order, "Order"),
    productivity: createStubStatBreakdown(productivity, "Productivity"),
    piety: createStubStatBreakdown(piety, "Piety"),
    profitFactor: {
      baseFromSize: basePF,
      placatedBonus: 0,
      productiveBonus: 0,
      orderlyBonus: 0,
      leadershipModifier: representatives.length > 0 ? representatives[0].stat_bonus : 0,
      modifiersTotal: 0,
      penaltyMultiplier: 1,
      final: basePF,
      contributions: [],
    },
    states: {
      isPlacated: complacency > size,
      isProductive: productivity >= 10,
      isOrderly: order >= 10,
      isPious: piety >= 10,
      hasAnarchy: order === 0,
      isHalted: productivity === 0,
      hasRiots: false,
      isHeretical: false,
    },
  };
};