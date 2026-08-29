import { 
  ColonyTypeKey, 
  HardInfrastructureTypeKey, 
  SupportUpgradeTypeKey, 
  RepresentativeTypeKey, 
  StatName 
} from '../types';

export interface ColonyTypeRule {
  key: ColonyTypeKey;
  displayName: string;
  description: string;
  initialInvestmentPf: string;
  baseStats: {
    size: number;
    complacency: number;
    productivity: number;
    order: number;
    piety: number;
  };
  specialEffect: {
    name: string;
    description: string;
    tag: string;
  };
}

export const COLONY_TYPES: Record<ColonyTypeKey, ColonyTypeRule> = {
  research_mission: {
    key: 'research_mission',
    displayName: 'Research Mission',
    description: 'Founded to study notable flora, fauna, or ancient ruins. Often established by Rogue Traders entangled with the Adeptus Mechanicus.',
    initialInvestmentPf: '1d5+2',
    baseStats: {
      size: 1,
      complacency: 2,
      productivity: 1,
      order: 1,
      piety: 1,
    },
    specialEffect: {
      name: 'Resource Experts',
      description: 'When exploiting Organic Compounds, Archeotech, or Xenos Ruins, Productivity increases by 2 and generates +1 additional Profit Factor.',
      tag: 'Productivity +2, PF +1 for Rare Resources',
    },
  },
  mining_and_industry: {
    key: 'mining_and_industry',
    displayName: 'Mining and Industry',
    description: 'The economic backbone of many dynasties. Mining colonies extract raw ores, while Industrial colonies manufacture finished goods.',
    initialInvestmentPf: '1d5+5',
    baseStats: {
      size: 1,
      complacency: 1,
      productivity: 2,
      order: 1,
      piety: 1,
    },
    specialEffect: {
      name: 'Industrial Powerhouse (GM Ruling)',
      description: 'Begins with a free Industrial Facility Upgrade (+1 Productivity). When exploiting Mineral Resources, Productivity increases by 2 and generates +2 additional Profit Factor.',
      tag: 'Free Industrial Facility, Mineral Bonus +2 Prod / +2 PF',
    },
  },
  ecclesiastical: {
    key: 'ecclesiastical',
    displayName: 'Ecclesiastical',
    description: 'Founded solely to spread the word of the God-Emperor. While they produce few physical goods, they are popular among pious Rogue Traders.',
    initialInvestmentPf: '1d5+3',
    baseStats: {
      size: 1,
      complacency: 1,
      productivity: 1,
      order: 2,
      piety: 2,
    },
    specialEffect: {
      name: 'Shield of Faith (GM Ruling)',
      description: 'Begins with a free Cultural Improvement Upgrade (+1 to chosen stat). If Order would decrease, the owner can choose to decrease Piety instead.',
      tag: 'Free Cultural Improvement, Order/Piety Damage Swap',
    },
  },
  agricultural: {
    key: 'agricultural',
    displayName: 'Agricultural',
    description: 'Established on verdant worlds to provide food for export. Despite their large scale, they have relatively few inhabitants due to high automation.',
    initialInvestmentPf: '1d5+4',
    baseStats: {
      size: 1,
      complacency: 1,
      productivity: 1,
      order: 2,
      piety: 1,
    },
    specialEffect: {
      name: 'Resilient to Famine',
      description: 'Any time the colony Size would decrease for any reason (growth checks, Anarchy decay, GM events), player rolls 1d10 physically; on 8+, Size does not decrease.',
      tag: '1d10 (8+) Prevents Size Decreases',
    },
  },
};

export const SIZE_TO_PF_TABLE: { size: number; profitFactor: number; label: string }[] = [
  { size: 0, profitFactor: 0, label: 'Ghost Town' },
  { size: 1, profitFactor: 1, label: 'Settlement' },
  { size: 2, profitFactor: 2, label: 'Outpost' },
  { size: 3, profitFactor: 3, label: 'Freehold' },
  { size: 4, profitFactor: 4, label: 'Demesne' },
  { size: 5, profitFactor: 6, label: 'Holding' },
  { size: 6, profitFactor: 8, label: 'Dominion' },
  { size: 7, profitFactor: 10, label: 'Territory' },
  { size: 8, profitFactor: 12, label: 'City' },
  { size: 9, profitFactor: 14, label: 'Metropolis' },
  { size: 10, profitFactor: 18, label: 'Hive' },
];

export interface HardInfrastructureRule {
  key: HardInfrastructureTypeKey;
  displayName: string;
  description: string;
  workingModifiers: { stat: StatName; value: number }[];
  notWorkingModifiers: { stat: StatName; value: number }[];
}

export const HARD_INFRASTRUCTURE_RULES: Record<HardInfrastructureTypeKey, HardInfrastructureRule> = {
  transport: {
    key: 'transport',
    displayName: 'Transport',
    description: 'Roads, bridges, maglev lines, canals, and spaceports. Essential for moving goods and people efficiently.',
    workingModifiers: [
      { stat: 'productivity', value: 1 },
      { stat: 'complacency', value: 1 },
    ],
    notWorkingModifiers: [
      { stat: 'productivity', value: -2 },
      { stat: 'order', value: -2 },
    ],
  },
  power: {
    key: 'power',
    displayName: 'Power',
    description: 'Peat-burning generators, solar panels, or block-sized fusion reactors. The lifeblood of industry.',
    workingModifiers: [
      { stat: 'productivity', value: 2 },
    ],
    notWorkingModifiers: [
      { stat: 'productivity', value: -3 },
      { stat: 'complacency', value: -1 },
    ],
  },
  water: {
    key: 'water',
    displayName: 'Water',
    description: 'Purification plants, reservoirs, and sewage systems. Necessary to prevent dehydration and disease.',
    workingModifiers: [
      { stat: 'order', value: 1 },
      { stat: 'complacency', value: 1 },
    ],
    notWorkingModifiers: [
      { stat: 'order', value: -2 },
      { stat: 'complacency', value: -2 },
    ],
  },
  food_production: {
    key: 'food_production',
    displayName: 'Food Production',
    description: 'Hydroponic farms or regular deliveries of corpse starch rations. Vital for sustained population growth.',
    workingModifiers: [
      { stat: 'productivity', value: 1 },
      { stat: 'complacency', value: 1 },
    ],
    notWorkingModifiers: [
      { stat: 'productivity', value: -2 },
      { stat: 'complacency', value: -2 },
    ],
  },
  communications: {
    key: 'communications',
    displayName: 'Communications',
    description: 'Radio buoys, orbital signal repeaters, and Astropathic choirs. Used for day-to-day operations and propaganda.',
    workingModifiers: [
      { stat: 'productivity', value: 1 },
      { stat: 'order', value: 1 },
    ],
    notWorkingModifiers: [
      { stat: 'productivity', value: -2 },
      { stat: 'order', value: -2 },
    ],
  },
};

export interface SupportUpgradeRule {
  key: SupportUpgradeTypeKey;
  displayName: string;
  description: string;
  statEffects: { stat: StatName | 'custom_choice'; value: number }[];
  limitRule: 'single' | 'once_per_stat' | 'unlimited';
  maxInstances?: number;
  mechanicalEffect: string;
  flavorText: string;
}

export const SUPPORT_UPGRADE_RULES: Record<SupportUpgradeTypeKey, SupportUpgradeRule> = {
  arbites_precinct: {
    key: 'arbites_precinct',
    displayName: 'Arbites Precinct',
    description: 'A detachment of Arbitrators petitioned from Port Wander or Scintilla to enforce Imperial law with steel-eyed resolve.',
    statEffects: [{ stat: 'order', value: 1 }],
    limitRule: 'unlimited',
    mechanicalEffect: '+10 bonus to Command, Intimidate, and Charm Tests when taking direct legal action in the colony.',
    flavorText: 'Reminds citizenry of their duty to the Emperor; deters smugglers and cultists.',
  },
  ecclesiarchy_mission: {
    key: 'ecclesiarchy_mission',
    displayName: 'Ecclesiarchy Mission',
    description: 'Established through missions, hospitals, or grand cathedrals to bring the God-Emperor’s light to the colonists.',
    statEffects: [{ stat: 'piety', value: 1 }],
    limitRule: 'unlimited',
    mechanicalEffect: '+10 bonus to convince/cajole citizenry into action while appearing sufficiently pious.',
    flavorText: 'Constant reminders of the Emperor’s grace fortify the spirit of the populace.',
  },
  mechanicum_station: {
    key: 'mechanicum_station',
    displayName: 'Mechanicum Station',
    description: 'A mission of Tech-Priests tasked with research, tech-rites, or overseeing manufactorums.',
    statEffects: [{ stat: 'productivity', value: 1 }], // +2 for mining_and_industry, +3 for research_mission
    limitRule: 'single',
    maxInstances: 1,
    mechanicalEffect: 'Productivity bonus: +1 Standard, +2 Mining/Industry, +3 Research Mission. Every 90 days, 1d10 physical roll (8+) grants 1d5+2 items from Treasure Generator.',
    flavorText: 'Brings the sacred blessings of the Omnissiah to the colony’s machines.',
  },
  infantry_garrison: {
    key: 'infantry_garrison',
    displayName: 'Infantry Garrison',
    description: 'Barracks and headquarters for Imperial Guard or planetary militia forces to protect the colony.',
    statEffects: [{ stat: 'order', value: 1 }],
    limitRule: 'single',
    maxInstances: 1,
    mechanicalEffect: '+10 bonus to Command and Intimidate Tests to protect colony. Can grant 100 Achievement Points to military Endeavours.',
    flavorText: 'Safeguards the colony against the numerous horrors of the Koronus Expanse.',
  },
  imperial_navy_station: {
    key: 'imperial_navy_station',
    displayName: 'Imperial Navy Station',
    description: 'A void-port, orbital dock, or aerospace facility maintained by the Imperial Navy.',
    statEffects: [{ stat: 'order', value: 1 }],
    limitRule: 'single',
    maxInstances: 1,
    mechanicalEffect: '+10 bonus to Command and Intimidate Tests protecting the colony; provides aerospace defence.',
    flavorText: 'Maintains system defense and the Rogue Trader’s connection to the wider void.',
  },
  cultural_improvement: {
    key: 'cultural_improvement',
    displayName: 'Cultural Improvement',
    description: 'Statues of saints, grand arenas, reliquaries, or monumental imperial art.',
    statEffects: [{ stat: 'custom_choice', value: 1 }],
    limitRule: 'once_per_stat',
    maxInstances: 4,
    mechanicalEffect: '+1 to any one Characteristic (Complacency, Order, Productivity, Piety) chosen upon construction. Max 1 per stat.',
    flavorText: 'Distracts citizens from their grinding existence and inspires deep loyalty.',
  },
  industrial_facility: {
    key: 'industrial_facility',
    displayName: 'Industrial Facility',
    description: 'Refineries, foundries, and sprawling mine complexes producing goods from rations to voidship plates.',
    statEffects: [{ stat: 'productivity', value: 1 }],
    limitRule: 'unlimited',
    mechanicalEffect: 'Explorers define a specific manufactured product, unlocking trade opportunities.',
    flavorText: 'The heart and soul of a colony’s economic expansion.',
  },
  personal_lodgings: {
    key: 'personal_lodgings',
    displayName: 'Personal Lodgings',
    description: 'A grand spire palace or luxurious prefabricated hab unit for the Rogue Trader’s use.',
    statEffects: [{ stat: 'order', value: 1 }],
    limitRule: 'single',
    maxInstances: 1,
    mechanicalEffect: '+10 bonus to Charm, Commerce, and Deceive Tests while entertaining significant NPCs.',
    flavorText: 'Showcases aristocratic power and Imperial authority.',
  },
  contacts: {
    key: 'contacts',
    displayName: 'Contacts',
    description: 'Formal ties with influential local NPCs, underworld bosses, or Mechanicus sages.',
    statEffects: [],
    limitRule: 'unlimited',
    mechanicalEffect: '+10 bonus to Fellowship-based Tests with affiliated group. NPCs provide urgent crisis alerts.',
    flavorText: 'Provides eyes and ears in dark corners of the sector.',
  },
  trappings: {
    key: 'trappings',
    displayName: 'Trappings',
    description: 'Grandiose signs of the Rogue Trader’s power (beast heads, golden effigies, victory banners).',
    statEffects: [{ stat: 'complacency', value: 1 }],
    limitRule: 'unlimited',
    mechanicalEffect: '+1 Complacency. Keeps the populace awed by the legend of their Lord Captain.',
    flavorText: 'Blinds the populace with the shining legend of dynasty authority.',
  },
};

export interface RepresentativeTypeRule {
  key: RepresentativeTypeKey;
  displayName: string;
  description: string;
  protectedStat: StatName | null;
  lossMitigationDescription: string;
  specialRule: string;
}

export const REPRESENTATIVE_TYPES: Record<RepresentativeTypeKey, RepresentativeTypeRule> = {
  satrap: {
    key: 'satrap',
    displayName: 'Satrap',
    description: 'An administrator with strong organizational skills and experience in high-stakes negotiation.',
    protectedStat: null,
    lossMitigationDescription: 'None',
    specialRule: '+5 bonus to Acquisition Tests for purchasing goods on this particular Colony.',
  },
  judge: {
    key: 'judge',
    displayName: 'Judge',
    description: 'Focuses on maintaining law and order at any cost, keeping the colony tightly controlled.',
    protectedStat: 'order',
    lossMitigationDescription: '-1 to negative modifiers on Order (minimum loss 1).',
    specialRule: 'Mitigates Order damage during unrest and crisis.',
  },
  cardinal: {
    key: 'cardinal',
    displayName: 'Cardinal',
    description: 'A spiritual leader who attracts pilgrims and inspires devotion to the God-Emperor.',
    protectedStat: 'piety',
    lossMitigationDescription: '-1 to negative modifiers on Piety (minimum loss 1).',
    specialRule: 'Mitigates Piety loss and shields faith.',
  },
  colonist_representative: {
    key: 'colonist_representative',
    displayName: 'Colonist Representative',
    description: 'A local elevated to governance, making colonists compliant as complaints are heard by one of their own.',
    protectedStat: 'complacency',
    lossMitigationDescription: '-1 to negative modifiers on Complacency (minimum loss 1).',
    specialRule: 'Reduces Complacency penalties from shortages and hardships.',
  },
  military_commander: {
    key: 'military_commander',
    displayName: 'Military Commander',
    description: 'Safeguards the colony, running production like a well-oiled machine under martial discipline.',
    protectedStat: 'productivity',
    lossMitigationDescription: '-1 to negative modifiers on Productivity (minimum loss 1).',
    specialRule: 'Mitigates Productivity loss during attacks and strikes.',
  },
  dynasty_member: {
    key: 'dynasty_member',
    displayName: 'Dynasty Member',
    description: 'A relative of the Rogue Trader assigned to test their fitness for inheriting a Warrant of Trade.',
    protectedStat: null,
    lossMitigationDescription: 'None',
    specialRule: 'Triggers Consequences of Nepotism (physical d100 roll result selects 1 of 5 permanent stat outcomes).',
  },
};

export interface PersonalityRule {
  key: string;
  displayName: string;
  description: string;
  statEffectsText: string;
  requiresGmInput?: boolean;
  gmInputType?: 'stat_choice' | 'physical_roll';
  gmInputHint?: string;
  isConditional?: boolean;
}

export const PERSONALITY_RULES: Record<string, PersonalityRule> = {
  beloved: {
    key: 'beloved',
    displayName: 'Beloved',
    description: 'A well-liked figure the colonists are less likely to rebel against.',
    statEffectsText: '+1 Complacency',
  },
  military_minded: {
    key: 'military_minded',
    displayName: 'Military-Minded',
    description: 'Focused on martial matters, defense plans, and militia rotations.',
    statEffectsText: '+1 Order',
  },
  corrupt: {
    key: 'corrupt',
    displayName: 'Corrupt',
    description: 'Profitable on the surface, but wealth mysteriously goes missing.',
    statEffectsText: '+2 Productivity, -1 Order',
  },
  idle: {
    key: 'idle',
    displayName: 'Idle',
    description: 'Takes a long time to perform tasks due to slothful ways.',
    statEffectsText: '+2 Complacency, -1 Productivity',
  },
  ambitious: {
    key: 'ambitious',
    displayName: 'Ambitious',
    description: 'Pursues any means to accomplish goals; driven but unpopular.',
    statEffectsText: '+2 Productivity, -1 Complacency',
  },
  zealous: {
    key: 'zealous',
    displayName: 'Zealous',
    description: 'Fanatical faith; focuses on shrines, pilgrimages, and small crusades.',
    statEffectsText: '+1 Piety',
  },
  patron_of_the_arts: {
    key: 'patron_of_the_arts',
    displayName: 'Patron of the Arts',
    description: 'Provides personal income to artists to reach perfection in their fields.',
    statEffectsText: '+2 Complacency, -1 Piety',
  },
  unlucky: {
    key: 'unlucky',
    displayName: 'Unlucky',
    description: 'Misfortune haunts them, and they are prone to bad luck.',
    statEffectsText: '+2 Piety',
  },
  ties_with: {
    key: 'ties_with',
    displayName: 'Ties With...',
    description: 'Friendly links with a particular faction or guild (e.g., Adeptus Arbites, Chartist Captains).',
    statEffectsText: '+1 to GM-chosen Stat (based on faction)',
    requiresGmInput: true,
    gmInputType: 'stat_choice',
    gmInputHint: 'GM selects affected stat based on the fictional affiliated organization.',
  },
  administrative_expert: {
    key: 'administrative_expert',
    displayName: 'Administrative Expert',
    description: 'Skilled at administration, making it much easier to coordinate colony logistics.',
    statEffectsText: '+2 Productivity (Conditional: active only while Order > Size)',
    isConditional: true,
  },
  cruel: {
    key: 'cruel',
    displayName: 'Cruel',
    description: 'Uses efficiency policies and harsh punishments to squeeze labor.',
    statEffectsText: '+2 Productivity, -1 Complacency',
  },
  spymaster: {
    key: 'spymaster',
    displayName: 'Spymaster',
    description: 'Maintains informants to retain tight control and knowledge of all events.',
    statEffectsText: '+2 Order, -1 Complacency',
  },
  generalissimo: {
    key: 'generalissimo',
    displayName: 'Generalissimo',
    description: 'Conducts themselves as high military rank with a large standing army.',
    statEffectsText: '+2 Order, -1 Piety',
  },
  paranoid: {
    key: 'paranoid',
    displayName: 'Paranoid',
    description: 'Suspicious of everyone; unlikely to be toppled but other governance suffers.',
    statEffectsText: '+2 Order, -1 Productivity',
  },
  mad: {
    key: 'mad',
    displayName: 'Mad',
    description: 'Eccentric and erratic; holds war-councils with servo-skulls or pet grox.',
    statEffectsText: '+1 Complacency, +1 Piety, +1 Productivity, Order penalty (result of 1d5, rolled physically)',
    requiresGmInput: true,
    gmInputType: 'physical_roll',
    gmInputHint: 'Enter the 1d5 physical die roll result (1 to 5) for Order penalty.',
  },
  charitable: {
    key: 'charitable',
    displayName: 'Charitable',
    description: 'Kind-hearted and generous; genuinely interested in the welfare of the populace.',
    statEffectsText: '+1 Complacency, +1 Piety, -1 Productivity',
  },
  vainglorious: {
    key: 'vainglorious',
    displayName: 'Vainglorious',
    description: 'Obsessed with personal accomplishment, statues, and gaudy appearances.',
    statEffectsText: '+2 Productivity, -1 Piety',
  },
  scholarly: {
    key: 'scholarly',
    displayName: 'Scholarly',
    description: 'Considers themselves an academic; balances and stabilizes the colony.',
    statEffectsText: '+1 to Lowest Characteristic when installed',
    requiresGmInput: true,
    gmInputType: 'stat_choice',
    gmInputHint: 'GM selects the lowest colony stat at installation time (or breaks ties).',
  },
  avaricious: {
    key: 'avaricious',
    displayName: 'Avaricious',
    description: 'Obsessively chases wealth, tithes, and throne gelt for its own sake.',
    statEffectsText: '+1 Productivity',
  },
  quite_a_character: {
    key: 'quite_a_character',
    displayName: 'Quite a Character',
    description: 'This representative is uniquely complex. Allows choosing 2 additional unique personalities (3 total).',
    statEffectsText: 'Grants +2 extra personality traits to this Representative.',
  },
};

export const DYNASTY_NEPOTISM_OUTCOMES = [
  { key: 'potential', label: 'That One Has Potential!', desc: '+1 to Chosen Stat upon appointment', stat: 'chosen' },
  { key: 'eye_on', label: 'One To Keep An Eye On', desc: '+1 Productivity', stat: 'productivity' },
  { key: 'heroics', label: 'Thrilling Heroics', desc: '+1 Piety', stat: 'piety' },
  { key: 'grox', label: "Come On, It's Just a Grox!", desc: '+1 Order', stat: 'order' },
  { key: 'volcano', label: 'You Built the Palace on a Volcano?!', desc: '+1 Complacency', stat: 'complacency' },
];

export const CHARACTERISTICS_INFO = [
  { key: 'ws', name: 'Weapon Skill', short: 'WS', desc: 'Hand-to-hand combat proficiency' },
  { key: 'bs', name: 'Ballistic Skill', short: 'BS', desc: 'Marksmanship and ranged weaponry' },
  { key: 's', name: 'Strength', short: 'S', desc: 'Physical muscle and lifting power' },
  { key: 't', name: 'Toughness', short: 'T', desc: 'Resilience against wounds and toxins' },
  { key: 'ag', name: 'Agility', short: 'Ag', desc: 'Speed, reflexes, and coordination' },
  { key: 'int', name: 'Intelligence', short: 'Int', desc: 'Reasoning, lore, and analytical acumen' },
  { key: 'per', name: 'Perception', short: 'Per', desc: 'Spatial awareness and keen senses' },
  { key: 'wp', name: 'Willpower', short: 'WP', desc: 'Mental resolve and psychic resistance' },
  { key: 'fel', name: 'Fellowship', short: 'Fel', desc: 'Persuasiveness, charm, and leadership' },
] as const;
