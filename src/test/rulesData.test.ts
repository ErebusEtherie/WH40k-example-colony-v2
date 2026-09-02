import { describe, it, expect } from "vitest";
import {
  COLONY_TYPES,
  SIZE_TO_PROFIT_FACTOR,
  REPRESENTATIVE_TYPES,
  PERSONALITIES,
  SUPPORT_UPGRADE_TYPES,
  LEADERSHIP_MODIFIERS,
} from "../data/rulesData";

describe("Koronus Expanse Rulebook Configuration Integrity", () => {
  it("contains all canonical colony archetypes with valid stat schemas", () => {
    expect(COLONY_TYPES.length).toBeGreaterThanOrEqual(4);

    const miningType = COLONY_TYPES.find((c) => c.name === "mining_and_industry");
    expect(miningType).toBeDefined();
    expect(miningType?.base_stats.productivity).toBeGreaterThanOrEqual(1);
    expect(miningType?.base_stats.size).toBe(1);

    // Ensure all types define required 5 core stats
    COLONY_TYPES.forEach((colonyType) => {
      expect(colonyType.name).toBeTruthy();
      expect(colonyType.display_name).toBeTruthy();
      expect(colonyType.base_stats).toBeDefined();
      expect(typeof colonyType.base_stats.size).toBe("number");
      expect(typeof colonyType.base_stats.complacency).toBe("number");
      expect(typeof colonyType.base_stats.order).toBe("number");
      expect(typeof colonyType.base_stats.productivity).toBe("number");
      expect(typeof colonyType.base_stats.piety).toBe("number");
    });
  });

  it("enforces valid Size to Profit Factor scaling", () => {
    expect(SIZE_TO_PROFIT_FACTOR.length).toBe(11); // size 0 through 10

    // Check size 0 is 0 PF ("Ghost Town")
    expect(SIZE_TO_PROFIT_FACTOR[0].size).toBe(0);
    expect(SIZE_TO_PROFIT_FACTOR[0].pf).toBe(0);

    // Check size 10 is 18 PF ("Hive")
    expect(SIZE_TO_PROFIT_FACTOR[10].size).toBe(10);
    expect(SIZE_TO_PROFIT_FACTOR[10].pf).toBe(18);

    // Ensure strictly non-decreasing profit factor as size increases
    for (let i = 1; i < SIZE_TO_PROFIT_FACTOR.length; i++) {
      expect(SIZE_TO_PROFIT_FACTOR[i].size).toBe(i);
      expect(SIZE_TO_PROFIT_FACTOR[i].pf).toBeGreaterThanOrEqual(
        SIZE_TO_PROFIT_FACTOR[i - 1].pf
      );
    }
  });

  it("validates representative types and loss mitigation stats", () => {
    const expectedTypes = [
      "satrap",
      "judge",
      "cardinal",
      "colonist_representative",
      "military_commander",
      "dynasty_member",
    ];

    expectedTypes.forEach((name) => {
      const rep = REPRESENTATIVE_TYPES.find((r) => r.name === name);
      expect(rep).toBeDefined();
      expect(rep?.display_name).toBeTruthy();
      expect(rep?.special_rule).toBeTruthy();
    });

    // Check judge mitigates order, cardinal mitigates piety
    const judge = REPRESENTATIVE_TYPES.find((r) => r.name === "judge");
    expect(judge?.loss_mitigation_stat).toBe("order");

    const cardinal = REPRESENTATIVE_TYPES.find((r) => r.name === "cardinal");
    expect(cardinal?.loss_mitigation_stat).toBe("piety");
  });

  it("validates representative personality modifiers", () => {
    expect(PERSONALITIES.length).toBeGreaterThanOrEqual(10);

    PERSONALITIES.forEach((personality) => {
      expect(personality.name).toBeTruthy();
      expect(personality.display_name).toBeTruthy();
      expect(personality.description).toBeTruthy();
      expect(Array.isArray(personality.stat_effects)).toBe(true);
    });

    const beloved = PERSONALITIES.find((p) => p.name === "beloved");
    expect(beloved?.stat_effects[0]).toEqual({ stat: "complacency", value: 1 });
  });

  it("validates support upgrades list", () => {
    expect(SUPPORT_UPGRADE_TYPES.length).toBeGreaterThan(0);
    SUPPORT_UPGRADE_TYPES.forEach((upgrade) => {
      expect(upgrade.name).toBeTruthy();
      expect(upgrade.display_name).toBeTruthy();
      expect(upgrade.stat_effects).toBeDefined();
    });
  });

  it("verifies leadership modifiers table", () => {
    expect(LEADERSHIP_MODIFIERS[2]).toBe(-2);
    expect(LEADERSHIP_MODIFIERS[4]).toBe(0);
    expect(LEADERSHIP_MODIFIERS[6]).toBe(2);
  });
});
