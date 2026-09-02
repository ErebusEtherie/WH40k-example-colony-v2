import { describe, it, expect } from "vitest";
import { calculateColonyState } from "../lib/domainCalculator";
import {
  Colony,
  Infrastructure,
  SupportUpgrade,
  Representative,
  Modifier,
  ColonyResource,
} from "../types/colony";

describe("Domain Calculator — Colony State & Rules Engine", () => {
  const baseColony: Colony = {
    id: "test-colony-1",
    name: "Aurelia Prime",
    colony_type: "mining_and_industry",
    founded_date: "41st Millennium",
    founding_age_days: 120,
    base_size: 3,
    base_complacency: 2,
    base_order: 2,
    base_productivity: 2,
    base_piety: 1,
    current_size: 3,
    current_complacency: 2,
    current_order: 2,
    current_productivity: 2,
    current_piety: 1,
    current_profit_factor: 3,
  };

  it("calculates baseline colony stats correctly without external influences", () => {
    const breakdown = calculateColonyState(baseColony, [], [], null, [], []);

    expect(breakdown.size.base).toBe(3);
    expect(breakdown.size.final).toBe(3);
    expect(breakdown.size.modifiersTotal).toBe(0);

    expect(breakdown.complacency.final).toBe(2);
    expect(breakdown.order.final).toBe(2);
    expect(breakdown.productivity.final).toBe(2);
    expect(breakdown.piety.final).toBe(1);

    // State conditions: none should be placated/orderly/productive since they equal 2 <= size(3)
    expect(breakdown.states.isPlacated).toBe(false);
    expect(breakdown.states.isOrderly).toBe(false);
    expect(breakdown.states.isProductive).toBe(false);
    expect(breakdown.states.isPious).toBe(false);

    // No crisis states
    expect(breakdown.states.hasRiots).toBe(false);
    expect(breakdown.states.hasAnarchy).toBe(false);
    expect(breakdown.states.isHalted).toBe(false);
    expect(breakdown.states.isHeretical).toBe(false);

    // Profit factor = base size = 3
    expect(breakdown.profitFactor.final).toBe(3);
  });

  it("clamps size between 0 and 10", () => {
    const smallColony: Colony = { ...baseColony, base_size: -5 };
    const hugeColony: Colony = { ...baseColony, base_size: 15 };

    const smallResult = calculateColonyState(smallColony, [], [], null, [], []);
    const hugeResult = calculateColonyState(hugeColony, [], [], null, [], []);

    expect(smallResult.size.final).toBe(0);
    expect(hugeResult.size.final).toBe(10);
  });

  it("applies active custom modifiers and ignores inactive modifiers", () => {
    const modifiers: Modifier[] = [
      {
        id: "mod-1",
        colony_id: baseColony.id,
        name: "Miners Guild Accord",
        modifier_stat: "productivity",
        modifier_value: 3,
        is_active: true,
        source: "Decree",
        description: "+3 Productivity",
      },
      {
        id: "mod-2",
        colony_id: baseColony.id,
        name: "Old Imperial Levy",
        modifier_stat: "order",
        modifier_value: -2,
        is_active: false, // Inactive
        source: "Tithe",
        description: "-2 Order",
      },
    ];

    const result = calculateColonyState(baseColony, [], [], null, modifiers, []);

    // Productivity: 2 base + 3 active = 5
    expect(result.productivity.final).toBe(5);
    expect(result.productivity.modifiersTotal).toBe(3);
    // Order should remain 2 because mod-2 is inactive
    expect(result.order.final).toBe(2);
    expect(result.order.modifiersTotal).toBe(0);
  });

  it("applies active infrastructure effects only when state is 'working'", () => {
    const infrastructures: Infrastructure[] = [
      {
        id: "infra-1",
        colony_id: baseColony.id,
        name: "Macro-Foundry",
        category: "Industrial",
        state: "working",
        active_effects: [{ stat: "productivity", value: 2 }],
      },
      {
        id: "infra-2",
        colony_id: baseColony.id,
        name: "Enforcer Citadel",
        category: "Military",
        state: "damaged", // Damaged, not working
        active_effects: [{ stat: "order", value: 3 }],
      },
    ];

    const result = calculateColonyState(baseColony, infrastructures, [], null, [], []);

    // Macro-Foundry adds 2 to productivity
    expect(result.productivity.final).toBe(4);
    // Enforcer Citadel does not add to order because damaged
    expect(result.order.final).toBe(2);
  });

  it("applies support upgrades when in working state", () => {
    const upgrades: SupportUpgrade[] = [
      {
        id: "upg-1",
        colony_id: baseColony.id,
        upgrade_type: "vox_relay",
        name: "Vox Relay Grid",
        state: "working",
        chosen_stat: "complacency",
      },
      {
        id: "upg-2",
        colony_id: baseColony.id,
        upgrade_type: "garrison",
        name: "Auxiliary Barracks",
        state: "offline",
        chosen_stat: "order",
      },
    ];

    const result = calculateColonyState(baseColony, [], upgrades, null, [], []);

    // Complacency: base 2 + 1 upgrade = 3
    expect(result.complacency.final).toBe(3);
    // Order: base 2 + 0 = 2
    expect(result.order.final).toBe(2);
  });

  it("applies representative personality traits", () => {
    const rep: Representative = {
      id: "rep-1",
      name: "Commissar Holt",
      title: "Lord Enforcer",
      representative_type: "judge",
      personality_traits: [
        { name: "Stern Discipline", stat_tag: "order" },
        { name: "Rigid Doctrine", stat_tag: "piety" },
      ],
      characteristics: {
        weapon_skill: 40,
        ballistic_skill: 40,
        strength: 35,
        toughness: 40,
        agility: 30,
        intelligence: 35,
        perception: 35,
        willpower: 45,
        fellowship: 30,
      },
      skills: ["Awareness", "Command"],
      talents: ["Iron Discipline"],
    };

    const result = calculateColonyState(baseColony, [], [], rep, [], []);

    // Order: 2 + 1 trait = 3
    expect(result.order.final).toBe(3);
    // Piety: 1 + 1 trait = 2
    expect(result.piety.final).toBe(2);
  });

  it("identifies positive condition thresholds (Placated, Orderly, Productive, Pious)", () => {
    // Colony size 2, stats elevated above size (3 > 2)
    const flourishingColony: Colony = {
      ...baseColony,
      base_size: 2,
      base_complacency: 4,
      base_order: 3,
      base_productivity: 5,
      base_piety: 3,
    };

    const result = calculateColonyState(flourishingColony, [], [], null, [], []);

    expect(result.states.isPlacated).toBe(true);
    expect(result.states.isOrderly).toBe(true);
    expect(result.states.isProductive).toBe(true);
    expect(result.states.isPious).toBe(true);

    // Profit Factor calculation:
    // Base from size = 2
    // Placated bonus = +1
    // Orderly bonus = +2
    // Productive bonus = +2
    // Total = 2 + 1 + 2 + 2 = 7
    expect(result.profitFactor.placatedBonus).toBe(1);
    expect(result.profitFactor.orderlyBonus).toBe(2);
    expect(result.profitFactor.productiveBonus).toBe(2);
    expect(result.profitFactor.final).toBe(7);
  });

  it("calculates resource deposits bonuses to Profit Factor", () => {
    const resources: ColonyResource[] = [
      {
        id: "res-1",
        colony_id: baseColony.id,
        resource_type: "adamantium",
        name: "Adamantium Seams",
        abundance: "Rich", // +2 PF
      },
      {
        id: "res-2",
        colony_id: baseColony.id,
        resource_type: "promethium",
        name: "Promethium Geysers",
        abundance: "Plentiful", // +1 PF
      },
      {
        id: "res-3",
        colony_id: baseColony.id,
        resource_type: "xenos_flora",
        name: "Sparse Flora",
        abundance: "Scarce", // 0 PF
      },
    ];

    const result = calculateColonyState(baseColony, [], [], null, [], resources);

    // Base size 3 + Rich (2) + Plentiful (1) = 6
    expect(result.profitFactor.modifiersTotal).toBe(3);
    expect(result.profitFactor.final).toBe(6);
  });

  it("triggers Anarchy crisis and zeros out Profit Factor when Order < 0", () => {
    const anarchyColony: Colony = {
      ...baseColony,
      base_size: 4,
      base_order: 1,
    };

    const severePenalty: Modifier = {
      id: "riot-mod",
      colony_id: baseColony.id,
      name: "Sedition Spread",
      modifier_stat: "order",
      modifier_value: -3, // Order becomes 1 - 3 = -2 < 0
      is_active: true,
      source: "Cult Uprising",
    };

    const result = calculateColonyState(anarchyColony, [], [], null, [severePenalty], []);

    expect(result.order.final).toBe(-2);
    expect(result.states.hasAnarchy).toBe(true);
    expect(result.profitFactor.penaltyMultiplier).toBe(0);
    expect(result.profitFactor.final).toBe(0);
  });

  it("triggers Halted crisis and halves Profit Factor (floor) when Productivity < 0", () => {
    const haltedColony: Colony = {
      ...baseColony,
      base_size: 5,
      base_productivity: 0,
    };

    const strikeModifier: Modifier = {
      id: "strike-mod",
      colony_id: baseColony.id,
      name: "Labor Mutiny",
      modifier_stat: "productivity",
      modifier_value: -2, // Productivity becomes -2 < 0
      is_active: true,
      source: "Mutiny",
    };

    const result = calculateColonyState(haltedColony, [], [], null, [strikeModifier], []);

    expect(result.productivity.final).toBe(-2);
    expect(result.states.isHalted).toBe(true);
    expect(result.profitFactor.penaltyMultiplier).toBe(0.5);
    // Base size 5 * 0.5 = 2.5 => floor 2
    expect(result.profitFactor.final).toBe(2);
  });

  it("triggers Riots when Complacency < 0 and Heresy when Piety < 0", () => {
    const troubledColony: Colony = {
      ...baseColony,
      base_complacency: -1,
      base_piety: -3,
    };

    const result = calculateColonyState(troubledColony, [], [], null, [], []);

    expect(result.states.hasRiots).toBe(true);
    expect(result.states.isHeretical).toBe(true);
  });
});
