import { http, HttpResponse } from "msw";
import type { ColonyTypeInfo } from "../../types/colony";

/**
 * Colony-type payload fixtures for the New Colony modal tests.
 *
 * Mirrors the shape served by GET /config/colony-types so component tests
 * exercise the real query/cache/error code path (per 08-frontend-testing.md)
 * rather than mocking the hook. Values are representative of the backend's
 * config/colony_types.yaml, not exhaustive.
 */
export const COLONY_TYPE_FIXTURES: ColonyTypeInfo[] = [
  {
    id: "research_mission",
    name: "Research Mission",
    description:
      "Founded to study notable flora, fauna, or ancient ruins. Often established by Rogue Traders entangled with the Adeptus Mechanicus.",
    base_stats: { size: 1, complacency: 2, productivity: 1, order: 1, piety: 1 },
    special_effects: [
      {
        name: "resource_experts",
        description:
          "When exploiting Organic Compounds, Archeotech, or Xenos Ruins, Productivity increases by 2 and it generates +1 additional Profit Factor.",
        resource_types: ["organic_compounds", "archeotech", "xenos_ruins"],
        productivity_bonus: 2,
        additional_pf: 1,
      },
    ],
  },
  {
    id: "mining_and_industry",
    name: "Mining and Industry",
    description:
      "The economic backbone of many dynasties. Mining colonies extract raw ores, while Industrial colonies manufacture finished goods.",
    base_stats: { size: 1, complacency: 1, productivity: 2, order: 1, piety: 1 },
    special_effects: [
      {
        name: "industrial_powerhouse",
        description:
          "Begins with a free Industrial Facility Upgrade. When exploiting Mineral Resources, Productivity increases by 2 and it generates +2 additional Profit Factor.",
        starts_with_upgrade: true,
        upgrade_type: "industrial_facility",
        resource_types: ["mineral_resources"],
        productivity_bonus: 2,
        additional_pf: 2,
      },
    ],
  },
  {
    id: "ecclesiastical",
    name: "Ecclesiastical",
    description:
      "Founded solely to spread the word of the God-Emperor. Popular among pious Rogue Traders looking to gain favor with the Ecclesiarchy.",
    base_stats: { size: 1, complacency: 1, productivity: 1, order: 2, piety: 2 },
    special_effects: [
      {
        name: "shield_of_faith",
        description:
          "Begins with a free Cultural Improvement Upgrade. If Order would decrease, the owner can choose to decrease Piety instead.",
        starts_with_upgrade: true,
        upgrade_type: "cultural_improvement",
        order_piety_swap: true,
      },
    ],
  },
  {
    id: "agricultural",
    name: "Agricultural",
    description:
      "Vital for feeding the billions of the Imperium. Vast fields, hydroponic domes, or algae basins sustain entire star systems.",
    base_stats: { size: 1, complacency: 2, productivity: 1, order: 1, piety: 1 },
    special_effects: [
      {
        name: "fertile_soil",
        description:
          "Agricultural resilience: on size reduction rolls, a 1d10 roll of 8+ prevents the size reduction.",
        famine_resilience_roll: 8,
      },
    ],
  },
];

export const colonyTypesHandler = http.get(
  "*/api/v1/config/colony-types",
  () => HttpResponse.json(COLONY_TYPE_FIXTURES)
);
