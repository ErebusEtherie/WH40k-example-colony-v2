export interface ColonyTypeConfig {
  name: string;
  display_name: string;
  description: string;
  initial_investment_pf: string;
  base_stats: {
    size: number;
    complacency: number;
    productivity: number;
    order: number;
    piety: number;
  };
  special_effects: {
    name: string;
    description: string;
    starts_with_upgrade?: boolean;
    upgrade_type?: string;
    resource_types?: string[];
    productivity_bonus?: number;
    additional_pf?: number;
    order_piety_swap?: boolean;
  }[];
}

export const COLONY_TYPES: ColonyTypeConfig[] = [
  {
    name: "research_mission",
    display_name: "Research Mission",
    description: "Founded to study notable flora, fauna, or ancient ruins. Often established by Rogue Traders entangled with the Adeptus Mechanicus.",
    initial_investment_pf: "1d5+2",
    base_stats: { size: 1, complacency: 2, productivity: 1, order: 1, piety: 1 },
    special_effects: [
      {
        name: "resource_experts",
        description: "When exploiting Organic Compounds, Archeotech, or Xenos Ruins, Productivity increases by 2 and it generates +1 additional Profit Factor.",
        resource_types: ["organic_compounds", "archeotech", "xenos_ruins"],
        productivity_bonus: 2,
        additional_pf: 1,
      },
    ],
  },
  {
    name: "mining_and_industry",
    display_name: "Mining and Industry",
    description: "The economic backbone of many dynasties. Mining colonies extract raw ores, while Industrial colonies manufacture finished goods.",
    initial_investment_pf: "1d5+5",
    base_stats: { size: 1, complacency: 1, productivity: 2, order: 1, piety: 1 },
    special_effects: [
      {
        name: "industrial_powerhouse",
        description: "Begins with a free Industrial Facility Upgrade. When exploiting Mineral Resources, Productivity increases by 2 and it generates +2 additional Profit Factor.",
        starts_with_upgrade: true,
        upgrade_type: "industrial_facility",
        resource_types: ["mineral_resources"],
        productivity_bonus: 2,
        additional_pf: 2,
      },
    ],
  },
  {
    name: "ecclesiastical",
    display_name: "Ecclesiastical",
    description: "Founded solely to spread the word of the God-Emperor. Popular among pious Rogue Traders looking to gain favor with the Ecclesiarchy.",
    initial_investment_pf: "1d5+3",
    base_stats: { size: 1, complacency: 1, productivity: 1, order: 2, piety: 2 },
    special_effects: [
      {
        name: "shield_of_faith",
        description: "Begins with a free Cultural Improvement Upgrade. If Order would decrease, the owner can choose to decrease Piety instead.",
        starts_with_upgrade: true,
        upgrade_type: "cultural_improvement",
        order_piety_swap: true,
      },
    ],
  },
  {
    name: "agricultural",
    display_name: "Agricultural",
    description: "Vital for feeding the billions of the Imperium. Vast fields, hydroponic domes, or algae basins sustain entire star systems.",
    initial_investment_pf: "1d5+2",
    base_stats: { size: 1, complacency: 2, productivity: 1, order: 1, piety: 1 },
    special_effects: [
      {
        name: "fertile_soil",
        description: "Agricultural resilience: on size reduction rolls, a 1d10 roll of 8+ prevents the size reduction.",
      },
    ],
  },
  {
    name: "military_outpost",
    display_name: "Military Outpost",
    description: "Fortified bastion defending borders or strategic trade lanes against xenos incursions and pirates.",
    initial_investment_pf: "1d5+4",
    base_stats: { size: 1, complacency: 1, productivity: 1, order: 2, piety: 1 },
    special_effects: [
      {
        name: "martial_vigilance",
        description: "Begins with a free Infantry Garrison Upgrade. Order losses are reduced by 1.",
        starts_with_upgrade: true,
        upgrade_type: "infantry_garrison",
      },
    ],
  },
  {
    name: "penal_colony",
    display_name: "Penal Colony",
    description: "Harsh penitentiary world where the condemned work arduous shifts in dangerous mines or manufactorums.",
    initial_investment_pf: "1d5+1",
    base_stats: { size: 1, complacency: 0, productivity: 2, order: 2, piety: 1 },
    special_effects: [
      {
        name: "forced_labor",
        description: "Higher initial productivity but prone to intense unrest if complacency remains zero.",
      },
    ],
  },
  {
    name: "feudal_world",
    display_name: "Feudal World",
    description: "Pre-industrial society governed by nobility and knightly oaths, offering staunch recruits and raw resources.",
    initial_investment_pf: "1d5+2",
    base_stats: { size: 1, complacency: 2, productivity: 1, order: 1, piety: 2 },
    special_effects: [
      {
        name: "ancient_oaths",
        description: "Faith and tradition keep the populace steadfast during crises.",
      },
    ],
  },
  {
    name: "pleasure_planet",
    display_name: "Pleasure Planet",
    description: "Dedicated to the lavish entertainment and indulgence of the nobility, high guildmasters, and Rogue Traders.",
    initial_investment_pf: "1d5+6",
    base_stats: { size: 1, complacency: 3, productivity: 1, order: 0, piety: 0 },
    special_effects: [
      {
        name: "decadent_haven",
        description: "Begins with Personal Lodgings. Generates bonus profit factor from trade and leisure endeavours.",
        starts_with_upgrade: true,
        upgrade_type: "personal_lodgings",
      },
    ],
  },
];

export interface InfrastructureConfig {
  name: string;
  display_name: string;
  description: string;
  working_modifiers: { stat: string; value: number }[];
  not_working_modifiers: { stat: string; value: number }[];
}

export const INFRASTRUCTURE_TYPES: InfrastructureConfig[] = [
  {
    name: "transport",
    display_name: "Transport",
    description: "Roads, bridges, maglev lines, canals, and spaceports. Essential for moving goods and people efficiently.",
    working_modifiers: [
      { stat: "productivity", value: 1 },
      { stat: "complacency", value: 1 },
    ],
    not_working_modifiers: [
      { stat: "productivity", value: -2 },
      { stat: "order", value: -2 },
    ],
  },
  {
    name: "power_network",
    display_name: "Power Network",
    description: "Peat-burning generators, solar panels, or block-sized fusion reactors. The 'lifeblood' of industry.",
    working_modifiers: [{ stat: "productivity", value: 2 }],
    not_working_modifiers: [
      { stat: "productivity", value: -3 },
      { stat: "complacency", value: -1 },
    ],
  },
  {
    name: "water_management",
    display_name: "Water Management",
    description: "Purification plants, reservoirs, and sewage systems. Necessary to prevent dehydration and disease.",
    working_modifiers: [
      { stat: "order", value: 1 },
      { stat: "complacency", value: 1 },
    ],
    not_working_modifiers: [
      { stat: "order", value: -2 },
      { stat: "complacency", value: -2 },
    ],
  },
  {
    name: "food_production",
    display_name: "Food Production",
    description: "Hydroponic farms or regular deliveries of corpse starch rations. Vital for growth.",
    working_modifiers: [
      { stat: "productivity", value: 1 },
      { stat: "complacency", value: 1 },
    ],
    not_working_modifiers: [
      { stat: "productivity", value: -2 },
      { stat: "complacency", value: -2 },
    ],
  },
  {
    name: "communications",
    display_name: "Communications",
    description: "Radio buoys, orbital signal repeaters, and Astropathic choirs. Used for operations and propaganda.",
    working_modifiers: [
      { stat: "productivity", value: 1 },
      { stat: "order", value: 1 },
    ],
    not_working_modifiers: [
      { stat: "productivity", value: -2 },
      { stat: "order", value: -2 },
    ],
  },
];

export interface SupportUpgradeConfig {
  name: string;
  display_name: string;
  description: string;
  stat_effects: { stat: string; value: number; choices?: string[] }[];
  mechanical_description: string;
  lore: string;
}

export const SUPPORT_UPGRADE_TYPES: SupportUpgradeConfig[] = [
  {
    name: "arbites_precinct",
    display_name: "Arbites Precinct",
    description: "A detachment of Arbitrators enforcing Imperial law with steel-eyed resolve.",
    stat_effects: [{ stat: "order", value: 1 }],
    mechanical_description: "+10 bonus to Command, Intimidate, and Charm Tests when taking direct legal action.",
    lore: "Reminds citizenry of duty to the God-Emperor and deters smugglers.",
  },
  {
    name: "ecclesiarchy_mission",
    display_name: "Ecclesiarchy Mission",
    description: "Established to bring the God-Emperor's light to the colonists.",
    stat_effects: [{ stat: "piety", value: 1 }],
    mechanical_description: "+10 bonus to tests made to convince or cajole the citizenry.",
    lore: "Fortifies the spirit of the populace against the warp.",
  },
  {
    name: "mechanicum_station",
    display_name: "Mechanicum Station",
    description: "A mission of Tech-Priests overseeing manufactorums and blessing machines.",
    stat_effects: [{ stat: "productivity", value: 1 }],
    mechanical_description: "Every 90 days, on 1d10 (8+), discover an ancient archeotech cache.",
    lore: "Brings the sacred blessings of the Omnissiah.",
  },
  {
    name: "infantry_garrison",
    display_name: "Infantry Garrison",
    description: "A barracks and headquarters for Imperial Guard or planetary defense militia.",
    stat_effects: [{ stat: "order", value: 1 }],
    mechanical_description: "+10 bonus to protect colony from invasion or unrest; grants 100 AP to military endeavours.",
    lore: "Safeguards against Koronus Expanse predators and raiders.",
  },
  {
    name: "imperial_navy_station",
    display_name: "Imperial Navy Station",
    description: "Orbital docks and aerospace facilities maintained by Navy personnel.",
    stat_effects: [{ stat: "order", value: 1 }],
    mechanical_description: "+10 bonus to system defense tests and void transport security.",
    lore: "Maintains orbital supremacy and void lane patrols.",
  },
  {
    name: "cultural_improvement",
    display_name: "Cultural Improvement",
    description: "Grand statues of Imperial saints, reliquaries, or victory arches.",
    stat_effects: [{ stat: "custom_choice", value: 1, choices: ["complacency", "order", "productivity", "piety"] }],
    mechanical_description: "Grants +1 to a chosen stat (complacency, order, productivity, or piety).",
    lore: "Distracts citizens from grinding existence and inspires loyalty.",
  },
  {
    name: "industrial_facility",
    display_name: "Industrial Facility",
    description: "Refineries, foundries, and sprawling mine complexes.",
    stat_effects: [{ stat: "productivity", value: 1 }],
    mechanical_description: "Allows defining specific export products for trade adventures.",
    lore: "The mechanical heart and economic engine of the colony.",
  },
  {
    name: "personal_lodgings",
    display_name: "Personal Lodgings",
    description: "A grand palace or high-grade hab spire for the Rogue Trader.",
    stat_effects: [{ stat: "order", value: 1 }],
    mechanical_description: "+10 bonus to Charm, Commerce, and Deceive Tests when entertaining dignitaries.",
    lore: "Demonstrates the supreme majesty of the dynasty.",
  },
  {
    name: "contacts",
    display_name: "Underworld Contacts",
    description: "Covert relationships with syndicate bosses, smuggler rings, or tech sages.",
    stat_effects: [],
    mechanical_description: "+10 bonus to Fellowship-based tests with criminal or affiliated groups; early crisis warning.",
    lore: "Provides subterranean whispers before uprisings occur.",
  },
  {
    name: "trappings",
    display_name: "Trappings of Power",
    description: "Grandiose monuments, predator trophies, and banners of the dynasty.",
    stat_effects: [{ stat: "complacency", value: 1 }],
    mechanical_description: "Keeps the populace in awe of their lord.",
    lore: "Blinds the populace by the shining legend of their leader.",
  },
];

export const UPGRADE_TYPES = SUPPORT_UPGRADE_TYPES;

export interface PersonalityConfig {
  name: string;
  display_name: string;
  description: string;
  stat_effects: { stat: string; value: number | string }[];
}

export const PERSONALITIES: PersonalityConfig[] = [
  { name: "beloved", display_name: "Beloved", description: "Well-liked figure; colonists are less likely to rebel.", stat_effects: [{ stat: "complacency", value: 1 }] },
  { name: "military_minded", display_name: "Military-Minded", description: "Disciplined focus on militia and fortifications.", stat_effects: [{ stat: "order", value: 1 }] },
  { name: "corrupt", display_name: "Corrupt", description: "Highly profitable upfront, but skimming resources.", stat_effects: [{ stat: "productivity", value: 2 }, { stat: "order", value: -1 }] },
  { name: "idle", display_name: "Idle", description: "Slothful governance keeps folks relaxed but slow.", stat_effects: [{ stat: "complacency", value: 2 }, { stat: "productivity", value: -1 }] },
  { name: "ambitious", display_name: "Ambitious", description: "Ruthlessly drives production quotas.", stat_effects: [{ stat: "productivity", value: 2 }, { stat: "complacency", value: -1 }] },
  { name: "zealous", display_name: "Zealous", description: "Fanatical faith with constant prayers and tithes.", stat_effects: [{ stat: "piety", value: 1 }] },
  { name: "patron_of_the_arts", display_name: "Patron of the Arts", description: "Sponsors lavish spectacles and architecture.", stat_effects: [{ stat: "complacency", value: 2 }, { stat: "piety", value: -1 }] },
  { name: "cruel", display_name: "Cruel", description: "Harsh punishments drive high output at the cost of morale.", stat_effects: [{ stat: "productivity", value: 2 }, { stat: "complacency", value: -1 }] },
  { name: "spymaster", display_name: "Spymaster", description: "Maintains informers across all hab-blocks.", stat_effects: [{ stat: "order", value: 2 }, { stat: "complacency", value: -1 }] },
  { name: "generalissimo", display_name: "Generalissimo", description: "Commands as supreme warlord.", stat_effects: [{ stat: "order", value: 2 }, { stat: "piety", value: -1 }] },
  { name: "paranoid", display_name: "Paranoid", description: "Watches every shadow; unshakeable order.", stat_effects: [{ stat: "order", value: 2 }, { stat: "productivity", value: -1 }] },
  { name: "charitable", display_name: "Charitable", description: "Provides rations and medical aid freely.", stat_effects: [{ stat: "complacency", value: 1 }, { stat: "piety", value: 1 }, { stat: "productivity", value: -1 }] },
  { name: "avaricious", display_name: "Avaricious", description: "Obsessively hoards profit and raw resources.", stat_effects: [{ stat: "productivity", value: 1 }] },
];

export interface RepresentativeTypeConfig {
  name: string;
  display_name: string;
  description: string;
  loss_mitigation_stat?: string;
  special_rule: string;
}

export const REPRESENTATIVE_TYPES: RepresentativeTypeConfig[] = [
  { name: "satrap", display_name: "Satrap", description: "Astute administrator and diplomat.", special_rule: "+5 bonus to Profit Factor when purchasing goods on this colony." },
  { name: "judge", display_name: "Judge", description: "Rigid enforcer of Imperial Lex.", loss_mitigation_stat: "order", special_rule: "Reduces Order losses by 1 (min 1 loss)." },
  { name: "cardinal", display_name: "Cardinal", description: "Preacher of the Imperial Creed.", loss_mitigation_stat: "piety", special_rule: "Reduces Piety losses by 1 (min 1 loss)." },
  { name: "colonist_representative", display_name: "Colonist Representative", description: "Tribal elder or union leader.", loss_mitigation_stat: "complacency", special_rule: "Reduces Complacency losses by 1 (min 1 loss)." },
  { name: "military_commander", display_name: "Military Commander", description: "Veteran officer overseeing security.", loss_mitigation_stat: "productivity", special_rule: "Reduces Productivity losses by 1 (min 1 loss)." },
  { name: "dynasty_member", display_name: "Dynasty Member", description: "Blood relative of the Rogue Trader.", special_rule: "Subject to Consequences of Nepotism." },
];

export const SIZE_TO_PROFIT_FACTOR: { size: number; pf: number; title: string }[] = [
  { size: 0, pf: 0, title: "Ghost Town" },
  { size: 1, pf: 1, title: "Settlement" },
  { size: 2, pf: 2, title: "Outpost" },
  { size: 3, pf: 3, title: "Freehold" },
  { size: 4, pf: 4, title: "Demesne" },
  { size: 5, pf: 6, title: "Holding" },
  { size: 6, pf: 8, title: "Dominion" },
  { size: 7, pf: 10, title: "Territory" },
  { size: 8, pf: 12, title: "City" },
  { size: 9, pf: 14, title: "Metropolis" },
  { size: 10, pf: 18, title: "Hive" },
];

export const LEADERSHIP_MODIFIERS: Record<number, number> = {
  2: -2,
  3: -1,
  4: 0,
  5: 1,
  6: 2,
};
